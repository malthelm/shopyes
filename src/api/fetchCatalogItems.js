import { executeWithDetailedHandling } from "../helpers/execute_helper.js";
import RequestBuilder from "../utils/request_builder.js";
import ConfigurationManager from "../utils/config_manager.js";
import { NotFoundError } from "../helpers/execute_helper.js";
import Logger from '../utils/logger.js';
import ProxyManager from '../utils/proxy_manager.js';

const extension = ConfigurationManager.getAlgorithmSetting.vinted_api_domain_extension || 'fr';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
};

export async function fetchCatalogItems({ cookie, page = 1, per_page = 20, searchParams = {}, retries = 3 }) {
    Logger.debug('Starting fetchCatalogItems', {
        extension,
        cookieExists: !!cookie,
        page,
        per_page,
        searchParams
    });

    let delay = 2000;
    let proxyUrl = null;

    while (retries > 0) {
        try {
            if (!cookie) {
                throw new Error('VINTED_COOKIE is not set or is empty');
            }

            proxyUrl = ProxyManager.getProxyUrl();
            
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

            // Add random delay between requests
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + delay));

            const requestHeaders = {
                ...headers,
                'cookie': cookie,
                'Referer': `https://www.vinted.${extension}/`,
                'Origin': `https://www.vinted.${extension}`
            };

            const response = await fetch(url.toString(), { 
                headers: requestHeaders,
                timeout: 15000,
                agent: new (await import('https-proxy-agent')).HttpsProxyAgent(proxyUrl)
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
            Logger.error('Fetch error', { error, proxyUrl });
            delay *= 2;
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
