const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const orderController = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

// @route   GET api/orders
// @desc    Get all orders
// @access  Private
router.get('/', auth, orderController.getOrders);

// @route   POST api/orders
// @desc    Create new order
// @access  Private
router.post(
    '/',
    [
        auth,
        check('chemical_id', 'Chemical ID is required').isNumeric(),
        check('quantity', 'Quantity is required').isNumeric()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    orderController.createOrder
);

// @route   GET api/orders/purchase-request/:id
// @desc    Generate Purchase Request PDF
// @access  Private
router.get('/purchase-request/:id', auth, orderController.generatePurchaseRequestPDF);

module.exports = router;
