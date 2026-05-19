const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function audit() {
    try {
        console.log("--- Phase 113-B Audit ---");
        
        // 1. Check Column
        const [cols] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'BiologicalAssets' AND column_name = 'against_species_id'
        `);
        console.log("Column 'against_species_id' exists:", cols.length > 0 ? "YES" : "NO");

        // 2. Check Strain Lookup
        const [strains] = await sequelize.query(`
            SELECT id, strain_number FROM "BiologicalAssets" WHERE "type" = 'Strain' LIMIT 5
        `);
        console.log("Strain lookup test (BiologicalAssets):", strains.length > 0 ? `Found ${strains.length} records. Example: ${strains[0].strain_number}` : "FAILED - No Strains Found");

        // 3. Check Phage Name Lookup
        const [phages] = await sequelize.query(`
            SELECT "ID", "Bacteriophage_Name" FROM "phage_names" LIMIT 1
        `);
        console.log("Phage Names lookup test:", phages.length > 0 ? "YES" : "NO");

        process.exit(0);
    } catch (err) {
        console.error("Audit Error:", err);
        process.exit(1);
    }
}

audit();
