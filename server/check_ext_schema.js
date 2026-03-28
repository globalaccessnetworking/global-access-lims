const sequelize = require('./config/database');

async function checkSchema() {
    try {
        await sequelize.authenticate();
        const tables = ['ext_bacterial_strains', 'ext_bacteriophages', 'ext_primers'];

        for (const table of tables) {
            const [results] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}';
            `);
            console.log(`\nTABLE: ${table}`);
            console.log(results.map(r => r.column_name).join(', '));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
