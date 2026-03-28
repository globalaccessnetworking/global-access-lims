const { sequelize } = require('../models');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Upload attachment
 */
exports.uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { entityType, entityId, caption } = req.body;
        const userId = req.user?.id;

        if (!entityType || !entityId) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'entityType and entityId are required' });
        }

        // Optimize image if it's an image file
        let finalPath = req.file.path;
        if (req.file.mimetype.startsWith('image/')) {
            try {
                const optimizedPath = req.file.path.replace(/\.[^.]+$/, '_optimized.jpg');
                await sharp(req.file.path)
                    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 85 })
                    .toFile(optimizedPath);

                // Delete original and use optimized
                fs.unlinkSync(req.file.path);
                finalPath = optimizedPath;
            } catch (err) {
                console.warn('Image optimization failed, using original:', err.message);
            }
        }

        // Get file stats
        const stats = fs.statSync(finalPath);
        const relativePath = finalPath.replace(/\\/g, '/').replace(/^.*\/uploads\//, 'uploads/');

        // Insert into database
        const [result] = await sequelize.query(
            `INSERT INTO attachments (entity_type, entity_id, file_name, file_path, file_type, file_size, uploaded_by, caption)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            {
                bind: [
                    entityType,
                    parseInt(entityId),
                    req.file.originalname,
                    relativePath,
                    req.file.mimetype,
                    stats.size,
                    userId,
                    caption || null
                ]
            }
        );

        res.json({
            success: true,
            attachment: result[0]
        });

    } catch (error) {
        console.error('Upload attachment error:', error);
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get attachments for an entity
 */
exports.getAttachments = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const [attachments] = await sequelize.query(
            `SELECT a.*, u.username as uploaded_by_name
             FROM attachments a
             LEFT JOIN "Users" u ON a.uploaded_by = u.id
             WHERE a.entity_type = $1 AND a.entity_id = $2
             ORDER BY a.created_at DESC`,
            { bind: [entityType, parseInt(entityId)] }
        );

        res.json({ attachments });

    } catch (error) {
        console.error('Get attachments error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete attachment
 */
exports.deleteAttachment = async (req, res) => {
    try {
        const { id } = req.params;

        // Get attachment details first
        const [attachments] = await sequelize.query(
            `SELECT * FROM attachments WHERE id = $1`,
            { bind: [parseInt(id)] }
        );

        if (attachments.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        const attachment = attachments[0];

        // Delete file from filesystem
        const fullPath = path.join(__dirname, '..', attachment.file_path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // Delete from database
        await sequelize.query(
            `DELETE FROM attachments WHERE id = $1`,
            { bind: [parseInt(id)] }
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update attachment caption
 */
exports.updateCaption = async (req, res) => {
    try {
        const { id } = req.params;
        const { caption } = req.body;

        await sequelize.query(
            `UPDATE attachments SET caption = $1 WHERE id = $2`,
            { bind: [caption, parseInt(id)] }
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Update caption error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = exports;
