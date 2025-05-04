import asyncHandler from "express-async-handler";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Event from "../models/Event.js";

// await Event.create({
//     type: "user_joined",
//     chat: "68112a0807ea316e465f7495",
//     createdBy: "6806a7d0d6f88e410971ee38",
//     targetUser: "6806ab55a51c4d1efc27f26e",
//     content: "Someone added you here"
// })  


export const getChats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const chats = await Chat.find({ participants: userId })
        .populate('participants', 'firstName lastName username email profileImage isOnline lastSeen')
        .populate('lastMessage');

    const formattedChats = chats.map(chat => {
        if (!chat.isGroup) {
            const otherUser = chat.participants.find(p => p._id.toString() !== userId);
            const isOnline = otherUser.isOnline;
            return {
                ...chat.toJSON(),
                chatName: otherUser.firstName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.username,
                chatProfile: otherUser.profileImage,
                isOnline
            };
        }
        return chat; // For group chats, keep as is or handle differently
    });

    res.status(200).json({ chats: formattedChats });
});
function formatChatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId)
        .populate('participants', 'fullName email profileImage')
        .populate('lastMessage');

    if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await Message.find({ chat: chatId })
        .sort({ createdAt: 1 })
        .populate('sender', 'fullName email profileImage');

    const events = await Event.find({ chat: chat._id }).lean();

    const combinedData = [...messages, ...events];

    const sortedData = combinedData.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    const formattedMessages = sortedData.map((message) => {
        if (message.media || message.text) {
            // It's a message
            return {
                ...message.toJSON(),
                isYou: message.sender._id.toString() === userId,
                contentType: 'message'
            };
        } else {
            // It's an event
            return {
                ...message,
                contentType: 'event'
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
        items
    }));

    res.status(200).json({ chat, messages: groupedMessages });
});

export const createChatAndSendMessage = asyncHandler(async (req, res) => {
    const { content, mediaType, reactions, receiverId, messageType } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOrCreate({
        participants: [receiverId, userId],
    });

    const newMessage = await Message.create({
        userId,
        content,
        chat: chat._id,
        messageType: messageType || 'text'
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
        receiverSocket.emit("receive_message", { ...newMessage.toJSON(), isYou: false });
    }
    res.status(201).send({ message: { ...newMessage.toJSON(), isYou: true }, chat });
});

export const sendMessage = asyncHandler(async (req, res) => {
    const { content, mediaType, reactions, receiverId } = req.body;
    const userId = req.user.id;
    const { chatId } = req.params;
    console.log(req.body);

    if (!content && !req.files) {
        return res.status(400).json({ error: 'Content or media is required' });
    }

    let chatToSendMessage = await Chat.findOne({
        _id: chatId,
        participants: userId,
    });

    if (!chatToSendMessage) {
        return res.status(404).json({ error: 'Chat not found' });
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
        mediaType: mediaType || 'none',
        reactions: reactions || [],
    });

    const savedMessage = await newMessage.save();

    chatToSendMessage.lastMessage = savedMessage._id;
    await chatToSendMessage.save();

    let otherUser = chatToSendMessage.participants.find(p => p._id.toString() !== userId);
    const userSocket = userSockets[otherUser._id];
    if (userSocket) {
        userSocket.emit('receiveMessage', { ...savedMessage.toJSON(), isYou: false });
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
        return res.status(404).json({ error: 'Message not found' });
    }

})

export const searchForChats = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const userId = req.user.id;

    const chats = await Chat.find({
        participants: userId,
        $or: [
            { chatName: { $regex: query, $options: 'i' } },
            { participants: { $elemMatch: { fullName: { $regex: query, $options: 'i' } } } }
        ]
    }).populate('participants', 'fullName email profileImage status lastSeen')
        .populate('lastMessage');

    const otherResults = await User.find({
        _id: { $ne: userId },
        username: { $regex: query, $options: 'i' },

    }).select('-password -__v').lean();

    const formattedChats = chats.map(chat => {
        if (!chat.isGroup) {
            const otherUser = chat.participants.find(p => p._id.toString() !== userId);
            return {
                ...chat.toJSON(),
                chatName: otherUser.fullName,
                chatProfile: otherUser.profileImage
            };
        }
        return chat;
    })

    const formattedOtherResults = otherResults.map(user => {
        return {
            ...user,
            chatName: user.firstName ? `${user.firstName} ${user.lastName}` : user.username,
            chatProfile: user.profile
        };
    })

    res.status(200).json({ chats: formattedChats, otherResults: formattedOtherResults });
});