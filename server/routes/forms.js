const express = require('express');
const router = express.Router();
const { CustomForm, sequelize } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * [ADMIN ARCHITECT] Evolution Engine - Phase 172
 * 
 * Logic to automatically translate a UI-defined form schema into a physical 
 * PostgreSQL table starting with 'ext_'. This gives lab admins "Full Control".
 */

// Helper to sanitize table names
const sanitizeTableName = (title) => {
    return 'ext_arch_' + title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').substring(0, 50);
};

// Helper to create or update the physical table
const deployFormTable = async (form) => {
    if (!form.schema_json || !Array.isArray(form.schema_json)) return;

    const tableName = form.table_name || sanitizeTableName(form.title);
    
    // 1. Create table if it doesn't exist
    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY, "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(), "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW())`);

    // 2. Add columns based on schema
    for (const field of form.schema_json) {
        if (!field.key || field.type === 'section') continue;

        // Determine Postgres column type
        let pgType = 'TEXT';
        if (field.type === 'number') pgType = 'NUMERIC';
        if (field.type === 'date') pgType = 'DATE';
        if (field.type === 'image' || field.type === 'file') pgType = 'TEXT'; // Base64 storage

        try {
            // Check if column exists
            const [results] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${tableName}' AND column_name = '${field.key}'
            `);

            if (results.length === 0) {
                console.log(`[ARCHITECT] Adding column ${field.key} (${pgType}) to ${tableName}`);
                await sequelize.query(`ALTER TABLE "${tableName}" ADD COLUMN "${field.key}" ${pgType}`);
            }
        } catch (err) {
            console.warn(`[ARCHITECT] Column Sync Warning for ${field.key}:`, err.message);
        }
    }

    // 3. Update CustomForm record with the table name
    if (form.table_name !== tableName) {
        await form.update({ table_name: tableName });
    }

    return tableName;
};

// GET All Forms
router.get('/', async (req, res) => {
    try {
        const forms = await CustomForm.findAll({ order: [['createdAt', 'DESC']] });
        res.json(forms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Single Form
router.get('/:id', async (req, res) => {
    try {
        const form = await CustomForm.findByPk(req.params.id);
        if (!form) return res.status(404).json({ error: 'Form not found' });
        res.json(form);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create/Save Form
router.post('/', async (req, res) => {
    try {
        const { title, description, schema_json, status, created_by } = req.body;
        const newForm = await CustomForm.create({
            title, description, schema_json, status, created_by
        });

        // Auto-deploy table if published
        if (status === 'Published') {
            await deployFormTable(newForm);
        }

        res.status(201).json(newForm);
    } catch (err) {
        console.error('[ARCHITECT] Save Error:', err);
        res.status(500).json({ error: 'Failed to deploy form architect.' });
    }
});

// PUT Update Form
router.put('/:id', async (req, res) => {
    try {
        const { title, schema_json, status } = req.body;
        const form = await CustomForm.findByPk(req.params.id);
        if (!form) return res.status(404).json({ error: 'Form not found' });

        await form.update({ title, schema_json, status });
        
        // Auto-deploy table if published
        if (status === 'Published') {
            await deployFormTable(form);
        }

        res.json(form);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Bindable Tables
router.get('/meta/tables', async (req, res) => {
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (
                table_name LIKE 'ext_%' 
                OR table_name LIKE 'bacterial_%' 
                OR table_name LIKE 'phage_%' 
                OR table_name LIKE 'plasmid_%'
                OR table_name IN ('manufacturers', 'stock_categories', 'storage_locations')
            )
            ORDER BY table_name
        `;
        const results = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
        const tables = results.map(row => ({
            id: row.table_name,
            label: row.table_name.replace('ext_', '').toUpperCase().replace(/_/g, ' ')
        }));
        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Columns for a specific table (MS Access Style Discovery)
router.get('/meta/columns/:tableName', async (req, res) => {
    const { tableName } = req.params;
    try {
        // Validation: Only allow research-relevant tables
        const allowedPrefixes = ['ext_', 'bacterial_', 'phage_', 'plasmid_', 'manufacturers', 'stock_', 'storage_'];
        const isAllowed = allowedPrefixes.some(p => tableName.startsWith(p));
        if (!isAllowed) return res.status(403).json({ error: 'Access Denied to target registry' });

        const description = await sequelize.getQueryInterface().describeTable(tableName);
        const columns = Object.keys(description).map(col => ({
            id: col,
            label: col.replace(/_/g, ' ').toUpperCase(),
            type: description[col].type
        }));
        res.json(columns);
    } catch (err) {
        console.error('[ARCHITECT DISCOVERY] Error:', err.message);
        res.status(500).json({ error: 'Failed to discover registry headers.' });
    }
});

module.exports = router;
