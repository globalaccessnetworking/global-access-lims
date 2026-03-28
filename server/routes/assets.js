const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const assetController = require('../controllers/assetController');
const { auth } = require('../middleware/auth');

// @route   GET api/assets
// @desc    Get all assets
// @access  Public
router.get('/', assetController.getAssets);

// @route   POST api/assets
// @desc    Add new asset
// @access  Private
router.post(
    '/',
    [
        auth,
        check('strain_number', 'Strain Number is required').not().isEmpty(),
        check('species', 'Species is required').not().isEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    assetController.addAsset
);

// @route   PUT api/assets/:id/move
// @desc    Move asset to new location
// @access  Private
router.put(
    '/:id/move',
    [
        auth,
        check('storage_location_id', 'Storage Location ID is required').isNumeric()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    assetController.moveAsset
);

module.exports = router;
