const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// GET /api/bio
exports.getBioLibrary = async (req, res) => {
    try {
        const { search = '' } = req.query;
        const searchTerm = `%${search}%`;

        // UNION ALL 'Bio Magnet' Query
        // Aggregates all assets from external tables into a unified library view.

        const query = `
            SELECT * FROM (
                -- 1. Bacterial Strains
                SELECT 
                    'strain' as type,
                    CAST(s."id" AS VARCHAR) as asset_id,
                    s."Strain_No" as name,
                    s."Specie" as specie_host,
                    COALESCE(s."Detail_of_Bacterial_Strain", 'No Details') as concentration,
                    s."GS_Box_details" as box,
                    COALESCE(CAST(ba."createdAt" AS VARCHAR), 'Pre-Migration Central') as createdAt
                FROM "ext_bacterial_strains" s
                LEFT JOIN "BiologicalAssets" ba ON s."Strain_No" = ba."strain_number"

                UNION ALL

                -- 2. Bacteriophages
                SELECT 
                    'phage' as type,
                    CAST(p."id" AS VARCHAR) as asset_id,
                    p."Bacteriophage_Name" as name,
                    p."Host_Bacteria" as specie_host,
                    COALESCE(p."Characterization_details", 'No Characterization') as concentration,
                    p."GS_Box_details" as box,
                    COALESCE(CAST(ba."createdAt" AS VARCHAR), 'Pre-Migration Central') as createdAt
                FROM "ext_bacteriophages" p
                LEFT JOIN "BiologicalAssets" ba ON p."Bacteriophage_Name" = ba."strain_number"

                UNION ALL

                -- 3. Primers
                SELECT 
                    'primer' as type,
                    CAST(pr."id" AS VARCHAR) as asset_id,
                    pr."Primer_Name" as name,
                    pr."Purpose" as specie_host,
                    pr."DNA_sequence" as concentration,
                    pr."Box_detail" as box,
                    COALESCE(CAST(ba."createdAt" AS VARCHAR), 'Pre-Migration Central') as createdAt
                FROM "ext_primers_details" pr
                LEFT JOIN "BiologicalAssets" ba ON pr."Primer_Name" = ba."strain_number"
            ) as unified_bio
            WHERE 
                "name" ILIKE :searchTerm OR 
                "specie_host" ILIKE :searchTerm OR 
                "box" ILIKE :searchTerm OR
                "type" ILIKE :searchTerm OR
                "concentration" ILIKE :searchTerm
            ORDER BY "name" ASC
            LIMIT 2500
        `;

        const assets = await sequelize.query(query, {
            replacements: { searchTerm },
            type: QueryTypes.SELECT
        });

        res.json({
            count: assets.length,
            assets: assets
        });

    } catch (error) {
        console.error('Bio Library Error:', error);
        res.status(500).json({ error: 'Failed to retrieve bio library data' });
    }
};
