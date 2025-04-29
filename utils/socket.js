import { Server as IOServer } from "socket.io";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

let io = null
export const userSockets = {}

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"];

export default function initSocket(server) {
    if (!io) {
        io = new IOServer(server, {
            cors: { origin: allowedOrigins },
        });
    }

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("message", ({ text, receiver }, cb) => {
            console.log("Message received:", text, receiver);

            const message = {
                date: "9 Sep 2024",
                events: [],
                chats: [
                    {
                        sender: "You",
                        time: "6:10 PM",
                        text: text,
                        isYou: true,
                    },
                ],
            }

            socket.broadcast.emit("message", text); // Broadcast to all
            cb({ message })
        });

        socket.on("user_online", async ({ userId }) => {
            console.log("User online: 🟢", userId);
            if (userId) {
                socket.userId = userId;
                userSockets[userId] = socket;
                console.log(`User ${userId} registered with socket ID ${socket.id} 🆔`);
                socket.broadcast.emit("user_online", userId);

                try {
                    const user = await User.findByIdAndUpdate(userId, {
                        status: "online",
                        lastSeen: null,
                    });
                    if (user) {
                        console.log("User status updated to online:", user.fullName);
                    } else {
                        console.log("User not found:", userId);
                    }
                } catch (error) {
                    console.error("Error updating user status:", error);
                }
            }
        });

        socket.on("send_message", async ({ chatId, text, mediaType, reactions, senderId, receiverId }, cb) => {
            // const { chatId, text, mediaType, reactions, userId } = data;
            // console.log("Message received:", data);
            try {
                let chatToSendMessage;

                if (chatId) {
                    console.log("Exist ✅")
                    chatToSendMessage = await Chat.findOne({
                        _id: chatId,
                        participants: senderId,
                    });
                } else {
                    console.log("❌ not exist")
                    chatToSendMessage = await Chat.findOrCreate({
                        participants: [senderId, receiverId],
                    }, { participants: [senderId, receiverId] })
                }

                console.log("chatToSendMessage", chatToSendMessage)
                if (!chatToSendMessage) {
                    return cb({ error: "Chat not found or user not in chat" });
                }

                // let mediaUrl = null;

                const savedMessage = await Message.create({
                    sender: senderId,
                    chat: chatToSendMessage._id,
                    text,
                    // mediaUrl,
                    mediaType: mediaType || 'none',
                    reactions: reactions || [],
                });


                chatToSendMessage.lastMessage = savedMessage._id;
                await chatToSendMessage.save();

                let otherUser = chatToSendMessage.participants.find(p => p._id.toString() !== sender);
                const receiverSocket = userSockets[otherUser._id];
                chatToSendMessage.lastMessage = savedMessage._id;
                await chatToSendMessage.save();

                if (receiverSocket) {
                    receiverSocket.emit('receive_message', { ...savedMessage.toJSON(), isYou: false });
                } else {
                    console.log(`${otherUser._id} is offline `, "💀💀💀");
                }
                cb({ ...savedMessage.toJSON(), isYou: true });
            } catch (error) {
                console.error('Error sending message:', error);
                cb({ err: "Error sending message using socket", error });
            }
        });

        socket.on("new_chat_message", async (message, cb) => {
            const { receiverId, content, sender, messageType } = message;
            try {
                const chat = await Chat.create({
                    participants: [receiverId, sender],
                })

                const newMessage = await Message.create({
                    sender,
                    content,
                    chat: chat._id,
                    messageType: messageType || 'text'
                })

                chat.lastMessage = newMessage._id;
                await chat.save();

                // 👉 Re-fetch with populated participants
                const populatedChat = await Chat.findById(chat._id)
                    .populate("participants", "fullName profileImage email")
                    .populate("lastMessage");

                const receiverSocket = userSockets[receiverId];

                if (receiverSocket) {
                    const notification = await Notification.create({
                        from: sender,
                        to: receiverId,
                        title: "New message",
                        content: "You have a new message",
                    })

                    sendNotification(receiverId, notification);

                    function formatChat(chat) {
                        if (!chat.isGroup) {
                            const otherUser = chat.participants.find(p => p._id.toString() !== sender);
                            return {
                                ...chat.toJSON(),
                                chatName: otherUser.fullName,
                                chatProfile: otherUser.profileImage
                            };
                        }
                        return chat;
                    }

                    receiverSocket.emit("new_chat", formatChat(populatedChat));
                    // receiverSocket.emit("receive_message", { ...newMessage.toJSON(), isYou: false });
                } else {
                    console.log(`${receiverId} is offline `, "💀💀💀");
                }
                cb({ ...newMessage.toJSON(), isYou: true });
            } catch (error) {
                console.error("Error creating chat and sending message:", error);
                cb({ error: "Error creating chat and sending message" });
            }
        })

        socket.on("disconnect", async () => {
            console.log("User disconnected:", socket.id);
            const userId = socket.userId;
            io.emit("user_offline", { userId, lastSeen: new Date() });
            try {
                const user = await User.findByIdAndUpdate(userId, {
                    status: "offline",
                    lastSeen: new Date(),
                });

                if (user) {
                    console.log("User status updated to offline: 🔴", userId);
                } else {
                    console.log("User not found:", userId);
                }
                delete userSockets[userId];
                console.log(`User ${userId} unregistered from socket ID ${socket.id} 🆔`);
            } catch (error) {
                console.error("Error updating user status:", error);
            }

        });
    });

}

export { io }