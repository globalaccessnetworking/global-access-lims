const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

// GET /api/analytics
router.get('/', auth, analyticsController.getAnalyticsSummary);

// GET /api/analytics/success-trends
router.get('/success-trends', auth, analyticsController.getSuccessTrends);

// GET /api/analytics/protocol-comparison
router.get('/protocol-comparison', auth, analyticsController.getProtocolComparison);

// GET /api/analytics/storage-utilization
router.get('/storage-utilization', auth, analyticsController.getStorageUtilization);

// GET /api/analytics/activity-timeline
router.get('/activity-timeline', auth, analyticsController.getActivityTimeline);

module.exports = router;
