const { sequelize } = require('./models');

async function check() {
    try {
        const [results] = await sequelize.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_name ILIKE '%BiologicalAsset%'
        `);
        console.log("ACTUAL SCHEMA:", results);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
