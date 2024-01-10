const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolemenu')
        .setDescription('Creates a role menu, with up to 25 roles')
        .setDMPermission(false)
        .addSubcommand(s => s.setName('create').setDescription('Creates a role menu')
            .addStringOption(o => o.setName('title').setDescription('The title of the menu').setRequired(true))
            .addStringOption(o => o.setName('description').setDescription('The description of the menu').setRequired(true))
            .addStringOption(o => o.setName('color').setDescription('The color of the embed for the menu (optional)'))
        )
        .addSubcommand(s => s.setName('add').setDescription('Adds a role to the menu. A menu cannot exceed 25 roles')
            .addStringOption(o => o.setName('menu_id').setDescription('The message ID of the menu. The message must be in the same channel as this command').setRequired(true))
            .addRoleOption(o => o.setName('role').setDescription('The name of the role').setRequired(true))
            .addStringOption(o => o.setName('emoji_id').setDescription('The ID of the emoji you want to display for this role. Must be an emoji from this server').setRequired(true))
        )
        .addSubcommand(s => s.setName('remove').setDescription('Removes a role to the menu')
            .addStringOption(o => o.setName('menu_id').setDescription('The message ID of the menu. The message must be in the same channel as this command').setRequired(true))
            .addRoleOption(o => o.setName('role').setDescription('The role to remove').setRequired(true))
        ),
    async execute(interaction, Dsc, client) {
        const c = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: c != 'create' });
        if (c == 'create') {
            return await interaction.editReply({
                embeds: [new Dsc.EmbedBuilder()
                    .setAuthor({ name: `menu by ${interaction.member.nickname || interaction.user.username} (${interaction.user.username})`, iconURL: interaction.user.avatarURL() })
                    .setTitle(interaction.options.getString('title'))
                    .setDescription(interaction.options.getString('description'))
                    .setColor(interaction.options.getString('color') || '#000000')]
            });
        }
        const ro = interaction.options.getRole('role');
        await interaction.channel.messages.fetch();
        const m = interaction.channel.messages.cache.get(interaction.options.getString('menu_id'));
        if (!m || m.author.id != client.user.id || m.interaction.commandName != 'rolemenu create') return await interaction.editReply({ content: 'Error : ID given for the menu doesn\'t correspond to a menu message sent by this bot' })
        const em = new Dsc.EmbedBuilder(m.embeds[0]);
        if (!em) return await interaction.editReply({ content: 'Error : the given menu doesn\'t have any embeds' });
        if (c == 'remove') {
            var i = em.data.fields.findIndex(f => f.value.includes(ro.toString()));
            if (i == -1) return await interaction.editReply({ content: 'Error : the provided role does not exist on this menu' });
            em.spliceFields(i, 1);
            var comp = [], fcomp = [new Dsc.ActionRowBuilder()], j = 0;
            m.components.forEach(r => r.components.forEach(b => {
                if (j != i) comp.push(new Dsc.ButtonBuilder(b.data));
                j++;
            }));
            for (let i = 0; i < comp.length; i++) {
                if (fcomp[fcomp.length - 1].components.length < 5) fcomp[fcomp.length - 1].addComponents(comp[i]);
                else fcomp.push(new Dsc.ActionRowBuilder().addComponents(comp[i]));
            }
            await m.edit({ embeds: [em], components: fcomp });
            return await interaction.editReply(`Role ${ro.toString()} removed from rolemenu`);
        }
        await interaction.guild.emojis.fetch();
        const e = interaction.guild.emojis.cache.get(interaction.options.getString('emoji_id'));
        if (!e) return await interaction.editReply({ content: 'Error : the provided emoji ID doesn\'t correspond to any emoji in this server' });
        if (em.data.fields?.length == 25) return await interaction.editReply({ content: 'Error : this menu already has the maximum amount of roles (25)' });
        em.addFields({ name: ro.name, value: `${e.toString()} => ${ro.toString()}`, inline: true });
        console.log(em.fields);
        let co = m.components;
        if (!co || co.length == 0) co = [new Dsc.ActionRowBuilder()];
        if (co[co.length - 1].components.length < 5) co[co.length - 1].components.push(new Dsc.ButtonBuilder().setEmoji({ id: e.id }).setStyle(Dsc.ButtonStyle.Secondary).setCustomId(`addRole ${ro.id}`));
        else co.push(new Dsc.ActionRowBuilder().addComponents(new Dsc.ButtonBuilder().setEmoji({ id: e.id }).setStyle(Dsc.ButtonStyle.Secondary).setCustomId(`addRole ${ro}`)));
        await m.edit({ embeds: [em], components: co });
        await interaction.editReply(`Role ${ro.toString()} added with emoji ${e.toString()}`);
    }
}