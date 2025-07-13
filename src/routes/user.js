// src/routes/user.js
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticateToken);

// Validation middleware
const validateUpdateProfile = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Routes
/**
 * @route   GET /user/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', userController.getProfile);

/**
 * @route   PUT /user/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/update-user', validateUpdateProfile, userController.updateProfile);

/**
 * @route   DELETE /user/me
 * @desc    Delete/deactivate user account
 * @access  Private
 */
router.delete('/me', userController.deleteAccount);

module.exports = router;