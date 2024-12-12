import mongoose from 'mongoose';
import Logger from './logger.js';

class DatabaseManager {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        try {
            if (!process.env.MONGODB_URI) {
                throw new Error('MongoDB URI not found in environment variables');
            }

            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            this.isConnected = true;
            Logger.info('Successfully connected to MongoDB');
        } catch (error) {
            Logger.error('MongoDB connection error:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            Logger.info('Disconnected from MongoDB');
        } catch (error) {
            Logger.error('MongoDB disconnection error:', error);
            throw error;
        }
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

export default new DatabaseManager(); 