import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required!"],
            unique: true,
        },
        firstName: {
            type: String,
            // required: [true, "Please provide first name!"],
        },
        lastName: {
            type: String,
            // required: [true, "Please provide last name!"],
        },
        phone: {
            type: String,
            // required: [true, "Please provide phone number!"],
            // unique: true,
        },
        profile: {
            type: String,
        },
        email: {
            type: String,
            required: [true, "Email is required!"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Password is required!"],
        },
        bio: {
            type: String,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        verifiedAt: {
            type: Date,
        },
        otp: {
            type: Number,
        },
        otpExpiry: {
            type: Date,
        },
        publicKey: { type: String }, 
    },
    {
        timestamps: true,
    }
);

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

UserSchema.methods.isPasswordCorrect = async function (
    plainPassword
) {
    return await bcrypt.compare(plainPassword, this.password);
};

UserSchema.methods.generateToken = async function () {
    const JWT_SECRET = process.env.JWT_SECRET;
    return await jwt.sign(
        { id: this._id, username: this.username },
        JWT_SECRET || "I AM NOT SECURE"
    );
};

const User = mongoose.model("User", UserSchema);

export default User;