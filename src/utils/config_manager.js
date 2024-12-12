import dotenv from 'dotenv';

class ConfigurationManager {
    constructor() {
        dotenv.config();
    }

    get(key) {
        return process.env[key];
    }

    set(key, value) {
        process.env[key] = value;
    }

    getMongoDBConfig() {
        return {
            uri: process.env.MONGODB_URI
        };
    }
}

export default new ConfigurationManager();
