import { fetchItem } from '../api/fetchItem.js';
import Logger from '../utils/logger.js';
import { fetchCatalogItems } from "../api/fetchCatalogItems.js";

/**
 * Enhanced configuration
 */
const CONFIG = {
    INITIAL_CONCURRENCY: 8,
    MAX_STEP: 25,
    ERROR_THRESHOLD: 5,
    RATE_LIMIT_DELAY: 100,
    BACKOFF_DELAY: 1000,
    MAX_RETRIES: 3
};

/**
 * State management
 */
let computedConcurrency = CONFIG.INITIAL_CONCURRENCY;
let consecutiveErrors = 0;
let lastPublishedTime = Date.now();
let step = 1;
let rateLimitErrorsPerSecond = 0;
let validItemsPerSecond = 0;

/**
 * Optimized step adjustment
 */
function adjustStep() {
    const timeSinceLastPublication = Date.now() - lastPublishedTime;

    if (consecutiveErrors > CONFIG.ERROR_THRESHOLD) {
        step = Math.max(1, step - 1);
        consecutiveErrors = Math.max(0, consecutiveErrors - 1);
        return;
    }

    if (timeSinceLastPublication > 10000) {
        step = Math.min(step * 2 + 10, CONFIG.MAX_STEP);
    } else if (timeSinceLastPublication > 5000) {
        step = 2;
    }
    
    step = Math.ceil(step);
}

/**
 * Enhanced error handling and retry logic
 */
async function fetchAndHandleItemSafe(cookie, itemID, callback) {
    let retries = CONFIG.MAX_RETRIES;
    
    while (retries > 0) {
        try {
            const response = await fetchItem({ cookie, item_id: itemID });
            
            if (response.item) {
                await callback(response.item);
                validItemsPerSecond++;
                lastPublishedTime = Date.now();
                consecutiveErrors = Math.max(0, consecutiveErrors - 1);
                return true;
            } 
            
            if (response.code === 429) {
                rateLimitErrorsPerSecond++;
                await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
                retries--;
                continue;
            }
            
            return false;
        } catch (error) {
            consecutiveErrors++;
            retries--;
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.BACKOFF_DELAY));
            }
        }
    }
    return false;
}

/**
 * Performance monitoring
 */
setInterval(() => {
    Logger.debug(`Performance: ${validItemsPerSecond} valid items/s, ${rateLimitErrorsPerSecond} rate limits/s`);
    validItemsPerSecond = 0;
    rateLimitErrorsPerSecond = 0;
}, 1000);

/**
 * Optimized step adjustment interval
 */
setInterval(() => {
    adjustStep();
}, 5);

// Export using ES module syntax
export default {
    fetchAndHandleItemSafe,
    adjustStep,
    getStep: () => step,
    getConcurrency: () => computedConcurrency
};

