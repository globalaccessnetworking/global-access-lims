const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('bacteriophage_lims', 'postgres', 'phagelabdrshafiq', { host: 'localhost', dialect: 'postgres', logging: false });

async function checkColumns() {
    const tables = ['ext_lab_tasks', 'ext_lab_stock', 'ext_bacterial_strains', 'ext_bacteriophages', 'ext_lab_projects'];
    console.log('--- DETAILED COLUMN AUDIT ---');
    for (const table of tables) {
        try {
            const [columns] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            console.log(`\n[${table.toUpperCase()}]:`);
            console.log(columns.map(c => c.column_name).join(', '));
        } catch (e) {
            console.error(`Error checking ${table}:`, e.message);
        }
    }
    await sequelize.close();
}

checkColumns();
