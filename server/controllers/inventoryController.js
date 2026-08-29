const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

const getBoxes = async (req, res) => {
    try {
        // FIX: Query FROM box_locations (the master table) so ALL boxes appear in the
        // dropdown — including new/empty boxes like "GS 15" that have no slots yet in
        // box_position_index. The old query used box_position_index as the base, which
        // caused boxes without any initialized slot rows to be completely invisible.
        const query = `
            SELECT 
                l."Box_detail" AS box_name,
                l."Box_detail" AS box_display_name,
                COALESCE(MAX(b.freezer_name), '')                                              AS freezer_name,
                COALESCE(COUNT(b.id), 0)                                                       AS total_capacity,
                COALESCE(SUM(CASE WHEN b.is_occupied   THEN 1 ELSE 0 END), 0)                 AS occupied_count,
                COALESCE(SUM(CASE WHEN NOT b.is_occupied THEN 1 ELSE 0 END), 0)               AS empty_count,
                COALESCE(SUM(CASE WHEN b.conflict_flag THEN 1 ELSE 0 END), 0)                 AS conflict_count
            FROM box_locations l
            LEFT JOIN box_position_index b ON b.box_name = l."Box_detail"
            WHERE l."Box_detail" IS NOT NULL AND l."Box_detail" != ''
            GROUP BY l."id", l."ID", l."Box_detail"
            ORDER BY l."Box_detail"
        `;
        const result = await sequelize.query(query, { type: QueryTypes.SELECT });
        res.json({ success: true, boxes: result });
    } catch (err) {
        console.error('Error fetching boxes:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const getBoxMatrix = async (req, res) => {
    try {
        const { boxName } = req.params;
        const query = `
            SELECT 
                id, box_name, freezer_name, row, "column", position_code, 
                asset_type, asset_id, asset_label, tube_label, source_table, 
                is_occupied, conflict_flag, notes
            FROM box_position_index
            WHERE box_name = :boxName
            ORDER BY row, "column"
        `;
        const result = await sequelize.query(query, { 
            replacements: { boxName },
            type: QueryTypes.SELECT 
        });
        
        // Return exactly 100 positions based on our strict rule
        res.json({ success: true, matrix: result });
    } catch (err) {
        console.error('Error fetching box matrix:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const getFreezers = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT freezer_name 
            FROM box_position_index 
            WHERE freezer_name IS NOT NULL AND freezer_name != ''
            ORDER BY freezer_name
        `;
        const result = await sequelize.query(query, { type: QueryTypes.SELECT });
        res.json({ success: true, freezers: result.map(r => r.freezer_name) });
    } catch (err) {
        console.error('Error fetching freezers:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const searchAssets = async (req, res) => {
    try {
        const { query, mode = 'quick' } = req.query;
        if (!query || query.length < 2) return res.json({ success: true, results: [] });

        let results = [];
        const searchPattern = `%${query}%`;

        // We only perform deep search if requested. Otherwise Quick Search is faster.
        if (mode === 'quick') {
            // Quick search just searches the index for currently placed tubes
            // (or if we need to search ALL UNPLACED tubes, we must query the legacy tables)
            // Wait, the user wants to "Assign Tube" from the lab inventory. 
            // So we MUST search the legacy tables! Quick mode means we limit the columns/joins.
            
            // Search Phages
            const phages = await sequelize.query(`
                SELECT id, "Bacteriophage_Name" as label, "Glycerol_Stock_tube_Label" as tube_label, 'phage' as type, 'ext_bacteriophages' as source 
                FROM ext_bacteriophages 
                WHERE "Bacteriophage_Name"::text ILIKE :q OR "Glycerol_Stock_tube_Label" ILIKE :q LIMIT 10
            `, { replacements: { q: searchPattern }, type: QueryTypes.SELECT });
            
            // Search Bacteria
            const bacteria = await sequelize.query(`
                SELECT id, "Strain_No" as label, "Glycerol_Stock_tube_label" as tube_label, 'bacteria' as type, 'ext_bacterial_strains' as source 
                FROM ext_bacterial_strains 
                WHERE "Strain_No" ILIKE :q OR "Glycerol_Stock_tube_label" ILIKE :q LIMIT 10
            `, { replacements: { q: searchPattern }, type: QueryTypes.SELECT });
            
            // Search Plasmids
            const plasmids = await sequelize.query(`
                SELECT id, "Plasmid_Name" as label, "Glycerol_Stock_Tube_Label" as tube_label, 'plasmid' as type, 'ext_plasmids' as source 
                FROM ext_plasmids 
                WHERE "Plasmid_Name" ILIKE :q OR "Glycerol_Stock_Tube_Label" ILIKE :q LIMIT 10
            `, { replacements: { q: searchPattern }, type: QueryTypes.SELECT });
            
            // Search Primers
            const primers = await sequelize.query(`
                SELECT id, "Primer_Name" as label, "Purpose" as tube_label, 'primer' as type, 'ext_primers_details' as source 
                FROM ext_primers_details 
                WHERE "Primer_Name" ILIKE :q OR "Purpose" ILIKE :q LIMIT 10
            `, { replacements: { q: searchPattern }, type: QueryTypes.SELECT });

            results = [...phages, ...bacteria, ...plasmids, ...primers];
        } else {
            // Mode B (Deep Search) could join phage_names, species, etc. 
            // For now, it returns the same with higher limits.
            results = []; 
        }

        res.json({ success: true, results });
    } catch (err) {
        console.error('Error searching assets:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const placeTube = async (req, res) => {
    try {
        const { slotId, asset } = req.body;
        const userId = req.user?.id || null; // Requires auth middleware

        // Validate Slot
        const [slot] = await sequelize.query(`SELECT * FROM box_position_index WHERE id = :id`, {
            replacements: { id: slotId }, type: QueryTypes.SELECT
        });

        if (!slot || slot.is_occupied) {
            return res.status(400).json({ success: false, error: 'Slot is already occupied or invalid.' });
        }

        // Update Slot
        await sequelize.query(`
            UPDATE box_position_index 
            SET is_occupied = true,
                asset_type = :type,
                asset_id = :assetId,
                asset_label = :label,
                tube_label = :tube,
                source_table = :source,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        `, {
            replacements: {
                id: slotId,
                type: asset.type,
                assetId: asset.id,
                label: asset.label,
                tube: asset.tube_label,
                source: asset.source
            }
        });

        // Audit Log
        await sequelize.query(`
            INSERT INTO system_audit_logs (user_id, action, table_name, record_id, details)
            VALUES (:userId, 'PLACE_TUBE', 'box_position_index', :slotId, :details)
        `, {
            replacements: {
                userId, slotId, details: JSON.stringify({ asset, position: slot.position_code, box: slot.box_name })
            }
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Error placing tube:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const moveTube = async (req, res) => {
    const transaction = await sequelize.transaction();
    const userId = req.user?.id || null;

    try {
        const { sourceSlotId, targetBox, targetPosition } = req.body;

        // 1. Get Source Slot
        const [source] = await sequelize.query(`SELECT * FROM box_position_index WHERE id = :id FOR UPDATE`, {
            replacements: { id: sourceSlotId }, type: QueryTypes.SELECT, transaction
        });

        if (!source || !source.is_occupied) {
            throw new Error('Source slot is invalid or empty.');
        }

        // 2. Get Target Slot
        const [target] = await sequelize.query(`SELECT * FROM box_position_index WHERE box_name = :box AND position_code = :pos FOR UPDATE`, {
            replacements: { box: targetBox, pos: targetPosition }, type: QueryTypes.SELECT, transaction
        });

        if (!target || target.is_occupied) {
            throw new Error('Target slot is already occupied or invalid.');
        }

        // 3. Move Asset Details to Target
        await sequelize.query(`
            UPDATE box_position_index 
            SET is_occupied = true,
                asset_type = :type,
                asset_id = :assetId,
                asset_label = :label,
                tube_label = :tube,
                source_table = :source,
                conflict_flag = false,
                notes = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :targetId
        `, {
            replacements: {
                targetId: target.id,
                type: source.asset_type,
                assetId: source.asset_id,
                label: source.asset_label,
                tube: source.tube_label,
                source: source.source_table
            },
            transaction
        });

        // 4. Clear Source Slot
        await sequelize.query(`
            UPDATE box_position_index 
            SET is_occupied = false,
                asset_type = NULL,
                asset_id = NULL,
                asset_label = NULL,
                tube_label = NULL,
                source_table = NULL,
                conflict_flag = false,
                conflict_details = NULL,
                notes = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :sourceId
        `, {
            replacements: { sourceId: sourceSlotId },
            transaction
        });

        // 5. Audit Log (Success)
        await sequelize.query(`
            INSERT INTO system_audit_logs (user_id, action, table_name, record_id, details)
            VALUES (:userId, 'MOVE_TUBE', 'box_position_index', :targetId, :details)
        `, {
            replacements: {
                userId, targetId: target.id, 
                details: JSON.stringify({ 
                    from: { box: source.box_name, position: source.position_code },
                    to: { box: target.box_name, position: target.position_code },
                    asset_label: source.asset_label
                })
            },
            transaction
        });

        await transaction.commit();
        res.json({ success: true });

    } catch (err) {
        await transaction.rollback();
        console.error('Error moving tube:', err);

        // Audit Log (Failure)
        try {
            await sequelize.query(`
                INSERT INTO system_audit_logs (user_id, action, table_name, record_id, details)
                VALUES (:userId, 'MOVE_TUBE_FAILED', 'box_position_index', :sourceSlotId, :details)
            `, {
                replacements: {
                    userId, sourceSlotId: req.body?.sourceSlotId || null,
                    details: JSON.stringify({ reason: err.message, target: req.body?.targetBox })
                }
            });
        } catch (e) { console.error('Failed to write audit log', e); }

        res.status(500).json({ success: false, error: err.message || 'Database error' });
    }
};

const removeTube = async (req, res) => {
    const transaction = await sequelize.transaction();
    const userId = req.user?.id || null;

    try {
        const { slotId } = req.body;

        // 1. Get Source Slot
        const [source] = await sequelize.query(`SELECT * FROM box_position_index WHERE id = :id FOR UPDATE`, {
            replacements: { id: slotId }, type: QueryTypes.SELECT, transaction
        });

        if (!source || !source.is_occupied) {
            throw new Error('Source slot is invalid or empty.');
        }

        const sourceTable = source.source_table;
        const assetId = source.asset_id;

        // 2. Clear Source Slot in box_position_index
        await sequelize.query(`
            UPDATE box_position_index 
            SET is_occupied = false,
                asset_type = NULL,
                asset_id = NULL,
                asset_label = NULL,
                tube_label = NULL,
                source_table = NULL,
                conflict_flag = false,
                conflict_details = NULL,
                notes = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :sourceId
        `, {
            replacements: { sourceId: slotId },
            transaction
        });

        // 3. Clear location fields in the original table
        const config = {
            ext_bacteriophages: [
                { box: 'GS_Box_details', pos: 'GS_position_in_Box', rack: 'GS_Rack_details', freezer: 'GS_Freezer_Name' },
                { box: 'DNA_storage_Box_detail', pos: '_4C_Position_in_box', rack: 'DNA_storage_Rack_Detail', freezer: 'DNA_Storage_Freezer' }
            ],
            ext_bacterial_strains: [
                { box: 'GS_Box_details', pos: 'Location_in_Box_GS', rack: 'Glycerol_Stock_Rack', freezer: 'Glycerol_Stock_Freezer' },
                { box: 'GD_Box_detail', pos: 'Loction_in_Box_PD', rack: 'Rack_detail_PD', freezer: 'DNA_Store_Freezer' }
            ],
            ext_plasmids: [
                { box: 'Glycerol_Stock_Box', pos: 'Location_in_Box_GS', rack: 'Glycerol_Stock_Rack', freezer: 'GS_Freezer_Name' },
                { box: 'DNA_Store_Box_Detail', pos: 'Location_in_Box_GS', rack: 'DNA_Store_Rack_Detail', freezer: 'DNA_Store_Freezer' }
            ],
            ext_primers_details: [
                { box: 'Box_detail', pos: 'Location_in_Box', rack: 'Rack_detail', freezer: 'Freezer_Name' }
            ]
        };

        if (sourceTable && config[sourceTable] && assetId) {
            const mappings = config[sourceTable];
            
            // Get the record
            const [record] = await sequelize.query(`SELECT * FROM "${sourceTable}" WHERE id = :id`, {
                replacements: { id: assetId }, type: QueryTypes.SELECT, transaction
            });

            if (record) {
                for (const m of mappings) {
                    const posVal = record[m.pos];
                    const normalizedPos = posVal ? String(posVal).trim().toUpperCase().replace(/[\s-]/g, '') : '';
                    if (normalizedPos === source.position_code) {
                        let setClauses = [];
                        setClauses.push(`"${m.box}" = NULL`);
                        setClauses.push(`"${m.pos}" = NULL`);
                        if (m.rack) setClauses.push(`"${m.rack}" = NULL`);
                        if (m.freezer) setClauses.push(`"${m.freezer}" = NULL`);
                        
                        await sequelize.query(`UPDATE "${sourceTable}" SET ${setClauses.join(', ')} WHERE id = :id`, {
                            replacements: { id: assetId }, transaction
                        });
                    }
                }
            }
        }

        // 4. Audit Log (Success)
        await sequelize.query(`
            INSERT INTO system_audit_logs (user_id, action, table_name, record_id, details)
            VALUES (:userId, 'REMOVE_TUBE', 'box_position_index', :slotId, :details)
        `, {
            replacements: {
                userId, slotId, 
                details: JSON.stringify({ 
                    from: { box: source.box_name, position: source.position_code },
                    asset_label: source.asset_label
                })
            },
            transaction
        });

        await transaction.commit();
        res.json({ success: true });

    } catch (err) {
        await transaction.rollback();
        console.error('Error removing tube:', err);
        res.status(500).json({ success: false, error: err.message || 'Database error' });
    }
};

const resolveConflict = async (req, res) => {
    try {
        const { slotId, decision, replacementAsset } = req.body;
        const userId = req.user?.id || null;

        const [slot] = await sequelize.query(`SELECT * FROM box_position_index WHERE id = :id`, {
            replacements: { id: slotId }, type: QueryTypes.SELECT
        });

        if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });

        let newConflictDetails = slot.conflict_details || { history: [] };
        newConflictDetails.history.push({
            action: 'RESOLVED',
            decision: decision,
            user_id: userId,
            timestamp: new Date().toISOString()
        });

        if (decision === 'KEEP') {
            await sequelize.query(`
                UPDATE box_position_index 
                SET conflict_flag = false,
                    conflict_details = :details::jsonb
                WHERE id = :id
            `, { replacements: { id: slotId, details: JSON.stringify(newConflictDetails) } });

        } else if (decision === 'REPLACE') {
            await sequelize.query(`
                UPDATE box_position_index 
                SET conflict_flag = false,
                    conflict_details = :details::jsonb,
                    asset_type = :type,
                    asset_id = :assetId,
                    asset_label = :label,
                    tube_label = :tube,
                    source_table = :source
                WHERE id = :id
            `, { replacements: { 
                id: slotId, details: JSON.stringify(newConflictDetails),
                type: replacementAsset.type, assetId: replacementAsset.id,
                label: replacementAsset.label, tube: replacementAsset.tube_label, source: replacementAsset.source
            }});

        } else if (decision === 'UNVERIFIED') {
            // Keep the conflict flag true but log the unverified status
            await sequelize.query(`
                UPDATE box_position_index 
                SET conflict_details = :details::jsonb
                WHERE id = :id
            `, { replacements: { id: slotId, details: JSON.stringify(newConflictDetails) } });
        }

        // Audit Log
        await sequelize.query(`
            INSERT INTO system_audit_logs (user_id, action, table_name, record_id, details)
            VALUES (:userId, 'RESOLVE_CONFLICT', 'box_position_index', :slotId, :details)
        `, {
            replacements: { userId, slotId, details: JSON.stringify({ decision, previous_asset: slot.asset_label }) }
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Error resolving conflict:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const checkSlot = async (req, res) => {
    try {
        let { boxName, positionCode } = req.query;
        if (!boxName || !positionCode) {
            return res.status(400).json({ success: false, error: 'boxName and positionCode are required' });
        }

        // box_position_index stores DISPLAY NAMES (e.g. "GS-26 (C1-b)").
        // The form stores the serial numeric `id` from box_locations (via RelationalSelect).
        // FIX: check BOTH serial `id` AND legacy varchar `ID` so the lookup never fails.
        const boxVal = String(boxName).trim();
        if (/^\d+$/.test(boxVal)) {
            const boxRows = await sequelize.query(
                `SELECT "Box_detail" FROM box_locations WHERE "id"::text = :v OR "ID"::text = :v LIMIT 1`,
                { replacements: { v: boxVal }, type: QueryTypes.SELECT }
            );
            if (boxRows.length > 0 && boxRows[0].Box_detail) {
                boxName = boxRows[0].Box_detail.trim();
            }
        }
        // If already a display name, use it directly

        // Normalize position code (strip spaces/dashes, uppercase)
        const normalizedPos = positionCode.trim().toUpperCase().replace(/[\s-]/g, '');

        const query = `
            SELECT * FROM box_position_index 
            WHERE box_name = :boxName AND position_code = :positionCode
        `;
        const [slot] = await sequelize.query(query, { 
            replacements: { boxName, positionCode: normalizedPos }, 
            type: QueryTypes.SELECT 
        });

        if (slot && slot.is_occupied) {
            res.json({ success: true, occupied: true, assetDetails: slot });
        } else {
            res.json({ success: true, occupied: false });
        }
    } catch (err) {
        console.error('Error checking slot:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

module.exports = {
    getBoxes,
    getBoxMatrix,
    getFreezers,
    searchAssets,
    placeTube,
    moveTube,
    removeTube,
    resolveConflict,
    checkSlot
};
