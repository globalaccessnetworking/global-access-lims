const { sequelize } = require('./models');

async function check() {
    try {
        const [results] = await sequelize.query(`SELECT count(*) as count FROM "ext_bacterial_strains" WHERE "Strain_No" ILIKE 'UNK-%'`);
        console.log("UNK COUNT IN EXT:", results[0].count);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
