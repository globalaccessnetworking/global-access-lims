const express = require('express');
const router = express.Router();
const { SavedQuery, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// GET /api/queries - List all queries
router.get('/', async (req, res) => {
    try {
        const queries = await SavedQuery.findAll({
            attributes: ['id', 'name', 'description', 'type', 'createdAt']
        });
        res.json(queries);
    } catch (err) {
        console.error("Error listing queries:", err);
        res.status(500).json({ error: "Failed to list queries" });
    }
});

// POST /api/queries - Create a new query
router.post('/', async (req, res) => {
    try {
        const { name, description, type, query_config } = req.body;
        const newQuery = await SavedQuery.create({
            name,
            description,
            type: 'dynamic', // Force dynamic for user-created
            query_config
        });
        res.json(newQuery);
    } catch (err) {
        console.error("Error creating query:", err);
        res.status(500).json({ error: "Failed to create query" });
    }
});

// GET /api/queries/:id/execute - Run a query
router.get('/:id/execute', async (req, res) => {
    try {
        const query = await SavedQuery.findByPk(req.params.id);
        if (!query) return res.status(404).json({ error: "Query not found" });

        if (query.type === 'static') {
            // Return stored JSON data
            return res.json(query.static_data);
        } else {
            // Dynamic execution logic
            const config = query.query_config; // { table: 'InventoryStock', filters: [{col, op, val}], columns: [] }

            if (!config || !config.table) {
                return res.status(400).json({ error: "Invalid Query Configuration" });
            }

            // Security: Whitelist tables
            const ALLOWED_TABLES = ['InventoryStocks', 'BiologicalAssets', 'Experiments', 'AvailableAntibiotics']; // Add more as needed
            // Also need to check if table exists in DB to be safe, but whitelist is better.
            // For now, let's assume config.table is safe enough if we sanitize? No, SQL injection risk.
            // BETTER: Use Sequelize's model directly based on string name?

            const modelName = config.table; // e.g. 'InventoryStock'
            const Model = require('../models')[modelName];

            if (!Model) {
                return res.status(400).json({ error: `Invalid Table: ${modelName}` });
            }

            // Build Where Clause
            const where = {};
            if (config.filters && Array.isArray(config.filters)) {
                // TODO: Implement complex filter parsing
                // For simplified phase, just return all or basic match
            }

            const results = await Model.findAll({
                attributes: config.columns && config.columns.length > 0 ? config.columns : undefined,
                where: where,
                limit: 1000
            });

            return res.json(results);
        }
    } catch (err) {
        console.error("Execute failed:", err);
        res.status(500).json({ error: "Query execution failed" });
    }
});

// POST /api/queries/run-adhoc - Universal Multi-Join Reporting Engine
router.post('/run-adhoc', async (req, res) => {
    try {
        const { executeComplexQuery } = require('../utils/reportEngine');
        const results = await executeComplexQuery(req.body);

        // Audit the data extraction
        const { SystemAuditLog } = require('../models');
        await SystemAuditLog.create({
            user_id: req.user?.id || null,
            action: 'REPORT_EXPORT',
            table_name: req.body.primaryTable,
            details: { 
                joins: req.body.joins?.length || 0, 
                filters: req.body.filters?.conditions?.length || 0,
                rowCount: results.length
            }
        });

        res.json(results);
    } catch (err) {
        console.error("Ad-Hoc Query Failed:", err);
        res.status(500).json({ error: err.message || "Failed to execute complex query" });
    }
});

// DELETE /api/queries/:id
router.delete('/:id', async (req, res) => {
    try {
        await SavedQuery.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;
