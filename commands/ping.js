let command = {
    name: "ping",
    name_localizations: {
        "de": "ping",
        "en-GB": "ping",
        "en-US": "ping",
    },
    description: "Get the ping to the bot",
    description_localizations: {
        "de": "Get the ping to the bot",
        "en-GB": "Get the ping to the bot",
        "en-US": "Get the ping to the bot",
    }
}

let executeCommand = function executeCommand(interaction, getLocale) {
    const { commandName, options } = interaction;

    const delay = Math.abs(Date.now() - interaction.createdTimestamp);

    interaction.reply({
        "content": " ",
        "ephemeral": true,
        "embeds": [
            {
                "type": "rich",
                "title": "🏓 Pong!",
                "description": `> **${delay}ms** Ping`,
                "color": 0x2B2D31,
            }
        ]
    }).catch(console.error)
}

module.exports.command = command;
module.exports.executeCommand = executeCommand;