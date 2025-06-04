import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
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
    return res.status(200).json({ users });
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

// PUT /users/:id/public-key
export const uploadPublicKey = asyncHandler(async (req, res) => {
    console.log("user", req.user);

    let { publicKey } = req.body;

    if (!publicKey) {
        return res.status(400).json({ error: "Missing publicKey" });
    }

    // Handle stringified keys (just in case)
    if (typeof publicKey === 'string') {
        try {
            publicKey = JSON.parse(publicKey);
        } catch {
            return res.status(400).json({ error: "Invalid publicKey format" });
        }
    }

    const requiredFields = ['crv', 'ext', 'kty', 'x', 'y'];
    const isValid = requiredFields.every(field => field in publicKey);

    if (!isValid) {
        return res.status(400).json({ error: "publicKey missing required fields" });
    }

    const user= await User.findByIdAndUpdate(req.user.id, { publicKey });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user });
});


// GET /users/:id/public-key
export const getPublicKey = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("publicKey");

    if (!user || !user.publicKey) {
        return res.status(404).json({ error: "Public key Not found" });
    }
    res.json({ publicKey: user.publicKey });
});