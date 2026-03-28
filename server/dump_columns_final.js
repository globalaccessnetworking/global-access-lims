const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');
const fs = require('fs');

async function checkColumns() {
    try {
        await sequelize.authenticate();
        let output = "";
        const tables = ['ext_bacterial_strains', 'ext_bacteriophages', 'ext_primers_details'];

        for (const table of tables) {
            const cols = await sequelize.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`,
                { type: QueryTypes.SELECT }
            );
            output += `\n--- ${table} Columns ---\n`;
            output += cols.map(c => c.column_name).join(', ') + "\n";
        }

        fs.writeFileSync('d:/Bacteriophage_LIMS/server/columns_dump.txt', output);
        console.log("Dumped to columns_dump.txt");

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

checkColumns();
