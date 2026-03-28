const { StorageLocation, BiologicalAsset, User } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// GET /api/storage/boxes
exports.getBoxes = async (req, res) => {
    try {
        // CROSS JOIN strategy to populate ALL freezers with ALL known box names
        // This ensures the dropdown is fully populated even if StorageLocations is empty.

        const query = `
            SELECT DISTINCT
                f."Freezer" as freezer_name,
                b."Box_detail" as box,
                r."Rack_No" as rack
            FROM "ext_location_detail_freezer" f
            CROSS JOIN "ext_location_detail_box_name" b
            LEFT JOIN "StorageLocations" sl ON 
                CAST(f."ID" AS VARCHAR) = CAST(sl.freezer_name AS VARCHAR) AND 
                CAST(b."ID" AS VARCHAR) = CAST(sl.box AS VARCHAR)
            LEFT JOIN "ext_location_detail_rack" r ON CAST(sl.rack AS VARCHAR) = CAST(r."ID" AS VARCHAR)
            ORDER BY f."Freezer" ASC, box ASC
        `;

        const boxes = await sequelize.query(query, { type: QueryTypes.SELECT });

        const formatted = boxes.map(b => ({
            freezer: b.freezer_name,
            box: b.box,
            rack: b.rack || ''
        }));

        res.json(formatted);

    } catch (error) {
        console.error('Get Boxes Error:', error);
        res.status(500).json({ error: 'Failed to retrieve boxes' });
    }
};

// GET /api/storage?box=BoxName
exports.getStorageHub = async (req, res) => {
    try {
        const { box } = req.query;
        if (!box) {
            return res.status(400).json({ error: 'Box name is required' });
        }

        // 1. Resolve Box Name to ID
        let boxId = null;
        try {
            const boxLookup = await sequelize.query(
                `SELECT "ID" FROM "ext_location_detail_box_name" WHERE "Box_detail" = :box`,
                { replacements: { box }, type: QueryTypes.SELECT }
            );
            if (boxLookup.length > 0) {
                boxId = boxLookup[0].ID;
            }
        } catch (err) {
            console.error("Box ID Lookup Failed:", err);
        }

        // 2. UNION ALL 'Magnet' Query (Dual Search: ID or Name)
        // We check if the external table's box column matches the ID OR the Name.
        // Coordinate Normalization: UPPERCASE and remove dashes (A-2 -> A2)

        const query = `
            SELECT * FROM (
                -- 1. Bacterial Strains (Green)
                SELECT 
                    'strain' as type,
                    CAST("id" AS VARCHAR) as asset_id,
                    "Strain_No" as name,
                    REPLACE(UPPER("Location_in_Box_GS"), '-', '') as position,
                    "Specie" as parent,
                    'Date Not Recorded' as origin_date,
                    'Data Missing in DB' as concentration,
                    "GS_Box_details" as box_matched
                FROM "ext_bacterial_strains"
                WHERE 
                    (:boxId IS NOT NULL AND CAST("GS_Box_details" AS VARCHAR) = CAST(:boxId AS VARCHAR))
                    OR "GS_Box_details" = :box

                UNION ALL

                -- 2. Bacteriophages (Blue)
                SELECT 
                    'phage' as type,
                    CAST("id" AS VARCHAR) as asset_id,
                    "Bacteriophage_Name" as name,
                    REPLACE(UPPER("GS_position_in_Box"), '-', '') as position,
                    "Host_Bacteria" as parent,
                    'Date Not Recorded' as origin_date,
                    'Data Missing in DB' as concentration,
                    "GS_Box_details" as box_matched
                FROM "ext_bacteriophages"
                WHERE 
                    (:boxId IS NOT NULL AND CAST("GS_Box_details" AS VARCHAR) = CAST(:boxId AS VARCHAR))
                    OR "GS_Box_details" = :box

                UNION ALL

                -- 3. Primers (Purple)
                SELECT 
                    'primer' as type,
                    CAST("id" AS VARCHAR) as asset_id,
                    "Primer_Name" as name,
                    REPLACE(UPPER("Location_in_Box"), '-', '') as position,
                    "Purpose" as parent,
                    'Date Not Recorded' as origin_date,
                    "DNA_sequence" as concentration,
                    "Box_detail" as box_matched
                FROM "ext_primers_details"
                WHERE 
                    (:boxId IS NOT NULL AND CAST("Box_detail" AS VARCHAR) = CAST(:boxId AS VARCHAR))
                    OR "Box_detail" = :box
            ) as unified_assets
        `;

        const results = await sequelize.query(query, {
            replacements: { box, boxId: boxId || null },
            type: QueryTypes.SELECT
        });

        if (results.length === 0) {
            console.log(`SQL SEARCH ID: [${box}] (ID: ${boxId}) - 0 Results`);
        }

        const gridMap = {};

        results.forEach(row => {
            if (!row.position) return;

            // Normalize Name
            let name = row.name || 'Data Missing in DB';

            gridMap[row.position] = {
                id: row.asset_id,
                type: row.type,
                name: name,
                lineage: {
                    originDate: row.origin_date,
                    parent: row.parent || 'Data Missing in DB',
                    concentration: row.concentration || 'Data Missing in DB',
                    associate: 'Data Missing in DB'
                }
            };
        });

        res.json({
            box,
            grid: gridMap
        });

    } catch (error) {
        console.error('Storage Hub Error:', error);
        res.status(500).json({ error: 'Failed to retrieve storage data' });
    }
};

