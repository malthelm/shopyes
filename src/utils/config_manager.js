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
}

export default new ConfigurationManager();
