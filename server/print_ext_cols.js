const { sequelize } = require('./models');

async function check() {
    try {
        const [strains] = await sequelize.query('SELECT * FROM "ext_bacterial_strains" LIMIT 1');
        const scols = Object.keys(strains[0]);
        console.log("STRAINS COLUMNS:");
        scols.forEach(c => console.log(` - ${c}`));

        const [phages] = await sequelize.query('SELECT * FROM "ext_bacteriophages" LIMIT 1');
        const pcols = Object.keys(phages[0]);
        console.log("PHAGES COLUMNS:");
        pcols.forEach(c => console.log(` - ${c}`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
