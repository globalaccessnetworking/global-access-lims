const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function findTables() {
    try {
        const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const extTables = results.filter(t => t.table_name.startsWith('ext_')).map(t => t.table_name);
        console.log("External Tables (MS Access Imports):", extTables);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

findTables();
