/**
 * fix-strain-records-1657-1660-1661.js
 *
 * Step 1: Diagnose exact values stored and find correct IDs on THIS VPS.
 * Step 2: Print UPDATE SQL to fix corrupted strain records.
 * Step 3: Apply the fix.
 *
 * Run with: node fix-strain-records-1657-1660-1661.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.DB_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false }
});

async function main() {
    console.log('=================================================================');
    console.log(' VPS Database Fix — Corrupted Strain Records 1657, 1660, 1661');
    console.log('=================================================================\n');

    // ── Step 1: Show raw DB values for the 3 records ─────────────────────────
    const strains = await sequelize.query(
        `SELECT id, "Specie", "GS_Rack_Number", "GD_Rack_Number", "GS_Box_details", "GD_Box_detail", "GS_Freezer_Number", "GD_Freezer_Number"
         FROM ext_bacterial_strains
         WHERE id IN (1657, 1660, 1661)
         ORDER BY id DESC`,
        { type: Sequelize.QueryTypes.SELECT }
    );

    console.log('─── Raw DB values for the 3 corrupted strains ───');
    strains.forEach(r => {
        console.log(`\n  ID ${r.id}:`);
        console.log(`    Specie          = "${r.Specie}"`);
        console.log(`    GS_Rack_Number  = "${r.GS_Rack_Number}"`);
        console.log(`    GD_Rack_Number  = "${r.GD_Rack_Number}"`);
        console.log(`    GS_Box_details  = "${r.GS_Box_details}"`);
        console.log(`    GD_Box_detail   = "${r.GD_Box_detail}"`);
        console.log(`    GS_Freezer_Num  = "${r.GS_Freezer_Number}"`);
        console.log(`    GD_Freezer_Num  = "${r.GD_Freezer_Number}"`);
    });

    // ── Step 2: Show full lookup tables on VPS ────────────────────────────────
    const [allSpecies, allRacks, allBoxes] = await Promise.all([
        sequelize.query(`SELECT id, "Species" FROM bacterial_species ORDER BY id`, { type: Sequelize.QueryTypes.SELECT }),
        sequelize.query(`SELECT id, "Rack_No" FROM rack_locations ORDER BY id`, { type: Sequelize.QueryTypes.SELECT }),
        sequelize.query(`SELECT id, "Box_detail" FROM box_locations ORDER BY id`, { type: Sequelize.QueryTypes.SELECT }),
    ]);

    console.log('\n─── Full bacterial_species table (VPS) ───');
    allSpecies.forEach(s => console.log(`  id=${s.id}: "${s.Species}"`));

    console.log('\n─── Full rack_locations table (VPS) ───');
    allRacks.forEach(r => console.log(`  id=${r.id}: "${r.Rack_No}"`));

    console.log('\n─── box_locations table (VPS, first 30) ───');
    allBoxes.slice(0, 30).forEach(b => console.log(`  id=${b.id}: "${b.Box_detail}"`));

    // ── Step 3: Find correct IDs for the target values ────────────────────────
    const findId = (arr, labelKey, targetLabel) => {
        const match = arr.find(r => String(r[labelKey]).trim().toLowerCase() === targetLabel.toLowerCase().trim());
        return match ? String(match.id) : null;
    };

    const acinetobacterId  = findId(allSpecies, 'Species', 'Acinetobacter baumannii');
    const c2RackId         = findId(allRacks,   'Rack_No', 'C-2');
    const c3RackId         = findId(allRacks,   'Rack_No', 'C-3');
    const primerBoxA4Id    = findId(allBoxes,   'Box_detail', 'Primer Box-A4');
    const primerBoxA2Id    = findId(allBoxes,   'Box_detail', 'Primer Box-A2');

    console.log('\n─── Resolved IDs for target values ───');
    console.log(`  "Acinetobacter baumannii" → id = ${acinetobacterId ?? 'NOT FOUND'}`);
    console.log(`  "C-2" (rack)              → id = ${c2RackId ?? 'NOT FOUND'}`);
    console.log(`  "C-3" (rack)              → id = ${c3RackId ?? 'NOT FOUND'}`);
    console.log(`  "Primer Box-A4" (box)     → id = ${primerBoxA4Id ?? 'NOT FOUND'}`);
    console.log(`  "Primer Box-A2" (box)     → id = ${primerBoxA2Id ?? 'NOT FOUND'}`);

    if (!acinetobacterId) {
        console.log('\n⚠️  "Acinetobacter baumannii" not found in species table on this VPS!');
        console.log('   Check the spelling above and manually set the correct species ID.\n');
    }

    // ── Step 4: Apply fixes ───────────────────────────────────────────────────
    console.log('\n─── Applying fixes ───');

    let fixCount = 0;

    for (const row of strains) {
        const updates = {};

        // Fix Species if it's wrong (maps to "test3" or other junk)
        if (acinetobacterId && row.Specie !== acinetobacterId) {
            updates['Specie'] = acinetobacterId;
        }

        // Fix GS_Rack if it maps to "a" 
        if (c3RackId && row.GS_Rack_Number !== null && row.GS_Rack_Number !== '' && row.GS_Rack_Number !== c3RackId) {
            // Only fix if current value is clearly wrong (not a valid rack ID that we know)
            const currentRack = allRacks.find(r => String(r.id) === String(row.GS_Rack_Number));
            if (currentRack && ['a', 'b', 'c', 'ff', 'test', 'test2', 'test3'].includes(currentRack.Rack_No.toLowerCase().trim())) {
                updates['GS_Rack_Number'] = c3RackId;
            }
        }

        // Fix GD_Rack if it maps to junk
        if (row.id === 1661 && c2RackId) {
            const currentGdRack = allRacks.find(r => String(r.id) === String(row.GD_Rack_Number));
            if (!currentGdRack || ['a', 'b', 'c', 'ff', '222', 'test', 'test2', 'test3'].includes(String(row.GD_Rack_Number))) {
                updates['GD_Rack_Number'] = c2RackId;
            }
        }
        if (row.id === 1660 && c2RackId) {
            const currentGdRack = allRacks.find(r => String(r.id) === String(row.GD_Rack_Number));
            if (!currentGdRack || ['a', 'b', 'c', 'ff', '222', 'test', 'test2', 'test3'].includes(String(row.GD_Rack_Number))) {
                updates['GD_Rack_Number'] = c2RackId;
            }
        }

        if (Object.keys(updates).length === 0) {
            console.log(`  Strain ${row.id}: Nothing to fix.`);
            continue;
        }

        const setClauses = Object.entries(updates)
            .map(([col, val]) => `"${col}" = '${val}'`)
            .join(', ');

        const sql = `UPDATE ext_bacterial_strains SET ${setClauses} WHERE id = ${row.id}`;
        console.log(`\n  Fixing strain ${row.id}:`);
        console.log(`    SQL: ${sql}`);

        try {
            await sequelize.query(sql, { type: Sequelize.QueryTypes.UPDATE });
            console.log(`    ✅ Fixed!`);
            fixCount++;
        } catch (e) {
            console.log(`    ❌ Error: ${e.message}`);
        }
    }

    // ── Step 5: Verify ────────────────────────────────────────────────────────
    console.log('\n─── Verification after fix ───');
    const afterStrains = await sequelize.query(
        `SELECT id, "Specie", "GS_Rack_Number", "GD_Rack_Number" FROM ext_bacterial_strains WHERE id IN (1657, 1660, 1661) ORDER BY id DESC`,
        { type: Sequelize.QueryTypes.SELECT }
    );

    afterStrains.forEach(r => {
        const spName = allSpecies.find(s => String(s.id) === String(r.Specie))?.Species ?? r.Specie;
        const gsRack = allRacks.find(rk => String(rk.id) === String(r.GS_Rack_Number))?.Rack_No ?? r.GS_Rack_Number;
        const gdRack = allRacks.find(rk => String(rk.id) === String(r.GD_Rack_Number))?.Rack_No ?? r.GD_Rack_Number;
        console.log(`  Strain ${r.id}: Species="${spName}" | GS_Rack="${gsRack}" | GD_Rack="${gdRack}"`);
    });

    console.log(`\n✅ Done. ${fixCount} strain(s) updated.\n`);
    await sequelize.close();
}

main().catch(e => {
    console.error('Fatal error:', e.message);
    process.exit(1);
});
