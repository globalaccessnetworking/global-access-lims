const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const importController = require('../controllers/importController');
const { auth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// @route   POST /api/import/preview
// @desc    Preview CSV file and validate structure
// @access  Private
router.post('/preview', auth, upload.single('file'), importController.previewImport);

// @route   POST /api/import/execute
// @desc    Execute CSV import
// @access  Private
router.post('/execute', auth, upload.single('file'), importController.executeImport);

// @route   GET /api/import/history
// @desc    Get import history
// @access  Private
router.get('/history', auth, importController.getImportHistory);

// @route   GET /api/import/template/:tableName
// @desc    Download CSV template for a table
// @access  Private
router.get('/template/:tableName', auth, importController.downloadTemplate);

module.exports = router;
