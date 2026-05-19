const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

console.log('✅ Auth Routes Module Loaded');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Admin only
router.post(
    '/register',
    [
        auth,
        authorize(['Admin']),
        check('username', 'Username is required').not().isEmpty(),
        check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    authController.register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('username', 'Username is required').exists(),
        check('password', 'Password is required').exists()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    authController.login
);

// @route   GET api/auth/users
// @desc    Get all users
// @access  Admin
router.get('/users', auth, authController.getUsers);

// @route   PUT api/auth/users/:id
// @desc    Update user permissions and role
// @access  Admin only
router.put('/users/:id', [auth, authorize(['Admin', 'SuperAdmin'])], authController.updateUserPermissions);

// @route   DELETE api/auth/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', auth, authController.deleteUser);

// @route   POST api/auth/forgot-password-step1
// @desc    Return user's security questions (public)
// @access  Public
router.post('/forgot-password-step1', authController.forgotPasswordStep1);

// @route   POST api/auth/forgot-password-step2
// @desc    Verify security answers and reset password (public)
// @access  Public
router.post('/forgot-password-step2', authController.forgotPasswordStep2);

module.exports = router;
