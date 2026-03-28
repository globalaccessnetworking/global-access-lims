const express = require('express');
const router = express.Router();
const { EquipmentLog } = require('../models');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
    try {
        const logs = await EquipmentLog.findAll({
            order: [['next_due_date', 'ASC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch equipment logs', details: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const log = await EquipmentLog.create(req.body);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create equipment log', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const log = await EquipmentLog.findByPk(req.params.id);
        if (!log) return res.status(404).json({ error: 'Log not found' });
        await log.update(req.body);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update equipment log' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const log = await EquipmentLog.findByPk(req.params.id);
        if (!log) return res.status(404).json({ error: 'Log not found' });
        await log.destroy();
        res.json({ message: 'Equipment log deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete equipment log' });
    }
});

module.exports = router;
