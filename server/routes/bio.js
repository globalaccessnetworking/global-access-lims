const express = require('express');
const router = express.Router();
const bioController = require('../controllers/bioController');

router.get('/', bioController.getBioLibrary);

module.exports = router;
