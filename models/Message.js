import { Schema, model, Types } from "mongoose"

const messageSchema = new Schema({
    text: { type: String },
    sender: { type: Types.ObjectId, required: true },
    chat: { type: Types.ObjectId, ref: "Chat", required: true },
    media: [{ type: Types.ObjectId, ref: "FilesAndMedia" }],
    // reactions: [{ type: Types.ObjectId, ref: "Reaction" }],
    replyTo: {
        type: Types.ObjectId,
        ref: "Message"
    },
    seenBy: [{
        type: Types.ObjectId,
        ref: "User"
    }],
}, { timestamps: true })

const Message = model("Message", messageSchema);

export default Message;