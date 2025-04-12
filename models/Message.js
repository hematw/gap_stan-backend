import { Schema, model, Types } from "mongoose"

const messageSchema = new Schema({
    message: { type: String, required: true },
    sender: { type: Types.ObjectId, required: true },
    receiver: { type: Types.ObjectId, required },
    file: [String],
    

}, { timestamps: true })