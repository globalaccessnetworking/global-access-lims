const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const antibioticController = require('../controllers/antibioticController');

// @route   GET api/antibiotics
// @desc    Get all antibiotics
// @access  Private
router.get('/', auth, antibioticController.getAntibiotics);

// @route   POST api/antibiotics
// @desc    Add or update antibiotic stock
// @access  Private
router.post('/', auth, antibioticController.addAntibiotic);

module.exports = router;
