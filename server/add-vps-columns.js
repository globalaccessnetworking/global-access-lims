/**
 * Database Migration: Add missing columns to ext_lab_stock table.
 * Specifically: Stock_Image (for inventory photos) and Safety_Data_Sheet.
 * Run on VPS with: node add-vps-columns.js
 */
const { sequelize } = require('./models');

async function run() {
    console.log('Verifying and adding missing columns to ext_lab_stock...');

    try {
        await sequelize.query('ALTER TABLE ext_lab_stock ADD COLUMN IF NOT EXISTS "Stock_Image" TEXT;');
        console.log('  [OK] Stock_Image column verified/added successfully.');
    } catch (e) {
        console.error('  [ERROR] Failed to add Stock_Image:', e.message);
    }

    try {
        await sequelize.query('ALTER TABLE ext_lab_stock ADD COLUMN IF NOT EXISTS "Safety_Data_Sheet" TEXT;');
        console.log('  [OK] Safety_Data_Sheet column verified/added successfully.');
    } catch (e) {
        console.error('  [ERROR] Failed to add Safety_Data_Sheet:', e.message);
    }

    console.log('\nMigration complete!');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
