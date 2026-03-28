const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { auth } = require('../middleware/auth');

router.get('/', auth, interactionController.getInteractionMatrix);
router.post('/', auth, interactionController.toggleInteraction);

module.exports = router;
