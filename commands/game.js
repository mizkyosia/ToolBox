const { SlashCommandBuilder } = require('@discordjs/builders');
const shapefile = require('shapefile'), StaticMaps = require('staticmaps'), { QuickDB } = require('quick.db');
const QuickChart = require('quickchart-js'), colorConvert = require('color-convert');
const minYear = 1900, maxYear = 2015, colors = [
    '#FFFFFF',
    '#0000FF',
    '#008000',
    '#FFFF00',
    '#FFA500',
    '#FF0000',
]

module.exports = {
    data: new SlashCommandBuilder().setName('game').setDescription('Starts a new game')
        .addSubcommand(
            s => s.setName('name-map').setDescription('A game where you have to guess a surname, judging by its rarity in different regions of a country')
                .addStringOption(
                    o => o.setName('country').setDescription('The country from which the surname is from').setRequired(true)
                        .setChoices(
                            {
                                name: 'France',
                                value: 'fr'
                            }
                        )
                ).addStringOption(
                    o => o.setName('color-mode').setDescription('Should sectors be colored by percentage of births, or number of births ?')
                        .setRequired(true)
                        .addChoices(
                            {
                                name: 'Number',
                                value: 'n'
                            },
                            {
                                name: 'Percentage',
                                value: 'p'
                            }
                        )
                ).addBooleanOption(
                    o => o.setName('allow-clues').setDescription('Allow players to ask for clues. Clues only show up for the player which asked')
                ).addBooleanOption(
                    o => o.setName('allow-answer').setDescription('Allow players to get the answer. Answers only show up for the player which asked')
                ).addStringOption(
                    o => o.setName('name').setDescription('The name the players will have to guess. Empty or unused -> bot picks a random name')
                )
        ),

    async execute(interaction, Dsc, client) {
        await interaction.deferReply({ephemeral: true});

        if (interaction.options.getSubcommand() == 'name-map') {
            var chosenName = interaction.options.getString('name');
            if(chosenName) chosenName = chosenName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const msgData = await this.nameMap(
                    interaction, Dsc, client,
                    interaction.options.getString('country', true),
                    chosenName,
                    interaction.options.getBoolean('allow-clues') ?? false,
                    interaction.options.getBoolean('allow-answer') ?? false,
                    interaction.options.getString('color-mode', true),
                    true
                )
            if(!msgData || msgData?.length != 2) return;
            const message =  await interaction.channel.send(msgData[1]);
            const thread = await message.startThread({
                name: 'name-map-game',
                autoArchiveDuration: 60
            });
            await thread.send({ content: 'Please post your guesses in this thread !\nFrom now on, you have `10` minutes to guess. Have fun !' });
            let found = false;
            const collector = thread.createMessageCollector({
                filter: m => !m.author.bot,
                time: 600_000
            });
    
            collector.on('collect', async (m) => {
                if (!m.content.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(msgData[0])) return;
                found = true;
                m.reply({ content: `GG, you found the name !\nIt was \`${msgData[0]}\`\nAll it took was ${collector.collected.size} attempts !` });
                collector.stop();
                thread.setLocked(true);
            });
    
            collector.on('end', async (collected) => {
                if (found) return;
                await thread.send({ content: `Time's up ! Seems like nobody found the name, even with ${collected.size} attempts...\nIt was \`${msgData[0]}\`` });
                thread.setLocked(true);
            });
        }

    },

    async nameMap(interaction, Dsc, client, country, chosenName, allowClues, allowAnswer, mode, fromCommand) {
        if (interaction.channel.isThread()) return interaction.editReply({ content: 'This command must be used outside of a thread !', ephemeral: true });
        const countryDB = new QuickDB({ filePath: './resources/geographical/geo.sqlite' }).table(country),
            params = await countryDB.get(`params`),
            existingNames = await countryDB.get(`existingNames`);

        if (!chosenName) chosenName = existingNames[Math.floor(Math.random() * existingNames.length)];
        if (!existingNames.find(n => n == chosenName)) return interaction.editReply({ content: 'This name is invalid !', ephemeral: true });
        
        if(fromCommand) interaction.editReply({ content: 'The game will start in a few moments', ephemeral: true });

        const nameData = await countryDB.get(`names.${chosenName}`),
            globalData = await countryDB.get(`births`),
            map = new StaticMaps({ width: params.width, height: params.height });
        const globalDept = {}, globalYear = {}, nameDept = {}, nameYear = {};

        for (let dID in globalData) {
            if (!globalDept[dID]) globalDept[dID] = 0;
            if (!nameDept[dID] && nameData[dID]) nameDept[dID] = 0;
            for (let yID in globalData[dID]) {

                // Total births part
                if (!globalYear[yID]) globalYear[yID] = 0;
                globalYear[yID] += globalData[dID][yID];
                globalDept[dID] += globalData[dID][yID];

                if (!nameData[dID] || !nameData[dID][yID]) continue;
                // Name part
                if (!nameYear[yID]) nameYear[yID] = 0;
                nameYear[yID] += nameData[dID][yID];
                nameDept[dID] += nameData[dID][yID];
            }
        }
        const departments = Object.keys(globalData);
        var deptVals = new Map(), yearVals = new Map(), maxDeptVal = 0;
        for (let dep of departments) {
            let val = (mode == 'p') ? (nameDept[dep] * 100) / globalDept[dep] : nameDept[dep];
            if (isNaN(val)) val = 0;
            deptVals.set(dep, val);
            if (val > maxDeptVal) maxDeptVal = val;
        }
        for (let year of Object.keys(globalYear)) {
            let val = (mode == 'p') ? (nameYear[year] * 100) / globalYear[year] : nameYear[year];
            if (isNaN(val)) val = 0;
            yearVals.set(year, val);
        }
        let i = 0;

        shapefile.open(`./resources/geographical/${country}/map.shp`).then(s => s.read().then(function log(result) {
            if (result.done) return;
            var val = Math.ceil((deptVals.get(departments[i]) * (colors.length - 1)) / maxDeptVal);
            map[`add${result.value.geometry.type}`]({
                coords: result.value.geometry.type == 'Polygon' ? result.value.geometry.coordinates[0] : result.value.geometry.coordinates.map(l => l[0]),
                color: '#000000',
                fill: colors[val],
                width: .5
            });
            i++;
            return s.read().then(log)
        }));


        const arrayNameYear = Object.keys(nameYear).map(k => [k, nameYear[k]]).sort((a, b) => a[0] < b[0] ? -1 : 1);
        await map.render([params.x, params.y], params.z);
        const file = new Dsc.AttachmentBuilder(await map.image.buffer('image/png', { quality: 100 }));
        const chart = await new QuickChart().setConfig({
            type: 'bar',                                // Show a bar chart
            data: {
                labels: arrayNameYear.map(l => l[0].slice(4)),   // Set X-axis labels
                datasets: [{
                    backgroundColor: '#FF4500',
                    label: 'Proportion of people born with this name',
                    data: arrayNameYear.map(v => v[1])          // Add data to the chart
                }]
            }
        }).getShortUrl();

        const thresholds = [];
        for (let i = 0; i < colors.length; i++) thresholds.push(Math.round(((maxDeptVal * i / 5) + Number.EPSILON) * 10000) / 10000);

        const comp = [
            new Dsc.ActionRowBuilder().addComponents(
                new Dsc.StringSelectMenuBuilder()
                    .setCustomId(`game name-map ${country} ${chosenName} ${allowClues} ${allowAnswer}`)
                    .addOptions(
                        {
                            label: 'Percentages',
                            value: 'p',
                            default: mode == 'p'
                        },
                        {
                            label: 'Numbers',
                            value: 'n',
                            default: mode != 'p'
                        }
                    )
            ),
        ]
        if (allowClues && allowClues != 'false') comp.push(
            new Dsc.ActionRowBuilder().addComponents(
                new Dsc.StringSelectMenuBuilder()
                    .setCustomId('p e')
                    .setPlaceholder('Clues')
                    .addOptions(
                        {
                            label: 'First letter',
                            value: 'First letter : ' + chosenName[0]
                        },
                        {
                            label: 'Last letter',
                            value: 'Last letter : ' + chosenName[chosenName.length - 1]
                        },
                        {
                            label: 'Random letter',
                            value: 'r ' + chosenName
                        },
                        {
                            label: 'Sex',
                            value: 'Sex of the name : ' + nameData.sex
                        },
                        {
                            label: 'Number of letters',
                            value: 'Number of letters : ' + chosenName.length
                        }
                    )
            )
        );
        if (allowAnswer && allowAnswer != 'false') comp.push(
            new Dsc.ActionRowBuilder().addComponents(
                new Dsc.ButtonBuilder().setLabel('Show answer').setStyle(Dsc.ButtonStyle.Secondary)
                    .setCustomId('p e The name is : ' + chosenName)
            )
        );

        return [chosenName, {
            fetchReply: true, files: [file], embeds: [
                {
                    title: 'Guess the name !',
                    url: 'https://floriangd.shinyapps.io/CartePrenoms/',
                    description: '_Game based on [this website](https://floriangd.shinyapps.io/CartePrenoms/)_',
                    color: client.color,
                    author: {
                        name: 'Games > Name-Map',
                        url: 'https://floriangd.shinyapps.io/CartePrenoms/'
                    },
                    image: {
                        url: 'attachment://file.jpg'
                    },
                    fields: [
                        {
                            name: 'Legend :',
                            value: thresholds.reduce((p, c, i) => p + `:${colorConvert.hex.keyword(colors[i])}_circle: : ${c}${mode == 'p' ? '%' : ' people'}\n`, ''),
                        },
                        {
                            name: 'Top departments :',
                            value: Array.from(deptVals).sort((a, b) => b[1] - a[1]).slice(0, 5).reduce((p, c) => {
                                return `${p}__Department ${c[0].slice(4)}__ : ${Math.round((c[1] + Number.EPSILON) * 10000) / 10000 + (mode == 'p' ? '%' : '')}\n`
                            }, ''),
                            inline: true
                        },
                        {
                            name: 'Top years :',
                            value: Array.from(yearVals).sort((a, b) => b[1] - a[1]).slice(0, 5).reduce((p, c) => {
                                return `${p}__${c[0].slice(4)}__ : ${Math.round((c[1] + Number.EPSILON) * 10000) / 10000 + (mode == 'p' ? '%' : '')}\n`
                            }, ''),
                            inline: true
                        }
                    ]
                },
                {
                    url: 'https://floriangd.shinyapps.io/CartePrenoms/',
                    image: {
                        url: chart
                    }
                }
            ],
            components: comp
        }]
    }
}