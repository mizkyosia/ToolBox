const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDMPermission(false)
        .setDescription('Displays the avatar of the given user, or the command user')
        .addSubcommand(s => s.setName('user').setDescription('Displays the avatar of the given user, or the command caster').addUserOption(o => o.setName('target').setDescription('The user whose avatar you want to show').setRequired(false)))
        .addSubcommand(s => s.setName('server').setDescription('Display the avatar of the current server')),
    async execute(interaction, Dsc, client) {
        await interaction.deferReply();
        if(interaction.options.getSubcommand() == 'server'){
            return await interaction.editReply({ embeds: [{
                title: `Server icon`,
                url: interaction.guild.iconURL(),
                image:{
                    url:interaction.guild.iconURL({ extension: 'png', dynamic:true, size: 1024 })
                }
            }]});
        }
        let u = interaction.options.getUser('target',false) || interaction.user;
        await interaction.editReply({ embeds: [{
            color:(await u.fetch()).accentColor,
            title: `Avatar of ${u.username}`,
            url: u.avatarURL(),
            image:{
                url:u.displayAvatarURL({ extension: 'png', dynamic: true, size: 1024 })
            },
            timestamp:new Date().toISOString()
        }]});
    }
}