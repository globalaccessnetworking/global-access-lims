const { Chemical, InventoryStock } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

exports.lookupAsset = async (req, res) => {
    const { identity } = req.query;

    if (!identity) {
        return res.status(400).json({ success: false, message: 'No identity provided' });
    }

    try {
        // 1. Check for INV- Prefix (Inventory / Chemicals)
        if (identity.startsWith('INV-')) {
            const cleanId = identity.replace('INV-', '');
            const parts = cleanId.split('-'); // e.g., Name-ID or just ID
            const dbId = parts[parts.length - 1];

            // Try Chemical first
            let asset = await Chemical.findOne({
                where: {
                    [Op.or]: [
                        { id: isNaN(dbId) ? -1 : dbId },
                        { qr_identity_string: identity },
                        { barcode: cleanId }
                    ]
                }
            });

            if (asset) {
                return res.json({ success: true, type: 'INV', asset });
            }

            // Try InventoryStock
            asset = await InventoryStock.findOne({
                where: {
                    [Op.or]: [
                        { id: isNaN(dbId) ? -1 : dbId },
                        { qr_identity_string: identity },
                        { catalog_number: cleanId }
                    ]
                }
            });

            if (asset) {
                return res.json({ success: true, type: 'INV', asset: { ...asset.toJSON(), name: asset.item_name } });
            }
        }

        // 2. Check for BIO- Prefix (Strains / Phages / Primers)
        if (identity.startsWith('BIO-')) {
            const cleanId = identity.replace('BIO-', '');
            const parts = cleanId.split('-');
            const dbId = parts[parts.length - 1];

            // Query BIO Library tables
            const bioQuery = `
                SELECT * FROM (
                    SELECT 'strain' as bio_type, id, "Strain_No" as name FROM "ext_bacterial_strains"
                    UNION ALL
                    SELECT 'phage' as bio_type, id, "Bacteriophage_Name" as name FROM "ext_bacteriophages"
                    UNION ALL
                    SELECT 'primer' as bio_type, id, "Primer_Name" as name FROM "ext_primers_details"
                ) as unified
                WHERE id = :dbId OR name = :cleanId
                LIMIT 1
            `;

            const bioAsset = await sequelize.query(bioQuery, {
                replacements: { dbId: isNaN(dbId) ? -1 : dbId, cleanId },
                type: QueryTypes.SELECT
            });

            if (bioAsset.length > 0) {
                return res.json({ success: true, type: 'BIO', asset: bioAsset[0] });
            }
        }

        // 3. Fallback for legacy IDs (unprefixed)
        // Check Chemical
        let fallback = await Chemical.findOne({ where: { [Op.or]: [{ id: isNaN(identity) ? -1 : identity }, { barcode: identity }] } });
        if (fallback) return res.json({ success: true, type: 'INV', asset: fallback });

        // Check Bio library legacy search
        const legacyBio = await sequelize.query(`
            SELECT 'strain' as bio_type, id, "Strain_No" as name FROM "ext_bacterial_strains" WHERE "Strain_No" = :id LIMIT 1
        `, { replacements: { id: identity }, type: QueryTypes.SELECT });
        if (legacyBio.length > 0) return res.json({ success: true, type: 'BIO', asset: legacyBio[0] });

        res.json({ success: false, message: 'Asset not found in Digital Bio-Vault' });

    } catch (err) {
        console.error('QR Lookup Error:', err.message);
        res.status(500).json({ success: false, error: 'Identification system error' });
    }
};
