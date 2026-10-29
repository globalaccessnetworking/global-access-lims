/**
 * DIAGNOSTIC: Check the actual sync state across ALL tables
 * Run: node server/diagnose-sync.js
 */
const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');

async function diagnose() {
    console.log('\n========== BOX SYNC DIAGNOSTICS ==========\n');

    // 1. Check recent records in each data table that HAVE location data
    const tables = [
        {
            name: 'ext_bacterial_strains',
            labelCol: 'Strain_No',
            boxCols: ['GS_Box_details', 'GD_Box_detail'],
            posCols:  ['Location_in_Box_GS', 'Loction_in_Box_PD'],
        },
        {
            name: 'ext_bacteriophages',
            labelCol: 'Glycerol_Stock_tube_Label',
            boxCols: ['GS_Box_details', 'DNA_storage_Box_detail'],
            posCols:  ['GS_position_in_Box', '_4C_Position_in_box'],
        },
        {
            name: 'ext_plasmids',
            labelCol: 'Plasmid_Name',
            boxCols: ['Glycerol_Stock_Box', 'DNA_Store_Box_Detail'],
            posCols:  ['Location_in_Box_GS', 'Location_in_Box_GS'],
        },
        {
            name: 'ext_primers_details',
            labelCol: 'Primer_Name',
            boxCols: ['Box_detail'],
            posCols:  ['Location_in_Box'],
        },
    ];

    for (const t of tables) {
        console.log(`\n--- Table: ${t.name} ---`);

        // Count records with location data
        const boxCol = t.boxCols[0];
        const posCol = t.posCols[0];
        const withLoc = await sequelize.query(
            `SELECT COUNT(*) as total FROM "${t.name}" WHERE "${boxCol}" IS NOT NULL AND TRIM("${boxCol}") != ''`,
            { type: QueryTypes.SELECT }
        ).catch(() => [{ total: 'ERROR' }]);
        console.log(`  Records with location data (${boxCol}): ${withLoc[0].total}`);

        // Count records in box_position_index for this table
        const indexed = await sequelize.query(
            `SELECT COUNT(*) as total FROM box_position_index WHERE source_table = '${t.name}' AND is_occupied = true`,
            { type: QueryTypes.SELECT }
        ).catch(() => [{ total: 'ERROR' }]);
        console.log(`  Indexed in box_position_index: ${indexed[0].total}`);

        // Find records that HAVE location data but are NOT in box_position_index
        const missingQ = await sequelize.query(
            `SELECT id, "${t.labelCol}", "${boxCol}", "${posCol}" 
             FROM "${t.name}" 
             WHERE "${boxCol}" IS NOT NULL AND TRIM("${boxCol}") != ''
               AND id NOT IN (
                   SELECT asset_id FROM box_position_index 
                   WHERE source_table = '${t.name}' AND is_occupied = true
               )
             ORDER BY id DESC LIMIT 10`,
            { type: QueryTypes.SELECT }
        ).catch(e => { console.log('  Error:', e.message); return []; });

        if (missingQ.length > 0) {
            console.log(`  ⚠️  ${missingQ.length} records WITH location data NOT in box_position_index (showing up to 10):`);
            missingQ.forEach(r => {
                console.log(`     id=${r.id} label="${r[t.labelCol]}" box="${r[boxCol]}" pos="${r[posCol]}"`);
            });
        } else {
            console.log(`  ✅ All located records appear to be indexed`);
        }
    }

    // 2. Check for box_name values in box_position_index that don't exist in box_locations
    console.log('\n--- Orphaned box_names in box_position_index ---');
    const orphaned = await sequelize.query(
        `SELECT DISTINCT box_name FROM box_position_index 
         WHERE is_occupied = true
           AND box_name NOT IN (SELECT COALESCE("Box_detail",'') FROM box_locations)
         ORDER BY box_name`,
        { type: QueryTypes.SELECT }
    ).catch(() => []);
    if (orphaned.length > 0) {
        console.log('  ⚠️  These box_names in box_position_index have NO matching entry in box_locations:');
        orphaned.forEach(r => console.log(`     "${r.box_name}"`));
    } else {
        console.log('  ✅ All box_names are valid');
    }

    // 3. Check for data records storing NUMERIC IDs instead of display names
    console.log('\n--- Records storing numeric box IDs (not display names) ---');
    const numericBoxes = await sequelize.query(
        `SELECT 'ext_bacterial_strains' as tbl, id, "Strain_No" as label, "GS_Box_details" as box
         FROM ext_bacterial_strains 
         WHERE "GS_Box_details" ~ '^[0-9]+$'
         UNION ALL
         SELECT 'ext_bacteriophages', id, "Glycerol_Stock_tube_Label", "GS_Box_details"
         FROM ext_bacteriophages
         WHERE "GS_Box_details" ~ '^[0-9]+$'
         UNION ALL
         SELECT 'ext_plasmids', id, "Plasmid_Name", "Glycerol_Stock_Box"
         FROM ext_plasmids
         WHERE "Glycerol_Stock_Box" ~ '^[0-9]+$'
         ORDER BY tbl, id DESC LIMIT 20`,
        { type: QueryTypes.SELECT }
    ).catch(() => []);
    
    if (numericBoxes.length > 0) {
        console.log(`  ⚠️  ${numericBoxes.length} records still store NUMERIC box IDs (not display names):`);
        numericBoxes.forEach(r => console.log(`     ${r.tbl} id=${r.id} label="${r.label}" box_id="${r.box}"`));
    } else {
        console.log('  ✅ No records with numeric box IDs found');
    }

    // 4. Check most recent 5 entries in each table vs their box_position_index status
    console.log('\n--- Last 5 entries per table vs box sync status ---');
    for (const t of tables) {
        const last5 = await sequelize.query(
            `SELECT s.id, s."${t.labelCol}" as label, s."${t.boxCols[0]}" as box, s."${t.posCols[0]}" as pos,
                    b.is_occupied, b.box_name as indexed_box
             FROM "${t.name}" s
             LEFT JOIN box_position_index b ON b.source_table = '${t.name}' AND b.asset_id = s.id AND b.is_occupied = true
             ORDER BY s.id DESC LIMIT 5`,
            { type: QueryTypes.SELECT }
        ).catch(() => []);
        console.log(`\n  ${t.name} (last 5):`);
        last5.forEach(r => {
            const synced = r.is_occupied ? '✅' : (r.box ? '❌ NOT SYNCED' : '— no location');
            console.log(`    id=${r.id} "${r.label}" box="${r.box}" pos="${r.pos}" → ${synced} (indexed_box="${r.indexed_box}")`);
        });
    }

    console.log('\n========== END DIAGNOSTICS ==========\n');
    await sequelize.close();
}

diagnose().catch(console.error);
