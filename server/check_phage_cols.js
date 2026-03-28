const sequelize = require('./config/database');

async function checkCols() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'ext_bacteriophages';
        `);
        console.log(results.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkCols();
