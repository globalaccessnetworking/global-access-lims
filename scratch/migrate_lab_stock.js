const path = require('path');
const dbPath = path.resolve('d:/Bacteriophage_LIMS/server/models');
const { sequelize } = require(dbPath);

async function main() {
    try {
        console.log("Starting migration: Adding 'barcode' column to 'ext_lab_stock'...");
        await sequelize.query('ALTER TABLE "ext_lab_stock" ADD COLUMN IF NOT EXISTS "barcode" VARCHAR(255)');
        console.log("MIGRATION SUCCESSFUL: 'barcode' column is now available in 'ext_lab_stock'.");
        process.exit(0);
    } catch (e) {
        console.error("MIGRATION FAILED:", e.message);
        process.exit(1);
    }
}

main();
