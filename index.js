require('dotenv').config();
const fs = require('fs');
const Dsc = require('discord.js');

const client = new Dsc.Client({
    partials: [
        Dsc.Partials.Channel,
        Dsc.Partials.Reaction,
        Dsc.Partials.GuildMember,
        Dsc.Partials.Message
    ],
    intents: [
        Dsc.GatewayIntentBits.Guilds,
        Dsc.GatewayIntentBits.GuildMembers,
        Dsc.GatewayIntentBits.GuildMessages,
        Dsc.GatewayIntentBits.MessageContent,
        Dsc.GatewayIntentBits.DirectMessages,
    ]
});
client.color = 0x5865F2;

client.login(process.env.TOKEN);
client.on("ready", initCommands);
client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        try {
            require(`./commands/${interaction.commandName}`).execute(interaction, Dsc, client);
        } catch (e) {
            await interaction.reply({ content: 'An internal problem has occured while running this command. Please try again later' })
            console.log(e);
        }
    } else if (interaction.isButton() || interaction.isAnySelectMenu()) {
        var a = interaction.customId.split(' '), c = a.shift();
        if(interaction.isAnySelectMenu()) a = a.concat(interaction.values.reduce((p, c) => p.concat(c.split(' ')), []));
        try {
            require(`./interactions/${c}`).execute(interaction, a, Dsc, client);
        } catch (e) {
            await interaction.reply({ content: 'An internal problem has occured while running this command. Please try again later' })
            console.log(e);
        }
    }
    else console.log('Interaction : ', interaction);
});

function initCommands() {
    console.log('\x1b[35m%s\x1b[0m', 'Slash command registering start\n');
    const commands = [];
    fs.readdirSync(`./commands/`).filter(file => file.endsWith('.js')).forEach(f => commands.push(require(`./commands/${f}`).data.toJSON()));
    const rest = new Dsc.REST({ version: '10' }).setToken(process.env.TOKEN);
    (async () => {
        try {
            await rest.put(
                Dsc.Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            console.log('\x1b[32m%s\x1b[0m', 'Slash commands registered successfully');
        } catch (e) { if (e) console.error(e); }
    })();
}
