import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (filter) {
        filter.$or = [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
        ];
    }

    const users = await User.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select("-password")
        .lean();
    return res.status(200).json(users);
});

export const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;
    const createdUser = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
    });
    return res.status(201).json(createdUser);
});

export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateFields = { ...req.body };

    // If a profile image was uploaded
    if (req.file) {
        updateFields.profile = `/uploads/${req.file.filename}`; // or wherever you store it
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
        new: true,
    })
        .select("-password")
        .lean();

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updatedUser);
});


export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id)
        .select("-password")
        .lean();
    if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
});
