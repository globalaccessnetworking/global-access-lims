const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log
});

async function alterTable() {
    try {
        console.log("Adding against_species_id to BiologicalAssets...");
        await sequelize.query('ALTER TABLE "BiologicalAssets" ADD COLUMN IF NOT EXISTS "against_species_id" INTEGER;');
        
        console.log("Database Schema updated for Phase 113-B.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
}

alterTable();
