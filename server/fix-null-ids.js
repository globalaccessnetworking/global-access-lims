/**
 * Fix NULL ID records in Access-imported lookup tables.
 * 
 * Problem: When new items are added via the LIMS UI, some tables use uppercase "ID"
 * (imported from Microsoft Access). The old POST handler only checked for lowercase "id",
 * so the MAX("id") query failed silently, leaving the new rows with ID = NULL.
 * 
 * This script re-assigns valid sequential IDs to any rows that have NULL IDs.
 * 
 * Run with: node server/fix-null-ids.js
 */
const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

// All Access-imported lookup tables that use uppercase "ID"
const LOOKUP_TABLES = [
    'bacterial_species',
    'phage_names',
    'box_locations',
    'rack_locations',
    'freezer_locations',
    'wild_type_recomb_types',
    'lytic_lysogenic_types',
    'plasmid_vectors',
    'gene_sources',
    'cloning_methods',
    'manufacturers',
    'stock_categories',
    'chemical_storage_areas',
    'antibiotics',
    'primer_binding_organism_types',
    'available_antibiotic_discs',
];

async function fixNullIds() {
    console.log('=== Fix NULL IDs in Lookup Tables ===\n');

    for (const table of LOOKUP_TABLES) {
        try {
            // Detect whether table uses "ID" or "id"
            const desc = await sequelize.getQueryInterface().describeTable(table);
            const idColName = desc['ID'] ? '"ID"' : desc['id'] ? '"id"' : null;

            if (!idColName) {
                console.log(`  [SKIP] ${table}: No ID column found.`);
                continue;
            }

            // Count rows with NULL ID
            const nullCheck = await sequelize.query(
                `SELECT COUNT(*) as cnt FROM "${table}" WHERE ${idColName} IS NULL`,
                { type: Sequelize.QueryTypes.SELECT }
            );
            const nullCount = parseInt(nullCheck[0]?.cnt || 0);

            if (nullCount === 0) {
                console.log(`  [OK]   ${table}: No NULL IDs found.`);
                continue;
            }

            console.log(`  [FIX]  ${table}: Found ${nullCount} rows with NULL ${idColName}. Assigning IDs...`);

            // Get the current max ID
            const maxRes = await sequelize.query(
                `SELECT MAX(${idColName}) as maxid FROM "${table}" WHERE ${idColName} IS NOT NULL`,
                { type: Sequelize.QueryTypes.SELECT }
            );
            let nextId = parseInt(maxRes[0]?.maxid || 0) + 1;

            // Get all NULL-ID rows (we need their rowid/ctid to update them one by one)
            const nullRows = await sequelize.query(
                `SELECT ctid FROM "${table}" WHERE ${idColName} IS NULL ORDER BY ctid`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            for (const row of nullRows) {
                await sequelize.query(
                    `UPDATE "${table}" SET ${idColName} = $1 WHERE ctid = $2::tid`,
                    { bind: [nextId, row.ctid] }
                );
                console.log(`    → Assigned ID ${nextId} to ctid ${row.ctid}`);
                nextId++;
            }

            console.log(`  [DONE] ${table}: Fixed ${nullCount} rows.\n`);
        } catch (err) {
            console.log(`  [ERR]  ${table}: ${err.message}\n`);
        }
    }

    console.log('\n=== Done! All lookup tables have been checked and fixed. ===');
    process.exit(0);
}

fixNullIds().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
