/**
 * Master Relational Foreign Key Migration Script
 * 
 * Synchronizes and repairs foreign keys across all dynamic tables
 * (ext_primers_details, ext_bacterial_strains, ext_bacteriophages, ext_plasmids, ext_lab_stock, ext_host_bacteria).
 * 
 * Maps stored text names (e.g. 'Primer Box-A4') to newly assigned integer IDs (e.g. 101)
 * in lookup tables (box_locations, rack_locations, freezer_locations, etc.).
 * 
 * Run with: node server/migrate-foreign-keys.js
 */
const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

const RELATIONAL_MAPPINGS = [
    // ext_primers_details
    { table: 'ext_primers_details', col: 'Box_detail', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_primers_details', col: 'Freezer_Shelve', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_primers_details', col: 'Freezer', targetTable: 'freezer_locations', labelCol: 'Freezer' },

    // ext_bacterial_strains
    { table: 'ext_bacterial_strains', col: 'GS_Box_details', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_bacterial_strains', col: 'GD_Box_detail', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_bacterial_strains', col: 'GS_Rack_Number', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_bacterial_strains', col: 'GD_Rack_Number', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_bacterial_strains', col: 'GS_Freezer_Number', targetTable: 'freezer_locations', labelCol: 'Freezer' },
    { table: 'ext_bacterial_strains', col: 'GD_Freezer_Number', targetTable: 'freezer_locations', labelCol: 'Freezer' },
    { table: 'ext_bacterial_strains', col: 'Specie', targetTable: 'bacterial_species', labelCol: 'Species' },

    // ext_bacteriophages
    { table: 'ext_bacteriophages', col: 'GS_Box_details', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_bacteriophages', col: 'DNA_storage_Box_detail', targetTable: 'box_locations', labelCol: 'Box_detail' },
    { table: 'ext_bacteriophages', col: 'GS_Racks', targetTable: 'rack_locations', labelCol: 'Rack_No' },
    { table: 'ext_bacteriophages', col: 'GS_Freezer_Name', targetTable: 'freezer_locations', labelCol: 'Freezer' },
    { table: 'ext_bacteriophages', col: 'Host_Name', targetTable: 'bacterial_species', labelCol: 'Species' },

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

async function migrateForeignKeys() {
    console.log('=== Starting Master Relational Foreign Key Migration ===\n');

    let totalUpdated = 0;

    for (const m of RELATIONAL_MAPPINGS) {
        try {
            // Check if column exists in table
            const tableDesc = await sequelize.getQueryInterface().describeTable(m.table);
            if (!tableDesc[m.col]) {
                console.log(`  [SKIP] Column "${m.col}" does not exist in table "${m.table}".`);
                continue;
            }

            // Check if target table and label column exist
            const targetDesc = await sequelize.getQueryInterface().describeTable(m.targetTable);
            const targetIdCol = targetDesc['ID'] ? 'ID' : targetDesc['id'] ? 'id' : null;
            if (!targetIdCol || !targetDesc[m.labelCol]) {
                console.log(`  [SKIP] Target lookup "${m.targetTable}" column check failed.`);
                continue;
            }

            // Load lookup dictionary (Label -> ID and ID -> Label)
            const lookups = await sequelize.query(
                `SELECT "${targetIdCol}" as id, "${m.labelCol}" as label FROM "${m.targetTable}" WHERE "${m.labelCol}" IS NOT NULL`,
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

            // Query non-null rows from the source table
            const sourceRows = await sequelize.query(
                `SELECT id, "${m.col}" as val FROM "${m.table}" WHERE "${m.col}" IS NOT NULL AND "${m.col}" != ''`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            let columnUpdates = 0;

            for (const row of sourceRows) {
                const valStr = String(row.val).trim();
                const valLower = valStr.toLowerCase();

                // Case 1: Value is a string name (e.g. 'Primer Box-A4') that matches a label in lookup table
                if (labelToIdMap.has(valLower)) {
                    const targetId = labelToIdMap.get(valLower);
                    if (valStr !== targetId) {
                        await sequelize.query(
                            `UPDATE "${m.table}" SET "${m.col}" = :targetId WHERE id = :rowId`,
                            { replacements: { targetId, rowId: row.id } }
                        );
                        columnUpdates++;
                    }
                }
            }

            if (columnUpdates > 0) {
                console.log(`  [UPDATED] ${m.table}.${m.col}: Migrated ${columnUpdates} text values to integer lookup IDs.`);
                totalUpdated += columnUpdates;
            } else {
                console.log(`  [OK] ${m.table}.${m.col}: All values are aligned with lookup IDs.`);
            }

        } catch (err) {
            console.error(`  [ERROR] ${m.table}.${m.col}:`, err.message);
        }
    }

    console.log(`\n=== Migration Complete! Total FK references repaired: ${totalUpdated} ===`);
    process.exit(0);
}

migrateForeignKeys().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
