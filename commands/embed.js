const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDMPermission(true)
        .setDescription('Displays the avatar of the given user, or the command user')
        .addStringOption(o => o.setName('description').setDescription('Embed description').setRequired(true))
        .addStringOption(o => o.setName('title').setDescription('Embed title'))
        .addStringOption(o => o.setName('url').setDescription('Embed URL (Title link)'))
        .addStringOption(o => o.setName('color').setDescription('Embed color (HEX with the #)').setMaxLength(7).setMinLength(7))
        .addStringOption(o => o.setName('image').setDescription('Embed image URL'))
        .addStringOption(o => o.setName('footer-text').setDescription('Embed footer text'))
        .addStringOption(o => o.setName('footer-icon').setDescription('Embed footer image URL'))
        .addStringOption(o => o.setName('author-name').setDescription('Embed author name'))
        .addStringOption(o => o.setName('author-url').setDescription('Embed author link'))
        .addStringOption(o => o.setName('author-icon').setDescription('Embed author icon URL'))
        .addBooleanOption(o => o.setName('timestamp').setDescription('Embed creation timestamp')),
    async execute(interaction, Dsc, client) {
        await interaction.deferReply({ephemeral:true});
        const e = new Dsc.EmbedBuilder()
        console.log(interaction.options.getString('description'));
        if(interaction.options.getString('title')) e.setTitle(interaction.options.getString('title'));
        e.setDescription(interaction.options.getString('description',true));
        if(interaction.options.getString('url')) e.setURL(interaction.options.getString('url'));
        if(interaction.options.getString('image')) e.setImage(interaction.options.getString('image'));
        if(interaction.options.getString('color')) e.setColor(interaction.options.getString('color'));
        e.setAuthor({ name: interaction.options.getString('author_name'), url: interaction.options.getString('author_url'), iconURL:interaction.options.getString('author_icon')});
        e.setFooter({ text: interaction.options.getString('footer_text'), iconURL: interaction.options.getString('footer_icon')})
        if(interaction.options.getBoolean('timestamp')) e.setTimestamp(Date.now());
        await interaction.channel.send({ embeds: [e]});
        await interaction.editReply({content: 'Embed sent'});
    }
}