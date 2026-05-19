const express = require('express');
const router = express.Router();
const bioController = require('../controllers/bioController');

router.get('/', bioController.getBioLibrary);
router.get('/detail/:type/:id', bioController.getAssetDetail);
router.patch('/detail/:type/:id', bioController.updateAssetDetail);

module.exports = router;
