const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// GET /api/search?q=query
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json([]); // Return flat array as requested
        }

        const searchTerm = `%${q}%`;

        // Execute searches concurrently using Promise.all
        const [phages, strains, plasmids, primers] = await Promise.all([
            // Bacteriophages
            sequelize.query(`
                SELECT id, "Bacteriophage_Name" as name, "Against_Species" as details 
                FROM ext_bacteriophages 
                WHERE "Bacteriophage_Name" ILIKE :search OR "Against_Species" ILIKE :search
                LIMIT 5
            `, { replacements: { search: searchTerm }, type: QueryTypes.SELECT }),

            // Bacterial Strains
            sequelize.query(`
                SELECT id, "Strain_No" as name, "Specie" as details 
                FROM ext_bacterial_strains 
                WHERE "Strain_No" ILIKE :search OR "Specie" ILIKE :search
                LIMIT 5
            `, { replacements: { search: searchTerm }, type: QueryTypes.SELECT }),

            // Plasmids
            sequelize.query(`
                SELECT id, "Plasmid_Name" as name, "Host_Bacteria" as details 
                FROM ext_plasmids 
                WHERE "Plasmid_Name" ILIKE :search OR "Host_Bacteria" ILIKE :search
                LIMIT 5
            `, { replacements: { search: searchTerm }, type: QueryTypes.SELECT }),

            // Primers
            sequelize.query(`
                SELECT id, "Primer_Name" as name, "Purpose" as details 
                FROM ext_primers_details 
                WHERE "Primer_Name" ILIKE :search OR "Purpose" ILIKE :search
                LIMIT 5
            `, { replacements: { search: searchTerm }, type: QueryTypes.SELECT })
        ]);

        // Format and unify results into a single flat array
        const formattedResults = [
            ...phages.map(p => ({
                id: p.id,
                label: p.name,
                details: p.details,
                type: 'phage',
                route: `/phage-entry?id=${p.id}`
            })),
            ...strains.map(s => ({
                id: s.id,
                label: s.name,
                details: s.details,
                type: 'strain',
                route: `/strain-entry?id=${s.id}`
            })),
            ...plasmids.map(pl => ({
                id: pl.id,
                label: pl.name,
                details: pl.details,
                type: 'plasmid',
                route: `/plasmid-entry?id=${pl.id}`
            })),
            ...primers.map(pr => ({
                id: pr.id,
                label: pr.name,
                details: pr.details,
                type: 'primer',
                route: `/primer-entry?id=${pr.id}`
            }))
        ];

        // Sort alphabetically by label or return as-is
        formattedResults.sort((a, b) => a.label.localeCompare(b.label));

        res.json(formattedResults);
    } catch (error) {
        console.error('Global search aggregate error:', error);
        res.status(500).json({ error: 'Search aggregation failed' });
    }
});

// Also keep the /global route working just in case anything relies on it
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
