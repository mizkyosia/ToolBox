const Game = require('../commands/game');
module.exports = {
    async execute(interaction, args, Dsc, client) {
        const subcommand = args.shift();
        if(subcommand == 'name-map'){
            await interaction.reply({ content: 'View changing...', ephemeral: true });
            const msgData = await Game.nameMap(interaction, Dsc, client, ...args, false);
            if(!msgData || msgData?.length != 2) return interaction.editReply({ content: 'Sorry, an internal error ocurred. Please try again later', ephemeral: true });
            await interaction.message.edit(msgData[1]);
            await interaction.editReply({ content: 'View changed', ephemeral: true });
        }
    }
}