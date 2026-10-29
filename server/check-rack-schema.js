const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function check() {
    try {
        console.log('=== rack_locations schema ===');
        const desc = await sequelize.getQueryInterface().describeTable('rack_locations');
        console.log('Columns:', Object.keys(desc));
        console.log('Full desc:', desc);

        const rows = await sequelize.query(`SELECT * FROM rack_locations LIMIT 5`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Sample rows:', rows);
    } catch (e) {
        console.error(e);
    }
}

check();
