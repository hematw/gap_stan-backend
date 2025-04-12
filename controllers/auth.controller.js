import asyncHandler from "express-async-handler";
import User from "../models/User";
import { CookieOptions, json, Request, Response } from "express";

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // seven days
    httpOnly: true,
    secure: true,
};

// Register route controller
export const registerUser = asyncHandler(
    async (req, res) => {
        const { username, email, password, firstName, lastName } = req.body;
        const createdUser = await User.create({
            username,
            email,
            password,
            firstName,
            lastName,
        });
        const token = await createdUser.generateToken();
        return res
            .status(200)
            .cookie("token", token, cookieOptions)
            .json({
                token,
                createdUser: { ...createdUser.toJSON(), password: undefined },
            });
    }
);

// Login route controller
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const foundUser = await User.findOne({ email });
    if (foundUser && (await foundUser.isPasswordCorrect(password))) {
        const token = await foundUser.generateToken();
        return res
            .status(200)
            .cookie("token", token, cookieOptions)
            .json({ token, user: foundUser });
    }
    return res.status(401).json({ message: "Email or password was wrong!" });
});

// Logout route controller
export const logoutUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .clearCookie("token", cookieOptions)
        .json({ message: "Logged out successfully" });
});