const { sequelize } = require('../models');
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const tableName = 'ext_lab_stock';
        const count = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`, {
            type: Sequelize.QueryTypes.SELECT
        });

        console.log(`Table [${tableName}] has ${count[0].count} rows.`);

        if (parseInt(count[0].count) === 347) {
            console.log("SUCCESS: Count matches expected 347.");
        } else {
            console.log("WARNING: Count does not match expected 347.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
