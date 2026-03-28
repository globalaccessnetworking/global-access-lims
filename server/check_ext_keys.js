const sequelize = require('./config/database');

async function checkKeys() {
    try {
        await sequelize.authenticate();
        const tables = ['ext_bacterial_strains', 'ext_bacteriophages', 'ext_primers'];

        for (const table of tables) {
            const [results] = await sequelize.query(`SELECT * FROM "${table}" LIMIT 1`);
            if (results.length > 0) {
                console.log(`\nTABLE: ${table}`);
                console.log(Object.keys(results[0]).join(', '));
            } else {
                console.log(`\nTABLE: ${table} is empty.`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkKeys();
