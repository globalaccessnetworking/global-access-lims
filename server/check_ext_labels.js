const { sequelize } = require('./models');

async function check() {
    try {
        const [strains] = await sequelize.query('SELECT * FROM "ext_bacterial_strains" LIMIT 2');
        const [phages] = await sequelize.query('SELECT * FROM "ext_bacteriophages" LIMIT 2');
        console.log("STRAINS:", JSON.stringify(strains, null, 2));
        console.log("PHAGES:", JSON.stringify(phages, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
