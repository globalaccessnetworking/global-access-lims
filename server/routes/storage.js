const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');

// GET /api/storage/boxes
router.get('/boxes', storageController.getBoxes);

// GET /api/storage?box=BoxName
router.get('/', storageController.getStorageHub);

// GET /api/storage/statistics
router.get('/statistics', storageController.getStatistics);

// GET /api/storage/heatmap
router.get('/heatmap', storageController.getHeatMap);

// POST /api/storage/find-slots
router.post('/find-slots', storageController.findEmptySlots);

// GET /api/storage/search
router.get('/search', storageController.searchSamples);

module.exports = router;
