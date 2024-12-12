import { Client, GatewayIntentBits, Partials, InteractionType, EmbedBuilder } from 'discord.js';
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
        if (!interaction.isCommand()) return;

        Logger.info(`Received command: ${interaction.commandName}`);

        if (interaction.commandName === 'ping') {
            const latency = client.ws.ping;
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🏓 Pong!')
                .addFields(
                    { name: 'Bot Latency', value: `${latency}ms`, inline: true },
                    { name: 'Status', value: '✅ Online', inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            Logger.info(`Ping command responded with ${latency}ms latency`);
        }

        if (interaction.commandName === 'test') {
            await interaction.deferReply();
            Logger.info('Running system check...');
            
            const checks = await runSystemCheck();
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('System Status Check')
                .addFields(
                    { 
                        name: 'Proxy System', 
                        value: checks.proxy ? '✅ Working' : '❌ Failed',
                        inline: true 
                    },
                    { 
                        name: 'Discord Connection', 
                        value: checks.discord ? '✅ Connected' : '❌ Disconnected',
                        inline: true 
                    },
                    { 
                        name: 'Database', 
                        value: checks.database ? '✅ Connected' : '❌ Disconnected',
                        inline: true 
                    },
                    {
                        name: 'Bot Latency',
                        value: `${client.ws.ping}ms`,
                        inline: true
                    },
                    {
                        name: 'Uptime',
                        value: `${Math.floor(client.uptime / 60000)} minutes`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Vinted Bot Status' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            Logger.info('System check completed and results sent');
        }
    } catch (error) {
        Logger.error('Error handling interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: 'There was an error processing your command!', 
                ephemeral: true 
            });
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
                description: 'Check bot latency and status'
            },
            {
                name: 'test',
                description: 'Run a complete system check'
            }
        ];

        Logger.info('Starting command registration...');
        Logger.info(`Commands to register: ${commands.map(cmd => cmd.name).join(', ')}`);

        try {
            const registeredCommands = await client.application.commands.set(commands);
            Logger.info(`Successfully registered ${registeredCommands.size} commands:`);
            registeredCommands.forEach(cmd => {
                Logger.info(`- /${cmd.name}: ${cmd.description}`);
            });
        } catch (registerError) {
            Logger.error('Failed to register commands:', registerError);
            throw registerError;
        }

    } catch (error) {
        Logger.error('Error in ready event:', error);
        Logger.error('Stack trace:', error.stack);
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

async function runSystemCheck() {
    Logger.info('Starting system check...');
    
    const checks = {
        proxy: false,
        discord: false,
        database: false
    };

    // Test proxy
    try {
        Logger.info('Testing proxy system...');
        const proxy = ProxyManager.getNextProxy();
        if (proxy) {
            checks.proxy = true;
            Logger.info('Proxy check passed');
        }
    } catch (error) {
        Logger.error('Proxy check failed:', error);
    }

    // Test Discord
    try {
        Logger.info('Testing Discord connection...');
        checks.discord = client.ws.ping !== undefined;
        Logger.info(`Discord check ${checks.discord ? 'passed' : 'failed'}`);
    } catch (error) {
        Logger.error('Discord check failed:', error);
    }

    // Test Database (if you're using MongoDB)
    try {
        Logger.info('Testing database connection...');
        if (mongoose.connection) {
            checks.database = mongoose.connection.readyState === 1;
            Logger.info(`Database check ${checks.database ? 'passed' : 'failed'}`);
        }
    } catch (error) {
        Logger.error('Database check failed:', error);
    }

    Logger.info('System check completed');
    return checks;
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