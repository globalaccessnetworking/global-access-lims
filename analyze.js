const { Sequelize } = require('sequelize');
const db = require('./server/models');

async function analyzeTables() {
    const tablesRaw = await db.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' AND table_name LIKE 'ext_%'
    `, { type: Sequelize.QueryTypes.SELECT });

    const tables = tablesRaw.map(t => t.table_name);
    let output = '';

    for (const table of tables) {
        const cols = await db.sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name='${table}'
        `, { type: Sequelize.QueryTypes.SELECT });

        output += `\n--- ${table} ---\n`;
        cols.forEach(c => {
            output += `${c.column_name} (${c.data_type})\n`;
        });
    }

    const fs = require('fs');
    fs.writeFileSync('./table_analysis.txt', output);
    console.log('Done mapping columns');
}

analyzeTables();
