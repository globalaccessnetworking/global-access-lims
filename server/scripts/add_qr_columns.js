const { sequelize } = require('../models');

async function migrate() {
    try {
        console.log('Starting Migration: Adding QR Columns...');

        // 1. Update Chemicals
        await sequelize.query(`
            ALTER TABLE "Chemicals" 
            ADD COLUMN IF NOT EXISTS "qr_identity_string" VARCHAR(255) UNIQUE,
            ADD COLUMN IF NOT EXISTS "max_volume" FLOAT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "stock_alert_level" FLOAT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "unit_type" VARCHAR(50);
        `);
        console.log('✅ Chemicals table updated.');

        // 2. Update InventoryStocks
        await sequelize.query(`
            ALTER TABLE "InventoryStocks" 
            ADD COLUMN IF NOT EXISTS "qr_identity_string" VARCHAR(255) UNIQUE,
            ADD COLUMN IF NOT EXISTS "current_volume" FLOAT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "max_volume" FLOAT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "stock_alert_level" FLOAT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "unit_type" VARCHAR(50);
        `);
        console.log('✅ InventoryStocks table updated.');

        console.log('Migration Complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err.message);
        process.exit(1);
    }
}

migrate();
