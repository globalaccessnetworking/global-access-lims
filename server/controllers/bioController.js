const { BiologicalAsset } = require('../models');
const { Op } = require('sequelize');

// GET /api/bio
exports.getBioLibrary = async (req, res) => {
    try {
        const { search = '' } = req.query;

        // Fetch using the official Sequelize model
        const assets = await BiologicalAsset.findAll({
            where: {
                [Op.or]: [
                    { species: { [Op.iLike]: `%${search}%` } },
                    { strain_number: { [Op.iLike]: `%${search}%` } },
                    { characteristics: { [Op.iLike]: `%${search}%` } }
                ]
            },
            order: [['id', 'ASC']],
            limit: 2500
        });

        // Format to match what the Frontend expectations (registry mapping)
        const formatted = assets.map(a => ({
            asset_id: a.id,
            name: a.strain_number, // The user's ID
            type: a.type ? a.type.toLowerCase() : 'strain',
            specie_host: a.species,
            concentration: a.characteristics || 'No Specific Details',
            box: a.storage_location_id ? `Loc ID: ${a.storage_location_id}` : 'Unassigned',
            createdAt: a.createdAt
        }));

        res.json({
            count: formatted.length,
            assets: formatted
        });

    } catch (error) {
        console.error('Bio Library Error:', error);
        res.status(500).json({ error: 'Failed to retrieve bio library data' });
    }
};

