const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Phase 3 & 4: Read-Only Routes
router.get('/boxes', inventoryController.getBoxes);
router.get('/box-matrix/:boxName', inventoryController.getBoxMatrix);

// Phase 5: Write Operations & Enhancements
router.get('/freezers', inventoryController.getFreezers);
router.get('/search-assets', inventoryController.searchAssets);
router.post('/place-tube', inventoryController.placeTube);
router.post('/move-tube', inventoryController.moveTube);
router.post('/remove-tube', inventoryController.removeTube);
router.post('/resolve-conflict', inventoryController.resolveConflict);
router.get('/check-slot', inventoryController.checkSlot);

module.exports = router;
