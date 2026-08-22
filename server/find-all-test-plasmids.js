/**
 * find-all-test-plasmids.js
 * Finds ALL ext_plasmids rows that still have wrong/test values
 * and shows their raw column values + translations.
 *
 * Run on VPS:
 *   cd ~/global-access-lims/server
 *   node find-all-test-plasmids.js
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME     || 'bacteriophage_lims',
    process.env.DB_USER     || 'postgres',
    process.env.DB_PASSWORD || 'phagelabdrshafiq',
    { host: process.env.DB_HOST || 'localhost', dialect: 'postgres', logging: false }
);

const Q = (sql, opts) => sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT, ...opts });

async function main() {
    console.log('=== Finding ALL ext_plasmids rows with suspicious/test values ===\n');

    // Find ALL rows — show every row's raw relational columns
    const rows = await Q(
        `SELECT id, "ID", "Plasmid_Name",
                "Plasmid_Backbone",
                "Host_Bacteria",
                "Activity_Shown_Against",
                "GLycerol_Stock_Freezer","Glycerol_Stock_Rack","Glycerol_Stock_Box",
                "DNA_Store_Freezer","DNA_Store_Rack","DNA_Store_Box_Detail",
                "Location_in_Box_GS"
         FROM ext_plasmids
         ORDER BY id DESC
         LIMIT 20`
    );

    // Build translation dicts
    const speciesMap = {};
    (await Q(`SELECT id, "ID", "Species" FROM bacterial_species`)).forEach(r => {
        if (r.id != null) speciesMap[String(r.id)] = r.Species;
        if (r.ID != null) speciesMap[String(r.ID)] = r.Species;
    });

    const rackMap = {};
    (await Q(`SELECT id, "ID", "Rack_No" FROM rack_locations`)).forEach(r => {
        if (r.id != null) rackMap[String(r.id)] = r.Rack_No;
        if (r.ID != null) rackMap[String(r.ID)] = r.Rack_No;
    });

    const boxMap = {};
    (await Q(`SELECT id, "ID", "Box_detail" FROM box_locations`)).forEach(r => {
        if (r.id != null) boxMap[String(r.id)] = r.Box_detail;
        if (r.ID != null) boxMap[String(r.ID)] = r.Box_detail;
    });

    const hostMap = {};
    (await Q(`SELECT id, "ID", "Host_Bacteria_No" FROM ext_host_bacteria`)).forEach(r => {
        if (r.id != null) hostMap[String(r.id)] = r.Host_Bacteria_No;
        if (r.ID != null) hostMap[String(r.ID)] = r.Host_Bacteria_No;
    });

    const freezerMap = {};
    (await Q(`SELECT id, "ID", "Freezer" FROM freezer_locations`)).forEach(r => {
        if (r.id != null) freezerMap[String(r.id)] = r.Freezer;
        if (r.ID != null) freezerMap[String(r.ID)] = r.Freezer;
    });

    console.log('Last 20 ext_plasmids rows (what table view will show):');
    console.log('─'.repeat(120));

    for (const row of rows) {
        const host     = hostMap[String(row.Host_Bacteria)]            ?? row.Host_Bacteria;
        const against  = speciesMap[String(row.Activity_Shown_Against)] ?? row.Activity_Shown_Against;
        const gsFreeze = freezerMap[String(row.GLycerol_Stock_Freezer)] ?? row.GLycerol_Stock_Freezer;
        const gsRack   = rackMap[String(row.Glycerol_Stock_Rack)]       ?? row.Glycerol_Stock_Rack;
        const gsBox    = boxMap[String(row.Glycerol_Stock_Box)]         ?? row.Glycerol_Stock_Box;
        const dnaFreeze= freezerMap[String(row.DNA_Store_Freezer)]      ?? row.DNA_Store_Freezer;
        const dnaRack  = rackMap[String(row.DNA_Store_Rack)]            ?? row.DNA_Store_Rack;
        const dnaBox   = boxMap[String(row.DNA_Store_Box_Detail)]       ?? row.DNA_Store_Box_Detail;

        console.log(`\nid=${row.id} | ID="${row.ID}" | Name="${row.Plasmid_Name}"`);
        console.log(`  Host_Bacteria          raw="${row.Host_Bacteria}"  → "${host}"`);
        console.log(`  Activity_Shown_Against raw="${row.Activity_Shown_Against}"  → "${against}"`);
        console.log(`  GS_Freezer             raw="${row.GLycerol_Stock_Freezer}"  → "${gsFreeze}"`);
        console.log(`  GS_Rack                raw="${row.Glycerol_Stock_Rack}"  → "${gsRack}"`);
        console.log(`  GS_Box                 raw="${row.Glycerol_Stock_Box}"  → "${gsBox}"`);
        console.log(`  DNA_Freezer            raw="${row.DNA_Store_Freezer}"  → "${dnaFreeze}"`);
        console.log(`  DNA_Rack               raw="${row.DNA_Store_Rack}"  → "${dnaRack}"`);
        console.log(`  DNA_Box                raw="${row.DNA_Store_Box_Detail}"  → "${dnaBox}"`);
        console.log(`  Location_in_Box_GS = "${row.Location_in_Box_GS}"`);
    }

    // Specifically flag rows still showing BL-21 (species id=26)
    const blRows = rows.filter(r => String(r.Activity_Shown_Against) === '26' || String(r.Activity_Shown_Against) === 'BL-21');
    if (blRows.length > 0) {
        console.log(`\n⚠️  STILL-WRONG ROWS (Activity_Shown_Against = BL-21):`);
        blRows.forEach(r => console.log(`  id=${r.id} ID="${r.ID}" Name="${r.Plasmid_Name}"`));
    } else {
        console.log('\n✅ No rows with BL-21 in last 20 plasmids!');
    }

    // Specifically flag rows still showing rack "w" (id=74)
    const wRows = rows.filter(r => String(r.Glycerol_Stock_Rack) === '74' || String(r.Glycerol_Stock_Rack) === 'w');
    if (wRows.length > 0) {
        console.log(`\n⚠️  STILL-WRONG ROWS (Glycerol_Stock_Rack = w):`);
        wRows.forEach(r => console.log(`  id=${r.id} ID="${r.ID}" Name="${r.Plasmid_Name}"`));
    }
}

main().finally(() => sequelize.close());
