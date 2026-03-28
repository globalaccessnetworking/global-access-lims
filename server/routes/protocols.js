const express = require('express');
const router = express.Router();
const protocolController = require('../controllers/protocolController');
const { auth } = require('../middleware/auth');

// GET /api/protocols
router.get('/', auth, protocolController.getProtocols);

// GET /api/protocols/:id
router.get('/:id', auth, protocolController.getProtocol);

// POST /api/protocols
router.post('/', auth, protocolController.createProtocol);

// POST /api/protocols/:id/execute
router.post('/:id/execute', auth, protocolController.startProtocolExecution);

// PUT /api/protocols/executions/:id/step
router.put('/executions/:id/step', auth, protocolController.updateExecutionStep);

// GET /api/protocols/executions/active
router.get('/executions/active', auth, protocolController.getActiveExecutions);

module.exports = router;
