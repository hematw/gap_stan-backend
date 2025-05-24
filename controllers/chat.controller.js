import asyncHandler from "express-async-handler";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import FilesAndMedia from "../models/FileAndMedia.js";
import formatChatDate from "../utils/formate-date.js";
import { io, userSockets } from "../utils/socket.js";
import generateEventMessage from "../utils/generateEventMessage.js";

// await Event.create({
//     type: "user_joined",
//     chat: "68112a0807ea316e465f7495",
//     createdBy: "6806a7d0d6f88e410971ee38",
//     targetUser: "6806ab55a51c4d1efc27f26e",
//     content: "Someone added you here"
// })

export const getChats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const chats = await Chat.find({ members: userId })
        .populate(
            "members",
            "firstName lastName username email profile isOnline lastSeen bio"
        )
        .populate("lastMessage")
        .sort({ createdAt: -1 });

    const formattedChats = chats.map((chat) => {
        if (!chat.isGroup) {
            const otherUser = chat.members.find((p) => p._id.toString() !== userId);
            const isOnline = otherUser.isOnline;
            return {
                ...chat.toJSON(),
                lastMessage: {
                    ...chat.lastMessage?.toJSON(),
                    isYou: chat.lastMessage?.sender.toString() === userId,
                },
                chatName: otherUser.firstName
                    ? `${otherUser.firstName} ${otherUser.lastName}`
                    : otherUser.username,
                username: otherUser.username,
                profile: otherUser.profile,
                bio: otherUser.bio,
                lastSeen: otherUser.lastSeen,
                isOnline,
            };
        }
        return chat; // For group chats, keep as is or handle differently
    });

    res.status(200).json({ chats: formattedChats });
});

export const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId)
        .populate("members", "fullName email profile")
        .populate("lastMessage");

    if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
    }

    const messages = await Message.find({ chat: chatId })
        .sort({ createdAt: 1 })
        .limit(20)
        .populate("files")
        .populate("sender", "firstName lastName username email profile _id")
        .lean();

    const events = await Event.find({ chat: chat._id })
        .populate("createdBy", "firstName lastName username")
        .populate("targetUser", "firstName lastName username")
        .lean();

    const eventsWithMessage = events.map((e) => ({
        ...e,
        content: e.content || generateEventMessage(e, req.user),
    }));

    const combinedData = [...messages, ...eventsWithMessage];

    const sortedData = combinedData.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    const formattedMessages = sortedData.map((message) => {
        if (message.files || message.text) {
            // It's a message
            return {
                ...message,
                isYou: message.sender._id.toString() === userId,
                contentType: "message",
            };
        } else {
            // It's an event
            return {
                ...message,
                contentType: "event",
            };
        }
    });

    // Group by day
    const grouped = {};
    for (const item of formattedMessages) {
        const label = formatChatDate(item.createdAt);
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(item);
    }

    const groupedMessages = Object.entries(grouped).map(([label, items]) => ({
        label,
        items,
    }));

    res.status(200).json({ chat, messages: groupedMessages });
});

export const createChatAndSendMessage = asyncHandler(async (req, res) => {
    const { content, mediaType, reactions, receiverId, messageType } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOrCreate({
        members: [receiverId, userId],
    });

    const newMessage = await Message.create({
        userId,
        content,
        chat: chat._id,
        messageType: messageType || "text",
    });

    chat.lastMessage = newMessage._id;
    await chat.save();
    const receiverSocket = userSockets[receiverId];

    if (receiverSocket) {
        const notification = await Notification.create({
            from: userId,
            to: receiverId,
            title: "New message",
            content: "You have a new message",
        });

        sendNotification(receiverId, notification);
        receiverSocket.emit("message_received", {
            ...newMessage.toJSON(),
            isYou: false,
        });
    }
    res
        .status(201)
        .send({ message: { ...newMessage.toJSON(), isYou: true }, chat });
});

export const sendMessage = asyncHandler(async (req, res) => {
    const { content, mediaType, reactions, receiverId } = req.body;
    const userId = req.user.id;
    const { chatId } = req.params;
    console.log(req.body);

    if (!content && !req.files) {
        return res.status(400).json({ error: "Content or media is required" });
    }

    let chatToSendMessage = await Chat.findOne({
        _id: chatId,
        members: userId,
    });

    if (!chatToSendMessage) {
        return res.status(404).json({ error: "Chat not found" });
    }

    let mediaUrl = null;
    if (req.file) {
        mediaUrl = `/uploads/${req.file.filename}`;
    }

    const newMessage = new Message({
        sender: userId,
        chat: chatToSendMessage._id,
        content,
        mediaUrl,
        mediaType: mediaType || "none",
        reactions: reactions || [],
    });

    const savedMessage = await newMessage.save();

    chatToSendMessage.lastMessage = savedMessage._id;
    await chatToSendMessage.save();

    let otherUser = chatToSendMessage.members.find(
        (p) => p._id.toString() !== userId
    );
    const userSocket = userSockets[otherUser._id];
    if (userSocket) {
        userSocket.emit("receiveMessage", {
            ...savedMessage.toJSON(),
            isYou: false,
        });
    } else {
        console.log(`${otherUser._id} is offline `, "💀💀💀");
    }

    res.status(201).json(savedMessage);
});

