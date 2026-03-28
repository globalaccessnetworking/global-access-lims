const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

// @route   GET api/notifications
// @desc    Get all notifications
// @access  Private
router.get('/', auth, notificationController.getNotifications);

// @route   PUT api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, notificationController.markAsRead);

module.exports = router;
