const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * GET /api/scan/resolve/:code
 * Universal Resolver — handles both LIMS UIDs and manufacturer barcodes
 */
router.get('/resolve/:code', auth, async (req, res) => {
    const { code } = req.params;
    if (!code) return res.status(400).json({ success: false, message: 'No code provided' });

    const clean = code.trim();

    try {
        // ────────────────────────────────────────────────────────────
        // TIER 1: In-House LIMS Biological QR Codes (LIMS-PHG-52, etc.)
        // ────────────────────────────────────────────────────────────
        if (clean.startsWith('LIMS-')) {
            const parts = clean.split('-'); // ['LIMS', 'PHG', '52']
            const typeCode = parts[1];
            const id = parseInt(parts[2]);

            if (typeCode === 'PHG' && id) {
                const [rows] = await sequelize.query(
                    `SELECT id, "Bacteriophage_Name" AS name, "Host_Bacteria" AS host, "WT_RECOMB" AS wt_recomb,
                            "Plaque_Morphology" AS morphology, "Genome_Size" AS genome_size,
                            "GS_Freezer_Name" AS freezer, "GS_Box_details" AS box,
                            "GS_position_in_Box" AS position, "Glycerol_Stock_tube_Label" AS tube_label
                     FROM ext_bacteriophages WHERE id = :id`,
                    { replacements: { id }, type: QueryTypes.SELECT }
                );
                if (rows) return res.json({ success: true, asset_type: 'PHAGE', uid: clean, details: rows });
            }

            if (typeCode === 'STR' && id) {
                const [rows] = await sequelize.query(
                    `SELECT id, "Strain_No" AS name, "Specie" AS species, "Wild_type_Recom" AS wt_recomb,
                            "Antibiotic_sensitivity" AS sensitivity, "Antibiotic_resistance" AS resistance,
                            "GS_Freezer_Number" AS freezer, "GS_Box_details" AS box,
                            "Location_in_Box_GS" AS position, "Glycerol_Stock_tube_label" AS tube_label
                     FROM ext_bacterial_strains WHERE id = :id`,
                    { replacements: { id }, type: QueryTypes.SELECT }
                );
                if (rows) return res.json({ success: true, asset_type: 'BACTERIA', uid: clean, details: rows });
            }

            if (typeCode === 'PLAS' && id) {
                const [rows] = await sequelize.query(
                    `SELECT id, "Plasmid_Name" AS name, "Plasmid_Backbone" AS backbone,
                            "Gene_Source" AS gene_source, "Antibiotic_Marker" AS marker,
                            "GLycerol_Stock_Freezer" AS freezer, "Glycerol_Stock_Box" AS box,
                            "Location_in_Box_GS" AS position, "Glycerol_Stock_Tube_Label" AS tube_label
                     FROM ext_plasmids WHERE id = :id`,
                    { replacements: { id }, type: QueryTypes.SELECT }
                );
                if (rows) return res.json({ success: true, asset_type: 'PLASMID', uid: clean, details: rows });
            }

            if (typeCode === 'PRM' && id) {
                const [rows] = await sequelize.query(
                    `SELECT id, "Primer_Name" AS name, "DNA_sequence" AS sequence, "Purpose" AS purpose,
                            "Freezer" AS freezer, "Box_detail" AS box, "Location_in_Box" AS position
                     FROM ext_primers_details WHERE id = :id`,
                    { replacements: { id }, type: QueryTypes.SELECT }
                );
                if (rows) return res.json({ success: true, asset_type: 'PRIMER', uid: clean, details: rows });
            }

            if (typeCode === 'INV' && id) {
                const [rows] = await sequelize.query(
                    `SELECT id, "Item_Name" AS name, "Manufacturer" AS manufacturer,
                            "Pack_Size" AS pack_size, "Category" AS category,
                            "Available_Quantity" AS current_quantity, "Location_Area" AS location_area,
                            "Location_shelf" AS location_shelf, "Location_details" AS location_details,
                            "barcode" AS barcode
                     FROM ext_lab_stock WHERE id = :id`,
                    { replacements: { id }, type: QueryTypes.SELECT }
                );
                if (rows) return res.json({ success: true, asset_type: 'INVENTORY', uid: clean, details: rows });
            }
        }

        // ────────────────────────────────────────────────────────────
        // TIER 2: Manufacturer Barcode (UPC/EAN/Custom) on chemicals
        // ────────────────────────────────────────────────────────────
        const [barcodeRow] = await sequelize.query(
            `SELECT id, "Item_Name" AS name, "Manufacturer" AS manufacturer,
                    "Pack_Size" AS pack_size, "Category" AS category,
                    "Available_Quantity" AS current_quantity, "Location_Area" AS location_area,
                    "Location_shelf" AS location_shelf, "Location_details" AS location_details,
                    "barcode" AS barcode
             FROM ext_lab_stock
             WHERE "barcode" = :code OR "Cat__" = :code
             LIMIT 1`,
            { replacements: { code: clean }, type: QueryTypes.SELECT }
        );
        if (barcodeRow) {
            return res.json({ success: true, asset_type: 'INVENTORY', uid: `LIMS-INV-${barcodeRow.id}`, details: barcodeRow });
        }

        // ────────────────────────────────────────────────────────────
        // TIER 3: Fuzzy name match (last resort)
        // ────────────────────────────────────────────────────────────
        const [fuzzyRow] = await sequelize.query(
            `SELECT id, "Item_Name" AS name, "Manufacturer" AS manufacturer,
                    "Pack_Size" AS pack_size, "Category" AS category,
                    "Available_Quantity" AS current_quantity, "Location_Area" AS location_area,
                    "Location_shelf" AS location_shelf, "Location_details" AS location_details,
                    "barcode" AS barcode
             FROM ext_lab_stock
             WHERE LOWER("Item_Name") LIKE LOWER(:code)
             LIMIT 1`,
            { replacements: { code: `%${clean}%` }, type: QueryTypes.SELECT }
        );
        if (fuzzyRow) {
            return res.json({ success: true, asset_type: 'INVENTORY', uid: `LIMS-INV-${fuzzyRow.id}`, details: fuzzyRow });
        }

        // Nothing found
        return res.json({ success: false, message: 'Asset not found in LIMS vault', scanned_code: clean });

    } catch (err) {
        console.error('Universal Scan Resolver Error:', err);
        res.status(500).json({ success: false, error: 'Resolver engine error', detail: err.message });
    }
});

