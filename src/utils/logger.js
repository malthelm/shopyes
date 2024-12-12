import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ConfigurationManager from './config_manager.js';

const devMode = ConfigurationManager.getDevMode
const dumpLogs = ConfigurationManager.getDumpLogs

class Logger {
    static logFilePath = path.join(process.cwd(), 'app.log');

    static initialize() {
        if (!fs.existsSync(Logger.logFilePath)) {
            fs.writeFileSync(Logger.logFilePath, '');
        }
    }

    static info(message) {
        Logger.log('INFO', message, chalk.green);
    }

    static warn(message) {
        Logger.log('WARN', message, chalk.yellow, true);
    }

    static error(message, error = null) {
        Logger.log('ERROR', message, chalk.red, true);
        if (error) {
            console.error(chalk.red('Error details:'));
            console.error(chalk.red('Message:', error.message));
            console.error(chalk.red('Name:', error.name));
            console.error(chalk.red('Stack:', error.stack));
        }
    }

    static debug(message, data = null) {
        if (!devMode) return;
        Logger.log('DEBUG', message, chalk.magenta);
        if (data) {
            console.log(chalk.magenta('Debug data:'), data);
        }
    }

    static log(level, message, colorFn, includeSource = false) {
        const timestamp = new Date().toISOString();
        const formattedLevel = colorFn(`[${level}]`);
        
        let logMessage;
        if (typeof message === 'object') {
            logMessage = `${timestamp} ${formattedLevel}:`;
            console.log(logMessage);
            console.log(message);
        } else {
            logMessage = `${timestamp} ${formattedLevel}: ${message}`;
            console.log(logMessage);
        }

        if (includeSource) {
            const source = Logger.getCallSource();
            console.log(colorFn(`Source: ${source}`));
        }
        
        if (dumpLogs) {
            fs.appendFileSync(Logger.logFilePath, `${logMessage}\n`);
            if (typeof message === 'object') {
                fs.appendFileSync(Logger.logFilePath, JSON.stringify(message, null, 2) + '\n');
            }
        }
    }

    static getCallSource() {
        const stack = new Error().stack;
        const stackLines = stack.split('\n');
        let callerLine = stackLines[4];

        if (callerLine) {
            callerLine = callerLine.replace(/^\s+at\s+/g, '');
            return callerLine;
        }

        return 'Unknown caller';
    }
}

Logger.initialize();

export default Logger;
