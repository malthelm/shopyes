import mongoose from 'mongoose';
import Logger from './logger.js';

class DatabaseManager {
    constructor() {
        this.isConnected = false;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
    }

    async connect(retryCount = 0) {
        try {
            if (!process.env.MONGODB_URI) {
                throw new Error('MongoDB URI not found in environment variables');
            }

            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
            });

            this.isConnected = true;
            Logger.info('Successfully connected to MongoDB');
        } catch (error) {
            Logger.error('MongoDB connection error:', error);
            this.isConnected = false;

            if (retryCount < this.maxRetries) {
                Logger.info(`Retrying connection in ${this.retryDelay/1000} seconds... (Attempt ${retryCount + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.connect(retryCount + 1);
            }
            
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