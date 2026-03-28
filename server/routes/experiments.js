const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experimentController');
const { auth } = require('../middleware/auth');

router.get('/', auth, experimentController.getExperiments);
router.post('/', auth, experimentController.createExperiment);
router.post('/comments', auth, experimentController.addComment);

module.exports = router;
