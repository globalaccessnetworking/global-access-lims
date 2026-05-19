const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function checkLookup() {
    try {
        const [results] = await sequelize.query('SELECT * FROM "primer_binding_organism_types"');
        console.log(results);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

checkLookup();
