/**
 * fix-plasmid-552.js
 * ─────────────────
 * Directly patches the ext_plasmids row whose "ID" = '552' (or id = 552)
 * with the correct relational IDs so that the Table View translates them
 * to their proper human-readable labels.
 *
 * Run on VPS:
 *   cd ~/global-access-lims/server
 *   node fix-plasmid-552.js
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
    console.log('=== Fixing ext_plasmids record "552" ===\n');

    // ── Step 1: find the row ──────────────────────────────────────────────────
    const rows = await Q(
        `SELECT id, "ID", "Plasmid_Name",
                "Host_Bacteria", "Activity_Shown_Against",
                "GLycerol_Stock_Freezer","Glycerol_Stock_Rack","Glycerol_Stock_Box",
                "DNA_Store_Freezer","DNA_Store_Rack","DNA_Store_Box_Detail"
         FROM ext_plasmids
         WHERE ("id"::text = '552' OR "ID"::text = '552')`
    );

    if (!rows.length) {
        console.error('❌  No row found with id or ID = 552. Listing last 5 rows:');
        const last5 = await Q(`SELECT id, "ID", "Plasmid_Name" FROM ext_plasmids ORDER BY id DESC LIMIT 5`);
        last5.forEach(r => console.log(`  id=${r.id}  ID=${r.ID}  Name=${r.Plasmid_Name}`));
        return;
    }

    const row = rows[0];
    console.log('Current raw values:');
    console.log(JSON.stringify(row, null, 2));

    // ── Step 2: look up correct IDs from reference tables ────────────────────
    // We'll resolve every relational column by its CURRENT stored value and
    // print the translation, then set the correct values the user actually wants.

    // Helper: resolve id from a lookup table by label
    async function resolveId(table, col, label) {
        const r = await Q(
            `SELECT id, "ID" FROM "${table}" WHERE LOWER("${col}") = LOWER($1) LIMIT 1`,
            { bind: [label] }
        );
        return r[0] ? (r[0].id ?? r[0].ID) : null;
    }

    // Helper: translate a stored id to a label
    async function translateId(table, col, storedVal) {
        if (!storedVal) return null;
        const r = await Q(
            `SELECT "${col}" FROM "${table}" WHERE ("id"::text = $1 OR "ID"::text = $1) LIMIT 1`,
            { bind: [String(storedVal)] }
        );
        return r[0] ? r[0][col] : `??(${storedVal})`;
    }

    console.log('\n── Current column translations (before fix) ──');
    console.log(`  Host_Bacteria          = ${row.Host_Bacteria}  →  ${await translateId('ext_host_bacteria','Host_Bacteria_No', row.Host_Bacteria)}`);
    console.log(`  Activity_Shown_Against = ${row.Activity_Shown_Against}  →  ${await translateId('bacterial_species','Species', row.Activity_Shown_Against)}`);
    console.log(`  GLycerol_Stock_Freezer = ${row.GLycerol_Stock_Freezer}  →  ${await translateId('freezer_locations','Freezer', row.GLycerol_Stock_Freezer)}`);
    console.log(`  Glycerol_Stock_Rack    = ${row.Glycerol_Stock_Rack}  →  ${await translateId('rack_locations','Rack_No', row.Glycerol_Stock_Rack)}`);
    console.log(`  Glycerol_Stock_Box     = ${row.Glycerol_Stock_Box}  →  ${await translateId('box_locations','Box_detail', row.Glycerol_Stock_Box)}`);
    console.log(`  DNA_Store_Freezer      = ${row.DNA_Store_Freezer}  →  ${await translateId('freezer_locations','Freezer', row.DNA_Store_Freezer)}`);
    console.log(`  DNA_Store_Rack         = ${row.DNA_Store_Rack}  →  ${await translateId('rack_locations','Rack_No', row.DNA_Store_Rack)}`);
    console.log(`  DNA_Store_Box_Detail   = ${row.DNA_Store_Box_Detail}  →  ${await translateId('box_locations','Box_detail', row.DNA_Store_Box_Detail)}`);

    // ── Step 3: Print ALL species, racks, boxes, and host bacteria so the user
    //           can see the correct IDs on their OWN VPS database ──────────────
    console.log('\n── bacterial_species (for Activity_Shown_Against) ──');
    const species = await Q(`SELECT id, "Species" FROM bacterial_species ORDER BY id`);
    species.forEach(r => console.log(`  id=${r.id}: "${r.Species}"`));

    console.log('\n── rack_locations (for Glycerol_Stock_Rack / DNA_Store_Rack) ──');
    const racks = await Q(`SELECT id, "Rack_No" FROM rack_locations ORDER BY id`);
    racks.forEach(r => console.log(`  id=${r.id}: "${r.Rack_No}"`));

    console.log('\n── box_locations first 30 (for Glycerol_Stock_Box / DNA_Store_Box_Detail) ──');
    const boxes = await Q(`SELECT id, "Box_detail" FROM box_locations ORDER BY id LIMIT 30`);
    boxes.forEach(r => console.log(`  id=${r.id}: "${r.Box_detail}"`));

    console.log('\n── ext_host_bacteria (for Host_Bacteria) ──');
    const hosts = await Q(`SELECT id, "Host_Bacteria_No" FROM ext_host_bacteria ORDER BY id`);
    hosts.forEach(r => console.log(`  id=${r.id}: "${r.Host_Bacteria_No}"`));

    // ── Step 4: Apply the fix ─────────────────────────────────────────────────
    // We know from your description the user wants:
    //   Activity_Shown_Against → "Avian pathogenic Escherichia coli(APEC)"
    //   Glycerol_Stock_Rack    → the rack that shows "w" … user doesn't want "w",
    //                            but we need to know which ID maps to the CORRECT rack.
    //
    // We will:
    //   (a) resolve the IDs the user ACTUALLY wants from above lists
    //   (b) apply the UPDATE
    //
    // Based on the VPS species table (printed above): APEC = id 11
    // The record currently shows "w" (rack id=74) and "GS-110 (L1-c)" (box=110) —
    // these came from the old test data. Leave them AS-IS until user confirms wanted values.
    //
    // For NOW we just fix Activity_Shown_Against = 11 (APEC) which was confirmed wrong.

    const apecId = await resolveId('bacterial_species', 'Species', 'Avian pathogenic Escherichia coli(APEC)');
    console.log(`\nResolved APEC id = ${apecId}`);

    if (apecId) {
        await sequelize.query(
            `UPDATE ext_plasmids SET "Activity_Shown_Against" = $1
             WHERE ("id"::text = '552' OR "ID"::text = '552')`,
            { bind: [String(apecId)], type: Sequelize.QueryTypes.UPDATE }
        );
        console.log(`✅ Activity_Shown_Against updated to ${apecId} (APEC)`);
    }

    // ── Step 5: Verify ───────────────────────────────────────────────────────
    const after = await Q(
        `SELECT id, "ID", "Activity_Shown_Against", "Glycerol_Stock_Rack", "Glycerol_Stock_Box"
         FROM ext_plasmids WHERE ("id"::text = '552' OR "ID"::text = '552')`
    );
    console.log('\nRow after fix:', after[0]);
    console.log('\n✅ Done. Now run: cd ~/global-access-lims && git pull origin main && pm2 restart all && cd client && npm run build && cp -r dist/* /var/www/lims/');
    console.log('Then open /dynamic/ext_plasmids and press Ctrl+F5.\n');
}

main().finally(() => sequelize.close());
