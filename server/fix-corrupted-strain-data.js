/**
 * fix-corrupted-strain-data.js
 * 
 * Diagnoses and reports strain records that have non-numeric/invalid values 
 * stored in relational fields (Species, Rack, Box, Freezer).
 * 
 * Run with: node fix-corrupted-strain-data.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.DB_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false }
});

async function main() {
    console.log('=== Diagnosing Corrupted Strain Records ===\n');

    // Load all lookup dictionaries
    const [species, racks, boxes, freezers] = await Promise.all([
        sequelize.query(`SELECT id, "ID", "Species" FROM bacterial_species ORDER BY id`, { type: Sequelize.QueryTypes.SELECT }),
        sequelize.query(`SELECT id, "ID", "Rack_No" FROM rack_locations ORDER BY id`, { type: Sequelize.QueryTypes.SELECT }),
        sequelize.query(`SELECT id, "ID", "Box_detail" FROM box_locations ORDER BY id`, { type: Sequelize.QueryTypes.SELECT }),
        sequelize.query(`SELECT id, "ID", "Freezer" FROM freezer_locations ORDER BY id`, { type: Sequelize.QueryTypes.SELECT }),
    ]);

    // Build label→id maps for fixing
    const speciesLabelToId = {};
    const rackLabelToId = {};
    const boxLabelToId = {};
    const freezerLabelToId = {};

    const speciesIdToLabel = {};
    const rackIdToLabel = {};
    const boxIdToLabel = {};
    const freezerIdToLabel = {};

    species.forEach(r => {
        speciesLabelToId[r.Species.toLowerCase().trim()] = String(r.id);
        speciesIdToLabel[String(r.id)] = r.Species;
        speciesIdToLabel[String(r.ID)] = r.Species;
    });
    racks.forEach(r => {
        rackLabelToId[r.Rack_No.toLowerCase().trim()] = String(r.id);
        rackIdToLabel[String(r.id)] = r.Rack_No;
        rackIdToLabel[String(r.ID)] = r.Rack_No;
    });
    boxes.forEach(r => {
        boxLabelToId[r.Box_detail.toLowerCase().trim()] = String(r.id);
        boxIdToLabel[String(r.id)] = r.Box_detail;
        boxIdToLabel[String(r.ID)] = r.Box_detail;
    });
    freezers.forEach(r => {
        freezerLabelToId[r.Freezer.toLowerCase().trim()] = String(r.id);
        freezerIdToLabel[String(r.id)] = r.Freezer;
        freezerIdToLabel[String(r.ID)] = r.Freezer;
    });

    // Fetch all strain records
    const strains = await sequelize.query(
        `SELECT id, "Specie", "GS_Rack_Number", "GD_Rack_Number", "GS_Box_details", "GD_Box_detail", "GS_Freezer_Number", "GD_Freezer_Number" 
         FROM ext_bacterial_strains ORDER BY id DESC LIMIT 200`,
        { type: Sequelize.QueryTypes.SELECT }
    );

    const isValidId = (val, dict) => val && dict[String(val).trim()];
    const isJunk = (val) => {
        if (!val || String(val).trim() === '') return false;
        const s = String(val).trim().toLowerCase();
        return ['test', 'test2', 'test3', 'test4', 'ff', 'gg', 'hh', 'tt', 'aa', 'bb', 'cc', 'a', 'b', 'c'].includes(s);
    };

    const corrupted = [];

    strains.forEach(row => {
        const issues = [];

        const spLabel = speciesIdToLabel[String(row.Specie)] || row.Specie;
        const gsRackLabel = rackIdToLabel[String(row.GS_Rack_Number)] || row.GS_Rack_Number;
        const gdRackLabel = rackIdToLabel[String(row.GD_Rack_Number)] || row.GD_Rack_Number;
        const gsBoxLabel = boxIdToLabel[String(row.GS_Box_details)] || row.GS_Box_details;
        const gdBoxLabel = boxIdToLabel[String(row.GD_Box_detail)] || row.GD_Box_detail;

        if (isJunk(spLabel)) issues.push(`Specie="${row.Specie}" translates to "${spLabel}"`);
        if (isJunk(gsRackLabel)) issues.push(`GS_Rack="${row.GS_Rack_Number}" translates to "${gsRackLabel}"`);
        if (isJunk(gdRackLabel)) issues.push(`GD_Rack="${row.GD_Rack_Number}" translates to "${gdRackLabel}"`);
        if (isJunk(gsBoxLabel)) issues.push(`GS_Box="${row.GS_Box_details}" translates to "${gsBoxLabel}"`);
        if (isJunk(gdBoxLabel)) issues.push(`GD_Box="${row.GD_Box_detail}" translates to "${gdBoxLabel}"`);

        // Also catch non-numeric IDs stored in numeric ID fields
        if (row.Specie && isNaN(row.Specie) && !speciesIdToLabel[row.Specie]) {
            issues.push(`Specie has non-ID text: "${row.Specie}"`);
        }
        if (row.GS_Rack_Number && isNaN(row.GS_Rack_Number) && !rackIdToLabel[row.GS_Rack_Number]) {
            issues.push(`GS_Rack_Number has non-ID text: "${row.GS_Rack_Number}"`);
        }
        if (row.GD_Rack_Number && isNaN(row.GD_Rack_Number) && !rackIdToLabel[row.GD_Rack_Number]) {
            issues.push(`GD_Rack_Number has non-ID text: "${row.GD_Rack_Number}"`);
        }

        if (issues.length > 0) {
            corrupted.push({ id: row.id, issues });
        }
    });

    if (corrupted.length === 0) {
        console.log('✅ No corrupted records found in the latest 200 strains!');
    } else {
        console.log(`⚠️  Found ${corrupted.length} corrupted record(s):\n`);
        corrupted.forEach(c => {
            console.log(`  Strain ID ${c.id}:`);
            c.issues.forEach(i => console.log(`    → ${i}`));
        });

        console.log('\n📋 Species lookup reference:');
        species.slice(0, 10).forEach(s => console.log(`  id=${s.id}: ${s.Species}`));
        console.log('  ...');
        console.log('\n📋 Rack lookup reference:');
        racks.slice(0, 12).forEach(r => console.log(`  id=${r.id}: ${r.Rack_No}`));
    }

    await sequelize.close();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
