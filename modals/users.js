const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    userid: {
        type: String,
        default: "none"
    },
    adminkey: {
        type: String,
    },
    vipuntil: {
        type: Number,
        default: 0,
    },
    badges: {
        type: Array,
        default: [],
    },
    bots: {
        type: Array,
        default: [],
    },
    points: {
        type: Number,
        default: 0
    },
    lastDaily: {
        type: Number,
        default: 0,
    },
    claimedRewardTwitter: {
        type: Boolean,
    },
    claimedRewardInstagram: {
        type: Boolean,
    },
    claimedRewardDiscord: {
        type: Boolean,
    },
    followedig: {
        type: Boolean,
        default: false
    },
    followedtwitter: {
        type: Boolean,
        default: false
    },
    redeemCodeLog: {
        type: Array,
    },
},
{
    timestamps: true,
});

module.exports = model("users", userSchema);