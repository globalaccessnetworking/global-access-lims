const path = require('path');
const dbPath = path.resolve('d:/Bacteriophage_LIMS/server/models');
const { sequelize } = require(dbPath);

async function listTables() {
    try {
        const [results] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log(results.map(t => t.table_name).join('\n'));
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
listTables();
