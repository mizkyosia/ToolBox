module.exports = {
    async execute(interaction, args, Dsc, client) {
        await interaction.deferReply({ ephemeral: true });
        await interaction.guild.roles.fetch();
        const r = interaction.guild.roles.cache.get(args[0]);
        if(!r) return await interaction.editReply({ content: 'Error : this role no longer exists on this server' });
        if(interaction.member.roles.cache.get(args[0])){
            interaction.member.roles.remove(r);
            return await interaction.editReply({ content: `Role ${r.toString()} removed` });
        }
        interaction.member.roles.add(r);
        await interaction.editReply({ content: `Role ${r.toString()} added` });
    }
}