const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { auth } = require('../middleware/auth');

router.get('/', auth, inventoryController.getChemicals);

// @route   GET api/inventory/chemicals
// @desc    Get all chemicals (alias for frontend consistency)
// @access  Private
router.get('/chemicals', auth, inventoryController.getChemicals);

// @route   GET api/inventory/lookup
// @desc    Lookup asset by QR/Barcode/ID
// @access  Private
router.get('/lookup', auth, inventoryController.lookupAsset);

// @route   POST api/inventory
// @desc    Create chemical
// @access  Private
router.post('/', auth, inventoryController.upsertChemical);

// @route   PUT api/inventory
// @desc    Upsert chemical (create or update by barcode)
// @access  Private
router.put('/', auth, inventoryController.upsertChemical);

// @route   PUT api/inventory/:id
// @desc    Update chemical by ID
// @access  Private
router.put('/:id', auth, inventoryController.updateChemical);

// @route   DELETE api/inventory/:id
// @desc    Delete chemical
// @access  Private
router.delete('/:id', auth, inventoryController.deleteChemical);

// @route   PUT api/inventory/:id/volume
// @desc    Update chemical volume
// @access  Private
router.put(
    '/:id/volume',
    [
        auth,
        check('current_volume', 'Current Volume is required and must be a number').isNumeric()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    inventoryController.updateVolume
);

// @route   GET api/inventory/low-stock
// @desc    Get low stock chemicals
// @access  Private
router.get('/low-stock', auth, inventoryController.getLowStock);

// ==========================================
// INVENTORY STOCK ROUTES
// ==========================================

// @route   GET api/inventory/stocks
// @desc    Get all inventory stocks
// @access  Private
router.get('/stocks', auth, inventoryController.getAllStocks);

// @route   POST api/inventory/stocks
// @desc    Add new stock item
// @access  Private
router.post('/stocks', auth, inventoryController.addStock);

// @route   PUT api/inventory/stocks/:id
// @desc    Update stock item
// @access  Private
router.put('/stocks/:id', auth, inventoryController.updateStock);

// @route   DELETE api/inventory/stocks/:id
// @desc    Delete stock item
// @access  Private
router.delete('/stocks/:id', auth, inventoryController.deleteStock);

module.exports = router;
