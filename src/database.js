import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

import ConfigurationManager from "./utils/config_manager.js";
import Logger from "./utils/logger.js";

export async function initializeDatabase() {
    const mongoConfig = ConfigurationManager.getMongoDBConfig();
    Logger.info(`Attempting to connect to MongoDB with URI: ${mongoConfig.uri}`);

    try {
        await mongoose.connect(mongoConfig.uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        Logger.info("Successfully connected to MongoDB");
        return true;
    } catch (err) {
        Logger.error("MongoDB connection error:", err);
        return false;
    }
}

// Add connection event handlers
mongoose.connection.on('connected', () => {
    Logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
    Logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    Logger.info('MongoDB disconnected');
});

var categoryMap = {};

// Helper function to recursively build the catalog map
function buildCategoryMap(node, parentMap = {}) {
    if (node.id) {
        const nodeId = String(node.id);
        parentMap[nodeId] = parentMap[nodeId] || [];
        parentMap[nodeId].push(nodeId); // Include the current node ID in its own list of children
    }
    if (node.catalogs && Array.isArray(node.catalogs)) {
        node.catalogs.forEach((child) => {
            const childId = String(child.id);
            const parentId = String(node.id);
            buildCategoryMap(child, parentMap);
            parentMap[parentId] = parentMap[parentId].concat(parentMap[childId] || []);
        });
    }
    return parentMap;
}

// Build the category map starting from the root nodes
function buildCategoryMapFromRoots(roots) {
    roots.data.catalogs.forEach((root) => {
        buildCategoryMap(root, categoryMap);
    });
}

function isSubcategory(parentId, childId) {
    parentId = String(parentId);
    childId = String(childId);
    if (!categoryMap[parentId]) {
        return false
    }
    return categoryMap[parentId].includes(childId);
}

// const preferencesEnum
const Preference = {
    Countries: "countries",
    Language: "language",
    Currency: "currency",
    Mention: "mention"
};

const ShippableMap = {
    "pl": ["se", "lt", "sk", "hu", "ro", "cz", "dk", "hr", "fi"],
    "fr": ["nl", "be", "it", "es", "pt", "lu", "at"],
    "it": ["nl", "be", "fr", "es", "pt", "lu", "at"],
    "be": ["nl", "fr", "it", "es", "pt", "lu"],
    "es": ["nl", "be", "fr", "it", "pt", "lu"],
    "nl": ["be", "fr", "it", "es", "pt", "lu"],
    "pt": ["nl", "be", "fr", "it", "es"],
    "lu": ["nl", "be", "fr", "it", "es"],
    "fi": ["se", "dk", "lt", "pl"],
    "dk": ["se", "fi", "pl"],
    "se": ["fi", "dk", "pl"],
    "at": ["fr", "it"],
    "cz": ["sk", "pl"],
    "lt": ["fi", "pl"],
    "sk": ["cz", "pl"],
    "hr": ["pl"],
    "ro": ["pl", "gr"],
    "hu": ["pl"],
    "gr": ["ro"],
    "com": ["us"],
    "de": [],
    "uk": [],
};

// Define your schemas
const userSchema = new Schema({
    discordId: { type: String, unique: true, required: true },
    channels: [{ type: Types.ObjectId, ref: 'VintedChannel' }],
    lastUpdated: { type: Date, default: Date.now },
    maxChannels: { type: Number, default: ConfigurationManager.getUserConfig.max_private_channels_default },
    preferences: { type: Map, default: {} },
});

/*const groupSchema = new Schema({
    name: { type: String, unique: true, required: true },
    users: [{ type: Types.ObjectId, ref: 'User' }],
});*/

const vintedChannelSchema = new Schema({
    channelId: { type: String, unique: true, required: true },
    lastUpdated: { type: Date, default: Date.now },
    keepMessageSent: { type: Boolean, default: false },
    name: { type: String, required: false },
    url: { type: String, default: null },
    bannedKeywords: { type: [String], default: [] },
    isMonitoring: { type: Boolean, default: true },
    type: { type: String, default: 'public' },
    user: { type: Types.ObjectId, ref: 'User', default: null },
    preferences: { type: Map, default: {} },
});

const searchSchema = new Schema({
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

// Create models
//const Group = model('Group', groupSchema);
const User = model('User', userSchema);
const VintedChannel = model('VintedChannel', vintedChannelSchema);
const Search = model('Search', searchSchema);

Logger.info("Database models loaded.");

export { Preference, ShippableMap, User, VintedChannel, Search as SearchModel, isSubcategory, buildCategoryMapFromRoots };
