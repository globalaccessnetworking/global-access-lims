const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { auth } = require('../middleware/auth');

// GET /api/activity/recent
router.get('/recent', activityController.getRecentActivity);

// GET /api/activity/stats
router.get('/stats', activityController.getActivityStats);

// POST /api/favorites
router.post('/favorites', auth, activityController.addFavorite);

// DELETE /api/favorites/:type/:id
router.delete('/favorites/:type/:id', auth, activityController.removeFavorite);

// GET /api/favorites
router.get('/favorites', auth, activityController.getFavorites);

module.exports = router;
