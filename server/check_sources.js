const { sequelize } = require('./models');

async function check() {
    try {
        const [results] = await sequelize.query('SELECT DISTINCT source FROM "BiologicalAssets"');
        console.log("DISTINCT SOURCES:", results);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
