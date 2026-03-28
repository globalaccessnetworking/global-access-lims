const { sequelize } = require('./models');

async function check() {
    try {
        const [results] = await sequelize.query('SELECT MIN(id) as min, MAX(id) as max, COUNT(*) as count FROM "BiologicalAssets"');
        console.log("RANGE:", results[0]);

        const [unkCheck] = await sequelize.query(`SELECT count(*) as count FROM "BiologicalAssets" WHERE strain_number NOT ILIKE 'UNK-%'`);
        console.log("NON-UNK COUNT:", unkCheck[0].count);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
