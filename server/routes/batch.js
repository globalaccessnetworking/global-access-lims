const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { auth } = require('../middleware/auth');

// POST /api/batch/delete
router.post('/delete', auth, batchController.bulkDelete);

// POST /api/batch/export
router.post('/export', auth, batchController.bulkExport);

// POST /api/batch/update-status
router.post('/update-status', auth, batchController.bulkUpdateStatus);

// POST /api/batch/generate-qr
router.post('/generate-qr', auth, batchController.bulkGenerateQR);

module.exports = router;
