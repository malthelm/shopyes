import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    itemId: { type: String, required: true },
    price: { type: Number },
    title: { type: String },
    url: { type: String },
    notified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

searchHistorySchema.index({ itemId: 1, userId: 1 }, { unique: true });

export default mongoose.model('SearchHistory', searchHistorySchema); 