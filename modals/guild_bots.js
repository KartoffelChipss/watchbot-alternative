const { Schema, model } = require("mongoose");

const guildBotSchema = new Schema({
    guildId: {
        type: String,
        default: "none"
    },
    lastsentStatus: {
        type: String,
    },
    botId: {
        type: String,
        default: "none"
    },
    channelUpdate: {
        type: String,
        default: "none"
    },
    channelMentionRole: {
        type: String,
    },
    channelMentionUser: {
        type: String,
    },
    dmList: {
        type: Array,
        default: [],
    },
    mailList: {
        type: Array,
        default: []
    },
    embedUpdate: {
        type: String,
        default: "none"
    },
    updateDelay: {
        type: Number,
        default: 0,
    }
},
{
    timestamps: true,
});

module.exports = model("guild_bots", guildBotSchema);