const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const backupService = require('../services/backupService');
const path = require('path');

// POST /api/backup/create
router.post('/create', auth, async (req, res) => {
    try {
        // Only admins can create backups
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const result = await backupService.createBackup();
        res.json(result);
    } catch (error) {
        console.error('Create backup error:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// GET /api/backup/list
router.get('/list', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const backups = backupService.listBackups();
        res.json({ backups });
    } catch (error) {
        console.error('List backups error:', error);
        res.status(500).json({ error: 'Failed to list backups' });
    }
});

// POST /api/backup/restore
router.post('/restore', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { backupFile } = req.body;
        const result = await backupService.restoreBackup(backupFile);
        res.json(result);
    } catch (error) {
        console.error('Restore backup error:', error);
        res.status(500).json({ error: 'Failed to restore backup' });
    }
});

// GET /api/backup/download/:filename
router.get('/download/:filename', auth, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { filename } = req.params;
        const backupPath = path.join(__dirname, '../backups', filename);

        res.download(backupPath);
    } catch (error) {
        console.error('Download backup error:', error);
        res.status(500).json({ error: 'Failed to download backup' });
    }
});

// POST /api/backup/export-settings
router.post('/export-settings', auth, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const result = backupService.exportSettings();
        res.json(result);
    } catch (error) {
        console.error('Export settings error:', error);
        res.status(500).json({ error: 'Failed to export settings' });
    }
});

module.exports = router;
