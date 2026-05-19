const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log
});

async function alterInventoryTable() {
    try {
        console.log("Expanding InventoryStocks for Relational IDs...");
        
        await sequelize.query('ALTER TABLE "InventoryStocks" ADD COLUMN IF NOT EXISTS "manufacturer_id" INTEGER;');
        await sequelize.query('ALTER TABLE "InventoryStocks" ADD COLUMN IF NOT EXISTS "stock_category_id" INTEGER;');
        await sequelize.query('ALTER TABLE "InventoryStocks" ADD COLUMN IF NOT EXISTS "storage_area_id" INTEGER;');
        
        console.log("Database Schema updated for Phase 113-C/D.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
}

alterInventoryTable();
