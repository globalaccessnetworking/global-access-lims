const { sequelize } = require('../models');

/**
 * Get all experiment templates
 */
exports.getTemplates = async (req, res) => {
    try {
        const user_id = req.user?.id;

        const [templates] = await sequelize.query(
            `SELECT t.*, u.username as created_by_name
             FROM experiment_templates t
             LEFT JOIN "Users" u ON t.created_by = u.id
             WHERE t.is_public = true OR t.created_by = $1
             ORDER BY t.created_at DESC`,
            { bind: [user_id] }
        );

        res.json({ templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create a new template
 */
exports.createTemplate = async (req, res) => {
    try {
        const { name, protocol, description, default_fields, checklist, is_public } = req.body;
        const created_by = req.user?.id;

        if (!name || !protocol) {
            return res.status(400).json({ error: 'Name and protocol are required' });
        }

        const [result] = await sequelize.query(
            `INSERT INTO experiment_templates (name, protocol, description, default_fields, checklist, created_by, is_public)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            {
                bind: [
                    name,
                    protocol,
                    description || '',
                    JSON.stringify(default_fields || {}),
                    JSON.stringify(checklist || []),
                    created_by,
                    is_public || false
                ]
            }
        );

        res.json({ success: true, template: result[0] });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get a single template
 */
exports.getTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const [templates] = await sequelize.query(
            `SELECT * FROM experiment_templates WHERE id = $1`,
            { bind: [parseInt(id)] }
        );

        if (templates.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({ template: templates[0] });
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete a template
 */
exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;

        // Check ownership
        const [templates] = await sequelize.query(
            `SELECT created_by FROM experiment_templates WHERE id = $1`,
            { bind: [parseInt(id)] }
        );

        if (templates.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (templates[0].created_by !== user_id) {
            return res.status(403).json({ error: 'Not authorized to delete this template' });
        }

        await sequelize.query(
            `DELETE FROM experiment_templates WHERE id = $1`,
            { bind: [parseInt(id)] }
        );

        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = exports;
