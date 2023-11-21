const { Client, Intents, User, GatewayIntentBits, Interaction, Constants, Collection, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, ModalBuilder, TextInputBuilder, ActivityType, AutoModerationActionExecution } = require("discord.js");
const client = new Client({ partials: ["CHANNEL"], intents: 4867 });
require("dotenv").config();
const path = require('node:path');
const fs = require("fs");
const mongoose = require("mongoose");
const chalk = require("chalk");
const guild_bots = require("./modals/guild_bots");
const Dashboard = require("./dashboard/dashboard");

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

if (process.env.DEVMODE === "true") {
    console.log(chalk.default.red("Bot started in development mode!"))
}

mongoose.connect(process.env.MONGOURI, {
    keepAlive: true
}).then(() => console.log(chalk.default.greenBright("Connected to database")));

client.once("ready", async () => {
    /* --- Send confirmation messages --- */
    console.log(chalk.default.greenBright(`${chalk.default.yellow(client.user.tag)} is now online!`));
    console.log(chalk.default.greenBright(`${chalk.default.yellow(client.user.tag)} is on ${chalk.default.yellow(client.guilds.cache.size)} servers!`));

    /* --- Set the presence --- */
    await guild_bots.find().count().then((count) => {
        client.user.setPresence({
            activities: [{ name: `${count} Bots on ${client.guilds.cache.size} Servers`, type: ActivityType.Watching }],
            status: 'online',
        });
    })

    setInterval(async () => {
        await guild_bots.find().count().then((count) => {
            client.user.setPresence({
                activities: [{ name: `${count} Bots on ${client.guilds.cache.size} Servers`, type: ActivityType.Watching }],
                status: 'online',
            });
        })
    }, 5 * 60 * 1000)

    /* --- Register commands --- */
    let commands;
    if (process.env.DEVMODE === "true") {
        const guildId = "774263159674503188";
        const guild = client.guilds.cache.get(guildId);
        commands = guild.commands;
    } else {
        commands = client.application.commands;
    }

    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const commandFile = require(filePath);
        commands.create(commandFile.command)
    }

    /* --- Start the webserver --- */
    Dashboard(client);

    /* --- Update the persistent embeds every 5 minutes --- */
    async function updateEmbeds() {
        await client.guilds.fetch()
        const bots = await guild_bots.find({ "embedUpdate": { "$not": /^none$/gm } })

        bots.forEach(async (bot, index) => {
            let guild = client.guilds.cache.get(bot.guildId);
            let botuser = await guild.members.fetch(bot.botId);
            let channelId = bot.embedUpdate.split("/")[0];
            let channel = await guild.channels.fetch(channelId);

            if (!botuser || !channel) return;

            channel.messages.fetch({ limit: 100 }).then(async messages => {
                messages.forEach(message => {
                    if (message.id === bot.embedUpdate.split("/")[1]) message.delete().catch(console.error)
                });
            })

            let statusmsg = `✅ | **Online**`;
            if (!botuser.presence) statusmsg = `<:kbwarning:1035893598559928400> | **Could not fetch status**`;
            if (botuser.presence && botuser.presence.status && botuser.presence.status === "offline") statusmsg = `<:kbwarning:1035893598559928400> | **Offline**`;

            channel.send({
                "content": " ",
                "tts": false,
                "embeds": [
                    {
                        "id": 141612892,
                        "title": ``,
                        "description": `## Status of ${botuser.user.username}#${botuser.user.discriminator} \n### > ${statusmsg}\n`,
                        "fields": [],
                        "color": 0x2B2D31,
                        "footer": {
                            "text": "Last update:"
                        },
                        "timestamp": new Date().toISOString(),
                    }
                ],
                "components": [],
                "actions": {},
                "username": "swad"
            }).then(async (msg) => {
                await guild_bots.findOneAndUpdate({ guildId: bot.guildId, botId: bot.botId }, { $set: { embedUpdate: `${channel.id}/${msg?.id}` }}, { returnOriginal: false });
            })
        });

        return;
    }

    updateEmbeds()

    setInterval(async () => {
        await updateEmbeds();
    }, 5 * 60 * 1000)
});

client.on("error", (err) => {
    console.log(err);
});
client.on("warn", console.warn);

client.login(process.env.TOKEN);