const sequelize = require('./config/database');
const fs = require('fs');
const path = require('path');

async function listTables() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        const tableNames = results.map(r => r.table_name);
        fs.writeFileSync(path.join(__dirname, 'all_tables.txt'), tableNames.join('\n'));
        console.log("Written to all_tables.txt");

        // Also try to get columns for ext_ tables
        let schemaInfo = "";
        for (const t of tableNames) {
            if (t.startsWith('ext_') || t.includes('Primer') || t.includes('Phage')) {
                const [cols] = await sequelize.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '${t}';
                `);
                schemaInfo += `\nTABLE: ${t}\n`;
                schemaInfo += cols.map(c => `${c.column_name} (${c.data_type})`).join(', ') + "\n";
            }
        }
        fs.appendFileSync(path.join(__dirname, 'all_tables.txt'), schemaInfo);

    } catch (e) {
        console.error(e);
        fs.writeFileSync(path.join(__dirname, 'all_tables_error.txt'), e.toString());
    } finally {
        await sequelize.close();
    }
}

listTables();
