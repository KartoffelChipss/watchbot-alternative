let guildBots = require("../modals/guild_bots.js");
const { PermissionFlagsBits } = require("discord.js");

let command = {
    name: "watch",
    name_localizations: {
        "de": "watch",
        "en-GB": "watch",
        "en-US": "watch",
    },
    description: "Send notification, when a bot goes offline",
    description_localizations: {
        "de": "Werde benachrichtigt, wenn ein Bot offline geht",
        "en-GB": "Send notification, when a bot goes offline",
        "en-US": "Send notification, when a bot goes offline",
    },
    default_member_permissions: "40",
    options: [
        {
            name: "bot",
            name_localizations: {
                "de": "bot",
                "en-GB": "bot",
                "en-US": "bot",
            },
            description: "The bot that should be watched",
            description_localizations: {
                "de": "Der Bot, der überwacht werden soll",
                "en-GB": "The bot that should be watched",
                "en-US": "The bot that should be watched",
            },
            required: true,
            type: 6,
        },
        {
            name: "channel",
            name_localizations: {
                "de": "kanal",
                "en-GB": "channel",
                "en-US": "channel",
            },
            description: "The channel, where bot updates should be sent",
            description_localizations: {
                "de": "Der Kanal, in dem Bot Updates gesendet werden sollen",
                "en-GB": "The channel, where bot updates should be sent",
                "en-US": "The channel, where bot updates should be sent",
            },
            required: true,
            type: 7,
        }
    ]
}

let executeCommand = async function executeCommand(interaction, getLocale) {
    const { commandName, options } = interaction;

    let selectedBot = options.getMember("bot");
    let selectedChannel = options.getChannel("channel");

    if ((!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))) {
        let warnSymbol = "<:kbwarning:1035893598559928400>";

        interaction.reply({
            "content": " ",
            "ephemeral": true,
            "embeds": [
                {
                    "type": "rich",
                    "title": "",
                    "description": `${warnSymbol} **You need the "Administrator" or "Manage Guild" permission to execute this command!**`,
                    "color": 0x2B2D31,
                }
            ]
        }).catch(console.error)
        return;
    }

    if (!selectedBot.user.bot) {
        let warnSymbol = "<:kbwarning:1035893598559928400>";

        interaction.reply({
            "content": " ",
            "ephemeral": true,
            "embeds": [
                {
                    "type": "rich",
                    "title": "",
                    "description": `${warnSymbol} **This user is not a bot!**`,
                    "color": 0x2B2D31,
                }
            ]
        }).catch(console.error)
        return;
    }

    if (selectedChannel.type !== 0 && selectedChannel.type !== 5) {
        let warnSymbol = "<:kbwarning:1035893598559928400>";

        interaction.reply({
            "content": " ",
            "ephemeral": true,
            "embeds": [
                {
                    "type": "rich",
                    "title": "",
                    "description": `${warnSymbol} **The channel must be a text or announcement channel!**`,
                    "color": 0x2B2D31,
                }
            ]
        }).catch(console.error)
        return;
    }

    let existingDoc = await guildBots.findOne({ guildId: interaction.guild.id, botId: selectedBot.user.id })
        .then(async (existingDoc) => {
            if (!existingDoc) {
                existingDoc = guildBots.create({ guildId: interaction.guild.id, botId: selectedBot.user.id, channelUpdate: selectedChannel.id }).then(() => {
                    interaction.reply({
                        "content": " ",
                        "embeds": [
                            {
                                "type": "rich",
                                "title": "",
                                "description": `<:KMC_BlauerHaken:987665905041424474> Status updates for ${selectedBot} are now being sent to ${selectedChannel}`,
                                "color": 0x2B2D31,
                            }
                        ]
                    }).catch(console.error)
                })
                return;
            }

            if (existingDoc.channelUpdate === selectedChannel.id) {
                await guildBots.findOneAndUpdate({ guildId: interaction.guild.id, botId: selectedBot.user.id }, { $set: { channelUpdate: "none" }}, { returnOriginal: false });
                interaction.reply({
                    "content": " ",
                    "embeds": [
                        {
                            "type": "rich",
                            "title": "",
                            "description": `<:KMC_BlauerHaken:987665905041424474> Status updates for ${selectedBot} are now disabled.`,
                            "color": 0x2B2D31,
                        }
                    ]
                }).catch(console.error)
                return;
            }

            await guildBots.findOneAndUpdate({ guildId: interaction.guild.id, botId: selectedBot.user.id }, { $set: { channelUpdate: selectedChannel.id }}, { returnOriginal: false });
            interaction.reply({
                "content": " ",
                "embeds": [
                    {
                        "type": "rich",
                        "title": "",
                        "description": `<:KMC_BlauerHaken:987665905041424474> Status updates for ${selectedBot} are now being sent to ${selectedChannel}`,
                        "color": 0x2B2D31,
                    }
                ]
            }).catch(console.error)
        })
}

module.exports.command = command;
module.exports.executeCommand = executeCommand;