/**
 * One-time fix script: Syncs box_position_index for all ext_plasmids records.
 * box_position_index stores numeric box IDs as box_name.
 * Run with: node fix-slot-sync.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize, QueryTypes } = require('sequelize');

const sequelize = new Sequelize(
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
    { logging: false }
);

// box_position_index now stores DISPLAY NAMES - resolve numeric ID to display name
async function resolveBoxName(boxValue) {
    if (!boxValue) return null;
    const val = String(boxValue).trim();
    if (/^\d+$/.test(val)) {
        const rows = await sequelize.query(
            `SELECT "Box_detail" FROM box_locations WHERE "ID"::text = :v LIMIT 1`,
            { replacements: { v: val }, type: QueryTypes.SELECT }
        );
        if (rows.length > 0 && rows[0].Box_detail) return rows[0].Box_detail.trim();
        return null;
    }
    return val; // Already a display name
}

async function run() {
    console.log('Starting box_position_index sync for ext_plasmids...');
    
    const plasmids = await sequelize.query(
        `SELECT id, "Plasmid_Name", "Glycerol_Stock_Tube_Label", "Glycerol_Stock_Box", "Location_in_Box_GS" FROM ext_plasmids WHERE "Glycerol_Stock_Box" IS NOT NULL AND "Location_in_Box_GS" IS NOT NULL`,
        { type: QueryTypes.SELECT }
    );
    
    console.log(`Found ${plasmids.length} plasmid(s) with Glycerol Stock Box+Position data`);

    for (const p of plasmids) {
        // Clear old slot entries for this plasmid
        await sequelize.query(
            `UPDATE box_position_index SET is_occupied = false, asset_type = NULL, asset_id = NULL, asset_label = NULL, tube_label = NULL, source_table = NULL WHERE source_table = 'ext_plasmids' AND asset_id = :id`,
            { replacements: { id: p.id }, type: QueryTypes.UPDATE }
        );

        const boxKey = await resolveBoxName(p.Glycerol_Stock_Box);
        const pos = p.Location_in_Box_GS;

        if (!boxKey || !pos) {
            console.log(`  [SKIP] Plasmid ${p.id} (${p.Plasmid_Name}) - box: ${p.Glycerol_Stock_Box}, pos: ${pos}`);
            continue;
        }

        const normalizedPos = pos.trim().toUpperCase().replace(/[\s-]/g, '');
        
        // Check if the slot actually exists in box_position_index
        const existingSlot = await sequelize.query(
            `SELECT id FROM box_position_index WHERE box_name = :box AND position_code = :pos`,
            { replacements: { box: boxKey, pos: normalizedPos }, type: QueryTypes.SELECT }
        );
        
        if (!existingSlot.length) {
            console.log(`  [MISSING SLOT] Plasmid ${p.id} (${p.Plasmid_Name}) → box_key=${boxKey}, pos=${normalizedPos} NOT IN INDEX`);
            continue;
        }

        await sequelize.query(`
            UPDATE box_position_index 
            SET is_occupied = true, asset_type = 'plasmid', asset_id = :id, asset_label = :label, tube_label = :tube, source_table = 'ext_plasmids', conflict_flag = false, updated_at = NOW()
            WHERE box_name = :box AND position_code = :pos
        `, { replacements: { id: p.id, label: p.Plasmid_Name || '', tube: p.Glycerol_Stock_Tube_Label || '', box: boxKey, pos: normalizedPos }, type: QueryTypes.UPDATE });

        console.log(`  [OK] Plasmid ${p.id} (${p.Plasmid_Name}) → box_key=${boxKey}, Slot: ${normalizedPos}`);
    }

    console.log('\nDone! Please refresh the Box Matrix to see updated slots.');
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
