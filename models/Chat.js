import { model } from "mongoose";
import { Schema } from "mongoose";

const ChatSchema = new Schema({
    chatName: {
        type: String,
        required: true,
    },
    isGroupChat: {
        type: Boolean,
        default: false,
    },
    users: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    latestMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message",
    },
    groupAdmin: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
})

const Chat = model("Chat", ChatSchema);

export default Chat;