/**
 * Migration: Convert box_position_index.box_name from numeric IDs to display names.
 * e.g. "32" → "GS-26 (C1-b)"
 * Run ONCE with: node migrate-box-names.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize, QueryTypes } = require('sequelize');

const sequelize = new Sequelize(
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
    { logging: false }
);

async function run() {
    console.log('Migrating box_position_index: numeric IDs → display names...\n');

    // Get all unique box_name values that are numeric IDs
    const numericBoxNames = await sequelize.query(
        `SELECT DISTINCT box_name FROM box_position_index WHERE box_name ~ '^[0-9]+$'`,
        { type: QueryTypes.SELECT }
    );
    // Sort numerically in JS
    numericBoxNames.sort((a, b) => parseInt(a.box_name) - parseInt(b.box_name));
    console.log(`Found ${numericBoxNames.length} unique numeric box IDs to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const row of numericBoxNames) {
        const numericId = row.box_name;
        // Look up the display name
        const boxRows = await sequelize.query(
            `SELECT "Box_detail" FROM box_locations WHERE "ID"::text = :id LIMIT 1`,
            { replacements: { id: numericId }, type: QueryTypes.SELECT }
        );

        if (!boxRows.length || !boxRows[0].Box_detail) {
            console.log(`  [SKIP] No box_locations entry for ID=${numericId}`);
            skipped++;
            continue;
        }

        const displayName = boxRows[0].Box_detail.trim();
        const result = await sequelize.query(
            `UPDATE box_position_index SET box_name = :name WHERE box_name = :id`,
            { replacements: { name: displayName, id: numericId } }
        );

        console.log(`  [OK] ID ${numericId} → "${displayName}"`);
        updated++;
    }

    console.log(`\nMigration complete: ${updated} box IDs converted, ${skipped} skipped`);
    console.log('The box_position_index now uses human-readable display names.');
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
