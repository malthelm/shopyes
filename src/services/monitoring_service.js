import { fetchCatalogItems } from '../api/fetchCatalogItems.js';
import { postMessageToChannel } from './discord_service.js';
import Logger from '../utils/logger.js';
import ConfigurationManager from '../utils/config_manager.js';
import crud from '../crud.js';

const discordConfig = ConfigurationManager.getDiscordConfig;
const CHECK_INTERVAL = 30000; // 30 seconds

class MonitoringService {
    static async startMonitoring() {
        Logger.info('Starting monitoring service...');
        
        const monitoringLoop = async () => {
            try {
                Logger.debug('Starting monitoring loop');
                
                const channels = await crud.getAllMonitoredVintedChannels();
                Logger.debug('Monitored channels:', channels.map(ch => ({
                    id: ch.channelId,
                    url: ch.url,
                    isMonitoring: ch.isMonitoring,
                    filters: ch.generated_filters
                })));

                if (!channels || channels.length === 0) {
                    Logger.debug('No channels to monitor');
                    setTimeout(monitoringLoop, CHECK_INTERVAL);
                    return;
                }

                // Check environment variables
                if (!process.env.VINTED_COOKIE) {
                    Logger.error('VINTED_COOKIE is not set in environment variables');
                    setTimeout(monitoringLoop, CHECK_INTERVAL);
                    return;
                }

                for (const channel of channels) {
                    try {
                        if (!channel.url || !channel.isMonitoring) {
                            Logger.debug(`Skipping channel ${channel.channelId} - inactive or no URL`);
                            continue;
                        }

                        Logger.debug('Processing channel:', {
                            id: channel.channelId,
                            url: channel.url,
                            isMonitoring: channel.isMonitoring,
                            filters: JSON.stringify(channel.generated_filters)
                        });

                        const items = await fetchCatalogItems({
                            cookie: process.env.VINTED_COOKIE,
                            per_page: 20,
                            searchParams: channel.generated_filters || {}
                        });

                        if (!items) {
                            Logger.warn(`No items returned for channel ${channel.channelId}`);
                            continue;
                        }

                        Logger.debug(`Fetched ${items.items?.length || 0} items for channel ${channel.channelId}`);

                    } catch (channelError) {
                        Logger.error('Channel processing error:', {
                            channelId: channel.channelId,
                            error: channelError.message,
                            stack: channelError.stack
                        });
                    }
                }

            } catch (error) {
                Logger.error('Monitoring loop error:', {
                    message: error.message,
                    stack: error.stack
                });
            }

            setTimeout(monitoringLoop, CHECK_INTERVAL);
        };

        await monitoringLoop();
    }
}

export default MonitoringService; 