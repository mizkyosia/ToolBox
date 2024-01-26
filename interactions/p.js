module.exports = {
    async execute(interaction, args, Dsc, client) {
        const eph = args.shift() == 'e';
        if(args[0] == ''){
            args.shift();
            let s = args.join(' ');
            return interaction.reply('Random character : ' + s[randomBetween(0, s.length)]);
        }
        await interaction.reply({ content: args.join(' '), ephemeral: eph });
    }
}

function randomBetween(max,min) {
    return Math.round(Math.random()*(max-min) + min);
}