import { model, Schema, Types } from "mongoose";

const filesAndMediaSchema = new Schema({
    sender: {
        type: Types.ObjectId,
        ref: "User",
        required: [true, "Sender of file should be known"]
    },
    chat: {
        type: Types.ObjectId,
        ref: "Chat",
        required: [true, "Chat ID of file should be known"]
    },
    path: {
        type: String,
        required: [true, "File path is required"]
    },
    mediaType: { type: String, enum: ["image", "video", "audio", "file"] },
}, { timestamps: true })

const FilesAndMedia = model("FilesAndMedia", filesAndMediaSchema)
export default FilesAndMedia
