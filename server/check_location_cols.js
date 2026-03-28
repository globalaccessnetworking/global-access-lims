const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function checkColumns() {
    try {
        await sequelize.authenticate();
        console.log("DB Connected.");

        const tables = ['ext_bacterial_strains', 'ext_bacteriophages', 'ext_primers_details'];

        for (const table of tables) {
            const cols = await sequelize.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`,
                { type: QueryTypes.SELECT }
            );
            console.log(`\n--- ${table} Columns ---`);
            console.log(cols.map(c => c.column_name).join(', '));
        }

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

checkColumns();
