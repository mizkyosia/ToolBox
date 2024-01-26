const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders'), fs = require('fs');

const cmdNames = fs.readdirSync(`./commands/`).filter(file => file.endsWith('.js')).map(f => {return {name:f.replace('.js', ''), value: f.replace('.js', '')}});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('To get more informations on the commands')
        .setDMPermission(true)
        .addSubcommand(s =>
            s.setName('general').setDescription('Displays all commands and their description')
            )
        .addSubcommand(s =>
            s.setName('command').setDescription('Gives additionnal info on a particular command')
            .addStringOption(o =>
                o.setName('name').setDescription('The command\'s name').setRequired(true)
                .addChoices(...cmdNames)
                )
            )
        ,
    async execute(interaction, Dsc, client) {
        await interaction.deferReply();
        if(interaction.options.getSubcommand() === 'command'){
            const cmd = require(`./${interaction.options.getString('name')}`)
            if(!cmd) return interaction.editReply({ content: `Sorry, the command ${interaction.options.getString('name')} is invalid`})
            return await interaction.editReply({ embeds: [{
                title: `Commande ${cmd.data.name}`,
                description: cmd.data.description,
                color: client.color,
                author: {
                    name: 'Help - Command',
                    icon_url: client.user.avatarURL(),
                }
            }], ephemeral: true });
        }

        const row = new ActionRowBuilder();
        row.addComponents(
            new ButtonBuilder().setCustomId('help -1').setLabel('Previous page').setEmoji({name:'◀️'}).setDisabled(true).setStyle(Dsc.ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('help 1').setLabel('Next page').setEmoji({name:'◀️'}).setDisabled(cmdNames.length <= 10).setStyle(Dsc.ButtonStyle.Secondary)
        );
        await interaction.editReply({ content: `General help`, components: [row], ephemeral: true });
    }
}