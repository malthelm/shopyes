import { SlashCommandBuilder } from 'discord.js';
import { SearchModel } from '../../database.js';
import Logger from '../../utils/logger.js';

export const data = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Manage Vinted searches')
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Create a new search')
            .addStringOption(option =>
                option
                    .setName('url')
                    .setDescription('The Vinted search URL')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all searches'));

export async function execute(interaction) {
    try {
        Logger.info(`Executing search command with subcommand: ${interaction.options.getSubcommand()}`);
        
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'create') {
            const url = interaction.options.getString('url');
            Logger.info(`Creating search with URL: ${url}`);
            
            const search = await SearchModel.create({
                url: url,
                guildId: interaction.guildId,
                channelId: interaction.channelId
            });
            Logger.info(`Search created: ${JSON.stringify(search)}`);

            await interaction.reply(`Successfully created new search!\nURL: ${url}`);
            
        } else if (subcommand === 'list') {
            Logger.info('Listing searches');
            
            const searches = await SearchModel.find({
                guildId: interaction.guildId
            });
            Logger.info(`Found ${searches.length} searches`);

            if (searches.length === 0) {
                await interaction.reply('No searches found for this server.');
                return;
            }

            const searchList = searches.map((search, index) => 
                `${index + 1}. ${search.url}`
            ).join('\n');

            await interaction.reply(`Active Searches:\n${searchList}`);
        }
    } catch (error) {
        Logger.error('Error executing search command:', error);
        await interaction.reply({
            content: 'There was an error executing the search command. Please try again.',
            ephemeral: true
        });
    }
} 