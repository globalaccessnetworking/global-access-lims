const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/interactionController');

// Phase 182: All routes open (no auth) for full diagnostic visibility
router.get('/debug',            async (req, res) => { res.json({ status: 'interactions router ok' }); });
router.get('/all-phages',       ctrl.getAllPhages);
router.get('/matrix',           ctrl.getMatrix);
router.get('/profile/:phageId', ctrl.getProfile);
router.get('/export',           ctrl.exportMatrix);
router.post('/upsert',          ctrl.upsertInteraction);

module.exports = router;
