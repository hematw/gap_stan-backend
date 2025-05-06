import { model } from "mongoose";
import { Schema } from "mongoose";
import findOrCreatePlugin from "mongoose-findorcreate";

const ChatSchema = new Schema({
    chatName: {
        type: String,
        // required: true,
    },
    isGroup: {
        type: Boolean,
        default: false,
    },
    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message",
    },
    groupAdmin: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    profile: {
        type: String,
    }
}, {
    timestamps: true,
})

ChatSchema.plugin(findOrCreatePlugin)

const Chat = model("Chat", ChatSchema);

export default Chat;