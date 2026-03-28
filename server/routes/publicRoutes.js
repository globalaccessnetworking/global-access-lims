const express = require('express');
const router = express.Router();
const { BiologicalAsset } = require('../models');

// GET /api/public/catalog
// Returns a sanitized list of assets (No Storage Location, No Notes)
router.get('/catalog', async (req, res) => {
    try {
        const assets = await BiologicalAsset.findAll({
            attributes: ['id', 'type', 'species', 'strain_number', 'source', 'characteristics', 'image_url']
        });
        res.json(assets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
