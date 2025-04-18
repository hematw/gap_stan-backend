import asyncHandler from "express-async-handler";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

export const getChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const chats = await Chat.find({ users: userId })
        .populate("users", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 });

    res.status(200).json(chats);
})

export const getChatMessages = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;

    const messages = await Message.find({ chat: chatId })
        .populate("sender", "-password")
        .populate("chat replyTo")
        .sort({ createdAt: -1 });    
    res.status(200).json(messages);
})