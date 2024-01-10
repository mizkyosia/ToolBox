const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const d = new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Creates a poll, with up to 25 choices')
    .setDMPermission(false)
    .addSubcommand(s => s.setName('create').setDescription('Creates a poll')
        .addStringOption(o => o.setName('title').setDescription('The title of the poll').setRequired(true))
        .addStringOption(o => o.setName('description').setDescription('The description of the poll').setRequired(true))
        .addStringOption(o => o.setName('color').setDescription('The color of the embed for the poll (optional)'))
    )
    .addSubcommand(s => s.setName('add').setDescription('Adds a choice to the poll. A poll cannot exceed 25 choices')
        .addStringOption(o => o.setName('poll_id').setDescription('The message ID of the poll. The message must be in the same channel as this command').setRequired(true))
        .addStringOption(o => o.setName('choice_name').setDescription('The name of the choice').setRequired(true))
        .addStringOption(o => o.setName('emoji_id').setDescription('The ID of the emoji you want to display for this choice. Must be an emoji from this server').setRequired(true))
    )
    .addSubcommand(s => s.setName('remove').setDescription('Removes a choice to the poll')
        .addStringOption(o => o.setName('poll_id').setDescription('The message ID of the poll. The message must be in the same channel as this command').setRequired(true))
        .addStringOption(o => o.setName('choice_name').setDescription('The choice\'s name').setRequired(true))
    );

module.exports = {
    data: d,
    async execute(interaction, Dsc, client) {
        const c = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: c != 'create' });
        if (c == 'create') {
            return await interaction.editReply({
                embeds: [new Dsc.EmbedBuilder()
                    .setAuthor({ name: `Poll by ${interaction.member.nickname || interaction.user.username} (${interaction.user.username})`, iconURL: interaction.user.avatarURL() })
                    .setTitle(interaction.options.getString('title'))
                    .setDescription(interaction.options.getString('description'))
                    .setColor(interaction.options.getString('color') || '#000000')
                    .setTimestamp(Date.now())]
            });
        }
        await interaction.channel.messages.fetch();
        const m = interaction.channel.messages.cache.get(interaction.options.getString('poll_id'));
        if(!m || m.author.id != client.user.id || m.interaction.commandName != 'poll create') return await interaction.editReply({ content: 'Error : ID given for the poll doesn\'t correspond to a poll message sent by this bot'})
        const em = m.embeds[0];
        if(!em) return await interaction.editReply({ content:'Error : the given poll doesn\'t have any embeds' });
        if(c == 'remove'){
            var i = em.fields.findIndex(f => f.name == interaction);
            if(i == -1) return await interaction.editReply({ content:'Error : the provided choice does not exist on this poll' });
            em.fields.splice(i,1);
            return await interaction.editReply({ embeds: [em] });
        }
        await interaction.guild.emojis.fetch();
        const e = interaction.guild.emojis.cache.get(interaction.options.getString('emoji_id'));
        if(!e) return await interaction.editReply({ content:'Error : the provided emoji ID doesn\'t correspond to any emoji in this server' });
        if (em.fields.length == 25) return await interaction.editReply({ content:'Error : this poll already has the maximum amount of choices (25)' });
        console.log(em.fields);
        let co = m.components;
        if(!co||co.length == 0) co = [new ActionRowBuilder()];
        if(co[co.length - 1].components.length < 5) co[co.length - 1].components.push(new ButtonBuilder().setEmoji({id:e.id}).setStyle(ButtonStyle.Secondary).setCustomId());
        else co.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setEmoji({id:e.id}).setStyle(ButtonStyle.Secondary).setCustomId('reaction')));
        await interaction.editReply({ embeds: [em], components: co });
    }
}