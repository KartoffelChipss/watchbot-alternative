const path = require('node:path');
const fs = require("fs");
const whitelist = require("../whitelist.json");

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {

        if (interaction.isCommand()) {
            if (process.env.WHITELIST === "true" && !whitelist.includes(interaction.user.id)) {
                interaction.reply({
                    "content": " ",
                    "ephemeral": true,
                    "embeds": [
                        {
                            "type": "rich",
                            "title": "❌ Access denied",
                            "description": `You are not whitelisted!\nPlease join our [Discord](https://discord.com/invite/Cc76tYwXvy) to get more information!`,
                            "color": 0x2B2D31,
                        }
                    ]
                }).catch(console.error)
                return;
            }

            const { commandName, options } = interaction;
            const commandDir = path.resolve(`${process.cwd()}${path.sep}commands`);

            if (fs.existsSync(`${commandDir}${path.sep}${commandName}.js`)) {

                let commandFile = require(`${commandDir}${path.sep}${commandName}.js`);

                commandFile.executeCommand(interaction);

                return;
            }
        }

    }
}