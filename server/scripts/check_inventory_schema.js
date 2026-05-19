const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function checkSchema() {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'InventoryStocks' 
            ORDER BY ordinal_position;
        `);
        console.log("SCHEMA FOR InventoryStocks:");
        results.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
