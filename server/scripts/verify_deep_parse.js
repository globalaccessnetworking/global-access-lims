const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../models');
const { Sequelize } = require('sequelize');

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Check Tables
        const tables = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ext_%';",
            { type: Sequelize.QueryTypes.SELECT }
        );

        console.log(`Found ${tables.length} dynamic tables.`);

        const tableNames = tables.map(t => {
            if (Array.isArray(t)) return t[0];
            return t.table_name;
        }).filter(t => t);

        if (tableNames.length > 0) console.log('First Table:', tableNames[0]);
        tableNames.forEach(t => console.log(` - ${t}`));

        // 2. Check Data in a specific table
        if (tableNames.length > 0) {
            const tableToTest = tableNames[0]; // e.g., ext_bacteriophages
            // Use table name which is already a string
            const count = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableToTest}"`, {
                type: Sequelize.QueryTypes.SELECT
            });
            console.log(`\nTable [${tableToTest}] has ${count[0].count} rows.`);

            const sample = await sequelize.query(`SELECT * FROM "${tableToTest}" LIMIT 1`, {
                type: Sequelize.QueryTypes.SELECT
            });
            console.log('Sample Row:', sample[0]);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
