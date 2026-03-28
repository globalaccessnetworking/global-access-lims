const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

// POST /api/reports/query
// Dynamic Query Builder
router.post('/query', async (req, res) => {
    const { table, fields, limits } = req.body;

    // Whitelist allowed tables to prevent SQL injection
    const allowedTables = ['BiologicalAssets', 'Users', 'Inventory', 'AuditLogs'];
    if (!allowedTables.includes(table)) {
        return res.status(400).json({ msg: 'Invalid Table selected' });
    }

    try {
        const query = `SELECT ${fields.join(', ')} FROM ${table} LIMIT :limit`;
        const results = await sequelize.query(query, {
            replacements: { limit: limits || 100 },
            type: sequelize.QueryTypes.SELECT
        });
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).send('Query Execution Failed');
    }
});

module.exports = router;
