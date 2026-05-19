const fs = require('fs');
const path = require('path');
const dbPath = path.resolve('d:/Bacteriophage_LIMS/server/models');
const { sequelize } = require(dbPath);

async function runSQL() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error("Usage: node run_sql.js <path_to_sql_file>");
        process.exit(1);
    }

    try {
        const sql = fs.readFileSync(sqlFile, 'utf8');
        console.log(`Executing SQL from ${sqlFile}...`);
        
        // Split by semicolon to execute one by one if needed, 
        // but for simple create table, multi-query might work depending on driver.
        // We'll use simple query.
        await sequelize.query(sql);
        
        console.log("SQL executed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("SQL Execution Error:", err.message);
        process.exit(1);
    }
}

runSQL();
