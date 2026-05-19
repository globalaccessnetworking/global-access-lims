const express = require('express');
const router = express.Router();
const { sequelize, Notification } = require('../models');
const { Sequelize } = require('sequelize');

// @route   GET api/system/tables
// @desc    Get all dynamic tables (starting with ext_)
// @access  Public (or Protected)
router.get('/tables', async (req, res) => {
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND (table_name LIKE 'ext_%' OR table_name IN (
                'bacterial_species', 'wild_type_recomb_types', 'phage_names', 
                'lytic_lysogenic_types', 'plasmid_vectors', 'gene_sources', 
                'cloning_methods', 'manufacturers', 'stock_categories', 
                'chemical_storage_areas', 'antibiotics', 'primer_binding_organism_types', 
                'available_antibiotic_discs',
                'box_locations', 'freezer_locations', 'rack_locations'
            ));
        `;

        const results = await sequelize.query(query, {
            type: Sequelize.QueryTypes.SELECT
        });

        // Map to cleaner format
        const tables = results.map(row => {
            const rawName = Array.isArray(row) ? row[0] : row.table_name;
            if (!rawName) return null; // Safety check
            
            // Clean up name and apply common typo fixes for display
            let displayName = rawName.replace('ext_', '').replace(/_/g, ' ');
            displayName = displayName.replace(/\bstoage\b/gi, 'storage');
            
            return {
                name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
                tableName: rawName,
                path: `/dynamic/${rawName}`
            };
        });

        res.json(tables);
    } catch (err) {
        console.error('Error fetching tables:', err);
        res.status(500).json({ error: 'Failed to fetch system tables' });
    }
});

// Helper to get foreign keys for a table (Postgres-specific for reliability)
async function getForeignKeys(tableName) {
    const query = `
        SELECT
            a.attname AS column_name,
            confrelid::regclass::text AS foreign_table_name,
            af.attname AS foreign_column_name
        FROM pg_constraint AS c
        JOIN pg_attribute AS a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        JOIN pg_attribute AS af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
        WHERE c.contype = 'f' AND conrelid = $1::regclass;
    `;
    try {
        const rows = await sequelize.query(query, { bind: [tableName], type: Sequelize.QueryTypes.SELECT });
        return rows || [];
    } catch (err) {
        console.warn(`[SYSTEM] FK detection failed for ${tableName}:`, err.message);
        return [];
    }
}

// Helper to fetch options for a foreign key with human-readable labels
async function getForeignKeyOptions(foreignTable, foreignCol) {
    try {
        // Try to find a human-readable column
        // Standardize table name for information_schema (remove quotes if any)
        const cleanTable = foreignTable.replace(/"/g, '');

        const cols = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
        `, { bind: [cleanTable], type: Sequelize.QueryTypes.SELECT });

        const colNames = cols.map(c => c.column_name.toLowerCase());
        let labelCol = foreignCol;

        const candidates = ['name', 'full_name', 'title', 'username', 'display_name', 'email', 'description', 'label'];
        for (const cand of candidates) {
            if (colNames.includes(cand)) {
                labelCol = cand;
                break;
            }
        }

        // Use the native table name for the actual query (case-preserving)
        const query = `SELECT "${foreignCol}" as value, "${labelCol}" as label FROM "${cleanTable}" LIMIT 200`;
        const options = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
        return options;
    } catch (err) {
        console.warn(`[SYSTEM] Failed to fetch options for ${foreignTable}:`, err.message);
        return [];
    }
}