// GET /api/storage/statistics
exports.getStatistics = async (req, res) => {
    try {
        const { freezer } = req.query;

        // Get all boxes
        const boxesQuery = freezer
            ? `SELECT DISTINCT b."Box_detail" as box FROM "ext_location_detail_box_name" b 
               JOIN "ext_location_detail_freezer" f ON f."Freezer" = :freezer`
            : `SELECT "Box_detail" as box FROM "ext_location_detail_box_name"`;

        const boxes = await sequelize.query(boxesQuery, {
            replacements: { freezer },
            type: QueryTypes.SELECT
        });

        const totalSlots = boxes.length * 81; // 9x9 grid per box

        // Count occupied slots by type
        const occupancyQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN type = 'strain' THEN 1 ELSE 0 END) as strains,
                SUM(CASE WHEN type = 'phage' THEN 1 ELSE 0 END) as phages,
                SUM(CASE WHEN type = 'primer' THEN 1 ELSE 0 END) as primers
            FROM (
                SELECT 'strain' as type FROM "ext_bacterial_strains" WHERE "Location_in_Box_GS" IS NOT NULL
                UNION ALL
                SELECT 'phage' as type FROM "ext_bacteriophages" WHERE "GS_position_in_Box" IS NOT NULL
                UNION ALL
                SELECT 'primer' as type FROM "ext_primers_details" WHERE "Location_in_Box" IS NOT NULL
            ) as all_samples
        `;

        const [occupancy] = await sequelize.query(occupancyQuery, { type: QueryTypes.SELECT });

        const occupied = parseInt(occupancy.total) || 0;
        const empty = totalSlots - occupied;
        const occupancyRate = totalSlots > 0 ? ((occupied / totalSlots) * 100).toFixed(1) : 0;

        res.json({
            totalSlots,
            occupied,
            empty,
            occupancyRate: parseFloat(occupancyRate),
            byType: {
                strains: parseInt(occupancy.strains) || 0,
                phages: parseInt(occupancy.phages) || 0,
                primers: parseInt(occupancy.primers) || 0
            },
            totalBoxes: boxes.length
        });
    } catch (error) {
        console.error('Get Statistics Error:', error);
        res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
};

// GET /api/storage/heatmap
exports.getHeatMap = async (req, res) => {
    try {
        // Get all boxes with their occupancy counts
        const heatmapQuery = `
            SELECT 
                b."Box_detail" as box,
                f."Freezer" as freezer,
                COUNT(DISTINCT samples.position) as occupied_count
            FROM "ext_location_detail_box_name" b
            CROSS JOIN "ext_location_detail_freezer" f
            LEFT JOIN (
                SELECT "GS_Box_details" as box_id, "Location_in_Box_GS" as position FROM "ext_bacterial_strains" WHERE "Location_in_Box_GS" IS NOT NULL
                UNION ALL
                SELECT "GS_Box_details" as box_id, "GS_position_in_Box" as position FROM "ext_bacteriophages" WHERE "GS_position_in_Box" IS NOT NULL
                UNION ALL
                SELECT "Box_detail" as box_id, "Location_in_Box" as position FROM "ext_primers_details" WHERE "Location_in_Box" IS NOT NULL
            ) samples ON CAST(samples.box_id AS VARCHAR) = CAST(b."ID" AS VARCHAR)
            GROUP BY b."Box_detail", f."Freezer"
            ORDER BY f."Freezer", b."Box_detail"
        `;

        const results = await sequelize.query(heatmapQuery, { type: QueryTypes.SELECT });

        const heatmap = results.map(row => ({
            box: row.box,
            freezer: row.freezer,
            occupiedCount: parseInt(row.occupied_count) || 0,
            totalSlots: 81,
            occupancyRate: ((parseInt(row.occupied_count) || 0) / 81 * 100).toFixed(1)
        }));

        res.json({ heatmap });
    } catch (error) {
        console.error('Get Heatmap Error:', error);
        res.status(500).json({ error: 'Failed to retrieve heatmap data' });
    }
};

// POST /api/storage/find-slots
exports.findEmptySlots = async (req, res) => {
    try {
        const { type, count = 1, preferredBox } = req.body;

        // Get all boxes
        const boxes = await sequelize.query(
            `SELECT "Box_detail" as box FROM "ext_location_detail_box_name" ORDER BY "Box_detail"`,
            { type: QueryTypes.SELECT }
        );

        const recommendations = [];
        const allPositions = [];

        // Generate all possible positions
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        rows.forEach(row => {
            cols.forEach(col => allPositions.push(`${row}${col}`));
        });

        // For each box, find empty slots
        for (const boxData of boxes) {
            const box = boxData.box;

            // Get occupied positions in this box
            const occupiedQuery = `
                SELECT DISTINCT REPLACE(UPPER(position), '-', '') as position FROM (
                    SELECT "Location_in_Box_GS" as position FROM "ext_bacterial_strains" WHERE "GS_Box_details" = :box
                    UNION ALL
                    SELECT "GS_position_in_Box" as position FROM "ext_bacteriophages" WHERE "GS_Box_details" = :box
                    UNION ALL
                    SELECT "Location_in_Box" as position FROM "ext_primers_details" WHERE "Box_detail" = :box
                ) as positions WHERE position IS NOT NULL
            `;

            const occupied = await sequelize.query(occupiedQuery, {
                replacements: { box },
                type: QueryTypes.SELECT
            });

            const occupiedSet = new Set(occupied.map(o => o.position));
            const emptySlots = allPositions.filter(pos => !occupiedSet.has(pos));

            // Calculate priority score
            let priority = 0;
            let reason = 'Available slot';

            if (box === preferredBox) {
                priority += 100;
                reason = 'Preferred box';
            }

            // Check if box has samples of same type
            if (type) {
                const typeQuery = type === 'strain'
                    ? `SELECT COUNT(*) as count FROM "ext_bacterial_strains" WHERE "GS_Box_details" = :box`
                    : type === 'phage'
                        ? `SELECT COUNT(*) as count FROM "ext_bacteriophages" WHERE "GS_Box_details" = :box`
                        : `SELECT COUNT(*) as count FROM "ext_primers_details" WHERE "Box_detail" = :box`;

                const [typeCount] = await sequelize.query(typeQuery, {
                    replacements: { box },
                    type: QueryTypes.SELECT
                });

                if (parseInt(typeCount.count) > 0) {
                    priority += 50;
                    reason = `Near other ${type}s`;
                }
            }

            // Add empty slots from this box
            emptySlots.slice(0, count).forEach(position => {
                recommendations.push({
                    box,
                    position,
                    priority,
                    reason,
                    emptyCount: emptySlots.length
                });
            });

            if (recommendations.length >= count * 3) break; // Get enough options
        }

        // Sort by priority and return top recommendations
        recommendations.sort((a, b) => b.priority - a.priority);

        res.json({
            recommendations: recommendations.slice(0, count * 2),
            totalFound: recommendations.length
        });
    } catch (error) {
        console.error('Find Empty Slots Error:', error);
        res.status(500).json({ error: 'Failed to find empty slots' });
    }
};

// GET /api/storage/search?q=searchTerm
exports.searchSamples = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ results: [] });
        }

        const searchQuery = `
            SELECT * FROM (
                SELECT 
                    'strain' as type,
                    "Strain_No" as name,
                    "GS_Box_details" as box,
                    REPLACE(UPPER("Location_in_Box_GS"), '-', '') as position,
                    "Specie" as details
                FROM "ext_bacterial_strains"
                WHERE LOWER("Strain_No") LIKE LOWER(:search)
                
                UNION ALL
                
                SELECT 
                    'phage' as type,
                    "Bacteriophage_Name" as name,
                    "GS_Box_details" as box,
                    REPLACE(UPPER("GS_position_in_Box"), '-', '') as position,
                    "Host_Bacteria" as details
                FROM "ext_bacteriophages"
                WHERE LOWER("Bacteriophage_Name") LIKE LOWER(:search)
                
                UNION ALL
                
                SELECT 
                    'primer' as type,
                    "Primer_Name" as name,
                    "Box_detail" as box,
                    REPLACE(UPPER("Location_in_Box"), '-', '') as position,
                    "Purpose" as details
                FROM "ext_primers_details"
                WHERE LOWER("Primer_Name") LIKE LOWER(:search)
            ) as search_results
            WHERE position IS NOT NULL
            LIMIT 20
        `;

        const results = await sequelize.query(searchQuery, {
            replacements: { search: `%${q}%` },
            type: QueryTypes.SELECT
        });

        // Resolve box IDs to names
        const enrichedResults = await Promise.all(results.map(async (result) => {
            try {
                const [boxInfo] = await sequelize.query(
                    `SELECT "Box_detail" as box_name FROM "ext_location_detail_box_name" WHERE CAST("ID" AS VARCHAR) = :boxId`,
                    { replacements: { boxId: result.box }, type: QueryTypes.SELECT }
                );

                return {
                    ...result,
                    boxName: boxInfo?.box_name || result.box
                };
            } catch {
                return { ...result, boxName: result.box };
            }
        }));

        res.json({ results: enrichedResults, count: enrichedResults.length });
    } catch (error) {
        console.error('Search Samples Error:', error);
        res.status(500).json({ error: 'Failed to search samples' });
    }
};
