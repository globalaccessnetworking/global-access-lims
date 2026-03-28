const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { auth } = require('../middleware/auth');

// @route   GET api/qr/lookup
// @desc    Lookup asset by standardized QR identity (INV- or BIO-)
// @access  Private
router.get('/lookup', auth, qrController.lookupAsset);

module.exports = router;
