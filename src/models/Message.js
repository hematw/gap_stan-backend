import { Schema, model, Types } from "mongoose"

const messageSchema = new Schema({
    text: { type: String },
    sender: { type: Types.ObjectId, required: true, ref: "User" },
    chat: { type: Types.ObjectId, ref: "Chat", required: true },
    files: [{ type: Types.ObjectId, ref: "FilesAndMedia" }],
    // reactions: [{ type: Types.ObjectId, ref: "Reaction" }],
    replyTo: {
        type: Types.ObjectId,
        ref: "Message"
    },
    seenBy: [{
        type: Types.ObjectId,
        ref: "User"
    }],
    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent"
    },
    iv: { type: [Number], required: true },   // IV (base64)
    fileIv: { type: String },
}, { timestamps: true })

const Message = model("Message", messageSchema);

export default Message;