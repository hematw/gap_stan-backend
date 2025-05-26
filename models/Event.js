import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'user_joined',
            'user_left',
            'user_added',
            'user_removed',
            'call_started',
            'call_missed',
            'message_deleted',
            'made_admin',
            'remove_admin',
            'custom_notice'
        ],
        required: true
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // optional if it's a system event
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // like who was added/removed
    },
    content: {
        type: String,
        required: false // for custom event text
    },
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
