const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs'), { QuickDB } = require('quick.db'), CSV = require('csv-parse');

module.exports = {
    data: new SlashCommandBuilder().setName('dev').setDMPermission(true)
        .setDescription('Collection of developper commands')
        .addSubcommandGroup(
            g => g.setName('update-data').setDescription('Update data')
                .addSubcommand(
                    s => s.setName('name-map').setDescription('Update data for a country the name-map game')
                        .addStringOption(
                            o => o.setName('country').setDescription('Stuff').addChoices({
                                name: 'France',
                                value: 'fr'
                            }).setRequired(true)
                        ).addBooleanOption(
                            o => o.setName('db-update').setDescription('Update database ?').setRequired(true)
                        ).addNumberOption(
                            o => o.setName('x').setDescription('The x coordinate of the center of the country')
                        ).addNumberOption(
                            o => o.setName('y').setDescription('The y coordinate of the center of the country')
                        ).addNumberOption(
                            o => o.setName('z').setDescription('Sets the zoom level of the picture (must be an integer)')
                        ).addNumberOption(
                            o => o.setName('width').setDescription('Image X resolution in pixels')
                        ).addNumberOption(
                            o => o.setName('height').setDescription('Image Y resolution in pixels')
                        )
                )
        )
    ,
    async execute(interaction, Dsc, client) {
        console.log('Update in progress...');
        await interaction.deferReply();

        const cmdGroup = interaction.options.getSubcommandGroup(true);
        const subCmd = interaction.options.getSubcommand(true);
        console.log(subCmd);

        if (subCmd == 'name-map' && cmdGroup == 'update-data') {
            return updateNameMapData(interaction, interaction.options.getString('country', true))
        }
        return interaction.updateReply({ content: 'Sorry, an internal issue occured. Please try again later' });
    }
}

async function updateNameMapData(interaction, country) {
    await interaction.editReply({ content: `Updating data for entry \`${country}\`...` });
    const db = new QuickDB({ filePath:'./resources/geographical/geo.sqlite' }).table(country), existingNames = new Set(), departments = new Set(), namesParser = fs
        .createReadStream(`./resources/geographical/${country}/names.csv`)
        .pipe(CSV.parse());
    
    const currentParams = await db.get(`params`);
    const params = {
        x: interaction.options.getNumber('x') ?? currentParams.x,
        y: interaction.options.getNumber('y') ?? currentParams.y,
        z: interaction.options.getNumber('z') ?? currentParams.z,
        width: interaction.options.getNumber('width') ?? currentParams.width,
        height: interaction.options.getNumber('height') ?? currentParams.height,
    }
    await db.set(`params`, params);
    if(!interaction.options.getBoolean('db-update')) return interaction.editReply({ content: 'Parameters updated !' });
    let first = true;

    console.log('Start of update');
    const names = {}, startTime = Date.now();

    for await (const record of namesParser) {
        if (record[1].startsWith('_') || first) { first = false; continue; }
        record[1] = record[1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (!names[record[1]]) names[record[1]] = { sex: record[0] };
        if (!names[record[1]][`dept${record[3]}`]) names[record[1]][`dept${record[3]}`] = {};
        names[record[1]][`dept${record[3]}`][`year${record[2]}`] = Math.round(parseFloat(record[4]));
        existingNames.add(record[1]);
    }

    await db.set(`existingNames`, Array.from(existingNames));
    await db.set(`names`, names);
    console.log('Names set');

    first = true;
    const births = {}, birthsParser = fs
        .createReadStream(`./resources/geographical/${country}/births.csv`)
        .pipe(CSV.parse());

    for await (const record of birthsParser) {
        if (first) { first = false; continue; }
        if (!births[`dept${record[0]}`]) births[`dept${record[0]}`] = {};
        births[`dept${record[0]}`][`year${record[1]}`] = Math.round(record[2]);
    }

    await db.set(`births`, births);

    console.log('Births set\nUpdate finished');
    await interaction.editReply({ content: `Update finished for entry \`${country}\`\nTime taken : \`${formatTime(Date.now() - startTime)}\`` });
}

function formatTime(time) {
    // MS
    var output = (time % 1000) + 'ms';
    time = Math.floor(time / 1000);
    if (!time) return output;

    // Seconds
    output = (time % 60) + 's ' + output;
    time = Math.floor(time / 60);
    if (!time) return output;

    // Minutes
    output = (time % 60) + 'm ' + output;
    time = Math.round(time / 60);
    if (!time) return output;

    // Hours
    output = (time % 24) + 'h ' + output;
    time = Math.round(time / 24);
    if (!time) return output;

    // Days
    output = time + 'd ' + output;
    return output;
}