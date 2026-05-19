const { sequelize } = require('../server/models');
const { Sequelize } = require('sequelize');

async function check() {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'ext_bacteriophages' 
            AND table_schema = 'public'
        `);
        console.log("COLUMNS IN ext_bacteriophages:");
        results.forEach(r => console.log(`- ${r.column_name}`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
