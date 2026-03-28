const express = require('express');
const router = express.Router();
const { PhageHostMatrix, BiologicalAsset } = require('../models');

// Get Matrix Data
router.get('/', async (req, res) => {
    try {
        const matrix = await PhageHostMatrix.findAll({
            include: [
                { model: BiologicalAsset, as: 'Phage', attributes: ['id', 'name', 'designation'] }, // Need to ensure association aliases in index.js
                // Wait, I didn't verify aliases in index.js for the new model. I should do that or just rely on default.
                // Standard sequelize: PhageHostMatrix.belongsTo(BiologicalAsset, { as: 'Phage', foreignKey: 'phage_id' })
                // I need to add these associations to index.js!
            ]
        });
        res.json(matrix);
    } catch (error) {
        console.error('Matrix Error:', error);
        res.status(500).json({ error: 'Failed to fetch matrix' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { phage_id, strain_id, lysis_score } = req.body;
        const entry = await PhageHostMatrix.create({ phage_id, strain_id, lysis_score });
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

module.exports = router;
