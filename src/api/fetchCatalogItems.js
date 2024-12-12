import { executeWithDetailedHandling } from "../helpers/execute_helper.js";
import RequestBuilder from "../utils/request_builder.js";
import ConfigurationManager from "../utils/config_manager.js";
import { NotFoundError } from "../helpers/execute_helper.js";

const extension = ConfigurationManager.getAlgorithmSetting.vinted_api_domain_extension

/**
 * Fetch catalog items from Vinted.
 * @param {Object} params - Parameters for fetching catalog items.
 * @param {string} params.cookie - Cookie for authentication.
 * @param {number} [params.per_page=96] - Number of items per page.
 * @param {string} [params.order='newest_first'] - Order of items.
 * @returns {Promise<Object>} - Promise resolving to the fetched catalog items.
 */
export async function fetchCatalogItems({ cookie, page = 1, per_page = 20, retries = 3 }) {
    while (retries > 0) {
        try {
            const response = await fetch(`https://www.vinted.fr/api/v2/catalog/items?page=${page}&per_page=${per_page}`, {
                headers: {
                    'cookie': cookie
                },
                timeout: 5000  // Add 5 second timeout
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            // Handle rate limits
            if (response.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                retries--;
                continue;
            }
            
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
