const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// GET /api/search/global?q=query
router.get('/global', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ results: [] });
        }

        const searchTerm = `%${q.toLowerCase()}%`;

        // Search across multiple tables
        const results = await sequelize.query(`
            SELECT * FROM (
                -- Experiments
                SELECT 
                    id,
                    title as name,
                    'experiment' as type,
                    protocol as details
                FROM "Experiments"
                WHERE LOWER(title) LIKE :search
                LIMIT 5

                UNION ALL

                -- Bacterial Strains
                SELECT 
                    id,
                    "Strain_No" as name,
                    'strain' as type,
                    "Specie" as details
                FROM "ext_bacterial_strains"
                WHERE LOWER("Strain_No") LIKE :search
                LIMIT 5

                UNION ALL

                -- Bacteriophages
                SELECT 
                    id,
                    "Bacteriophage_Name" as name,
                    'phage' as type,
                    "Host_Bacteria" as details
                FROM "ext_bacteriophages"
                WHERE LOWER("Bacteriophage_Name") LIKE :search
                LIMIT 5

                UNION ALL

                -- Chemicals
                SELECT 
                    id,
                    name,
                    'chemical' as type,
                    CONCAT(manufacturer, ' - ', catalog_number) as details
                FROM "Chemicals"
                WHERE LOWER(name) LIKE :search
                LIMIT 5

                UNION ALL

                -- Primers
                SELECT 
                    id,
                    "Primer_Name" as name,
                    'primer' as type,
                    "Purpose" as details
                FROM "ext_primers_details"
                WHERE LOWER("Primer_Name") LIKE :search
                LIMIT 5
            ) as all_results
            LIMIT 20
        `, {
            replacements: { search: searchTerm },
            type: QueryTypes.SELECT
        });

        res.json({ results, count: results.length });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;
