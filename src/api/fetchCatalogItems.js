import { executeWithDetailedHandling } from "../helpers/execute_helper.js";
import RequestBuilder from "../utils/request_builder.js";
import ConfigurationManager from "../utils/config_manager.js";
import { NotFoundError } from "../helpers/execute_helper.js";
import Logger from '../utils/logger.js';

const extension = ConfigurationManager.getAlgorithmSetting.vinted_api_domain_extension || 'fr';

export async function fetchCatalogItems({ cookie, page = 1, per_page = 20, searchParams = {}, retries = 3 }) {
    Logger.debug('Starting fetchCatalogItems', {
        extension,
        cookieExists: !!cookie,
        cookieLength: cookie?.length,
        page,
        per_page,
        searchParams
    });

    while (retries > 0) {
        try {
            if (!cookie) {
                throw new Error('VINTED_COOKIE is not set or is empty');
            }

            const baseUrl = `https://www.vinted.${extension}/api/v2/catalog/items`;
            const url = new URL(baseUrl);
            
            url.searchParams.set('page', page);
            url.searchParams.set('per_page', per_page);
            url.searchParams.set('order', 'newest_first');
            
            if (searchParams) {
                Object.entries(searchParams).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(val => {
                            if (val) {
                                url.searchParams.append(`${key}[]`, val);
                            }
                        });
                    } else if (value) {
                        url.searchParams.set(key, value);
                    }
                });
            }

            Logger.debug('Making request', { url: url.toString() });

            const response = await fetch(url.toString(), { 
                headers: {
                    'cookie': cookie,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': `https://www.vinted.${extension}/`,
                    'Origin': `https://www.vinted.${extension}`,
                    'Connection': 'keep-alive'
                },
                timeout: 10000
            });
            
            Logger.debug('Response received', { status: response.status });
            
            if (response.ok) {
                const data = await response.json();
                Logger.debug('Success', { itemCount: data.items?.length || 0 });
                return data;
            }
            
            if (response.status === 429) {
                Logger.warn('Rate limited, waiting before retry...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries--;
                continue;
            }
            
            const responseText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);

        } catch (error) {
            Logger.error('Fetch error', error);
            
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}
