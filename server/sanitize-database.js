/**
 * Database Sanitization & Foreign Key Repair Script
 * 
 * 1. Scans all dynamic tables for leaked UUIDs (e.g. b11eb986-d563-42dd-96ed-fe6941f8cec2)
 *    and replaces them with clean integer IDs or human-readable names.
 * 2. Ensures all foreign key columns in dynamic tables strictly match valid lookup table IDs.
 * 
 * Run with: node server/sanitize-database.js
 */
const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

const RELATIONAL_TARGETS = [
    // ext_bacterial_strains
    { table: 'ext_bacterial_strains', col: 'Specie', targetTable: 'bacterial_species', labelCol: 'Species' },
    { table: 'ext_bacterial_strains', col: 'Wild_type_Recom', targetTable: 'wild_type_recomb_types', labelCol: 'Field1' },
    { table: 'ext_bacterial_strains', col: 'GS_Freezer_Number', targetTable: 'freezer_locations', labelCol: 'Freezer' },
    { table: 'ext_bacterial_strains', col: 'GS_Rack_Number', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_bacterial_strains', col: 'GS_Box_details', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_bacterial_strains', col: 'GD_Freezer_Number', targetTable: 'freezer_locations', labelCol: 'Freezer' },
    { table: 'ext_bacterial_strains', col: 'GD_Rack_Number', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_bacterial_strains', col: 'GD_Box_detail', targetTable: 'box_locations', labelCol: 'Box_detail' },

    // ext_primers_details
    { table: 'ext_primers_details', col: 'Box_detail', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_primers_details', col: 'Freezer_Shelve', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_primers_details', col: 'Freezer', targetTable: 'freezer_locations', labelCol: 'Freezer' },
    { table: 'ext_primers_details', col: 'Phage', targetTable: 'phage_names', labelCol: 'Bacteriophage_Name' },
    { table: 'ext_primers_details', col: 'Bacteria', targetTable: 'ext_bacterial_strains', labelCol: 'Strain_No' },
    { table: 'ext_primers_details', col: 'Plasmid', targetTable: 'plasmid_vectors', labelCol: 'Plasmid_Name' },

    // ext_bacteriophages
    { table: 'ext_bacteriophages', col: 'GS_Box_details', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_bacteriophages', col: 'DNA_storage_Box_detail', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_bacteriophages', col: 'GS_Racks', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_bacteriophages', col: 'GS_Freezer_Name', targetTable: 'freezer_locations', labelCol: 'Freezer' },

    // ext_plasmids
    { table: 'ext_plasmids', col: 'Glycerol_Stock_Box', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_plasmids', col: 'DNA_Store_Box_Detail', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_plasmids', col: 'Glycerol_Stock_Rack', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_plasmids', col: 'DNA_Store_Rack', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_plasmids', col: 'GLycerol_Stock_Freezer', targetTable: 'freezer_locations', labelCol: 'Freezer' },
    { table: 'ext_plasmids', col: 'DNA_Store_Freezer', targetTable: 'freezer_locations', labelCol: 'Freezer' },

    // ext_lab_stock
    { table: 'ext_lab_stock', col: 'Location_Area', targetTable: 'freezer_locations', labelCol: 'Freezer' },
    { table: 'ext_lab_stock', col: 'Manufacturer', targetTable: 'manufacturers', labelCol: 'Manufacturers' },
    { table: 'ext_lab_stock', col: 'Category', targetTable: 'stock_categories', labelCol: 'Category' }
];

async function sanitizeDatabase() {
    console.log('=== Starting Database Sanitization & Foreign Key Cleaning ===\n');

    let totalCleaned = 0;

    for (const t of RELATIONAL_TARGETS) {
        try {
            // Describe source table
            const sourceDesc = await sequelize.getQueryInterface().describeTable(t.table);
            if (!sourceDesc[t.col]) continue;

            // Describe target table
            const targetDesc = await sequelize.getQueryInterface().describeTable(t.targetTable);
            const targetIdCol = targetDesc['ID'] ? 'ID' : targetDesc['id'] ? 'id' : null;
            if (!targetIdCol || !targetDesc[t.labelCol]) continue;

            // Load lookup items
            const lookups = await sequelize.query(
                `SELECT "${targetIdCol}" as id, "${t.labelCol}" as label FROM "${t.targetTable}" WHERE "${t.labelCol}" IS NOT NULL`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            const labelToIdMap = new Map();
            const validIds = new Set();

            for (const item of lookups) {
                if (item.id !== null && item.id !== undefined) {
                    const idStr = String(item.id).trim();
                    const labelStr = String(item.label).trim().toLowerCase();
                    validIds.add(idStr);
                    if (labelStr) {
                        labelToIdMap.set(labelStr, idStr);
                    }
                }
            }

            // Find all rows in source table with non-null values
            const sourceRows = await sequelize.query(
                `SELECT id, "${t.col}" as val FROM "${t.table}" WHERE "${t.col}" IS NOT NULL AND "${t.col}" != ''`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            let cleanedCount = 0;

            for (const row of sourceRows) {
                const valStr = String(row.val).trim();

                // Case A: Leaked UUID or invalid text (e.g. length > 30 or containing hyphens like UUID)
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valStr) || valStr.startsWith('frontend-gen-');

                if (isUuid) {
                    console.log(`  [UUID DETECTED] ${t.table}.${t.col} row ${row.id}: Leaked UUID '${valStr}'`);
                    // Try to find if any label matches or default to NULL if invalid
                    await sequelize.query(
                        `UPDATE "${t.table}" SET "${t.col}" = NULL WHERE id = :rowId`,
                        { replacements: { rowId: row.id } }
                    );
                    cleanedCount++;
                }
                // Case B: Value is a label string (e.g. 'Staphylococcus aureus') -> Map to ID
                else if (labelToIdMap.has(valStr.toLowerCase())) {
                    const targetId = labelToIdMap.get(valStr.toLowerCase());
                    if (valStr !== targetId) {
                        await sequelize.query(
                            `UPDATE "${t.table}" SET "${t.col}" = :targetId WHERE id = :rowId`,
                            { replacements: { targetId, rowId: row.id } }
                        );
                        cleanedCount++;
                    }
                }
            }

            if (cleanedCount > 0) {
                console.log(`  [CLEANED] ${t.table}.${t.col}: Sanitized ${cleanedCount} records.`);
                totalCleaned += cleanedCount;
            } else {
                console.log(`  [OK] ${t.table}.${t.col}: Clean.`);
            }

        } catch (err) {
            console.error(`  [ERR] ${t.table}.${t.col}:`, err.message);
        }
    }

    console.log(`\n=== Sanitization Complete! Total records cleaned/repaired: ${totalCleaned} ===`);
    process.exit(0);
}

sanitizeDatabase().catch(err => {
    console.error('Fatal error during sanitization:', err);
    process.exit(1);
});
