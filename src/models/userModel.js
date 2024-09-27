const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
    {
        name: {
            type: "String",
            required: true
        },
        email: {
            type: "String",
            unique: true,
            required: true
        },
        password: {
            type: "String",
            required: true
        },
        role: {
            type: "String",
            required: true,
        },
        employeeId: {
            type: "String",
            required: true,
        },
        image: {
            type: "String",
            default: 'https://readerbee-profile-image.s3.us-west-2.amazonaws.com/77.png1658916635585',
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        },
    },

    { timestaps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;