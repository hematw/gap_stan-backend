import { Schema, model, Types } from "mongoose"

const messageSchema = new Schema({
    text: { type: String },
    sender: { type: Types.ObjectId, required: true },
    chat: { type: Types.ObjectId, ref: "Chat", required: true },
    media: [{ type: String }],
    mediaType: [{ type: String, enum: ["image", "video", "audio", "file"] }],
    replyTo: {
        type: Types.ObjectId,
        ref: "Message"
    },
    reactions: [{ type: Types.ObjectId, ref: "Reaction" }]
}, { timestamps: true })

const Message = model("Message", messageSchema);

export default Message;