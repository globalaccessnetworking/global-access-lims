const { sequelize } = require('./models');

async function check() {
    try {
        const [strains] = await sequelize.query('SELECT * FROM "ext_bacterial_strains" LIMIT 1');
        console.log("STRAINS COLUMNS:", JSON.stringify(Object.keys(strains[0])));

        const [phages] = await sequelize.query('SELECT * FROM "ext_bacteriophages" LIMIT 1');
        console.log("PHAGES COLUMNS:", JSON.stringify(Object.keys(phages[0])));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
