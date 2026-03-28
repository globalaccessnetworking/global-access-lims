const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false
    }
);

async function verify() {
    try {
        const [results] = await sequelize.query('SELECT COUNT(*) FROM "InventoryStocks"');
        console.log(`InventoryStocks COUNT: ${results[0].count}`);

        try {
            const [bactResults] = await sequelize.query('SELECT COUNT(*) FROM "ext_bacterial_strains"');
            console.log(`Bacterial Strains COUNT: ${bactResults[0].count}`);
        } catch (e) {
            console.log('Bacterial Strains table not found or empty.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
verify();
