module.exports = {
    async execute(interaction, args, Dsc, client) {
        const eph = args.shift() == 'e';
        console.log(args);
        if(args[0] == 'r'){
            args.shift();
            let s = args.join(' ');
            return interaction.reply({ content: 'Random character : ' + s[randomBetween(0, s.length)], ephemeral: eph });
        }
        await interaction.reply({ content: args.join(' '), ephemeral: eph });
    }
}

function randomBetween(max,min) {
    return Math.round(Math.random()*(max-min) + min);
}