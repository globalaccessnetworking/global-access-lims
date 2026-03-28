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
        await sequelize.authenticate();
        const [results] = await sequelize.query('SELECT COUNT(*) FROM "InventoryStocks"');
        console.log(`InventoryStocks Count: ${results[0].count}`);

        const [results2] = await sequelize.query('SELECT * FROM "InventoryStocks" LIMIT 1');
        console.log('Sample Item:', results2[0]);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
verify();
