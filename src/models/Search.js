import mongoose from 'mongoose';

const searchSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

export const SearchModel = mongoose.model('Search', searchSchema); 