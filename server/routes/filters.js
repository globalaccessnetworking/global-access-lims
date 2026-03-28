const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filterController');
const { auth } = require('../middleware/auth');

// POST /api/filters/save
router.post('/save', auth, filterController.saveFilter);

// GET /api/filters
router.get('/', auth, filterController.getFilters);

// DELETE /api/filters/:id
router.delete('/:id', auth, filterController.deleteFilter);

module.exports = router;
