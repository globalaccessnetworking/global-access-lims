const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { auth } = require('../middleware/auth');

// @route   GET api/alerts
// @desc    Get all inventory alerts (low stock & expiring)
// @access  Private
router.get('/', auth, alertController.getAlerts);

// @route   POST api/alerts/dismiss
// @desc    Dismiss or snooze an alert
// @access  Private
router.post('/dismiss', auth, alertController.dismissAlert);

// @route   POST api/alerts/send-digest
// @desc    Send email digest of alerts
// @access  Private
router.post('/send-digest', auth, alertController.sendDigest);

module.exports = router;
