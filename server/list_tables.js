const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function listTables() {
    try {
        const results = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
            { type: Sequelize.QueryTypes.SELECT }
        );
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listTables();
