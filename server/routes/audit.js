const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { auth, authorize } = require('../middleware/auth');

// @route   GET api/audit
// @desc    Get all logs
// @access  Admin only
router.get('/', [auth, authorize(['Admin'])], auditController.getLogs);

module.exports = router;
