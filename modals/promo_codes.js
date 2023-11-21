const { Schema, model } = require("mongoose");

const promocodeSchema = new Schema({
    code: {
        type: String,
    },
    type: {
        type: String,
    },
    amount: {
        type: Number,
        default: 0,
    },
    expiring: {
        type: String,
    },
    max_uses: {
        type: Number,
        default: -1,
    },
    used_by: {
        type: Array,
        default: [],
    }
},
{
    timestamps: true,
});

module.exports = model("promo_codes", promocodeSchema);