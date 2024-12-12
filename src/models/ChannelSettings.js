import mongoose from 'mongoose';

const channelSettingsSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    ownerId: { type: String, required: true },
    type: { type: String, enum: ['public', 'private'], default: 'private' },
    lastActivity: { type: Date, default: Date.now },
    search: {
        query: { type: String },
        priceMin: { type: Number },
        priceMax: { type: Number },
        enabled: { type: Boolean, default: true }
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ChannelSettings', channelSettingsSchema); 