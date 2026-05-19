const path = require('path');
const dbPath = path.resolve('d:/Bacteriophage_LIMS/server/models');
const { sequelize } = require(dbPath);

async function check() {
    const tableName = process.argv[2] || 'ext_primers_details';
    try {
        const [results] = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 1`);
        if (results.length === 0) {
            console.log(`${tableName} table is empty.`);
            const [columns] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${tableName}'
            `);
            console.log(`${tableName} columns:`, columns.map(c => c.column_name));
        } else {
            console.log(`${tableName} columns:`, Object.keys(results[0]));
            console.log("Sample Record:", JSON.stringify(results[0], null, 2));
        }
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
check();