// [PHASE 115-119] Comprehensive Relational Registry — Verified against live Postgres schema
// Maps exact case-sensitive column names (from DB) → lookup endpoint + source table
const LOOKUP_REGISTRY = {

    // ── ext_bacteriophages ─────────────────────────────────────────────────────────────
    'Bacteriophage_Name':   { endpoint: '/lookup/phage-names',   table: 'phage_names',            col: 'Bacteriophage_Name' },
    'WT_RECOMB':            { endpoint: '/lookup/wild-type-recomb',       table: 'wild_type_recomb_types',      col: 'Field1' },
    'WT_RECOME':            { endpoint: '/lookup/wild-type-recomb',       table: 'wild_type_recomb_types',      col: 'Field1' },
    'Host_Bacteria':        { endpoint: '/lookup/all-strains',    table: 'ext_bacterial_strains',   col: 'Glycerol_Stock_tube_label' },
    'Host_Range':           { endpoint: '/lookup/all-strains',    table: 'ext_bacterial_strains',   col: 'Strain_No', multiSelect: true },
    'Activity_Shown_Against': { endpoint: '/lookup/species',        table: 'bacterial_species',           col: 'Species' },
    'GS_Freezer_Name':      { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'GS_Racks':             { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'GS_Box_details':       { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'Against_Species':      { endpoint: '/lookup/species',        table: 'bacterial_species',           col: 'Species' },
    'DNA_storage_Box_detail': { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'Antibiotic_resistance':  { endpoint: '/lookup/antibiotics',  table: 'antibiotics',             col: 'Complete_Name', multiSelect: true },

    // ── ext_bacterial_strains ──────────────────────────────────────────────────────
    'Specie':               { endpoint: '/lookup/species',        table: 'bacterial_species',           col: 'Species' },
    'Wild_type_Recom':      { endpoint: '/lookup/wild-type-recomb',       table: 'wild_type_recomb_types',      col: 'Field1' },
    'GS_Freezer_Number':    { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'GS_Rack_Number':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'GS_Box_details':       { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'GD_Freezer_Number':    { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'GD_Rack_Number':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'GD_Box_detail':        { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'Antibiotic_sensitivity': { endpoint: '/lookup/antibiotics',  table: 'antibiotics',             col: 'Complete_Name', multiSelect: true },

    // â”€â”€ ext_plasmids â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    'Plasmid_Backbone':     { endpoint: '/lookup/plasmid-vectors', table: 'plasmid_vectors',        col: 'Plasmid_Name' },
    'Gene_Source':          { endpoint: '/lookup/gene-sources',   table: 'gene_sources',            col: 'Donar_DNA_detail' },
    'Cloning_Method':       { endpoint: '/lookup/cloning-methods', table: 'cloning_methods',        col: 'Cloninig_Method' },
    'Antibiotic_Marker':    { endpoint: '/lookup/antibiotics',    table: 'antibiotics',             col: 'Complete_Name' },
    'Freezer':      { endpoint: '/lookup/freezers',     table: 'freezer_locations',           col: 'Freezer' },
    'Rack_No':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'Box_detail':   { endpoint: '/lookup/boxes',        table: 'box_locations',               col: 'Box_detail' },
    'GLycerol_Stock_Freezer': { endpoint: '/lookup/freezers',     table: 'ext_location_detail_freezer',       col: 'Freezer' },
    'Glycerol_Stock_Box':   { endpoint: '/lookup/boxes',          table: 'ext_location_detail_box',           col: 'Box detail' },

    'Binds_with_Phage_Bacteria_Plasmid': { endpoint: '/lookup/primer-binding-types', table: 'primer_binding_organism_types', col: 'Field1' },
    'Phage':        { endpoint: '/lookup/phages',       table: 'phage_names',             col: 'Bacteriophage_Name' },
    'Bacteria':     { endpoint: '/lookup/bacteria',     table: 'ext_bacterial_strains',   col: 'Strain_No' },
    'Plasmid':      { endpoint: '/lookup/plasmids',     table: 'plasmid_vectors',         col: 'Plasmid_Name' },
    'Freezer_Shelve': { endpoint: '/lookup/racks',      table: 'rack_locations',              col: 'Rack_No' },
    'DNA_Store_Freezer':    { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'DNA_Store_Rack':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'DNA_Store_Box_Detail': { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },

    // ── ext_lab_stock ────────────────────────────────────────────────────────────────
    'Manufacturer':         { endpoint: '/lookup/manufacturers',  table: 'manufacturers',           col: 'Manufacturers' },
    'Category':             { endpoint: '/lookup/stock-categories', table: 'stock_categories',      col: 'Category' },
    'Location_Area':        { endpoint: '/lookup/freezers',       table: 'freezer_locations',       col: 'Freezer' },

    // ── ext_host_bacteria ────────────────────────────────────────────────────────────
    'Host_Bacteria_No':     { endpoint: '/lookup/bacterial-strains', table: 'ext_bacterial_strains', col: 'Strain_No' },
    'GS_Freezer_Number':    { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'GS_Rack_Number':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'GS_Box_details':       { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'Location_Area_final':  { endpoint: '/lookup/freezers',       table: 'freezer_locations',       col: 'Freezer' },

    // â”€â”€ available_antibiotic_discs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    'Antibiotic_Disc':      { endpoint: '/lookup/antibiotics',    table: 'antibiotics',             col: 'Complete_Name' },

    // â”€â”€ phage_names (self-lookups) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    'Host_Name':            { endpoint: '/lookup/species',        table: 'bacterial_species',       col: 'Species' },
    'Lytic_Lysogenic':      { endpoint: '/lookup/lytic-types',    table: 'lytic_lysogenic_types',   col: 'Type' },
    'Wild_type_Recombinant': { endpoint: '/lookup/wild-type-recomb',      table: 'wild_type_recomb_types',  col: 'Field1' },

    // â”€â”€ Freezer Storage Tables (A-O multi-select) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    'Location_detail':      { endpoint: '/lookup/freezers',       table: 'freezer_locations',       col: 'Freezer' },
    'Location':             { endpoint: '/lookup/freezers',       table: 'freezer_locations',       col: 'Freezer' },
    'A': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'B': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'C': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'c': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'D': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'E': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'F': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'G': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'H': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'I': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'J': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'K': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'L': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'M': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'N': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },
    'O': { endpoint: '/lookup/boxes', table: 'box_locations', col: 'Box_detail', multiSelect: true },

    // â”€â”€ BiologicalAssets (normalized FK columns) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    'species_id':           { endpoint: '/lookup/species',        table: 'bacterial_species',       col: 'Species' },
    'wild_type_id':         { endpoint: '/lookup/wild-type-recomb',       table: 'wild_type_recomb_types',  col: 'Field1' },
    'vector_id':            { endpoint: '/lookup/plasmid-vectors', table: 'plasmid_vectors',        col: 'Plasmid_Name' },
    'source_id':            { endpoint: '/lookup/gene-sources',   table: 'gene_sources',            col: 'Donar_DNA_detail' },
    'method_id':            { endpoint: '/lookup/cloning-methods', table: 'cloning_methods',        col: 'Cloninig_Method' },
    'antibiotic_id':        { endpoint: '/lookup/antibiotics',    table: 'antibiotics',             col: 'Complete_Name' },
    'phage_name_id':        { endpoint: '/lookup/phage-names',    table: 'phage_names',             col: 'Bacteriophage_Name' },
    'host_strain_id':       { endpoint: '/lookup/all-strains',    table: 'ext_bacterial_strains',   col: 'Glycerol_Stock_tube_label' },
    'target_phage_id':      { endpoint: '/lookup/phage-names',    table: 'phage_names',             col: 'Bacteriophage_Name' },
    'target_plasmid_id':    { endpoint: '/lookup/all-plasmids',   table: 'plasmid_vectors',         col: 'Plasmid_Name' },
    'storage_location_id':  { endpoint: '/lookup/freezers',       table: 'freezer_locations',       col: 'Freezer' },
    'against_species_id':   { endpoint: '/lookup/species',        table: 'bacterial_species',       col: 'Species' },
    'type':                 { endpoint: '/lookup/asset-types',    table: 'BiologicalAssets',        col: 'type' },
    'manufacturer_id':      { endpoint: '/lookup/manufacturers',  table: 'manufacturers',           col: 'Manufacturers' },
    'category_id':          { endpoint: '/lookup/stock-categories', table: 'stock_categories',      col: 'Category' },

    // â”€â”€ Projects & Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    'lead_investigator_id': { endpoint: '/lookup/users',          table: 'Users',                   col: 'username' },
    'assigned_to_id':       { endpoint: '/lookup/users',          table: 'Users',                   col: 'username' },
    'project_id':           { endpoint: '/lookup/projects',       table: 'ext_lab_projects',        col: 'name' },

    'name': true
};


// [PHASE 120] Ground-Truth Schema Overrides — Verified against Bacteriophage-MMG- Updated.accdb
// Priority: Overrides > Registry > FK Detection
const SCHEMA_OVERRIDES = {
    // ── App-specific status fields ────────────────────────────────────────────
    'ext_lab_tasks': {
        'status': { type: 'select', options: ['Pending', 'Todo', 'In Progress', 'Review', 'Completed'] },
        'priority': { type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
    },
    'ext_lab_projects': {
        'status': { type: 'select', options: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'] }
    },
    'ext_equipment_logs': {
        'status': { type: 'select', options: ['Operational', 'Maintenance Due', 'Out of Order'] }
    },
    'ext_experiment_comments': {
        'category': { type: 'select', options: ['General', 'Issue', 'Observation', 'Protocol Update'] }
    },

    // ── -80 Freezer stoage details-FINAL (Access truth: A,B,E = MULTI; C,D,F-O = SINGLE)
    'ext__80_freezer_stoage_details_final': {
        'Location_detail': { type: 'select', isRelational: true, endpoint: '/lookup/freezers', multiSelect: false },
        'A': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: true },
        'B': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: true },
        'C': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'D': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'E': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: true },
        'F': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'G': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'H': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'I': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'J': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'K': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'L': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'M': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'N': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'O': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false }
    },

    // ── -80 Freezer storage details (non-final: all A-O are SINGLE-select, Access-verified)
    'ext__80_freezer_storage_details': {
        'Location': { type: 'select', isRelational: true, endpoint: '/lookup/freezers', multiSelect: false },
        'A': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'B': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'c': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'D': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'E': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'F': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'G': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'H': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'I': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'J': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'K': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'L': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'M': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'N': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false },
        'O': { type: 'select', isRelational: true, endpoint: '/lookup/boxes', multiSelect: false }
    },

    // ── available_antibiotic_discs (Quntity is a number, NOT relational)
    'available_antibiotic_discs': {
        'Antibiotic_Disc': { type: 'select', isRelational: true, endpoint: '/lookup/antibiotics' },
        'Quntity': { type: 'number', isRelational: false, label: 'Quantity' }
    },

    // ── ext_bacteriophages (4C rack is rack_locations)
    'ext_bacteriophages': {
        '_4C_Fridge_Number': { type: 'select', isRelational: true, endpoint: '/lookup/freezers', multiSelect: false },
        '_4C_Rack_Number':   { type: 'select', isRelational: true, endpoint: '/lookup/racks', multiSelect: false }
    }
};

// Helper to get unified schema with relational metadata
async function getTableSchema(tableName, sequelize, fks) {
    try {
        const description = await sequelize.getQueryInterface().describeTable(tableName).catch(() => ({}));
        if (!description || Object.keys(description).length === 0) return [];

        // [PHASE 162] Fetch Column Comments for Laboratory Type Preservation
        const commentRows = await sequelize.query(`
            SELECT cols.column_name, pg_catalog.col_description(c.oid, cols.ordinal_position::int) as column_comment
            FROM information_schema.columns cols
            JOIN pg_class c ON c.relname = cols.table_name
            JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = cols.table_schema
            WHERE cols.table_name = $1 AND cols.table_schema = 'public'
        `, {
            bind: [tableName],
            type: Sequelize.QueryTypes.SELECT
        });

        const commentMap = {};
        commentRows.forEach(row => {
            if (row.column_comment) {
                commentMap[row.column_name] = row.column_comment.trim().toLowerCase();
            }
        });

        const schema = await Promise.all(Object.keys(description).map(async (key) => {
            const col = description[key];
            let label = key.replace(/_/g, ' ');

            // Cleanup typos/legacy labels
            if (label.toLowerCase() === 'specie') label = 'Species';
            if (label.toLowerCase() === 'quntity') label = 'Quantity';
            if (label.toLowerCase() === 'wild type recom') label = 'Wild-Type/Recomb';
            label = label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            label = label.replace(/Id$/g, '').replace(/dna/i, 'DNA').replace(/gs/i, 'GS').trim();

            let item = {
                key: key,
                label: label,
                type: (col.type || '').toString().toLowerCase().includes('int') ? 'number' : 'text',
                isRelational: false
            };

            // 1. Check LOOKUP_REGISTRY for Phase 115 Parity (Case-insensitive match)
            // [PHASE 154/155] Self-lookup safeguard & Fuzzy Matching
            const normalizeKey = (k) => k.toLowerCase().replace(/[\s-]/g, '_');
            const targetKey = normalizeKey(key);
            const regKey = Object.keys(LOOKUP_REGISTRY).find(k => normalizeKey(k) === targetKey);
            const regEntry = LOOKUP_REGISTRY[regKey];
            
            if (regEntry && regEntry.table !== tableName) {
                item.isRelational = true;
                item.endpoint = regEntry.endpoint; 
                item.type = 'select'; 
                item.multiSelect = regEntry.multiSelect === true;
            } else {
                // 2. Check for Foreign Keys (DB level fallback)
                const fk = fks.find(f => f.column_name === key);
                if (fk && !item.isRelational) {
                    item.isRelational = true;
                    item.endpoint = `/lookup/${fk.foreign_table_name.replace(/"/g, '').replace(/_/g, '-')}`;
                    item.type = 'select';
                }
            }

            // [PHASE 120] Table-specific freezer multi-select rule
            // ONLY the -final table has mixed multi/single — overrides handle it above
            // Do NOT apply a blanket A-O multiSelect rule here (breaks storage details non-final)

            // 3. Apply SCHEMA_OVERRIDES (highest priority — always last)
            if (SCHEMA_OVERRIDES[tableName] && SCHEMA_OVERRIDES[tableName][key]) {
                const ov = SCHEMA_OVERRIDES[tableName][key];
                item = { ...item, ...ov };
                if (item.type === 'select' && item.options?.length > 0 && typeof item.options[0] === 'string') {
                    item.options = item.options.map(opt => ({ value: opt, label: opt }));
                }
            }

            // [PHASE 159/160/162] Smart Media Detection & Identity Preservation
            // Priority 1: Persistent Metadata (DB Comments)
            if (commentMap[key]) {
                const labType = commentMap[key];
                if (['image', 'file', 'date', 'number', 'text'].includes(labType)) {
                    item.type = labType;
                }
            } else {
                // Priority 2: Keyword Heuristics (Legacy Fallback)
                const nameLower = key.toLowerCase();
                const isImage = ['pic', 'img', 'photo', 'image', 'scan'].some(k => nameLower.includes(k));
                const isFile = ['doc', 'pdf', 'file', 'attachment'].some(k => nameLower.includes(k));

                if (isImage) {
                    item.type = 'image';
                } else if (isFile) {
                    item.type = 'file';
                }
            }

            return item;
        }));
        return schema;
    } catch (err) {
        console.error(`[SYSTEM] Schema extraction failed for ${tableName}:`, err.message);
        return [];
    }
}

// Helper for security whitelisting
const isAllowedTable = (name) => {
    if (!name) return false;
    const whitelist = [
        'bacterial_species', 'wild_type_recomb_types', 'phage_names', 
        'lytic_lysogenic_types', 'plasmid_vectors', 'gene_sources', 
        'cloning_methods', 'manufacturers', 'stock_categories', 
        'chemical_storage_areas', 'antibiotics', 'primer_binding_organism_types',
        'available_antibiotic_discs', 'box_locations', 'rack_locations', 'freezer_locations',
        'Users', 'BiologicalAssets', 'InventoryStocks', 'StorageLocations'
    ];
    return name.startsWith('ext_') || whitelist.includes(name);
};

// @route   GET api/system/:tableName/schema
// @desc    Get ONLY schema for a specific dynamic table
router.get('/:tableName/schema', async (req, res) => {
    const { tableName } = req.params;
    if (!isAllowedTable(tableName)) return res.status(403).json({ error: 'Access denied.' });
    if (/[^a-zA-Z0-9_]/.test(tableName)) return res.status(400).json({ error: 'Invalid table name.' });

    try {
        const fks = await getForeignKeys(tableName);
        const schema = await getTableSchema(tableName, sequelize, fks);
        res.json({ tableName, schema });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET api/system/:tableName
// @desc    Get data for a specific dynamic table
router.get('/:tableName', async (req, res) => {
    const { tableName } = req.params;

    if (!isAllowedTable(tableName)) return res.status(403).json({ error: 'Access denied. Invalid table scope.' });
    if (/[^a-zA-Z0-9_]/.test(tableName)) return res.status(400).json({ error: 'Invalid table name parameter.' });

    try {
        console.log(`[SYSTEM] Fetching data/schema for table: ${tableName}`);

        const [rows, fks] = await Promise.all([
            sequelize.query(`SELECT * FROM "${tableName}" LIMIT 2000`, { type: Sequelize.QueryTypes.SELECT }),
            getForeignKeys(tableName)
        ]);


        const schema = await getTableSchema(tableName, sequelize, fks);
        
        // [PHASE 115] Perform Relational Translation on Data Rows
        const mappedData = [...rows];
        const relationalCols = schema.filter(c => c.isRelational);

        if (mappedData.length > 0 && relationalCols.length > 0) {
            for (const col of relationalCols) {
                // [PHASE 154/155] Fuzzy Resolution: Match 'Field Name' to 'Field_Name'
                const normalizeK = (k) => k.toLowerCase().replace(/[\s-]/g, '_');
                const targetK = normalizeK(col.key);
                const regK = Object.keys(LOOKUP_REGISTRY).find(k => normalizeK(k) === targetK);
                const regEntry = LOOKUP_REGISTRY[regK];
                
                // [PHASE 154] Self-resolution safeguard: Do not translate if table is its own source truth
                if (regEntry && regEntry.table !== tableName) {
                    try {
                        const lookupResults = await sequelize.query(
                            `SELECT "ID" as id, "${regEntry.col}" as label FROM "${regEntry.table}"`,
                            { type: Sequelize.QueryTypes.SELECT }
                        );
                        
                        const dict = {};
                        lookupResults.forEach(r => {
                            if (r.id !== null && r.id !== undefined) {
                                dict[String(r.id).trim()] = r.label;
                            }
                        });

                        mappedData.forEach(row => {
                            const rawVal = row[col.key];
                            if (rawVal !== null && rawVal !== undefined) {
                                // [PHASE 117/119] Support semicolon or comma-separated multi-select IDs (legacy parity)
                                const stringVal = String(rawVal).trim();
                                if (stringVal.includes(';') || (stringVal.includes(',') && !isNaN(parseInt(stringVal.split(',')[0])))) {
                                    const delimeter = stringVal.includes(';') ? ';' : ',';
                                    const ids = stringVal.split(delimeter).map(id => id.trim());
                                    const labels = ids.map(id => dict[id] || id).filter(Boolean);
                                    row[col.key] = labels.join(', ');
                                } else if (dict[stringVal]) {
                                    row[col.key] = dict[stringVal];
                                }
                            }
                        });
                    } catch (eRel) {
                        console.warn(`[SYSTEM] Relational translation failed for col ${col.key}:`, eRel.message);
                    }
                }
            }
        }

        res.json({
            tableName,
            count: mappedData.length,
            schema,
            data: mappedData,
            debug: {
                columnCount: schema.length,
                timestamp: new Date().toISOString(),
                version: 'v11_smart_dropdowns_enabled'
            }
        });

    } catch (err) {
        console.error(`Error fetching data for ${tableName}:`, err.message);
        if (err.parent && err.parent.code === '42P01') {
            return res.status(404).json({ error: 'Table not found' });
        }
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// @route   GET api/system/:tableName/:id
// @desc    Get a single raw record for form hydration
router.get('/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    if (!isAllowedTable(tableName)) return res.status(403).json({ error: 'Access denied.' });

    try {
        const result = await sequelize.query(`SELECT * FROM "${tableName}" WHERE id = $1`, {
            bind: [id],
            type: Sequelize.QueryTypes.SELECT
        });

        if (!result.length) return res.status(404).json({ error: 'Record not found' });
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   POST api/system/:tableName
// @desc    Add a record to a dynamic table
router.post('/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const data = req.body;

    if (!isAllowedTable(tableName)) {
        return res.status(403).json({ error: 'Access denied.' });
    }

    try {
        // Fetch table description to check for timestamp columns
        const description = await sequelize.getQueryInterface().describeTable(tableName);
        const hasColumn = (colName) => Object.keys(description).includes(colName);

        const payload = { ...data };

        // [SECURE] Case Correction for Lab Tasks
        if (tableName === 'ext_lab_tasks' && payload.status) {
            const statusMap = {
                'pending': 'Pending',
                'todo': 'Todo',
                'todo ': 'Todo',
                'in progress': 'In Progress',
                'review': 'Review',
                'completed': 'Completed'
            };
            const lowerStatus = payload.status.toString().toLowerCase().trim();
            if (statusMap[lowerStatus]) {
                payload.status = statusMap[lowerStatus];
            }
        }

        const now = new Date();

        // Automatic Timestamps - ONLY if they exist in the schema
        if (hasColumn('created_at') && !payload.created_at) payload.created_at = now;
        if (hasColumn('updated_at') && !payload.updated_at) payload.updated_at = now;

        // [PHASE 128] Prune null IDs to allow DB Auto-Increment to kick in
        if (payload.id === null || payload.id === undefined || payload.id === '') {
            delete payload.id;
        }

        // [PHASE 128] Manual ID Fallback for Legacy Tables (missing SERIAL sequences)
        // If id is still missing after pruning, check if we need to manual increment
        if (!payload.id) {
            try {
                const maxRes = await sequelize.query(`SELECT MAX("id") as maxid FROM "${tableName}"`, { type: Sequelize.QueryTypes.SELECT });
                const maxId = maxRes[0]?.maxid || 0;
                payload.id = Number(maxId) + 1;
                console.log(`[SYSTEM] Manual ID Assigned for ${tableName}: ${payload.id}`);
            } catch (eId) {
                console.warn(`[SYSTEM] Manual ID calculation skipped for ${tableName}:`, eId.message);
            }
        }

        const columns = Object.keys(payload).join('", "');
        const values = Object.values(payload);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO "${tableName}" ("${columns}") VALUES (${placeholders}) RETURNING *`;

        const result = await sequelize.query(query, {
            bind: values,
            type: Sequelize.QueryTypes.INSERT
        });

        const record = result[0];

        // [NOTIFICATION] Trigger for Lab Tasks
        if (tableName === 'ext_lab_tasks' && record.assigned_to_id) {
            try {
                await Notification.create({
                    user_id: record.assigned_to_id,
                    type: 'TASK_ASSIGNED',
                    message: `New Task Assigned: ${record.title}`
                });
            } catch (errNotify) {
                console.error('Task Notification Error:', errNotify.message);
            }
        }

        res.json({ success: true, record });
    } catch (err) {
        console.error('Insert Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// @route   PUT api/system/:tableName/:id
router.put('/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const data = req.body;

    if (!isAllowedTable(tableName)) return res.status(403).json({ error: 'Access denied.' });

    try {
        const description = await sequelize.getQueryInterface().describeTable(tableName);
        const hasColumn = (colName) => Object.keys(description).includes(colName);

        const payload = { ...data };

        // [SECURE] Case Correction for Lab Tasks
        if (tableName === 'ext_lab_tasks' && payload.status) {
            const statusMap = {
                'pending': 'Pending',
                'todo': 'Todo',
                'todo ': 'Todo',
                'in progress': 'In Progress',
                'review': 'Review',
                'completed': 'Completed'
            };
            const lowerStatus = payload.status.toString().toLowerCase().trim();
            if (statusMap[lowerStatus]) {
                payload.status = statusMap[lowerStatus];
            }
        }

        if (hasColumn('updated_at')) payload.updated_at = new Date();
        const updates = Object.keys(payload).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const values = Object.values(payload);

        const query = `UPDATE "${tableName}" SET ${updates} WHERE id = $${values.length + 1} RETURNING *`;

        const result = await sequelize.query(query, {
            bind: [...values, id],
            type: Sequelize.QueryTypes.UPDATE
        });

        const record = result[0];

        // [NOTIFICATION] Trigger for Lab Tasks (if assignment changed)
        if (tableName === 'ext_lab_tasks' && record.assigned_to_id && payload.assigned_to_id) {
            try {
                await Notification.create({
                    user_id: record.assigned_to_id,
                    type: 'TASK_UPDATED',
                    message: `Task Updated/Assigned: ${record.title}`
                });
            } catch (errNotify) {
                console.error('Task Update Notification Error:', errNotify.message);
            }
        }

        res.json({ success: true, record });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   POST api/system/:tableName/add-column
// @desc    Dynamic Schema Evolution (MS Access Experience)
// @access  Admin/Manager
router.post('/:tableName/add-column', async (req, res) => {
    const { tableName } = req.params;
    const { columnName, type } = req.body;

    if (!isAllowedTable(tableName)) return res.status(403).json({ error: 'Access denied.' });
    if (!columnName || /[^a-zA-Z0-9_]/.test(columnName)) return res.status(400).json({ error: 'Invalid column name (use a-z, 0-9, underscores).' });

    try {
        // [SECURE] Validate column type
        const allowedTypes = {
            'text': 'TEXT',
            'number': 'INTEGER',
            'date': 'DATE',
            'boolean': 'BOOLEAN',
            'image': 'TEXT', // Base64 Storage
            'file': 'TEXT'   // Base64/JSON Storage
        };
        const pgType = allowedTypes[type] || 'TEXT';

        // ALTER TABLE
        await sequelize.query(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${pgType}`);
        
        // [PHASE 162] Apply Column Comment for Persistent Type Identity
        try {
            // [SECURE] 'type' is validated against allowedTypes above
            await sequelize.query(`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${type}'`);
            console.log(`[SCHEMA EVOLUTION] Applied metadata comment '${type}' to ${tableName}.${columnName}`);
        } catch (commentErr) {
            console.warn(`[SCHEMA EVOLUTION] Metadata comment failed:`, commentErr.message);
        }

        console.log(`[SCHEMA EVOLUTION] Table ${tableName}: Added column ${columnName} (${type})`);
        res.json({ success: true, message: `Column '${columnName}' added successfully.` });
    } catch (err) {
        console.error('[SCHEMA EVOLUTION] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// @route   POST api/system/:tableName/delete-column
// @desc    Dynamic Schema Evolution (MS Access Experience) - DELETE
router.post('/:tableName/delete-column', async (req, res) => {
    const { tableName } = req.params;
    const { columnName } = req.body;

    if (!isAllowedTable(tableName)) return res.status(403).json({ error: 'Access denied.' });
    if (!columnName || /[^a-zA-Z0-9_]/.test(columnName)) return res.status(400).json({ error: 'Invalid column name.' });

    try {
        await sequelize.query(`ALTER TABLE "${tableName}" DROP COLUMN "${columnName}"`);
        console.log(`[SCHEMA EVOLUTION] Table ${tableName}: Dropped column ${columnName}`);
        res.json({ success: true, message: `Column '${columnName}' deleted successfully.` });
    } catch (err) {
        console.error('[SCHEMA EVOLUTION] Delete Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// @route   POST api/system/:tableName/bulk-delete
// @desc    Atomic Multiple Delete (Maintenance Accelerator)
router.post('/:tableName/bulk-delete', async (req, res) => {
    const { tableName } = req.params;
    const { ids } = req.body;

    if (!isAllowedTable(tableName)) return res.status(403).json({ error: 'Access denied.' });
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No record IDs provided for deletion.' });
    }

    try {
        // [SECURE] Validate that all IDs are numbers (or sanitized strings)
        const sanitizedIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        if (sanitizedIds.length === 0) return res.status(400).json({ error: 'No valid numeric IDs found.' });

        console.log(`[SYSTEM] Bulk Deletion Request for ${tableName}: ${sanitizedIds.length} records.`);
        
        await sequelize.query(`DELETE FROM "${tableName}" WHERE id IN (${sanitizedIds.join(',')})`, {
            type: Sequelize.QueryTypes.DELETE
        });

        res.json({ success: true, count: sanitizedIds.length });
    } catch (err) {
        console.error('[SYSTEM] Bulk Delete Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// @route   DELETE api/system/:tableName/:id
router.delete('/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    if (!isAllowedTable(tableName)) return res.status(403).json({ error: 'Access denied.' });

    try {
        await sequelize.query(`DELETE FROM "${tableName}" WHERE id = $1`, {
            bind: [id],
            type: Sequelize.QueryTypes.DELETE
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;