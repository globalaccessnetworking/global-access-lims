const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// Log activity
exports.logActivity = async (userId, actionType, entityType, entityId, entityName, description = null, metadata = null) => {
    try {
        await sequelize.query(`
            INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, entity_name, description, metadata)
            VALUES (:userId, :actionType, :entityType, :entityId, :entityName, :description, :metadata)
        `, {
            replacements: { userId, actionType, entityType, entityId, entityName, description, metadata: metadata ? JSON.stringify(metadata) : null },
            type: QueryTypes.INSERT
        });
    } catch (error) {
        console.error('Activity log error:', error);
    }
};

// GET /api/activity/recent
exports.getRecentActivity = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const activities = await sequelize.query(`
            SELECT 
                a.id,
                a.action_type,
                a.entity_type,
                a.entity_id,
                a.entity_name,
                a.description,
                a.created_at,
                u.username
            FROM activity_log a
            LEFT JOIN "Users" u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT :limit
        `, {
            replacements: { limit: parseInt(limit) },
            type: QueryTypes.SELECT
        });

        res.json({ activities });
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
};

// GET /api/activity/stats
exports.getActivityStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Experiments this week
        const experimentsWeek = await sequelize.query(`
            SELECT COUNT(*) as count FROM "Experiments"
            WHERE DATE(date) >= :weekAgo
        `, { replacements: { weekAgo }, type: QueryTypes.SELECT });

        // Samples added today
        const samplesToday = await sequelize.query(`
            SELECT COUNT(*) as count FROM activity_log
            WHERE DATE(created_at) = :today 
            AND entity_type IN ('strain', 'phage', 'primer')
            AND action_type = 'created'
        `, { replacements: { today }, type: QueryTypes.SELECT });

        // Tasks completed this week
        const tasksWeek = await sequelize.query(`
            SELECT COUNT(*) as count FROM "ext_lab_tasks"
            WHERE status = 'Completed' AND DATE(updated_at) >= :weekAgo
        `, { replacements: { weekAgo }, type: QueryTypes.SELECT });

        res.json({
            experimentsThisWeek: parseInt(experimentsWeek[0]?.count) || 0,
            samplesToday: parseInt(samplesToday[0]?.count) || 0,
            tasksCompletedWeek: parseInt(tasksWeek[0]?.count) || 0
        });
    } catch (error) {
        console.error('Get activity stats error:', error);
        res.status(500).json({ error: 'Failed to fetch activity stats' });
    }
};

// POST /api/favorites
exports.addFavorite = async (req, res) => {
    try {
        const { entityType, entityId } = req.body;
        const userId = req.user.id;

        await sequelize.query(`
            INSERT INTO user_favorites (user_id, entity_type, entity_id)
            VALUES (:userId, :entityType, :entityId)
            ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING
        `, {
            replacements: { userId, entityType, entityId },
            type: QueryTypes.INSERT
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
};

// DELETE /api/favorites/:type/:id
exports.removeFavorite = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.id;

        await sequelize.query(`
            DELETE FROM user_favorites
            WHERE user_id = :userId AND entity_type = :type AND entity_id = :id
        `, {
            replacements: { userId, type, id },
            type: QueryTypes.DELETE
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
};

// GET /api/favorites
exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;

        const favorites = await sequelize.query(`
            SELECT 
                f.entity_type,
                f.entity_id,
                f.created_at,
                CASE 
                    WHEN f.entity_type = 'experiment' THEN (SELECT title FROM "Experiments" WHERE id = f.entity_id)
                    WHEN f.entity_type = 'strain' THEN (SELECT "Strain_No" FROM "ext_bacterial_strains" WHERE id = f.entity_id)
                    WHEN f.entity_type = 'phage' THEN (SELECT "Bacteriophage_Name" FROM "ext_bacteriophages" WHERE id = f.entity_id)
                    ELSE 'Unknown'
                END as name
            FROM user_favorites f
            WHERE f.user_id = :userId
            ORDER BY f.created_at DESC
            LIMIT 10
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        res.json({ favorites });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
};
