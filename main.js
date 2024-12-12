import { Client, GatewayIntentBits, Partials, InteractionType } from 'discord.js';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import ProxyManager from './src/utils/proxy_manager.js';
import Logger from './src/utils/logger.js';

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
    ]
});

// Handle interactions (slash commands)
client.on('interactionCreate', async interaction => {
    try {
        Logger.info(`Received interaction: ${interaction.commandName}`);
        
        if (!interaction.isCommand()) return;

        if (interaction.commandName === 'ping') {
            await interaction.reply('Pong! 🏓');
        }

        if (interaction.commandName === 'test') {
            await interaction.reply('Bot is working! ✅');
        }
    } catch (error) {
        Logger.error('Error handling interaction:', error);
        // Try to respond with error message if we haven't responded yet
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error processing your command!', ephemeral: true });
        }
    }
});

// Regular message handling
client.on('messageCreate', async (message) => {
    Logger.info(`Received message: ${message.content}`);
    
    if (message.author.bot) return;

    if (message.content === '!ping') {
        try {
            await message.reply('Pong! 🏓');
            Logger.info('Successfully sent ping response');
        } catch (error) {
            Logger.error('Error sending ping response:', error);
        }
    }

    if (message.content === '!test') {
        try {
            await message.reply('Bot is working! ✅');
            Logger.info('Successfully sent test response');
        } catch (error) {
            Logger.error('Error sending test response:', error);
        }
    }
});

// Discord ready event
client.once('ready', async () => {
    try {
        Logger.info(`Logged in as ${client.user.tag}!`);
        Logger.info(`Bot is in ${client.guilds.cache.size} servers`);

        // Register slash commands
        const commands = [
            {
                name: 'ping',
                description: 'Replies with Pong!'
            },
            {
                name: 'test',
                description: 'Test if the bot is working'
            }
        ];

        await client.application.commands.set(commands);
        Logger.info('Slash commands registered successfully');
    } catch (error) {
        Logger.error('Error in ready event:', error);
    }
});

async function initialize() {
    try {
        // Initialize proxy system
        await ProxyManager.loadProxies();
        Logger.info(`Proxy system initialized successfully`);

        // Test proxy
        const proxyTest = await testProxy();
        if (proxyTest) {
            Logger.info('Proxy test passed successfully!');
        } else {
            Logger.error('Proxy test failed!');
        }

        // Login to Discord
        await client.login(process.env.DISCORD_TOKEN);
        Logger.info('Discord bot is now online!');
        
    } catch (error) {
        Logger.error('Initialization error:', error);
        process.exit(1);
    }
}

async function testProxy() {
    try {
        const proxy = ProxyManager.getNextProxy();
        Logger.info(`Testing proxy: ${proxy.host}:${proxy.port}`);

        const response = await fetch('https://api.ipify.org?format=json', {
            proxy: `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
        });

        const data = await response.json();
        Logger.info(`Proxy test successful! IP: ${data.ip}`);
        return true;
    } catch (error) {
        Logger.error('Proxy test failed:', error);
        return false;
    }
}

// Error handling
client.on('error', (error) => {
    Logger.error('Discord client error:', error);
});

// Debug logging
client.on('debug', (info) => {
    Logger.debug('Discord debug:', info);
});

// Start the bot
initialize();