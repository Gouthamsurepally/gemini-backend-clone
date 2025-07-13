// src/routes/subscription.js
const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Routes that require authentication
/**
 * @route   POST /subscribe/pro
 * @desc    Create Pro subscription checkout session
 * @access  Private
 */
router.post('/pro', authenticateToken, subscriptionController.createProSubscription);

/**
 * @route   GET /subscription/status
 * @desc    Get user's subscription status
 * @access  Private
 */
router.get('/status', authenticateToken, subscriptionController.getSubscriptionStatus);

/**
 * @route   POST /subscription/cancel
 * @desc    Cancel user's subscription
 * @access  Private
 */
router.post('/cancel', authenticateToken, subscriptionController.cancelSubscription);

/**
 * @route   POST /subscription/reactivate
 * @desc    Reactivate cancelled subscription
 * @access  Private
 */
router.post('/reactivate', authenticateToken, subscriptionController.reactivateSubscription);

// Manual webhook trigger (for testing)
router.post('/trigger-webhook', authenticateToken, subscriptionController.triggerWebhookManually);


// Public routes for Stripe callbacks
/**
 * @route   GET /subscription/success
 * @desc    Handle successful subscription
 * @access  Public
 */
router.get('/success', subscriptionController.subscriptionSuccess);

/**
 * @route   GET /subscription/cancel
 * @desc    Handle cancelled subscription
 * @access  Public
 */
router.get('/cancel', subscriptionController.subscriptionCancel);

// Test webhook endpoint (for development)
router.post('/webhook/test', subscriptionController.testWebhook);


module.exports = router;