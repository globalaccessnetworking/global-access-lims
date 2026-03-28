const { sequelize } = require('./models');

async function check() {
    try {
        const [results] = await sequelize.query('SELECT * FROM "BiologicalAssets" ORDER BY id ASC LIMIT 5');
        console.log("LOW ID RECORDS:", JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
