const guild_bots = require("../modals/guild_bots.js");
let guildBots = require("../modals/guild_bots.js");
let nodemailer = require("nodemailer");
let chalk = require("chalk");
const path = require("path");
const ejs = require("ejs");

let transporter = nodemailer.createTransport({
    host: "smtp.ionos.de",
    port: 587,
    secure: false,
    auth: {
        user: process.env.IONOS_SMTP_USER,
        pass: process.env.IONOS_SMTP_PWD,
    },
});

transporter.verify(function (error, success) {
    if (error) {
      console.log(chalk.red(error));
    } else {
      console.log(chalk.green("Server is ready to take messages"));
    }
});

const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`);
const templateDir = path.resolve(`${dataDir}${path.sep}templates`);

module.exports = {
	name: 'presenceUpdate',
	async execute(oldPresence, newPresence) {

        if (!oldPresence) {
            console.log("No old presence");
            return;
        };

        if (oldPresence.status === newPresence.status) return;

        let oldStatus = oldPresence.status;
        let newStatus = newPresence.status;


        if (oldPresence.status === "offline" || newPresence.status === "offline") {
            await guildBots.findOne({ botId: oldPresence.userId, guildId: oldPresence.guild.id })
                .then((doc) => {
                    if (!doc) return;

                    console.log(oldPresence.userId + ": " + oldPresence.status + " -> " + newPresence.status)

                    let updateDelay = doc.updateDelay;

                    if (!updateDelay || updateDelay === "none") updateDelay = 0;

                    setTimeout(async () => {
                        let botMember = oldPresence.guild.members.cache.get(newPresence.userId);
                        if (!botMember) {
                            try {
                                await guild.members.fetch();
                                botMember = oldPresence.guild.members.cache.get(newPresence.userId);
                            } catch (err) {
                                console.error(`Couldn't fetch the members of ${oldPresence.guild.id}: ${err}`);
                            }
                        }

                        let newDoc = await guildBots.findOne({ botId: oldPresence.userId, guildId: oldPresence.guild.id })
                        
                        //console.log(botMember.presence?.status + " : " + newStatus)
                        if (newPresence.status === newDoc.lastsentStatus) {
                            console.log("Already sent status")
                            return;
                        };

                        await guildBots.findOneAndUpdate({ botId: oldPresence.userId, guildId: oldPresence.guild.id }, { $set: { lastsentStatus: newPresence.status } }, { returnOriginal: false })

                        console.log("Set last status to " + newPresence.status)

                        if (doc.channelUpdate && doc.channelUpdate !== "none") {

                            let mentionRole = "";
                            if (doc.channelMentionRole && doc.channelMentionRole !== "none") {
                                mentionRole = `<@&${doc.channelMentionRole}>`;
                            }
    
                            let mentionUser = "";
                            if (doc.channelMentionUser && doc.channelMentionUser !== "none") {
                                mentionUser = `<@${doc.channelMentionUser}>`;
                            }
    
                            newPresence.guild.channels.fetch(doc.channelUpdate).then((channel) => {
                                
                                if (newPresence.status === "offline") {
                                    channel.send({
                                        "content": `${mentionRole} ${mentionUser}`,
                                        "ephemeral": false,
                                        "embeds": [
                                            {
                                                "type": "rich",
                                                "title": "",
                                                "description": `<:kbwarning:1035893598559928400> | <@${newPresence.userId}> is **offline**`,
                                                "color": 0x2B2D31,
                                            }
                                        ]
                                    }).catch(console.error)
                                } else {
                                    channel.send({
                                        "content": `${mentionRole} ${mentionUser}`,
                                        "ephemeral": false,
                                        "embeds": [
                                            {
                                                "type": "rich",
                                                "title": "",
                                                "description": `✅ | <@${newPresence.userId}> is **online**`,
                                                "color": 0x2B2D31,
                                            }
                                        ]
                                    }).catch(console.error)
                                }
                            })
                        }
    
                        doc.dmList.forEach(async (dmUser, index) => {
                            if (!dmUser.activationCode || dmUser.activationCode !== "none") return;
    
                            let member = oldPresence.guild.members.cache.get(dmUser.id);
                            if (!member) {
                                try {
                                    await oldPresence.guild.members.fetch();
                                    member = oldPresence.guild.members.cache.get(dmUser.id);
                                } catch (err) {
                                    console.error(`Couldn't fetch the members of ${oldPresence.guild.id}: ${err}`);
                                }
                            }
    
                            if (newPresence.status === "offline") {
                                member.send({
                                    "content": ``,
                                    "ephemeral": false,
                                    "embeds": [
                                        {
                                            "type": "rich",
                                            "title": "",
                                            "description": `<:kbwarning:1035893598559928400> | <@${newPresence.userId}> is **offline** on ${oldPresence.guild.name}`,
                                            "color": 0x2B2D31,
                                        }
                                    ]
                                }).catch(console.error)
                            } else {
                                member.send({
                                    "content": ``,
                                    "ephemeral": false,
                                    "embeds": [
                                        {
                                            "type": "rich",
                                            "title": "",
                                            "description": `✅ | <@${newPresence.userId}> is **online** on ${oldPresence.guild.name}`,
                                            "color": 0x2B2D31,
                                        }
                                    ]
                                }).catch(console.error)
                            }
                        })

                        doc.mailList.forEach(async (mailObj, index) => {
                            if (!mailObj.activationCode || mailObj.activationCode !== "none") return;

                            if (newPresence.status === "offline") {
                                ejs.renderFile(path.resolve(`${templateDir}${path.sep}mails${path.sep}statusmail.ejs`), { 
                                    mail: mailObj.mail,
                                    botMember,
                                    newPresence,
                                    status: "offline"
                                }, function (err, mailfile) {
                                    if (err) return console.log(err);

                                    transporter.sendMail({
                                        from: process.env.IONOS_SMTP_USER,
                                        to: mailObj.mail,
                                        subject: `${botMember.user.username}#${botMember.user.discriminator} is now 🔴 Offline`,
                                        text: `Hello ${mailObj.mail.split("@")[0]},\n\n Your Bot ${botMember.user.username}#${botMember.user.discriminator} (${botMember.user.id}) is now offline on ${newPresence.guild.name} (${newPresence.guild.id})\n\nGreetings\nYour Argus Team`,
                                        html: mailfile
                                    }, (err, info) => {
                                        if (err) console.log(err);
                                    });
                                });
                            } else {
                                ejs.renderFile(path.resolve(`${templateDir}${path.sep}mails${path.sep}statusmail.ejs`), { 
                                    mail: mailObj.mail,
                                    botMember,
                                    newPresence,
                                    status: "online"
                                }, function (err, mailfile) {
                                    if (err) return console.log(err);

                                    transporter.sendMail({
                                        from: process.env.IONOS_SMTP_USER,
                                        to: mailObj.mail,
                                        subject: `${botMember.user.username}#${botMember.user.discriminator} is now 🟢 Online`,
                                        text: `Hello ${mailObj.mail.split("@")[0]},\n\n Your Bot ${botMember.user.username}#${botMember.user.discriminator} (${botMember.user.id}) is now online on ${newPresence.guild.name} (${newPresence.guild.id})\n\nGreetings\nYour Argus Team`,
                                        html: mailfile
                                    }, (err, info) => {
                                        if (err) console.log(err);
                                    });
                                });
                            }
                        })
                    }, updateDelay)
                })
        }

    }
}