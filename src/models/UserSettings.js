import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    language: { type: String, default: 'fr' },
    notifications: {
        enabled: { type: Boolean, default: true },
        channel: { type: String },
        mentions: [{ type: String }]
    },
    searches: [{
        query: { type: String },
        priceMin: { type: Number },
        priceMax: { type: Number },
        enabled: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],
    maxChannels: { type: Number, default: 5 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('UserSettings', userSettingsSchema); 