export const deleteMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findOneAndDelete({ _id: id, sender: userId });
    if (!message) {
        return res.status(404).json({ error: "Message not found" });
    }
});

export const searchForChats = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const userId = req.user.id;

    const chats = await Chat.find({
        members: userId,
        $or: [
            { chatName: { $regex: query, $options: "i" } },
            {
                members: { $elemMatch: { fullName: { $regex: query, $options: "i" } } },
            },
        ],
    })
        .populate("members", "fullName email profile status lastSeen")
        .populate("lastMessage");

    const otherResults = await User.find({
        _id: { $ne: userId },
        username: { $regex: query, $options: "i" },
    })
        .select("-password -__v")
        .lean();

    const formattedChats = chats.map((chat) => {
        if (!chat.isGroup) {
            const otherUser = chat.members.find((p) => p._id.toString() !== userId);
            return {
                ...chat.toJSON(),
                chatName: otherUser.fullName,
                profile: otherUser.profile,
            };
        }
        return chat;
    });

    const formattedOtherResults = otherResults.map((user) => {
        return {
            ...user,
            chatName: user.firstName
                ? `${user.firstName} ${user.lastName}`
                : user.username,
            profile: user.profile,
        };
    });

    res
        .status(200)
        .json({ chats: formattedChats, otherResults: formattedOtherResults });
});

const mediaMimeMap = {
    image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    video: ["video/mp4", "video/webm"],
    audio: ["audio/mpeg", "audio/wav", "audio/webm"],
    file: ["application/pdf"],
};

export const uploadFiles = async (req, res) => {
    const sender = req.user.id;
    const chat = req.params.chatId;
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded." });
        }

        const filesToSave = [];

        for (const file of req.files) {
            const { mimetype } = file;

            const mediaType = Object.entries(mediaMimeMap).find(([_, mimes]) =>
                mimes.includes(mimetype)
            )?.[0];

            if (!mediaType) {
                return res
                    .status(400)
                    .json({ error: `Unsupported file type: ${file.originalname}` });
            }

            if (!chat) {
                const { receiver } = req.query;
                const newChat = await Chat.findOrCreate({
                    members: [sender, receiver],
                });
            }

            filesToSave.push({
                sender,
                chat: chat || newChat._id,
                path: `/uploads/${file.filename}`,
                mediaType: mediaType,
            });
        }

        const savedFiles = await FilesAndMedia.insertMany(filesToSave);

        res.status(201).json({
            message: "Files uploaded successfully!",
            files: savedFiles,
        });
    } catch (err) {
        console.error("File upload error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createGroup = asyncHandler(async (req, res) => {
    const { chatName, members: members } = req.body;

    if (!chatName || members.length < 2) {
        return res
            .status(400)
            .json({ error: "Group needs a name and at least 3 members" });
    }

    const createdBy = req.user.id;

    let path;
    if (req.file) {
        path = `/uploads/${req.file.originalname}`;
    }

    const groupChat = await Chat.create({
        chatName,
        isGroup: true,
        members: [...members, req.user.id],
        createdBy,
        groupAdmins: [createdBy],
        profile: path,
    });

    for (const member of groupChat.members) {
        const memberSocket = userSockets[member.toString()];
        console.log("MMMMMMM", member);
        if (memberSocket) {
            console.log("LLLLLL", memberSocket);
            memberSocket.join(groupChat._id);
            io.to(groupChat._id).emit("new-chat", groupChat);
        }
    }

    res.status(201).json(groupChat);
});

export const getChatFilesAndMedia = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat does not exist." });
    }

    const filesAndMedia = await FilesAndMedia.find({ chat: chatId });

    const files = [];
    const links = [];
    const media = [];

    filesAndMedia.forEach((item) => {
        if (item.mediaType === "file") {
            files.push(item);
        } else if (["image", "video", "audio"].includes(item.mediaType)) {
            media.push(item);
        }
    });

    res.status(200).json({ files, media, links });
});

