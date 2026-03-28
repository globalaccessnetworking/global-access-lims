const sequelize = require('./config/database');

async function checkData() {
    try {
        await sequelize.authenticate();
        const tables = ['ext_bacterial_strains', 'ext_bacteriophages', 'ext_primers'];

        for (const table of tables) {
            const [results] = await sequelize.query(`SELECT * FROM "${table}" LIMIT 1`);
            console.log(`\nTABLE: ${table}`);
            console.log(JSON.stringify(results[0], null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkData();
