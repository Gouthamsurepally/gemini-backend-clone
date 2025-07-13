// src/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateSignup = [
  body('mobile')
    .isMobilePhone()
    .withMessage('Please provide a valid mobile number'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const validateSendOTP = [
  body('mobile')
    .isMobilePhone()
    .withMessage('Please provide a valid mobile number')
];

const validateVerifyOTP = [
  body('mobile')
    .isMobilePhone()
    .withMessage('Please provide a valid mobile number'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits')
];

const validateForgotPassword = [
  body('mobile')
    .isMobilePhone()
    .withMessage('Please provide a valid mobile number')
];

const validateChangePassword = [
  body('currentPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Current password must be at least 6 characters'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Routes
/**
 * @route   POST /auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', validateSignup, authController.signup);

/**
 * @route   POST /auth/send-otp
 * @desc    Send OTP to user's mobile number
 * @access  Public
 */
router.post('/send-otp', validateSendOTP, authController.sendOTP);

/**
 * @route   POST /auth/verify-otp
 * @desc    Verify OTP and login user
 * @access  Public
 */
router.post('/verify-otp', validateVerifyOTP, authController.verifyOTP);

/**
 * @route   POST /auth/forgot-password
 * @desc    Send OTP for password reset
 * @access  Public
 */
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

/**
 * @route   POST /auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', authenticateToken, validateChangePassword, authController.changePassword);

module.exports = router;