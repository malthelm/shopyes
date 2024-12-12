import { client, connectWithRetry } from './src/client.js';
import CatalogService from './src/services/catalog_service.js';
import { registerCommands, handleCommands } from './src/bot/commands_handler.js';
import ConfigurationManager from './src/utils/config_manager.js';
import ProxyManager from './src/utils/proxy_manager.js';
import MonitoringService from './src/services/monitoring_service.js';
import Logger from './src/utils/logger.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    await delay(5000); // Initial delay
    console.log('Starting bot...');
    
    try {
        // Initialize proxy manager
        Logger.info('Initializing proxy manager...');
        await ProxyManager.init();
        
        // Register commands when bot connects
        client.once('ready', async () => {
            const discordConfig = ConfigurationManager.getDiscordConfig;
            await registerCommands(client, discordConfig);
            
            // Start monitoring service
            await MonitoringService.startMonitoring();
        });

        // Handle command interactions
        client.on('interactionCreate', handleCommands);
        
        await connectWithRetry();
    } catch (error) {
        Logger.error('Error during startup:', error);
        process.exit(1);
    }
})();