export const getChatMembers = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId).populate(
        "members",
        "firstName lastName username email profile bio isOnline lastSeen"
    );

    if (!chat) {
        return res.status(404).json({ message: "Chat does not exist." });
    }
    res
        .status(200)
        .json({ members: chat.members, groupAdmins: chat.groupAdmins });
});

export const addToGroupChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    const { newMembers } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat does not exist." });
    }
    console.log(chat.groupAdmins, userId);
    if (!chat.groupAdmins.includes(userId)) {
        return res
            .status(403)
            .json({ message: "You are not authorized to perform this action." });
    }

    const events = [];

    for (const member of newMembers) {
        if (!chat.members.includes(member)) {
            chat.members.push(member);
        }
        await chat.save();

        const memberSocket = userSockets[member.toString()];
        if (memberSocket) {
            memberSocket.join(chatId);
            io.to(chatId).emit("new-chat", chat);
        }

        events.push({
            type: "user_added",
            chat: chatId,
            createdBy: userId,
            targetUser: member,
        });
    }
    const savedEvents = await Event.insertMany(events);

    res
        .status(200)
        .json({ message: "Members added successfully.", events: savedEvents });
});

export const removeFromChat = asyncHandler(async (req, res) => {
    const { chatId, memberId } = req.params;
    const userId = req.user.id;

    let chat = await Chat.findById(chatId);

    if (!chat) {
        return res.status(404).json({ message: "Chat does not exist." });
    }

    if (!chat.groupAdmins.includes(userId)) {
        return res
            .status(403)
            .json({ message: "You are not authorized to perform this action." });
    }

    const events = [];

    chat = await Chat.findByIdAndUpdate(chatId, {
        $pull: { members: memberId },
    }, { new: true }).populate(
        "members",
        "firstName lastName username email profile bio isOnline lastSeen"
    ).populate("groupAdmins").lean();

    const memberSocket = userSockets[memberId.toString()];
    if (memberSocket) {
    }

    events.push({
        type: "user_removed",
        chat: chatId,
        createdBy: userId,
        targetUser: memberId,
    });
    const savedEvents = await Event.insertMany(events);

    res
        .status(200)
        .json({
            message: "Member removed successfully.",
            events: savedEvents,
            ...chat
        });
});

export const leaveGroup = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat does not exist." });
    }
    if (!chat.members.includes(userId)) {
        return res
            .status(403)
            .json({ message: "You are not authorized to perform this action." });
    }
    const events = [];
    chat.members = chat.members.filter((member) => member.toString() !== userId);
    await chat.save();
    const memberSocket = userSockets[userId.toString()];
    if (memberSocket) {
        memberSocket.leave(chatId);
    }
    events.push({
        type: "user_left",
        chat: chatId,
        createdBy: userId,
        targetUser: userId,
    });
    const savedEvents = await Event.insertMany(events);
    res
        .status(200)
        .json({
            message: "You have left the group.",
            events: savedEvents,
            ...chat
        });
}
);

export const makeAdmin = asyncHandler(async (req, res) => {
    const { chatId, memberId } = req.params;
    const userId = req.user.id;

    let chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat does not exist." });
    }
    if (!chat.groupAdmins.includes(userId)) {
        return res
            .status(403)
            .json({ message: "You are not authorized to perform this action." });
    }
    if (chat.groupAdmins.includes(memberId)) {
        return res
            .status(400)
            .json({ message: "User is already an admin." });
    }
    chat.groupAdmins.push(memberId);
    (await chat.save())

    chat = await Chat.findById(chatId)
        .populate("members", "firstName lastName username email profile bio isOnline lastSeen")
        .populate("groupAdmins", "firstName lastName username email profile bio isOnline lastSeen")
        .lean();

    res
        .status(200)
        .json({ message: "User has been made admin.", chat, events: [] });
}
);

export const dismissAdmin =  asyncHandler(async (req, res) => {
    const { chatId, memberId } = req.params;
    const userId = req.user.id;

    let chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat does not exist." });
    }
    if (!chat.groupAdmins.includes(userId)) {
        return res
            .status(403)
            .json({ message: "You are not authorized to perform this action." });
    }
    if (!chat.groupAdmins.includes(memberId)) {
        return res
            .status(400)
            .json({ message: "User already is not admin." });
    }
    chat.groupAdmins = chat.groupAdmins.filter(m=> m.toString() !== memberId);
    (await chat.save())

    chat = await Chat.findById(chatId)
        .populate("members", "firstName lastName username email profile bio isOnline lastSeen")
        .populate("groupAdmins", "firstName lastName username email profile bio isOnline lastSeen")
        .lean();

    res
        .status(200)
        .json({ message: "User has been dismissed as admin.", chat, events: [] });
}
);