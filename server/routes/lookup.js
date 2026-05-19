const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Sequelize } = require('sequelize');
const db = require('../models');

/**
 * Universal Lookup API — Phase 113
 * Returns { id, label } pairs for all relational dropdown fields
 * Mirrors Microsoft Access "Lookup Field" behavior
 * Column names are verified against actual PostgreSQL ext_ tables
 */

const rawQ = async (sql) => {
    const rows = await db.sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT });
    return rows.map(r => Array.isArray(r) ? { id: r[0], label: r[1] } : r);
};

// ─── Bacterial Strains ─────────────────────────────────────────────────────

// Species (24 entries) — bacterial_species.Species
router.get('/species', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Species" as label FROM "bacterial_species" WHERE "Species" IS NOT NULL ORDER BY "Species"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Wild-type / Recombinant — wild_type_recomb_types.Field1
router.get('/wild-type-recomb', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Field1" as label FROM "wild_type_recomb_types" WHERE "Field1" IS NOT NULL ORDER BY "ID"`);
        res.json(data);
    } catch (err) {
        res.json([{ id: "1", label: 'Wild-type' }, { id: "2", label: 'Recomb' }]);
    }
});

// ─── Bacteriophage ────────────────────────────────────────────────────────

// Phage names (55 entries) — phage_names.Bacteriophage_Name
router.get('/phage-names', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Bacteriophage_Name" as label FROM "phage_names" WHERE "Bacteriophage_Name" IS NOT NULL ORDER BY "Bacteriophage_Name"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lytic / Lysogenic types — lytic_lysogenic_types.Type
router.get('/lytic-types', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Type" as label FROM "lytic_lysogenic_types" WHERE "Type" IS NOT NULL ORDER BY "ID"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Plasmids ─────────────────────────────────────────────────────────────

// Plasmid vectors/backbone (18 entries) — plasmid_vectors.Plasmid_Name
router.get('/plasmid-vectors', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Plasmid_Name" as label FROM "plasmid_vectors" WHERE "Plasmid_Name" IS NOT NULL ORDER BY "Plasmid_Name"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Gene sources (8 entries) — gene_sources.Donar_DNA_detail
router.get('/gene-sources', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Donar_DNA_detail" as label FROM "gene_sources" WHERE "Donar_DNA_detail" IS NOT NULL ORDER BY "Donar_DNA_detail"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cloning methods (5 entries) — cloning_methods.Cloninig_Method
router.get('/cloning-methods', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Cloninig_Method" as label FROM "cloning_methods" WHERE "Cloninig_Method" IS NOT NULL ORDER BY "ID"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Lab Stock / Inventory ─────────────────────────────────────────────────

// Manufacturers (66 entries) — manufacturers.Manufacturers
router.get('/manufacturers', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Manufacturers" as label FROM "manufacturers" WHERE "Manufacturers" IS NOT NULL ORDER BY "Manufacturers"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stock categories (8 entries) — stock_categories.Category
router.get('/stock-categories', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Category" as label FROM "stock_categories" WHERE "Category" IS NOT NULL ORDER BY "Category"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chemical storage areas — chemical_storage_areas.Storage_Area
router.get('/storage-areas', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Storage_Area" as label FROM "chemical_storage_areas" WHERE "Storage_Area" IS NOT NULL ORDER BY "Storage_Area"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Freezers (8 entries) — freezer_locations.Freezer
router.get('/freezers', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Freezer" as label FROM "freezer_locations" WHERE "Freezer" IS NOT NULL ORDER BY "Freezer"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Racks (428 entries) — rack_locations.Rack_No
router.get('/racks', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Rack_No" as label FROM "rack_locations" WHERE "Rack_No" IS NOT NULL ORDER BY "ID"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Boxes (122 entries) — box_locations.Box_detail
router.get('/boxes', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Box_detail" as label FROM "box_locations" WHERE "Box_detail" IS NOT NULL ORDER BY "ID"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Antibiotics ───────────────────────────────────────────────────────────

// Antibiotics (83 entries) — antibiotics
router.get('/antibiotics', async (req, res) => {
    try {
        const data = await rawQ(
            `SELECT "ID" as id, "Complete_Name" as label FROM "antibiotics" WHERE "Complete_Name" IS NOT NULL ORDER BY "Complete_Name"`
        );
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Primers ───────────────────────────────────────────────────────────

// Primer Binding Targets (Bacteria, Phage, Plasmid)
router.get('/primer-binding-types', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Field1" as label FROM "primer_binding_organism_types" ORDER BY "ID"`);
        res.json(data);
    } catch (err) {
        res.json([{ id: "1", label: 'Bacteria' }, { id: "2", label: 'Phage' }, { id: "3", label: 'Plasmid' }]);
    }
});

router.get('/binding-types', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Field1" as label FROM "primer_binding_organism_types" ORDER BY "ID"`);
        res.json(data);
    } catch (err) {
        res.json([{ id: "1", label: 'Bacteria' }, { id: "2", label: 'Phage' }, { id: "3", label: 'Plasmid' }]);
    }
});

// Host Bacteria (New Repository Phase 166)
router.get('/host-bacteria', async (req, res) => {
    try {
        const data = await rawQ(`SELECT id, "Host_Bacteria_No" as label FROM "ext_host_bacteria" WHERE "Host_Bacteria_No" IS NOT NULL ORDER BY "Host_Bacteria_No"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bacteria / Bacterial Strains
router.get('/bacteria', async (req, res) => {
    try {
        const data = await rawQ(`SELECT id, "Strain_No" as label FROM "ext_bacterial_strains" WHERE "Strain_No" IS NOT NULL ORDER BY "Strain_No"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Phages
router.get('/phages', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Bacteriophage_Name" as label FROM "phage_names" ORDER BY "Bacteriophage_Name"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Plasmids
router.get('/plasmids', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Plasmid_Name" as label FROM "plasmid_vectors" ORDER BY "Plasmid_Name"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// All Assets (Bacterial Strains) for generic mapping — Uses serial id
router.get('/all-assets', async (req, res) => {
    try {
        const data = await rawQ(`SELECT id, "strain_number" as label FROM "BiologicalAssets" ORDER BY "strain_number"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Legacy Strains (for resolving historical Host Bacteria IDs 1345, 602, etc)
router.get('/all-strains', async (req, res) => {
    try {
        const data = await rawQ(`SELECT id, "Strain_No" as label FROM "ext_bacterial_strains" WHERE "Strain_No" IS NOT NULL ORDER BY "Strain_No"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// All Phages — Uses legacy ID string
router.get('/all-phages', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Bacteriophage_Name" as label FROM "phage_names" ORDER BY "Bacteriophage_Name"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// All Plasmids — Uses legacy ID string
router.get('/all-plasmids', async (req, res) => {
    try {
        const data = await rawQ(`SELECT "ID" as id, "Plasmid_Name" as label FROM "plasmid_vectors" ORDER BY "Plasmid_Name"`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Metadata Management ──────────────────────────────────────────────────

// Projects
router.get('/projects', async (req, res) => {
    try {
        const data = await rawQ(`SELECT id, name as label FROM "ext_lab_projects" ORDER BY name`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Users
router.get('/users', async (req, res) => {
    try {
        const data = await rawQ(`SELECT id, username as label FROM "Users" ORDER BY username`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Asset Types (for BiologicalAssets filtering/dropdowns)
router.get('/asset-types', async (req, res) => {
    try {
        const data = await rawQ(`SELECT DISTINCT type as id, type as label FROM "BiologicalAssets" WHERE type IS NOT NULL ORDER BY type`);
        res.json(data);
    } catch (err) {
        res.json([{ id: 'Phage', label: 'Phage' }, { id: 'Strain', label: 'Strain' }, { id: 'Plasmid', label: 'Plasmid' }]);
    }
});
// ─── Dynamic Architect Binder ───────────────────────────────────────────

/**
 * Dynamic Lookup logic for the Form Architect.
 * Allows user-created forms to bond with any registry table.
 */
router.get('/dynamic/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const { labelCol } = req.query;

    // Security Whitelist (Allow ext_ tables and legacy clinical tables)
    const allowedPrefixes = ['ext_', 'bacterial_', 'phage_', 'plasmid_', 'manufacturers'];
    const isAllowed = allowedPrefixes.some(p => tableName.startsWith(p));

    if (!isAllowed) return res.status(403).json({ error: 'Access Denied to target registry' });

    try {
        // Attempt to find a suitable label column if not provided
        let targetLabel = labelCol;
        if (!targetLabel) {
            const description = await db.sequelize.getQueryInterface().describeTable(tableName);
            const cols = Object.keys(description);
            targetLabel = cols.find(c => ['title', 'name', 'label', 'Species', 'Bacteriophage_Name', 'Manufacturers'].some(n => c.toLowerCase().includes(n.toLowerCase()))) || cols[0];
        }

        const data = await rawQ(`SELECT id, "${targetLabel}" as label FROM "${tableName}" WHERE "${targetLabel}" IS NOT NULL LIMIT 1000`);
        res.json(data);
    } catch (err) {
        console.error('[LOOKUP DEBUG] Dynamic Error:', err.message);
        res.status(500).json({ error: 'Relational binding failed. Please check table name.' });
    }
});

module.exports = router;
