/**
 * audit-all-tables.js
 * ───────────────────
 * Audits ext_bacteriophages, ext_primers_details, available_antibiotic_discs,
 * ext_lab_stock for:
 *   1. Missing LOOKUP_REGISTRY entries (relational columns not being translated)
 *   2. Translation accuracy (are stored IDs resolving to correct labels?)
 *
 * Run on VPS:
 *   cd ~/global-access-lims/server
 *   node audit-all-tables.js
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

// ── Mirror of LOOKUP_REGISTRY (v15) — only keys matter for audit ─────────────
const REGISTRY_KEYS = new Set([
    'Bacteriophage_Name','WT_RECOMB','WT_RECOME','Host_Bacteria','Host_Range',
    'Activity_Shown_Against','GS_Freezer_Name','GS_Racks','GS_Box_details',
    'Against_Species','DNA_storage_Box_detail','Antibiotic_resistance',
    'Specie','Wild_type_Recom','GS_Freezer_Number','GS_Rack_Number','GD_Freezer_Number',
    'GD_Rack_Number','GD_Box_detail','Antibiotic_sensitivity',
    'Plasmid_Backbone','Gene_Source','Cloning_Method','Antibiotic_Marker',
    'Freezer','Rack_No','Box_detail',
    'GLycerol_Stock_Freezer','Glycerol_Stock_Rack','Glycerol_Stock_Box',
    'Binds_with_Phage_Bacteria_Plasmid','Phage','Bacteria','Plasmid',
    'Freezer_Shelve','DNA_Store_Freezer','DNA_Store_Rack','DNA_Store_Box_Detail',
    'Manufacturer','Category','Location_Area','Location_Area_final',
    'Antibiotic_Disc','Host_Bacteria_No',
    'Host_Name','Lytic_Lysogenic','Wild_type_Recombinant',
]);

// Keyword fallbacks (same as system.js Phase 115)
function keywordFallback(col) {
    const t = col.toLowerCase().replace(/[\s-]/g, '_').replace(/s$/i, '');
    if (t.includes('rack'))        return 'rack_locations → Rack_No';
    if (t.includes('box'))         return 'box_locations → Box_detail';
    if (t.includes('freezer'))     return 'freezer_locations → Freezer';
    if (t.includes('specie') || t.includes('against')) return 'bacterial_species → Species';
    if (t.includes('phage'))       return 'phage_names → Bacteriophage_Name';
    if (t.includes('antibiotic'))  return 'antibiotics → Complete_Name';
    if (t.includes('manufacturer')) return 'manufacturers → Manufacturers';
    if (t.includes('category'))    return 'stock_categories → Category';
    if (t.includes('host'))        return 'ext_host_bacteria → Host_Bacteria_No';
    return null;
}

async function auditTable(tableName) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`TABLE: ${tableName}`);
    console.log('═'.repeat(70));

    let colDesc;
    try {
        colDesc = await sequelize.getQueryInterface().describeTable(tableName);
    } catch (e) {
        console.log(`  ⚠️  Table not found: ${e.message}`);
        return;
    }

    const colNames = Object.keys(colDesc);
    const relational = [];
    const notRelational = [];

    for (const col of colNames) {
        if (['id','ID','created_at','updated_at','createdAt','updatedAt'].includes(col)) continue;
        const type = colDesc[col].type;
        // Only TEXT/VARCHAR/CHARACTER VARYING are candidates for relational columns
        if (!type.includes('TEXT') && !type.includes('VARCHAR') && !type.includes('CHARACTER')) {
            notRelational.push(`${col} (${type})`);
            continue;
        }
        const inRegistry = REGISTRY_KEYS.has(col);
        const fallback   = keywordFallback(col);
        if (inRegistry || fallback) {
            relational.push({ col, source: inRegistry ? 'REGISTRY' : `KEYWORD(${fallback})` });
        } else {
            notRelational.push(`${col} → ❓ NOT MAPPED (may be free-text or needs registry entry)`);
        }
    }

    console.log(`\n  ✅ Relational columns (will be translated in Table View):`);
    relational.forEach(r => console.log(`     ${r.col.padEnd(35)} via ${r.source}`));

    console.log(`\n  📋 Non-relational / free-text columns:`);
    notRelational.forEach(c => console.log(`     ${c}`));

    // Sample translation test: pick latest row with non-null relational values
    const sampleRows = await Q(
        `SELECT * FROM "${tableName}" ORDER BY id DESC LIMIT 5`
    ).catch(() => []);

    if (sampleRows.length > 0) {
        console.log(`\n  🔬 Sample translation test (latest 1–5 rows):`);
        for (const row of sampleRows.slice(0, 3)) {
            const nameCol = ['ID','Strain_No','Bacteriophage_Name','Plasmid_Name','Primer_name','Chemical_name','Antibiotic_disc_name'].find(c => row[c] != null);
            const label = nameCol ? row[nameCol] : `id=${row.id}`;
            const nonNull = relational.filter(r => row[r.col] != null && row[r.col] !== 'null');
            if (nonNull.length > 0) {
                console.log(`\n     Row "${label}":`);
                for (const { col } of nonNull) {
                    console.log(`       ${col.padEnd(30)} = "${row[col]}"`);
                }
            }
        }
    }
}

async function main() {
    const tables = [
        'ext_bacteriophages',
        'ext_primers_details',
        'available_antibiotic_discs',
        'ext_lab_stock',
    ];

    for (const t of tables) {
        await auditTable(t);
    }

    // Also list actual table names in DB to verify names
    console.log(`\n${'═'.repeat(70)}`);
    console.log('ALL ext_* tables in DB:');
    const tbls = await Q(
        `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'ext_%' ORDER BY tablename`
    );
    tbls.forEach(r => console.log(`  ${r.tablename}`));
}

main().finally(() => sequelize.close());
