const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/sourceController');
const { auth } = require('../middleware/auth');

router.get('/', auth, sourceController.getSources);
router.post('/', auth, sourceController.addSource);

module.exports = router;
