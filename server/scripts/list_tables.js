const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function listTables() {
    try {
        const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        console.log(results.map(t => t.table_name).join('\n'));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

listTables();
