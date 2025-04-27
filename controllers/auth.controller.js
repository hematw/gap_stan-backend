import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // seven days
    httpOnly: true,
    secure: true,
};

// Register route controller
export const registerUser = asyncHandler(
    async (req, res) => {
        // , firstName, lastName 
        console.log(req.body);
        const { username, email, password } = req.body;

        const createdUser = await User.create({
            username,
            email,
            password,
            // firstName,
            // lastName,
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

    if(!email || !password) {
        return res.status(400).json({message: "Both email and password are required!"})
    }

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

export const checkUsername = asyncHandler(async () => {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (user) {
        return res.status(200).json({ message: "Username is already taken!" });
    } else {
        return res.status(409).json({ message: "Username is available!" });
    }
})