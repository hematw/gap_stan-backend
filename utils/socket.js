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

        socket.on("user-online", async ({ userId, isOnline }) => {
            console.log("User online: 🟢", userId);

            const userChats = await Chat.find({ participants: userId }).select("_id");

            const chatsIds = userChats.map(chat => chat._id);
            await Message.updateMany({
                chat: {
                    $in: chatsIds,
                },
                status: "sent"
            }, { status: "delivered" })

            if (userId) {
                socket.userId = userId;
                userSockets[userId] = socket;
                console.log(`User ${userId} registered with socket ID ${socket.id} 🆔`);
                socket.broadcast.emit("update-status", { userId, isOnline });

                try {
                    const user = await User.findByIdAndUpdate(userId, {
                        isOnline,
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

        socket.on("send-message", async ({ chatId, text, files = [], reactions, senderId, receiverId, replayTo }, cb) => {
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

                console.log("chatToSendMessage", chatToSendMessage._id)
                if (!chatToSendMessage) {
                    return cb({ error: "Chat not found or user not in chat" });
                }

                // let mediaUrl = null;

                const savedMessage = await Message.create({
                    sender: senderId,
                    chat: chatToSendMessage._id,
                    text,
                    files: files.map(file => file._id),
                    replayTo,
                    reactions: reactions || [],
                });


                chatToSendMessage.lastMessage = savedMessage._id;
                await chatToSendMessage.save();

                let otherUser = chatToSendMessage.participants.find(p => p._id.toString() !== senderId);
                const receiverSocket = userSockets[otherUser._id];
                chatToSendMessage.lastMessage = savedMessage._id;
                await chatToSendMessage.save();

                const sender = await User.findById(senderId);

                if (receiverSocket) {
                    console.log("User is Online 🔰")
                    receiverSocket.emit('message-received', {
                        ...savedMessage.toJSON(),
                        isYou: false,
                        sender: sender || senderId,
                        files
                    });
                } else {
                    console.log(`${otherUser._id} is offline `, "💀💀💀");
                }

                cb({
                    message: "Message sent.",
                    data: {
                        ...savedMessage.toJSON(),
                        isYou: true,
                        sender: sender || senderId,
                        files
                    }
                });
            } catch (error) {
                console.error('Error sending message:', error);
                cb({ message: "Error sending message using socket", error });
            }
        });

        socket.on("new-chat-message", async (message, cb) => {
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
                    .populate("participants", "fullName profile email")
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
                                chatProfile: otherUser.profile
                            };
                        }
                        return chat;
                    }

                    receiverSocket.emit("new_chat", formatChat(populatedChat));
                    // receiverSocket.emit("message_received", { ...newMessage.toJSON(), isYou: false });
                } else {
                    console.log(`${receiverId} is offline `, "💀💀💀");
                }
                cb({ ...newMessage.toJSON(), isYou: true });
            } catch (error) {
                console.error("Error creating chat and sending message:", error);
                cb({ error: "Error creating chat and sending message" });
            }
        })

        socket.on("typing", ({ chatId, userId, isTyping, timestamp }) => {
            console.log(`User ${userId} is ${isTyping ? "typing" : "not typing"} in chat ${chatId} at ${timestamp}`);

            // Broadcast typing event to other participants in the chat
            socket.broadcast.emit("typing", { chatId, userId, isTyping, timestamp });
        });

        socket.on("message-delivered", async ({ messageId }) => {
            const message = await Message.findById(messageId);
            if (message) {
                message.status = "delivered"
                await message.save()
            } else {
                console.error(`Message with id ${messageId} NOT found`)
            }
        })

        socket.on("mark-as-seen", async ({ chatId }) => {
            const chat = await Chat.findById(chatId);

            if (chat) {
                await Message.updateMany({
                    chat: chat._id,
                    status: { $ne: "seen" },
                    sender: { $ne: socket.userId }
                }, { status: "seen" });
            } else {
                console.error(`Chat with id ${chatId} NOT found`)
            }
        })

        socket.on("disconnect", async () => {
            console.log("User disconnected: 😵", socket.id, socket.userId);
            const userId = socket.userId;
            socket.broadcast.emit("update-status", { userId, isOnline: false, lastSeen: new Date() });
            try {
                const user = await User.findByIdAndUpdate(userId, {
                    isOnline: false,
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