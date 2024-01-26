const { QuickDB } = require('quick.db'), fs = require('fs'), CSV = require('csv-parse'), ms = require('ms');
const name = 'names', country = 'fr';

async function main() {
    const db = new QuickDB();
    const parser = fs
        .createReadStream(`./resources/geographical/${country}/${name}.csv`)
        .pipe(CSV.parse());
    await parse(db, parser, true);
}

async function parse(db, parser, first) {
    console.log('Start of update');
    const output = { };
    const startTime = Date.now();
    for await (const record of parser) {
        if (record[1].startsWith('_') || first) { first = false; continue; }
        let data = {
            year: parseInt(record[2]),
            nb: parseInt(record[4])
        }
        if(!output[record[1]]) output[record[1]] = { };
        output[record[1]][`dept${record[3]}`] = data;
    }
    await db.set(`${country}.${name}`, output);
    console.log(`Update finished\nFinal output : ${output}\nTime taken : ${formatTime(Date.now() - startTime)}`);
};

function formatTime(time){
    // MS
    var output = (time % 1000) + 'ms';
    time = Math.floor(time / 1000);
    if(!time) return output;

    // Seconds
    output = (time % 60) + 's ' + output;
    time = Math.floor(time / 60);
    if(!time) return output;

    // Minutes
    output = (time % 60) + 'm ' + output;
    time = Math.round(time / 60);
    if(!time) return output;

    // Hours
    output = (time % 24) + 'h ' + output;
    time = Math.round(time / 24);
    if(!time) return output;

    // Days
    output = time + 'd ' + output;
    return output;
}

main();