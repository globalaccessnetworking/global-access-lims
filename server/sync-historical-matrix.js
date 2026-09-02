#!/usr/bin/env node
/**
 * sync-historical-matrix.js  --  LIMS PRO Master Box Matrix Recovery Script
 *
 * Step 1: Initialize the full 100-slot grid (A1-J10) for every box in
 *         box_locations that is missing rows in box_position_index.
 * Step 2: Sweep ALL dynamic inventory tables and re-map every historical
 *         tube placement back into the correct grid slot.
 * Step 3: Propagate freezer names to all empty sibling slots.
 *
 * Usage:
 *   cd ~/global-access-lims/server
 *   node sync-historical-matrix.js
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

const ROWS = ['A','B','C','D','E','F','G','H','I','J'];
const COLS = [1,2,3,4,5,6,7,8,9,10];

const TABLE_CONFIG = {
    ext_bacteriophages: {
        type: 'phage', 
        labelField: 'Bacteriophage_Name', 
        mappings: [
            { boxField: 'GS_Box_details',        posField: 'GS_position_in_Box',  freezerField: 'GS_Freezer_Name', tubeField: 'Glycerol_Stock_tube_Label' },
            { boxField: 'DNA_storage_Box_detail', posField: '_4C_Position_in_box', freezerField: '_4C_Fridge_Number', tubeField: 'DNA_Storage_Label' }
        ]
    },
    ext_bacterial_strains: {
        type: 'bacteria', 
        labelField: 'Strain_No', 
        mappings: [
            { boxField: 'GS_Box_details', posField: 'Location_in_Box_GS', freezerField: 'GS_Freezer_Number', tubeField: 'Glycerol_Stock_tube_label' },
            { boxField: 'GD_Box_detail',  posField: 'Loction_in_Box_PD',  freezerField: 'GD_Freezer_Number', tubeField: 'Genomic_DNA_tube_Label' }
        ]
    },
    ext_plasmids: {
        type: 'plasmid', 
        labelField: 'Plasmid_Name', 
        mappings: [
            { boxField: 'Glycerol_Stock_Box',   posField: 'Location_in_Box_GS', freezerField: 'GLycerol_Stock_Freezer', tubeField: 'Glycerol_Stock_Tube_Label' },
            { boxField: 'DNA_Store_Box_Detail',  posField: 'Location_in_Box_GS', freezerField: 'DNA_Store_Freezer', tubeField: 'PLasmid_DNA_Label' }
        ]
    },
    ext_primers_details: {
        type: 'primer', 
        labelField: 'Primer_Name', 
        mappings: [
            { boxField: 'Box_detail', posField: 'Location_in_Box', freezerField: 'Freezer_Name', tubeField: 'Purpose' }
        ]
    }
};

async function resolveBoxName(raw) {
    if (!raw) return null;
    const val = String(raw).trim();
    if (!val || val.toLowerCase() === 'null') return null;
    if (/^\d+$/.test(val)) {
        const rows = await sequelize.query(
            'SELECT "Box_detail" FROM box_locations WHERE "id"::text = :v OR "ID"::text = :v LIMIT 1',
            { replacements: { v: val }, type: QueryTypes.SELECT }
        );
        return (rows.length > 0 && rows[0].Box_detail) ? rows[0].Box_detail.trim() : null;
    }
    return val;
}

async function resolveFreezername(raw) {
    if (!raw) return null;
    const val = String(raw).trim();
    if (!val || val.toLowerCase() === 'null') return null;
    if (/^\d+$/.test(val)) {
        try {
            const rows = await sequelize.query(
                'SELECT "Freezer" FROM freezer_locations WHERE "id"::text = :v OR "ID"::text = :v LIMIT 1',
                { replacements: { v: val }, type: QueryTypes.SELECT }
            );
            return (rows.length > 0 && rows[0].Freezer) ? rows[0].Freezer.trim() : null;
        } catch (e) { return null; }
    }
    return val;
}

function normalizePos(raw) {
    if (!raw) return null;
    const p = String(raw).trim().toUpperCase().replace(/[\s\-_]/g, '');
    return /^[A-J]([1-9]|10)$/.test(p) ? p : null;
}

async function initializeAllBoxSlots() {
    console.log('\n==========================================================');
    console.log(' STEP 1: Initializing missing 100-slot grids...');
    console.log('==========================================================');

    const boxes = await sequelize.query(
        'SELECT "id", "ID", "Box_detail" FROM box_locations WHERE "Box_detail" IS NOT NULL AND trim("Box_detail") != \'\' ORDER BY "Box_detail"',
        { type: QueryTypes.SELECT }
    );
    console.log('  Found ' + boxes.length + ' total boxes in box_locations.\n');

    let initialized = 0, alreadyFull = 0;

    for (const box of boxes) {
        const boxName = box.Box_detail.trim();
        const [{ cnt }] = await sequelize.query(
            'SELECT COUNT(*) AS cnt FROM box_position_index WHERE box_name = :b',
            { replacements: { b: boxName }, type: QueryTypes.SELECT }
        );
        const existing = parseInt(cnt, 10);

        if (existing >= 100) { alreadyFull++; continue; }

        console.log('  -> "' + boxName + '" has ' + existing + ' slots -- filling to 100...');

        const existingRows = await sequelize.query(
            'SELECT position_code FROM box_position_index WHERE box_name = :b',
            { replacements: { b: boxName }, type: QueryTypes.SELECT }
        );
        const existingCodes = new Set(existingRows.map(r => r.position_code));

        let inserted = 0;
        for (const row of ROWS) {
            for (const col of COLS) {
                const pos = row + col;
                if (!existingCodes.has(pos)) {
                    await sequelize.query(
                        'INSERT INTO box_position_index (box_name, freezer_name, row, "column", position_code, is_occupied, conflict_flag) VALUES (:b, NULL, :r, :c, :p, false, false)',
                        { replacements: { b: boxName, r: row, c: col, p: pos } }
                    );
                    inserted++;
                }
            }
        }
        console.log('    OK: Inserted ' + inserted + ' new slots for "' + boxName + '"');
        initialized++;
    }

    console.log('\n  Result: ' + initialized + ' boxes initialized, ' + alreadyFull + ' already complete.');
    return initialized;
}

async function syncAllHistoricalRecords() {
    console.log('\n==========================================================');
    console.log(' STEP 2: Syncing historical tube placements...');
    console.log('==========================================================');

    let grandTotal = 0, grandSkipped = 0;

    for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
        console.log('\n  > Table: ' + tableName);

        const [{ tcount }] = await sequelize.query(
            'SELECT COUNT(*) AS tcount FROM information_schema.tables WHERE table_schema=\'public\' AND table_name=:t',
            { replacements: { t: tableName }, type: QueryTypes.SELECT }
        ).catch(() => [{ tcount: '0' }]);
        if (parseInt(tcount, 10) === 0) { console.log('    SKIP: table does not exist.'); continue; }

        let records;
        try {
            records = await sequelize.query('SELECT * FROM "' + tableName + '" ORDER BY id', { type: QueryTypes.SELECT });
        } catch (e) { console.log('    ERROR: ' + e.message); continue; }

        console.log('    ' + records.length + ' records found.');

        await sequelize.query(
            'UPDATE box_position_index SET is_occupied=false,asset_type=NULL,asset_id=NULL,asset_label=NULL,tube_label=NULL,source_table=NULL,conflict_flag=false,updated_at=CURRENT_TIMESTAMP WHERE source_table=:t',
            { replacements: { t: tableName } }
        );
        console.log('    Cleared old occupancy for ' + tableName + '.');

        let tableMapped = 0, tableSkipped = 0;

        for (const record of records) {
            const recId    = record.id;
            const recLabel = record[config.labelField] || '';

            for (const mapping of config.mappings) {
                const boxRaw     = record[mapping.boxField];
                const posRaw     = record[mapping.posField];
                const freezerRaw = record[mapping.freezerField] || null;
                const recTube    = record[mapping.tubeField] || '';

                if (!boxRaw || !posRaw) continue;

                const boxName = await resolveBoxName(boxRaw);
                if (!boxName) {
                    console.log('      SKIP: cannot resolve box "' + boxRaw + '" for id=' + recId);
                    tableSkipped++;
                    continue;
                }

                const freezerName = await resolveFreezername(freezerRaw);
                const rawPositions = String(posRaw).split(/[,;]+/);

                for (const rawPos of rawPositions) {
                    const pos = normalizePos(rawPos);
                    if (!pos) {
                        console.log('      SKIP: invalid position "' + rawPos + '" for id=' + recId);
                        tableSkipped++;
                        continue;
                    }

                    const updated = await sequelize.query(
                        'UPDATE box_position_index SET is_occupied=true,asset_type=:atype,asset_id=:aid,asset_label=:alabel,tube_label=:tube,source_table=:src,freezer_name=COALESCE(NULLIF(:fz,\'\'),freezer_name),conflict_flag=false,updated_at=CURRENT_TIMESTAMP WHERE box_name=:box AND position_code=:pos RETURNING id',
                        { replacements: { atype: config.type, aid: String(recId), alabel: recLabel, tube: recTube, src: tableName, fz: freezerName||'', box: boxName, pos: pos }, type: QueryTypes.SELECT }
                    );

                    if (updated && updated.length > 0) {
                        console.log('      OK: [' + config.type + '] id=' + recId + ' label="' + recLabel + '" tube="' + recTube + '" -> ' + boxName + '/' + pos);
                        tableMapped++;
                    } else {
                        console.log('      MISS: slot not found: box="' + boxName + '" pos="' + pos + '" id=' + recId);
                        tableSkipped++;
                    }
                }
            }
        }

        console.log('    -- ' + tableName + ': ' + tableMapped + ' mapped, ' + tableSkipped + ' skipped');
        grandTotal   += tableMapped;
        grandSkipped += tableSkipped;
    }

    console.log('\n  Result: ' + grandTotal + ' tubes mapped, ' + grandSkipped + ' skipped.');
    return { grandTotal, grandSkipped };
}

async function propagateFreezerNames() {
    console.log('\n==========================================================');
    console.log(' STEP 3: Propagating freezer names to empty slots...');
    console.log('==========================================================');
    await sequelize.query(
        'UPDATE box_position_index AS target SET freezer_name = src.freezer_name FROM (SELECT DISTINCT ON (box_name) box_name, freezer_name FROM box_position_index WHERE freezer_name IS NOT NULL AND freezer_name != \'\' ORDER BY box_name, is_occupied DESC, id ASC) src WHERE target.box_name = src.box_name AND (target.freezer_name IS NULL OR target.freezer_name = \'\')'
    );
    console.log('  OK: Freezer names propagated.');
}

async function main() {
    console.log('\n+----------------------------------------------------------+');
    console.log('|  LIMS PRO: Historical Box Matrix Recovery Script          |');
    console.log('+----------------------------------------------------------+');

    try {
        await sequelize.authenticate();
        console.log('OK: Database connected.\n');
    } catch (err) {
        console.error('FATAL: Cannot connect to database:', err.message);
        process.exit(1);
    }

    const t0 = Date.now();

    const boxesInitialized             = await initializeAllBoxSlots();
    const { grandTotal, grandSkipped } = await syncAllHistoricalRecords();
    await propagateFreezerNames();

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    console.log('\n+----------------------------------------------------------+');
    console.log('|                   RECOVERY COMPLETE                       |');
    console.log('+----------------------------------------------------------+');
    console.log('|  Boxes initialized:          ' + String(boxesInitialized).padEnd(30) + '|');
    console.log('|  Historical tubes mapped:    ' + String(grandTotal).padEnd(30) + '|');
    console.log('|  Skipped (bad box/position): ' + String(grandSkipped).padEnd(30) + '|');
    console.log('|  Elapsed:                    ' + (elapsed + 's').padEnd(30) + '|');
    console.log('+----------------------------------------------------------+');
    console.log('\nNext: pm2 restart all  then Ctrl+F5 in the browser.\n');

    await sequelize.close();
    process.exit(0);
}

main().catch(err => {
    console.error('FATAL:', err.message || err);
    process.exit(1);
});