const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Sends the current latency of the bot in milliseconds')
        .setDMPermission(true),
    async execute(interaction, Dsc, client) {
        await interaction.deferReply();
        await interaction.editReply({ content: `Pong 🏓\n\nBot ping : \`${Date.now() - interaction.createdTimestamp}ms\`\nAPI ping : \`${Math.round(client.ws.ping)}ms\``, ephemeral: true })
    }
}