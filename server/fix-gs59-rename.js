/**
 * One-time fix: Rename "GS59" → "GS-59" everywhere.
 * Run this ONCE on the VPS after git pull to recover the lost tubes.
 * Usage: node server/fix-gs59-rename.js
 */
const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');

const OLD_NAME = 'GS59';
const NEW_NAME = 'GS-59';

async function fixGS59() {
    console.log(`\n=== ONE-TIME FIX: Renaming "${OLD_NAME}" → "${NEW_NAME}" ===\n`);

    try {
        // 1. Fix box_position_index
        const bpiResult = await sequelize.query(
            `UPDATE box_position_index SET box_name = :newName, updated_at = CURRENT_TIMESTAMP WHERE box_name = :oldName`,
            { replacements: { newName: NEW_NAME, oldName: OLD_NAME }, type: QueryTypes.UPDATE }
        );
        console.log(`box_position_index: ${bpiResult[1]} slot(s) updated`);

        // 2. Fix ext_bacterial_strains (GS box column)
        const s1 = await sequelize.query(
            `UPDATE ext_bacterial_strains SET "GS_Box_details" = :newName WHERE "GS_Box_details"::text = :oldName`,
            { replacements: { newName: NEW_NAME, oldName: OLD_NAME }, type: QueryTypes.UPDATE }
        );
        console.log(`ext_bacterial_strains.GS_Box_details: ${s1[1]} row(s) updated`);

        // 3. Fix ext_bacterial_strains (GD box column)
        const s2 = await sequelize.query(
            `UPDATE ext_bacterial_strains SET "GD_Box_detail" = :newName WHERE "GD_Box_detail"::text = :oldName`,
            { replacements: { newName: NEW_NAME, oldName: OLD_NAME }, type: QueryTypes.UPDATE }
        );
        console.log(`ext_bacterial_strains.GD_Box_detail: ${s2[1]} row(s) updated`);

        // 4. Fix ext_bacteriophages (GS box column)
        const p1 = await sequelize.query(
            `UPDATE ext_bacteriophages SET "GS_Box_details" = :newName WHERE "GS_Box_details"::text = :oldName`,
            { replacements: { newName: NEW_NAME, oldName: OLD_NAME }, type: QueryTypes.UPDATE }
        );
        console.log(`ext_bacteriophages.GS_Box_details: ${p1[1]} row(s) updated`);

        // 5. Fix ext_bacteriophages (DNA box column)
        const p2 = await sequelize.query(
            `UPDATE ext_bacteriophages SET "DNA_storage_Box_detail" = :newName WHERE "DNA_storage_Box_detail"::text = :oldName`,
            { replacements: { newName: NEW_NAME, oldName: OLD_NAME }, type: QueryTypes.UPDATE }
        );
        console.log(`ext_bacteriophages.DNA_storage_Box_detail: ${p2[1]} row(s) updated`);

        // 6. Fix ext_plasmids
        const pl1 = await sequelize.query(
            `UPDATE ext_plasmids SET "Glycerol_Stock_Box" = :newName WHERE "Glycerol_Stock_Box"::text = :oldName`,
            { replacements: { newName: NEW_NAME, oldName: OLD_NAME }, type: QueryTypes.UPDATE }
        );
        console.log(`ext_plasmids.Glycerol_Stock_Box: ${pl1[1]} row(s) updated`);

        const pl2 = await sequelize.query(
            `UPDATE ext_plasmids SET "DNA_Store_Box_Detail" = :newName WHERE "DNA_Store_Box_Detail"::text = :oldName`,
            { replacements: { newName: NEW_NAME, oldName: OLD_NAME }, type: QueryTypes.UPDATE }
        );
        console.log(`ext_plasmids.DNA_Store_Box_Detail: ${pl2[1]} row(s) updated`);

        // 7. Fix ext_primers_details
        const pr1 = await sequelize.query(
            `UPDATE ext_primers_details SET "Box_detail" = :newName WHERE "Box_detail"::text = :oldName`,
            { replacements: { newName: NEW_NAME, oldName: OLD_NAME }, type: QueryTypes.UPDATE }
        );
        console.log(`ext_primers_details.Box_detail: ${pr1[1]} row(s) updated`);

        // 8. Also fix any numeric references: find the numeric id of GS-59 in box_locations
        const boxRow = await sequelize.query(
            `SELECT id, "ID" FROM box_locations WHERE "Box_detail" = :name LIMIT 1`,
            { replacements: { name: NEW_NAME }, type: QueryTypes.SELECT }
        );
        if (boxRow.length > 0) {
            const numericId = String(boxRow[0].id || boxRow[0].ID || '');
            console.log(`\nBox "${NEW_NAME}" has numeric id=${numericId}. Checking for numeric references...`);
            
            // Fix any records that still store the numeric ID
            const s3 = await sequelize.query(
                `UPDATE ext_bacterial_strains SET "GS_Box_details" = :newName WHERE "GS_Box_details"::text = :numId`,
                { replacements: { newName: NEW_NAME, numId: numericId }, type: QueryTypes.UPDATE }
            );
            if (s3[1] > 0) console.log(`ext_bacterial_strains.GS_Box_details (numeric): ${s3[1]} row(s) fixed`);
        }

        console.log(`\n✅ FIX COMPLETE! "${OLD_NAME}" → "${NEW_NAME}" cascade done.`);
        console.log(`   Please restart the backend: pm2 restart all\n`);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

fixGS59();