/**
 * POST /api/scan/adjust-quantity
 * Atomically adjust inventory quantity (add or subtract)
 */
router.post('/adjust-quantity', auth, async (req, res) => {
    const { item_id, delta, action_type = 'CONSUME', notes = '' } = req.body;
    if (!item_id || delta === undefined) {
        return res.status(400).json({ success: false, message: 'item_id and delta required' });
    }

    const t = await sequelize.transaction();
    try {
        // Lock the row
        const [current] = await sequelize.query(
            `SELECT id, "Item_Name", "Available_Quantity" FROM ext_lab_stock WHERE id = :id FOR UPDATE`,
            { replacements: { id: item_id }, type: QueryTypes.SELECT, transaction: t }
        );
        if (!current) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        const oldQty = parseFloat(current.Available_Quantity) || 0;
        const newQty = Math.max(0, oldQty + parseFloat(delta));

        await sequelize.query(
            `UPDATE ext_lab_stock SET "Available_Quantity" = :newQty WHERE id = :id`,
            { replacements: { newQty, id: item_id }, transaction: t }
        );

        // Write to audit log
        try {
            await sequelize.query(
                `INSERT INTO system_audit_logs (action, table_name, record_id, details, created_at)
                 VALUES (:action, 'ext_lab_stock', :id, :details::jsonb, NOW())`,
                {
                    replacements: {
                        action: action_type,
                        id: item_id,
                        details: JSON.stringify({ item: current.Item_Name, old_qty: oldQty, new_qty: newQty, delta, notes })
                    },
                    transaction: t
                }
            );
        } catch (auditErr) {
            console.warn('Audit log failed (non-fatal):', auditErr.message);
        }

        await t.commit();
        res.json({
            success: true,
            message: `Quantity updated: ${oldQty} → ${newQty}`,
            old_quantity: oldQty,
            new_quantity: newQty,
            item_name: current.Item_Name
        });

    } catch (err) {
        await t.rollback();
        console.error('Quantity adjustment failed:', err);
        res.status(500).json({ success: false, error: 'Failed to adjust quantity', detail: err.message });
    }
});

/**
 * POST /api/scan/link-barcode
 * Link an unknown manufacturer barcode to an existing inventory item
 */
router.post('/link-barcode', auth, async (req, res) => {
    const { item_id, barcode } = req.body;
    if (!item_id || !barcode) {
        return res.status(400).json({ success: false, message: 'item_id and barcode required' });
    }
    try {
        await sequelize.query(
            `UPDATE ext_lab_stock SET "barcode" = :barcode WHERE id = :id`,
            { replacements: { barcode, id: item_id } }
        );
        res.json({ success: true, message: `Barcode ${barcode} linked to item #${item_id}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
