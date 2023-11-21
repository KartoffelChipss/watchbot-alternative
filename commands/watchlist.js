const guild_bots = require("../modals/guild_bots");

let command = {
    name: "watchlist",
    name_localizations: {
        "de": "watchlist",
        "en-GB": "watchlist",
        "en-US": "watchlist",
    },
    description: "A list of Bots, that are being watched on your server",
    description_localizations: {
        "de": "Eine Liste an Bots, die auf deinem Server beobachtet werden",
        "en-GB": "A list of Bots, that are being watched on your server",
        "en-US": "A list of Bots, that are being watched on your server",
    }
}

let executeCommand = async function executeCommand(interaction, getLocale) {
    const { commandName, options } = interaction;

    let botList = await guild_bots.find({ guildId: interaction.guild.id })

    let listString = ``;
    botList.forEach((bot) => {
        if ((!bot.channelUpdate || bot.channelUpdate === "none") && bot.dmList.length <= 0 && bot.mailList.length <= 0) return;

        let channel = "- no channel";
        if (bot.channelUpdate && bot.channelUpdate !== "none") channel = `- <#${bot.channelUpdate}>`;

        listString += `- <@${bot.botId}> ${channel} - **${bot.dmList.length}** DM users - **${bot.mailList.length}** E-Mails\n`
    });

    interaction.reply({
        "content": " ",
        "ephemeral": true,
        "embeds": [
            {
                "type": "rich",
                "title": "Watchlist",
                "description": `These bots are being watched on your server:\n${listString}\nIf you would like to get more details, please use the dashboard.`,
                "color": 0x2B2D31,
            }
        ],
        "components": [
            {
              "id": 239780285,
              "type": 1,
              "components": [
                {
                  "id": 478005087,
                  "type": 2,
                  "style": 5,
                  "label": "Dashboard",
                  "action_set_id": "670153492",
                  "url": "https://argus-bot.com/dashboard"
                }
              ]
            }
          ]
    }).catch(console.error)
}

module.exports.command = command;
module.exports.executeCommand = executeCommand;