const url = require("url");
const ejs = require("ejs");
const path = require("path");
const chalk = require("chalk");
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const session = require("express-session");
const { PermissionsBitField } = require("discord.js");
const Strategy = require("passport-discord").Strategy;
//const { boxConsole } = require("../functions/boxconsole");
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const whitelist = require("../whitelist.json");

const app = express();
const MemoryStore = require("memorystore")(session);

const guild_bots = require("../modals/guild_bots.js");
const users = require("../modals/users");
const promo_codes = require("../modals/promo_codes.js");

const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
    message: {
        msg: "Too many requests, please try again later."
    }
});

app.use("/api", apiLimiter)

function randomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

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

module.exports = async (client) => {
    if (process.env.DEVMODE === "true") {
        app.set('subdomain offset', 1);
    }

    const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`);
    const templateDir = path.resolve(`${dataDir}${path.sep}templates`);

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    let domain;
    let callbackUrl;

    try {
        const domainUrl = new URL(process.env.DOMAIN);
        domain = {
            host: domainUrl.hostname,
            protocol: domainUrl.protocol,
        };
    } catch (e) {
        console.log(e);
        throw new TypeError("Invalid domain specific in the config file.");
    }

    if (process.env.USINGCUSTOMDOMAIN === "true") {
        callbackUrl = `${domain.protocol}//${domain.host}/callback`;
    } else {
        callbackUrl = `${domain.protocol}//${domain.host}${process.env.PORT == 80 ? "" : `:${process.env.PORT}`}/callback`;
    }

    const msg = `${chalk.red.bold("Info:")} ${chalk.green.italic(
        "Make sure you have added the Callback URL to the Discord's OAuth Redirects section in the developer portal.",
    )}`;
    // boxConsole([
    //     `${chalk.red.bold("Callback URL:")} ${chalk.white.bold.italic.underline(
    //         callbackUrl,
    //     )}`,
    //     `${chalk.red.bold(
    //         "Discord Developer Portal:",
    //     )} ${chalk.white.bold.italic.underline(
    //         `https://discord.com/developers/applications/${process.env.ID}/oauth2`,
    //     )}`,
    //     msg,
    // ]);

    passport.use(
        new Strategy(
            {
                clientID: process.env.ID,
                clientSecret: process.env.SECRET,
                callbackURL: callbackUrl,
                scope: ["identify", "guilds"],
            },
            (accessToken, refreshToken, profile, done) => {
                process.nextTick(() => done(null, profile));
            },
        ),
    );

    app.use(
        session({
            store: new MemoryStore({ checkPeriod: 86400000 }),
            secret:
                "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
            resave: false,
            saveUninitialized: false,
        }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

    app.locals.domain = process.env.DOMAIN.split("//")[1];

    app.engine("ejs", ejs.renderFile);
    app.set("view engine", "ejs");

    app.use(bodyParser.json());
    app.use(
        bodyParser.urlencoded({
            extended: true,
        }),
    );

    app.use("/assets", express.static(path.resolve(`${dataDir}${path.sep}assets`)));

    const renderTemplate = (res, req, template, data = {}) => {
        const baseData = {
            bot: client,
            path: req.path,
            user: req.isAuthenticated() ? req.user : null,
        };

        res.render(
            path.resolve(`${templateDir}${path.sep}${template}`),
            Object.assign(baseData, data),
        );
    };

    const requireAuth = (req, res, next) => {
        if (req.isAuthenticated()) return next();
        req.session.backURL = req.url;
        res.redirect("/login");
    };

    app.get("/login", (req, res, next) => {
        if (req.session.backURL) {
            req.session.backURL = req.session.backURL;
        } else if (req.headers.referer) {
            const parsed = url.parse(req.headers.referer);
            if (parsed.hostname === app.locals.domain) {
                req.session.backURL = parsed.path;
            }
        } else {
            req.session.backURL = "/";
        }

        console.log("1" + req.session.backURL)
        next();
    },
        passport.authenticate("discord", { failureRedirect: "/" }),
    );

    app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }),
        async (req, res) => {
            console.log("2" + req.session.backURL)
            if (req.session.backURL) {
                const backURL = req.session.backURL;
                req.session.backURL = null;
                res.redirect(backURL);
            } else {
                res.redirect("/dashboard");
            }

            await users.findOne({ userid: req.user.id }).then(async (userDoc) => {
                if (userDoc) return;

                await users.create({ userid: req.user.id });
            })
        },
    );

    app.get("/logout", function (req, res) {
        req.session.destroy(() => {
            req.logout(() => {});
            res.redirect("/");
        });
    });

    app.get("/", (req, res) => {
        renderTemplate(res, req, "home/main.ejs", {
            user: req.user,
        })
    });

    app.get("/impressum", (req, res) => {
        renderTemplate(res, req, "home/impressum.ejs", {
            user: req.user,
        })
    });
    app.get("/terms", (req, res) => {
        renderTemplate(res, req, "home/tos.ejs", {
            user: req.user,
        })
    });
    app.get("/privacy", (req, res) => {
        renderTemplate(res, req, "home/privacy.ejs", {
            user: req.user,
        })
    });

    app.get("/support", (req, res) => {
        renderTemplate(res, req, "home/support.ejs", {
            user: req.user,
        })
    });

    app.get("/premium", (req, res) => {
        renderTemplate(res, req, "home/premium.ejs", {
            user: req.user,
        })
    });

    app.get("/discord", (req, res) => {
        res.redirect("https://discord.com/invite/Cc76tYwXvy");
    });

    app.get("/instagram", (req, res) => {
        res.redirect("https://www.instagram.com/argus_bot");
    });

    app.get("/twitter", (req, res) => {
        res.redirect("https://twitter.com/argus_dbot");
    });

    app.get("/invite", (req, res) => {
        res.redirect(`https://discord.com/api/oauth2/authorize?client_id=1138772460322435072&permissions=${process.env.PERMISSIONS}&scope=bot%20applications.commands`);
    });

    app.get("/profile", requireAuth, async (req, res) => {
        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.resolve(userDoc).then((value) => {
            if (!value) return res.redirect("/");

            renderTemplate(res, req, "dashboard/profile.ejs", {
                user: req.user,
                userDoc,
            });
        })
    });
    
    app.get("/redeem", requireAuth, async (req, res) => {
        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.resolve(userDoc).then((value) => {
            if (!value) return res.redirect("/");

            renderTemplate(res, req, "dashboard/redeemPage.ejs", {
                user: req.user,
                userDoc,
            });
        })
    });

    if (process.env.WHITELIST === "true") {
        app.get("/dashboard", (req, res, next) => {
            if (req.user && whitelist.includes(req.user.id)) next();
            else res.redirect("/login");
        })
    }

    app.get("/dashboard", requireAuth, async (req, res) => {
        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.resolve(userDoc).then((value) => {
            if (!value) return res.redirect("/");

            renderTemplate(res, req, "dashboard/main.ejs", {
                user: req.user,
                userDoc,
                perms: PermissionsBitField,
                domain: process.env.DOMAIN,
                port: process.env.PORT,
                requiredPerms: process.env.PERMISSIONS
            })
        })
    });

    app.get("/managepremium", requireAuth, async (req, res) => {
        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.resolve(userDoc).then((value) => {
            if (!value) return res.redirect("/");

            renderTemplate(res, req, "dashboard/premium.ejs", {
                user: req.user,
                userDoc,
            });
        })
    });

    app.get("/dashboard/:guildId", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect("/dashboard");
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            return res.redirect("/dashboard");
        }

        //let guildBots = await guild_bots.find({ guildId: guild.id });

        let botMembers = guild.members.cache.filter(member => member.user.bot)

        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.resolve(userDoc).then((value) => {
            if (!value) return res.redirect("/");

            renderTemplate(res, req, "dashboard/server.ejs", {
                guild,
                user: req.user,
                botMembers,
                userDoc
            })
        })
    });

    app.get("/dashboard/:guildId/:botId", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect("/dashboard");
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            return res.redirect("/dashboard");
        }
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) return res.redirect(`/dashboard/${guild.id}`);

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            botDoc = await guild_bots.create({ guildId: guild.id, botId: botMember.id });
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.resolve(userDoc).then((value) => {
            if (!value) return res.redirect("/");

            renderTemplate(res, req, "dashboard/guildBot.ejs", {
                user: req.user,
                userDoc,
                guild,
                botMember,
                botDoc
            })
        })
    });

    app.get("/dashboard/:guildId/:botId/channel", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect("/dashboard");
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            return res.redirect("/dashboard");
        }

        let roles = await guild.roles.fetch();

        let channels = await guild.channels.fetch();
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) return res.redirect(`/dashboard/${guild.id}`);

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            botDoc = await guild_bots.create({ guildId: guild.id, botId: botMember.id });
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.all([roles, botDoc, channels, userDoc]).then((values) => {
            roles.sort((a, b) => b.position - a.position || b.id - a.id);
            channels = channels.filter(c => c.type === 0 || c.type === 5)
            renderTemplate(res, req, "dashboard/guildBot_update_channel.ejs", {
                user: req.user,
                userDoc,
                guild,
                botMember,
                botDoc,
                roles,
                channels
            })
        })
    });

    app.get("/dashboard/:guildId/:botId/dm", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect("/dashboard");
        let member = guild.members.cache.get(req.user.id);
        let allMembers = await guild.members.fetch();
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            return res.redirect("/dashboard");
        }

        let roles = await guild.roles.fetch();

        let channels = await guild.channels.fetch();
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) return res.redirect(`/dashboard/${guild.id}`);

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            botDoc = await guild_bots.create({ guildId: guild.id, botId: botMember.id });
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.all([roles, botDoc, channels, allMembers, userDoc]).then((values) => {
            roles.sort((a, b) => b.position - a.position || b.id - a.id);
            channels = channels.filter(c => c.type === 0 || c.type === 5)
            allMembers = allMembers.filter(u => u.user.bot === false);
            renderTemplate(res, req, "dashboard/guildBot_update_dm.ejs", {
                user: req.user,
                userDoc,
                guild,
                botMember,
                botDoc,
                roles,
                channels,
                allMembers
            })
        })
    });

    app.get("/api/:guildId/:botId/adddmuser/:userId", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) {
            res.send("Guild not found");
            res.status(404);
            return;
        }
        let member = guild.members.cache.get(req.user.id);
        let allMembers = await guild.members.fetch();
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        if (!userDoc) {
            res.send("User not found");
            res.status(400);
            return;
        }

        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            res.send("forbidden");
            res.status(403);
            return;
        }

        let addMember = guild.members.cache.get(req.params.userId);
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }
    
        if (!addMember || !addMember.user) return;

        var result = botDoc.dmList.find(obj => {
            return obj.id === req.params.userId
        });

        if (result) {
            res.send({ msg: "User already added" });
            res.status(400);
            return;
        }

        if ((userDoc.vipuntil < new Date().getTime() && botDoc.dmList.length >= 10) || (userDoc.vipuntil >= new Date().getTime() && botDoc.dmList.length >= 100)) {
            res.send({ msg: "Limit reached!", premium: userDoc.vipuntil >= new Date().getTime() });
            res.status(400);
            return;
        }

        const randomActivationCode = randomString(5);

        addMember.send(
            `Hello ${addMember.user.username},\n\n<@${req.user.id}> wants us to send you status updates for the <@${botMember.user.id}> bot on \`${guild.name}\`.\nPlease click the link below, to confirm that you want to recieve personal messages regarding the status of <@${botMember.user.id}>.\n\nhttps://argus-bot.com/dashboard/${req.params.guildId}/${req.params.botId}/verifydm?code=${randomActivationCode}\n\nIf you have not requested this, you can just ignore this message.`
        ).catch((err => {
                if (err) console.log(err)
                res.send({ msg: "Error sending msg" });
                res.status(400);
                return;
            }))

        Promise.all([botDoc, allMembers]).then(async (values) => {
            allMembers = allMembers.filter(u => u.user.bot === false);

            let dmObject = {
                id: req.params.userId,
                name: addMember.user.username,
                activationCode: randomActivationCode,
            }
            
            let newArr = botDoc.dmList;
            newArr.push(dmObject);

            await guild_bots.findOneAndUpdate({ guildId: guild.id, botId: req.params.botId }, { $set: { dmList: newArr }}, { returnOriginal: false });

            res.status(200);
            res.send(dmObject);
        })
    });

    app.get("/api/:guildId/:botId/rmvdmuser/:userId", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) {
            res.send("Guild not found");
            res.status(404);
            return;
        }
        let member = guild.members.cache.get(req.user.id);
        let allMembers = await guild.members.fetch();
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }

        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            res.send("forbidden");
            res.status(403);
            return;
        }

        let addMember = guild.members.cache.get(req.params.userId);
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }
    
        if (!addMember || !addMember.user) return;

        var result = botDoc.dmList.find(obj => {
            return obj.id === req.params.userId
        });

        if (!result) {
            res.send({ msg: "User not existing" });
            res.status(400);
            return;
        }

        Promise.all([botDoc, allMembers]).then(async (values) => {
            allMembers = allMembers.filter(u => u.user.bot === false);

            let dmObject = {
                id: req.params.userId,
                name: addMember.user.username,
                activationCode: randomString(5),
            }
            
            let newArr = botDoc.dmList;
            newArr = botDoc.dmList.filter(obj => {
                return obj.id !== req.params.userId
            });

            await guild_bots.findOneAndUpdate({ guildId: guild.id, botId: req.params.botId }, { $set: { dmList: newArr }}, { returnOriginal: false });

            res.status(200);
            res.send({ msg: "OK" });
        })
    });

    app.get("/dashboard/:guildId/:botId/verifydm", async (req, res) => {
        console.log("VERIFY!")
        let botDoc = await guild_bots.findOne({ guildId: req.params.guildId, botId: req.params.botId });

        if (!botDoc) {
            renderTemplate(res, req, "dashboard/verifydm.ejs", {
                role: "danger",
                msg: "Bot not found!"
            });
            return;
        }

        if (!req.query.code) {
            renderTemplate(res, req, "dashboard/verifydm.ejs", {
                role: "danger",
                msg: "No code provided!"
            });
            return;
        }

        var result = botDoc.dmList.find(obj => {
            return obj.activationCode === req.query.code
        });

        if (!result) {
            renderTemplate(res, req, "dashboard/verifydm.ejs", {
                role: "danger",
                msg: "Activation code wrong!"
            });
            return;
        }

        let newArr = botDoc.dmList;
        newArr = botDoc.dmList.filter(obj => {
            return obj.id !== result.id
        });

        let newDmObject = {
            id: result.id,
            name: result.name,
            activationCode: "none",
        }

        newArr.push(newDmObject);

        await guild_bots.findOneAndUpdate({ guildId: req.params.guildId, botId: req.params.botId }, { $set: { dmList: newArr }}, { returnOriginal: false });

        renderTemplate(res, req, "dashboard/verifydm.ejs", {
            role: "success",
            msg: "Successfully verified DM!"
        });
    });

    app.get("/dashboard/:guildId/:botId/mail", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect("/dashboard");
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            return res.redirect("/dashboard");
        }

        //let channels = await guild.channels.fetch();
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) return res.redirect(`/dashboard/${guild.id}`);

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            botDoc = await guild_bots.create({ guildId: guild.id, botId: botMember.id });
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.all([botDoc]).then((values) => {
            renderTemplate(res, req, "dashboard/guildBot_update_mail.ejs", {
                user: req.user,
                userDoc,
                guild,
                botMember,
                botDoc
            })
        })
    });

    app.get("/api/:guildId/:botId/setchannelupdatechannel/:channelId", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) {
            res.send("Guild not found");
            res.status(404);
            return;
        }
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        if (!userDoc) {
            res.send("User not found");
            res.status(400);
            return;
        }

        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            res.send("forbidden");
            res.status(403);
            return;
        }
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        Promise.all([botDoc]).then(async (values) => {
            if (req.params.channelId === "none") {
                await guild_bots.findOneAndUpdate({ guildId: guild.id, botId: req.params.botId }, { $set: { channelUpdate: "none" }}, { returnOriginal: false });
                res.status(200);
                res.send({ msg: "OK" });
                return;
            }

            let newChannel = guild.channels.cache.get(req.params.channelId);

            if (!newChannel) {
                res.send({ msg: "Channel not found" });
                res.status(400);
                return;
            }

            await guild_bots.findOneAndUpdate({ guildId: guild.id, botId: req.params.botId }, { $set: { channelUpdate: newChannel.id }}, { returnOriginal: false });

            res.status(200);
            res.send({ msg: "OK" });
        })
    });

    app.get("/api/:guildId/:botId/setupdatechannelrole/:roleId", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) {
            res.send("Guild not found");
            res.status(404);
            return;
        }
        let member = guild.members.cache.get(req.user.id);
        let allMembers = await guild.members.fetch();
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        if (!userDoc) {
            res.send("User not found");
            res.status(400);
            return;
        }

        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            res.send("forbidden");
            res.status(403);
            return;
        }
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        Promise.all([botDoc]).then(async (values) => {
            if (req.params.roleId === "none") {
                await guild_bots.findOneAndUpdate({ guildId: guild.id, botId: req.params.botId }, { $set: { channelMentionRole: "none" }}, { returnOriginal: false });
                res.status(200);
                res.send({ msg: "OK" });
                return;
            }

            let mentionrole = guild.roles.cache.get(req.params.roleId);

            if (!mentionrole) {
                res.send({ msg: "Role not found" });
                res.status(400);
                return;
            }

            await guild_bots.findOneAndUpdate({ guildId: guild.id, botId: req.params.botId }, { $set: { channelMentionRole: mentionrole.id }}, { returnOriginal: false });

            res.status(200);
            res.send({ msg: "OK" });
        })
    });

    app.get("/api/:guildId/:botId/addmail/:mail", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) {
            res.send("Guild not found");
            res.status(404);
            return;
        }
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${req.params.guildId}: ${err}`);
            }
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        if (!userDoc) {
            res.send("User not found");
            res.status(400);
            return;
        }

        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            res.send("forbidden");
            res.status(403);
            return;
        }

        let addMail = decodeURIComponent(req.params.mail);
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }
    
        if (!addMail) return;

        var result = botDoc.mailList.find(obj => {
            return obj.mail === addMail
        });

        if (result) {
            res.send({ msg: "User already added" });
            res.status(400);
            return;
        }

        if ((userDoc.vipuntil < new Date().getTime() && botDoc.mailList.length >= 5) || (userDoc.vipuntil >= new Date().getTime() && botDoc.mailList.length >= 15)) {
            res.send({ msg: "Limit reached!", premium: userDoc.vipuntil >= new Date().getTime() });
            res.status(400);
            return;
        }

        const activationCode = randomString(5);

        ejs.renderFile(path.resolve(`${templateDir}${path.sep}mails${path.sep}confirmmail.ejs`), { 
            botMember,
            activationCode,
            guild,
            guildId: req.params.guildId,
            botId: req.params.botId,
            addMail
        }, function (err, mailfile) {
            if (err) {
                console.log(err);
            } else {
                transporter.sendMail({
                    from: process.env.IONOS_SMTP_USER,
                    to: addMail,
                    subject: `Confirm E-Mail adress for Bot Updates`,
                    text: `Hello ${addMail.split("@")[0]},\n\nPlease confirm, that you want to recieve updates for the status of ${botMember.user.username} bot on ${guild.name}.\nClick the link below, to confirm that you want to recieve E-Mails regarding the status of ${botMember.user.username}.\n\nhttps://argus-bot.com/dashboard/${req.params.guildId}/${req.params.botId}/verifymail?code=${activationCode}\n\nIf you have not requested this E-Mail, you can just ignore this message.\n\nGreetings\nYour Argus Team`,
                    html: mailfile
                }, (err, info) => {
                    if (err && err.message === "No recipients defined") {
                        res.send({ msg: "No recipients defined" });
                        res.status(400);
                        return;
                    }
                    if (err) {
                        res.send({ msg: "Error while sending email" });
                        res.status(400);
                        return;
                    };
        
                    Promise.all([botDoc]).then(async (values) => {
            
                        let mailObject = {
                            mail: addMail,
                            activationCode: activationCode,
                        }
                        
                        let newArr = botDoc.mailList;
                        newArr.push(mailObject);
            
                        await guild_bots.findOneAndUpdate({ guildId: guild.id, botId: req.params.botId }, { $set: { mailList: newArr }}, { returnOriginal: false });
            
                        res.status(200);
                        res.send(mailObject);
                    })
                });
            }
            
        });
    });

    // app.get("/mails/confirmmail", (req, res) => {
    //     renderTemplate(res, req, "mails/confirmmail.ejs", {

    //     });
    // })

    app.get("/api/:guildId/:botId/rmvmail/:mail", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) {
            res.send("Guild not found");
            res.status(404);
            return;
        }
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${req.params.guildId}: ${err}`);
            }
        }

        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            res.send("forbidden");
            res.status(403);
            return;
        }

        let addMail = decodeURIComponent(req.params.mail);
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let botDoc = await guild_bots.findOne({ guildId: req.params.guildId, botId: req.params.botId });

        if (!botDoc) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }
    
        if (!addMail) return;

        var result = botDoc.mailList.find(obj => {
            return obj.mail === addMail
        });

        if (!result) {
            res.send({ msg: "User not existing" });
            res.status(400);
            return;
        }

        Promise.all([botDoc]).then(async (values) => {
            let newArr = botDoc.mailList;
            newArr = botDoc.mailList.filter(obj => {
                return obj.mail !== addMail
            });

            await guild_bots.findOneAndUpdate({ guildId: req.params.guildId, botId: req.params.botId }, { $set: { mailList: newArr }}, { returnOriginal: false });

            res.status(200);
            res.send({ msg: "OK" });
        })
    });

    app.get("/dashboard/:guildId/:botId/verifymail", async (req, res) => {
        let botDoc = await guild_bots.findOne({ guildId: req.params.guildId, botId: req.params.botId });

        if (!botDoc) {
            renderTemplate(res, req, "dashboard/verifydm.ejs", {
                role: "danger",
                msg: "Bot not found!"
            });
            return;
        }

        if (!req.query.code) {
            renderTemplate(res, req, "dashboard/verifydm.ejs", {
                role: "danger",
                msg: "No code provided!"
            });
            return;
        }

        var result = botDoc.mailList.find(obj => {
            return obj.activationCode === req.query.code
        });

        if (!result) {
            renderTemplate(res, req, "dashboard/verifydm.ejs", {
                role: "danger",
                msg: "Activation code wrong!"
            });
            return;
        }

        let newArr = botDoc.mailList;
        newArr = botDoc.mailList.filter(obj => {
            return obj.mail !== result.mail
        });

        let newDmObject = {
            mail: result.mail,
            activationCode: "none",
        }

        newArr.push(newDmObject);

        await guild_bots.findOneAndUpdate({ guildId: req.params.guildId, botId: req.params.botId }, { $set: { mailList: newArr }}, { returnOriginal: false });

        renderTemplate(res, req, "dashboard/verifydm.ejs", {
            role: "success",
            msg: "Successfully verified E-Mail adress!"
        });
    });

    app.get("/dashboard/:guildId/:botId/embed", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect("/dashboard");
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
            }
        }
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            return res.redirect("/dashboard");
        }

        let channels = await guild.channels.fetch();
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) return res.redirect(`/dashboard/${guild.id}`);

        let botDoc = await guild_bots.findOne({ guildId: guild.id, botId: req.params.botId });

        if (!botDoc) {
            botDoc = await guild_bots.create({ guildId: guild.id, botId: botMember.id });
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        Promise.all([botDoc, channels, userDoc]).then((values) => {
            channels = channels.filter(c => c.type === 0 || c.type === 5)
            renderTemplate(res, req, "dashboard/guildBot_update_embed.ejs", {
                user: req.user,
                userDoc,
                guild,
                botMember,
                botDoc,
                channels
            })
        })
    });

    app.get("/api/:guildId/:botId/setembedchannel/:channelId", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) {
            res.send("Guild not found");
            res.status(404);
            return;
        }
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${req.params.guildId}: ${err}`);
            }
        }

        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            res.send("forbidden");
            res.status(403);
            return;
        }

        let channels = await guild.channels.fetch();
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let botDoc = await guild_bots.findOne({ guildId: req.params.guildId, botId: req.params.botId });

        if (!botDoc) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        if (botDoc.embedUpdate.split("/")[0] === req.params.channelId) {
            res.send({ msg: "No changes found" });
            res.status(400);
            return;
        }

        if (req.params.channelId === "none") {
            await guild_bots.findOneAndUpdate({ guildId: req.params.guildId, botId: req.params.botId }, { $set: { embedUpdate: `none` }}, { returnOriginal: false });
            res.status(200);
            res.send({ msg: "OK" });
            return;
        }

        Promise.all([botDoc, channels]).then(async (values) => {
            let newChannel = guild.channels.cache.get(req.params.channelId);
            let oldChannel = guild.channels.cache.get(botDoc.embedUpdate.split("/")[0]);

            let statusmsg = `✅ | **Online**`;
            if (!botMember.presence) statusmsg = `<:kbwarning:1035893598559928400> | **Could not fetch status**`;
            if (botMember.presence && botMember.presence.status && botMember.presence.status === "offline") statusmsg = `<:kbwarning:1035893598559928400> | **Offline**`;

            newChannel.send({
                "content": " ",
                "tts": false,
                "embeds": [
                    {
                        "id": 141612892,
                        "title": ``,
                        "description": `## Status of ${botMember.user.username}#${botMember.user.discriminator} \n### > ${statusmsg}\n`,
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
            })
                .then(async (msg) => {
                    if (oldChannel) {
                        oldChannel.messages.fetch({ limit: 100 }).then(async (messages) => {
                            messages.forEach(message => {
                                if (message.id === botDoc.embedUpdate.split("/")[1]) message.delete().catch(console.error)
                            })
    
                            await guild_bots.findOneAndUpdate({ guildId: req.params.guildId, botId: req.params.botId }, { $set: { embedUpdate: `${newChannel.id}/${msg?.id}` }}, { returnOriginal: false });
                        })
                    } else {
                        await guild_bots.findOneAndUpdate({ guildId: req.params.guildId, botId: req.params.botId }, { $set: { embedUpdate: `${newChannel.id}/${msg?.id}` }}, { returnOriginal: false });
                    }
                    res.status(200);
                    res.send({ msg: "OK" });
                })
                .catch(err => {
                    console.log(err)
                    res.status(200);
                    res.send({ msg: "Error while sending embed" });
                })
        })
    });

    app.get("/api/:guildId/:botId/setupdatedelay/:delay", requireAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) {
            res.send("Guild not found");
            res.status(404);
            return;
        }
        let member = guild.members.cache.get(req.user.id);
        if (!member) {
            try {
                await guild.members.fetch();
                member = guild.members.cache.get(req.user.id);
            } catch (err) {
                console.error(`Couldn't fetch the members of ${req.params.guildId}: ${err}`);
            }
        }

        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has('MANAGE_GUILD')) {
            res.send("forbidden");
            res.status(403);
            return;
        }
        
        let botMember = guild.members.cache.get(req.params.botId);

        if (!botMember) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let botDoc = await guild_bots.findOne({ guildId: req.params.guildId, botId: req.params.botId });

        if (!botDoc) {
            res.send({ msg: "Bot not found" });
            res.status(404);
            return;
        }

        let delay = Number(req.params.delay);

        if (delay === undefined || delay === null) {
            res.send({ msg: "Invalid delay" });
            res.status(400);
            return;
        }

        Promise.all([botDoc]).then(async (values) => {
            if (botDoc.updateDelay === delay) {
                res.send({ msg: "No changes found" });
                res.status(400);
                return;
            }

            await guild_bots.findOneAndUpdate({ guildId: req.params.guildId, botId: req.params.botId}, { $set: { updateDelay: delay }}, { returnOriginal: false });

            res.send({ msg: "OK" });
            res.status(200);
        })
    });

    app.get("/api/redeemcode/:code", requireAuth, async (req, res) => {
        let code = req.params.code;

        let userDoc = await users.findOne({ userid: req.user.id });
        let codeDoc = await promo_codes.findOne({ code: code });

        if (!codeDoc) {
            res.send({ msg: "Code not found" });
            res.status(400);
            return;
        }

        if (codeDoc.used_by.includes(req.user.id)) {
            res.send({ msg: "Already claimed code" });
            res.status(400);
            return;
        }

        if (codeDoc.used_by.length >= codeDoc.max_uses && codeDoc.max_uses !== -1) {
            res.send({ msg: "Max uses reached" });
            res.status(400);
            return;
        }

        if (new Date().getTime() >= Number(codeDoc.expiring)) {
            res.send({ msg: "Code expired" });
            res.status(400);
            return; 
        }

        let newUserArray = codeDoc.used_by;
        newUserArray.push(req.user.id);

        let newUsedArray = userDoc.redeemCodeLog;
        newUsedArray.push({
            type: codeDoc.type,
            amount: codeDoc.amount,
            code: codeDoc.code,
            redeemed: new Date().getTime()
        });

        await promo_codes.findOneAndUpdate({ code: code }, { $set: { used_by: newUserArray }}, { returnOriginal: false });

        if (codeDoc.type === "points") {
            await users.findOneAndUpdate({ userid: req.user.id }, { $inc: { points: codeDoc.amount }, $set: { redeemCodeLog: newUsedArray }});
        } else if (codeDoc.type === "premium") {
            await users.findOneAndUpdate({ userid: req.user.id }, { $inc: { vipuntil: codeDoc.amount }, $set: { redeemCodeLog: newUsedArray }});
        }

        res.send({ 
            msg: "OK",
            type: codeDoc.type,
            amount: codeDoc.amount,
            code: codeDoc.code,
        });
        res.status(200);
    });

    app.get("/api/claimReward/:rewardType", requireAuth, async (req, res) => {
        let rewardType = req.params.rewardType;

        let userDoc = await users.findOne({ userid: req.user.id });

        if (!userDoc) return;

        if (rewardType === "instagram") {
            if (userDoc.claimedRewardInstagram === true) {
                res.status(400);
                res.send({ msg: "Already claimed!" });
                return;
            }

            await users.findOneAndUpdate({ userid: req.user.id }, { $set: { claimedRewardInstagram: true }, $inc: { points: 5000 } }, { returnOriginal: false });

            res.status(200);
            res.send({ msg: "OK" });
            return;
        }

        if (rewardType === "twitter") {
            if (userDoc.claimedRewardTwitter === true) {
                res.status(400);
                res.send({ msg: "Already claimed!" });
                return;
            }

            await users.findOneAndUpdate({ userid: req.user.id }, { $set: { claimedRewardTwitter: true }, $inc: { points: 5000 } }, { returnOriginal: false });

            res.status(200);
            res.send({ msg: "OK" });
            return;
        }

        if (rewardType === "discord") {
            if (userDoc.claimedRewardDiscord === true) {
                res.status(400);
                res.send({ msg: "Already claimed!" });
                return;
            }

            await users.findOneAndUpdate({ userid: req.user.id }, { $set: { claimedRewardDiscord: true }, $inc: { points: 10000 } }, { returnOriginal: false });

            res.status(200);
            res.send({ msg: "OK" });
            return;
        }

        res.status(400);
        res.send({ msg: "Reward type not found" });
        return;
    });

    app.get("/rewardredirect/:rewardType", (req, res) => {
        let rewardType = req.params.rewardType;

        if (rewardType === "twitter") {
            res.redirect("https://twitter.com/argus_dbot");
        }

        if (rewardType === "instagram") {
            res.redirect("https://www.instagram.com/argus_bot");
        }

        if (rewardType === "discord") {
            res.redirect("https://discord.com/invite/Cc76tYwXvy");
        }
    });

    app.get("/api/buypremium/:months", requireAuth, async (req, res) => {
        let months = Number(req.params.months);

        if (!months || (months !== 1 && months !== 3 && months !== 12)) {
            res.status(400);
            res.send({ msg: "Invalid premium duration" });
            return;
        }

        let userDoc = await users.findOne({ userid: req.user.id });

        if (!userDoc) {
            res.status(400);
            res.send({ msg: "Could not find user" });
            return;
        }

        let cost = 40000;
        if (months === 1) cost = 40000;
        if (months === 3) cost = 110000;
        if (months === 12) cost = 400000;

        if (userDoc.points - cost < 0) {
            res.status(400);
            res.send({ msg: "Not enough money" });
            return;
        }

        let milliseconds = months * 30 * 24 * 60 * 60 * 1000;

        await users.findOneAndUpdate({ userid: req.user.id }, { $inc: { points: -Math.abs(cost), vipuntil: milliseconds }});
        
        res.status(200);
        res.send({ msg: "OK" });
        return;
    });

    /* Admin panel */
    const requireMod = async (req, res, next) => {
        if (!req.user) return res.redirect("/login");

        let userDoc = await users.findOne({ userid: req.user.id });

        if (userDoc.badges.includes("admin") || userDoc.badges.includes("mod")) return next();

        return res.redirect("/");
    }

    const requireAadmin = async (req, res, next) => {
        if (!req.user) return res.redirect("/login");

        let userDoc = await users.findOne({ userid: req.user.id });

        if (!userDoc.badges.includes("admin")) return res.redirect("/");

        return next();
    }

    app.get("/admin", requireAuth, requireMod, async (req, res) => {
        let userDoc = await users.findOne({ userid: req.user.id });

        renderTemplate(res, req, "admin/main.ejs", {
            user: req.user,
            userDoc,
        });
    });

    app.get("/admin/promo", requireAuth, requireAadmin, async (req, res) => {
        let userDoc = await users.findOne({ userid: req.user.id });

        function notExpiredCode(codeDoc) {
            let expiringDate = Number(codeDoc.expiring);
            let now = new Date().getTime();

            return expiringDate > now;
        }

        let promocodes = await promo_codes.find();

        promocodes = promocodes.filter(notExpiredCode);

        //console.log(promocodes)

        renderTemplate(res, req, "admin/promoCode.ejs", {
            user: req.user,
            userDoc,
            promocodes
        });
    });

    app.get("/admin/promo/create", requireAuth, requireAadmin, async (req, res) => {
        let userDoc = await users.findOne({ userid: req.user.id });

        renderTemplate(res, req, "admin/createPromoCode.ejs", {
            user: req.user,
            userDoc,
        });
    });

    function randomString(length) {
        const list = "ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789";
        var res = "";
        for(var i = 0; i < length; i++) {
            var rnd = Math.floor(Math.random() * list.length);
            res = res + list.charAt(rnd);
        }
        return res;
    }

    app.post("/admin/promo/create", requireAuth, requireAadmin, async (req, res) => {
        let userDoc = await users.findOne({ userid: req.user.id });

        let code = randomString(16);

        console.log(code)

        let expiryDate = new Date(req.body.expirydate).getTime();

        if (!expiryDate) {
            renderTemplate(res, req, "admin/createPromoCode.ejs", {
                user: req.user,
                userDoc,
            });
            return;
        }

        promo_codes.create({ code: code, amount: req.body.amount, expiring: expiryDate, max_uses: req.body.maxuses, type: req.body.type });

        renderTemplate(res, req, "admin/createPromoCode.ejs", {
            user: req.user,
            userDoc,
        });
    });

    app.get("*", (req, res) => {
        renderTemplate(res, req, "error_404", { user: req.user });
    });

    app.listen(process.env.PORT, null, null, () =>
        console.log(chalk.default.green(`Dashboard is up and running on port ${chalk.default.yellow(process.env.PORT)}.`)),
    );
};