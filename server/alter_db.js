const db = require('./models');

async function alterTables() {
    try {
        console.log("Altering BiologicalAssets...");
        await db.sequelize.query(`
            ALTER TABLE "BiologicalAssets"
            ADD COLUMN IF NOT EXISTS "species_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "wild_type_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "source_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "stock_category_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "phage_name_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "host_strain_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "lytic_type_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "plasmid_vector_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "gene_source_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "cloning_method_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "antibiotic_marker_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "manufacturer_id" INTEGER;
        `);

        console.log("Altering StorageLocations...");
        await db.sequelize.query(`
            ALTER TABLE "StorageLocations"
            ADD COLUMN IF NOT EXISTS "freezer_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "rack_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "box_id" INTEGER;
        `);

        console.log("Alterations successful.");
    } catch (err) {
        console.error("Error altering tables:", err.message);
    } finally {
        process.exit();
    }
}

alterTables();
