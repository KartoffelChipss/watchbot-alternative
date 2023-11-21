let command = {
    name: "help",
    name_localizations: {
        "de": "hilfe",
        "en-GB": "help",
        "en-US": "help",
    },
    description: "A list of Commands and a stetup-guide",
    description_localizations: {
        "de": "Liste an Commands und Setup-Anleitung",
        "en-GB": "A list of Commands and a stetup-guide",
        "en-US": "A list of Commands and a stetup-guide",
    }
}

let executeCommand = function executeCommand(interaction, getLocale) {
    const { commandName, options } = interaction;

    interaction.reply({
        "content": " ",
        "ephemeral": true,
        "embeds": [
            {
                "type": "rich",
                "title": "Help Menu",
                "description": `Welcome to **Argus**!\n\nTo setup simple channel notifications, you can use </watch:1138784768327176192>.\nIf you want to change more settings or want to setup DM and Mail notifications, please use our [Dashboard](https://argus-bot.com/dashboard).`,
                "color": 0x2B2D31,
            }
        ],
        "components": [
            {
                "id": 404588479,
                "type": 1,
                "components": [
                    {
                        "id": 279770337,
                        "type": 2,
                        "style": 5,
                        "label": "Dashboard",
                        "action_set_id": "902295766",
                        "url": "https://argus-bot.com/dashboard"
                    },
                    {
                        "id": 15641384,
                        "type": 2,
                        "style": 5,
                        "label": "Support Center",
                        "action_set_id": "494712198",
                        "url": "https://argus-bot.com/support"
                    }
                ]
            },
            {
                "id": 703895978,
                "type": 1,
                "components": [
                    {
                        "id": 699132182,
                        "type": 2,
                        "style": 5,
                        "label": "Terms of Service",
                        "action_set_id": "846721248",
                        "url": "https://argus-bot.com/terms"
                    },
                    {
                        "id": 932495169,
                        "type": 2,
                        "style": 5,
                        "label": "Privacy Policy",
                        "action_set_id": "612148581",
                        "url": "https://argus-bot.com/privacy"
                    }
                ]
            }
        ],
    }).catch(console.error)
}

module.exports.command = command;
module.exports.executeCommand = executeCommand;