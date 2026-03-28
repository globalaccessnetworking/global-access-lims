const express = require('express');
const router = express.Router();
const { CustomForm, sequelize } = require('../models');

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
        res.status(201).json(newForm);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save form' });
    }
});

// PUT Update Form
router.put('/:id', async (req, res) => {
    try {
        const { title, schema_json, status } = req.body;
        const form = await CustomForm.findByPk(req.params.id);
        if (!form) return res.status(404).json({ error: 'Form not found' });

        await form.update({ title, schema_json, status });
        res.json(form);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Bindable Tables (Mock for now, could query Schema info)
router.get('/meta/tables', async (req, res) => {
    try {
        // In a real scenario, correct SQL query to get table names
        // const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
        // For security and simplicity, we return the allowed bindable models
        const tables = [
            { name: 'BiologicalAssets', label: 'Biological Assets (Strains, Phages)' },
            { name: 'InventoryItems', label: 'Chemical Inventory' },
            { name: 'Users', label: 'System Users' },
            { name: 'Antibiotics', label: 'Antibiotic Discs' }
        ];
        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
