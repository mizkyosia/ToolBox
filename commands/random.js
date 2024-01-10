const { SlashCommandBuilder, range } = require('discord.js');
const convert = require('color-convert');

module.exports = {
    data: new SlashCommandBuilder().setName('random').setDMPermission(true).setDescription('A group of commands for generating random things')
        .addSubcommand(s => s.setName('number').setDescription('Returns a random number in range [min;max]')
            .addNumberOption(o => o.setName('min').setDescription('The minimum number').setRequired(true))
            .addNumberOption(o => o.setName('max').setDescription('The maximum number').setRequired(true))
            .addIntegerOption(o => o.setName('iterations').setDescription('The number of random numbers to be generated. Maximum 100').setRequired(true).setMaxValue(100).setMinValue(1))
            .addBooleanOption(o => o.setName('round').setDescription('Should the numbers be rounded ?').setRequired(true))
        )
        .addSubcommand(s => s.setName('color').setDescription('Returns a random color in multiple formats')),
    async execute(interaction, Dsc, client) {
        await interaction.deferReply({ ephemeral:true });
        if(interaction.options.getSubcommand() == 'number') {
            let s = '';
            for(let i = 0; i < interaction.options.getInteger('iterations'); i++){
                let z = randomBetween(interaction.options.getNumber('max'),interaction.options.getNumber('min'));
                s += (interaction.options.getBoolean('round') ? Math.round(z) : z) + '\n';
            }
            return await interaction.editReply({ content:s});
        } else if(interaction.options.getSubcommand() == 'color') {
            let c = [Math.round(randomBetween(0,255)),Math.round(randomBetween(0,255)),Math.round(randomBetween(0,255))];
            convert.rgb.ansi16
            return await interaction.editReply({ embeds:[{
                title:'#' + convert.rgb.hex(c),
                color:parseInt(convert.rgb.hex(c),16),
                description:`RGB : ${c}\nHSV : ${convert.rgb.hsv(c)}\nHSL : ${convert.rgb.hsl(c)}\nCMYK : ${convert.rgb.cmyk(c)}\nName : ${convert.rgb.keyword(c)}`
            }]});
        }
    }
}

function randomBetween(max,min) {
    return Math.random()*(max-min) + min;
}