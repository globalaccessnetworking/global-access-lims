const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// POST /api/filters/save
exports.saveFilter = async (req, res) => {
    try {
        const { name, filterType, criteria } = req.body;
        const userId = req.user.id;

        const [filter] = await sequelize.query(`
            INSERT INTO saved_filters (user_id, name, filter_type, filter_criteria)
            VALUES (:userId, :name, :filterType, :criteria)
            RETURNING *
        `, {
            replacements: {
                userId,
                name,
                filterType,
                criteria: JSON.stringify(criteria)
            },
            type: QueryTypes.INSERT
        });

        res.json({ filter });
    } catch (error) {
        console.error('Save filter error:', error);
        res.status(500).json({ error: 'Failed to save filter' });
    }
};

// GET /api/filters
exports.getFilters = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filterType } = req.query;

        let query = `
            SELECT id, name, filter_type, filter_criteria, created_at
            FROM saved_filters
            WHERE user_id = :userId
        `;

        const replacements = { userId };

        if (filterType) {
            query += ` AND filter_type = :filterType`;
            replacements.filterType = filterType;
        }

        query += ` ORDER BY created_at DESC`;

        const filters = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        // Parse JSON criteria
        const parsedFilters = filters.map(f => ({
            ...f,
            filter_criteria: JSON.parse(f.filter_criteria)
        }));

        res.json({ filters: parsedFilters });
    } catch (error) {
        console.error('Get filters error:', error);
        res.status(500).json({ error: 'Failed to fetch filters' });
    }
};

// DELETE /api/filters/:id
exports.deleteFilter = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await sequelize.query(`
            DELETE FROM saved_filters
            WHERE id = :id AND user_id = :userId
        `, {
            replacements: { id, userId },
            type: QueryTypes.DELETE
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete filter error:', error);
        res.status(500).json({ error: 'Failed to delete filter' });
    }
};
