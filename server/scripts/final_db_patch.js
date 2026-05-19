const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log
});

async function finalAlter() {
    try {
        console.log("Adding final primer relational columns to BiologicalAssets...");
        await sequelize.query('ALTER TABLE "BiologicalAssets" ADD COLUMN IF NOT EXISTS "target_phage_id" INTEGER;');
        await sequelize.query('ALTER TABLE "BiologicalAssets" ADD COLUMN IF NOT EXISTS "target_plasmid_id" INTEGER;');
        console.log("Success.");
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

finalAlter();
