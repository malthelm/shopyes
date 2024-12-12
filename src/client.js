import { Client, GatewayIntentBits, Options, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const DEBUG = true;

// Debug environment variables
console.log('Environment check:');
console.log('CLIENT_ID exists:', process.env.DISCORD_CLIENT_ID ? 'Yes' : 'No');
console.log('CLIENT_ID value:', process.env.DISCORD_CLIENT_ID);

// Define commands
const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!'
    },
    {
        name: 'search',
        description: 'Manage Vinted searches',
        options: [
            {
                name: 'create',
                description: 'Create a new search',
                type: 1
            },
            {
                name: 'list',
                description: 'List all searches',
                type: 1
            }
        ]
    }
];

// Setup REST API with explicit error handling
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
    try {
        if (!process.env.DISCORD_CLIENT_ID) {
            throw new Error('DISCORD_CLIENT_ID is not defined in environment variables');
        }

        console.log('Started refreshing application (/) commands.');
        console.log('Using CLIENT_ID:', process.env.DISCORD_CLIENT_ID);

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
    }
}

// Adjust retry timing based on rate limit reset
async function getResetDelay(error) {
    if (error.message.includes('resets at')) {
        const resetTimeMatch = error.message.match(/resets at (.*?)Z/);
        if (resetTimeMatch) {
            const resetTime = new Date(resetTimeMatch[1] + 'Z');
            const now = new Date();
            return Math.max(resetTime - now + 1000, 5000); // Add 1 second buffer
        }
    }
    return 300000; // Default to 5 minutes
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
    ws: {
        large_threshold: 50,
        compress: true
    },
    makeCache: Options.cacheWithLimits({
        MessageManager: 10,
        PresenceManager: 0,
    }),
    shardCount: 1,
    shards: [0],
    waitGuildTimeout: 0,
    restRequestTimeout: 60000,
    retryLimit: 5,
    failIfNotExists: false
});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await registerCommands();
});

client.on('error', (error) => {
    console.error('Discord client error:', error);
});

async function connectWithRetry() {
    try {
        if (DEBUG) console.log('Attempting to connect with token:', process.env.DISCORD_TOKEN ? 'Token exists' : 'No token found');
        
        await client.login(process.env.DISCORD_TOKEN);
        console.log('Successfully connected to Discord!');
    } catch (error) {
        console.error('Connection error:', error.message);
        
        // Calculate delay until rate limit reset
        const delay = await getResetDelay(error);
        console.log(`Waiting ${Math.floor(delay/1000)} seconds before next attempt...`);
        
        setTimeout(connectWithRetry, delay);
    }
}

// Add command handling
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
    
    if (interaction.commandName === 'search') {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'create') {
            await interaction.reply('Creating new search...');
        } else if (subcommand === 'list') {
            await interaction.reply('Listing searches...');
        }
    }
});

export { client, connectWithRetry };
