const express = require('express');
const router = express.Router();
const modulesController = require('../controllers/modulesController');
const { auth } = require('../middleware/auth');

// @route   GET api/modules/list
// @desc    Get all available modules (Core + Dynamic)
// @access  Private
router.get('/list', auth, modulesController.getModuleList);

// @route   GET api/modules/:type
// @desc    Get data for a specific module
// @access  Private
router.get('/:type', auth, modulesController.getModuleData);

module.exports = router;
