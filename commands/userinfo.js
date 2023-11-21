const users = require("../modals/users");

let command = {
    name: "userinfo",
    name_localizations: {
        "de": "nutzerinfo",
        "en-GB": "userinfo",
        "en-US": "userinfo",
    },
    description: "Get information about a user",
    description_localizations: {
        "de": "Erhalte Infos über einen Nutzer",
        "en-GB": "Get information about a user",
        "en-US": "Get information about a user",
    },
    options: [
        {
            name: "user",
            name_localizations: {
                "de": "nutzer",
                "en-GB": "user",
                "en-US": "user",
            },
            description: "The user, you want information about",
            description_localizations: {
                "de": "Der Nutzer, über den du Informationen möchtest",
                "en-GB": "The user, you want information about",
                "en-US": "The user, you want information about",
            },
            required: true,
            type: 6,
        },
    ]
}

let executeCommand = async function executeCommand(interaction, getLocale) {
    const { commandName, options } = interaction;

    let requestedUser = options.getMember("user");

    if (!requestedUser) return;

    await users.findOne({ userid: requestedUser.id }).then(async (user) => {
        if (!user) user = await users.create({ userid: requestedUser.id });

        let adminString = "";
        if (user.badges.includes("admin")) adminString = `\n> <:rank_headadmin:1142135804114767992> Administrator`;

        let devString = "";
        if (user.badges.includes("dev")) devString = `\n> <:rank_dev:1142135668433223770> Developer`;

        let modString = "";
        if (user.badges.includes("dev")) modString = `\n> <:rank_mod:1142135724477513748> Moderator`;

        let premiumRoleString = "";
        if (user.vipuntil > new Date().getTime()) premiumRoleString = `\n> <:argus_premium:1146005958045212743> Premium Subscriber`;

        let noRoleString = "";
        if (!adminString && !devString && !modString) {
            noRoleString = "\n> None";
        }

        let premiumBadgeString = "";
        if (user.vipuntil > new Date().getTime()) {
            premiumBadgeString = "<:argus_premium:1146005958045212743> ";
        }

        interaction.reply({
            "content": " ",
            "ephemeral": true,
            "embeds": [
                {
                    "type": "rich",
                    "title": premiumBadgeString + requestedUser.user.globalName,
                    "description": `Information about <@${requestedUser.user.id}>
                    \n**General:**
                    > **Username**: ${requestedUser.user.username}
                    > **ID:** ${requestedUser.user.id}
                    > **Points:** ${user.points.toLocaleString('en-US').replaceAll(',', ' ')} <:argus_token:1145776476906598511>
                    \n**Roles:**${adminString}${devString}${modString}${noRoleString}${premiumRoleString}`,
                    "color": 0x2B2D31,
                    "thumbnail": {
                        "url": `https://cdn.discordapp.com/avatars/${requestedUser.user.id}/${requestedUser.user.avatar}.png`
                    }
                }
            ]
        }).catch(console.error)
    })
}

module.exports.command = command;
module.exports.executeCommand = executeCommand;