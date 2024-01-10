const { SlashCommandBuilder, ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ticket').setDescription('Setups a ticket system for members to use'),
    async execute(interaction, Dsc, client) {
        await interaction.deferReply();
        await interaction.guild.channels.create({ name: 'Tickets', type: Dsc.ChannelType.GuildCategory });
        await interaction.editReply({ embeds:[{
            title: 'Ticket system',
            description: 'Create a ticket for any of the reasons below'
        }] })
    }
}