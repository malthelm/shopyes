import fs from 'fs/promises';
import path from 'path';
import Logger from './logger.js';
import ConfigurationManager from './config_manager.js';

class ProxyManager {
    constructor() {
        this.proxies = [];
        this.currentIndex = 0;
        this.isWebshare = ConfigurationManager.get('USE_WEBSHARE') === '1';
        this.webshareKey = ConfigurationManager.get('WEBSHARE_API_KEY');
    }

    async loadProxies() {
        try {
            if (this.isWebshare) {
                await this.loadWebshareProxies();
            } else {
                await this.loadProxyFile();
            }
            Logger.info(`Loaded ${this.proxies.length} proxies`);
        } catch (error) {
            Logger.error('Failed to load proxies:', error);
            throw error;
        }
    }

    async loadWebshareProxies() {
        try {
            const response = await fetch('https://proxy.webshare.io/api/proxy/list/', {
                headers: {
                    'Authorization': `Token ${this.webshareKey}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch Webshare proxies: ${response.status}`);
            }

            const data = await response.json();
            this.proxies = data.results.map(proxy => ({
                host: proxy.proxy_address,
                port: proxy.ports.http,
                username: proxy.username,
                password: proxy.password
            }));
        } catch (error) {
            Logger.error('Webshare API error:', error);
            throw error;
        }
    }

    async loadProxyFile() {
        try {
            const proxyPath = ConfigurationManager.get('PROXY_LIST_PATH');
            const content = await fs.readFile(proxyPath, 'utf-8');
            this.proxies = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
                .map(line => {
                    const [host, port, username, password] = line.split(':');
                    return { host, port, username, password };
                });
        } catch (error) {
            Logger.error('Failed to load proxy file:', error);
            throw error;
        }
    }

    getNextProxy() {
        if (this.proxies.length === 0) {
            throw new Error('No proxies available');
        }
        const proxy = this.proxies[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
        return proxy;
    }

    getProxyUrl() {
        const proxy = this.getNextProxy();
        return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }
}

export default new ProxyManager();
