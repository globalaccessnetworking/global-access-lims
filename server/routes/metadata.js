const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { auth } = require('../middleware/auth');

// GET /api/metadata/unique/:module/:field
// Fetches unique existing values for any field in any module to power smart dropdowns
router.get('/unique/:module/:field', auth, async (req, res) => {
    try {
        const { module, field } = req.params;
        
        // Map frontend module names to DB table names if they differ
        const tableMap = {
            'inventory': 'InventoryStocks',
            'assets': 'BiologicalAssets',
            'projects': 'Projects',
            'tasks': 'LabTasks',
            'sources': 'Sources',
            'locations': 'StorageLocations',
            'equipment': 'Equipment'
        };

        const tableName = tableMap[module.toLowerCase()] || module;
        
        // Raw query for performance and flexibility across different models
        // Using double quotes for table/column names to handle PostgreSQL case sensitivity
        const query = `SELECT DISTINCT "${field}" FROM "${tableName}" WHERE "${field}" IS NOT NULL AND "${field}" != '' ORDER BY "${field}" ASC LIMIT 500`;
        
        const results = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });

        const values = results.map(row => row[field]);
        res.json(values);
    } catch (error) {
        console.error('Metadata Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

// GET /api/metadata/bulk-lookups
// Fetches multiple lists (Users, Locations, sources) in one go for form initializations
router.get('/bulk-lookups', auth, async (req, res) => {
    try {
        const [users, locations, sources] = await Promise.all([
            sequelize.query('SELECT id, username FROM "Users" ORDER BY username ASC', { type: sequelize.QueryTypes.SELECT }),
            sequelize.query('SELECT DISTINCT freezer_name, box FROM "StorageLocations" ORDER BY freezer_name ASC', { type: sequelize.QueryTypes.SELECT }),
            sequelize.query('SELECT id, name, type FROM "Sources" ORDER BY name ASC', { type: sequelize.QueryTypes.SELECT })
        ]);

        res.json({ users, locations, sources });
    } catch (error) {
        console.error('Bulk Metadata Error:', error);
        res.status(500).json({ error: 'Failed to fetch bulk metadata' });
    }
});

module.exports = router;
