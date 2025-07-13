// src/routes/chatroom.js
const express = require('express');
const { body, param } = require('express-validator');
const chatroomController = require('../controllers/chatroomController');
const { authenticateToken } = require('../middleware/auth');
const { checkDailyLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply authentication to all chatroom routes
router.use(authenticateToken);

// Validation middleware
const validateCreateChatroom = [
  body('name')
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('Chatroom name is required and must be less than 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
];

const validateSendMessage = [
  body('message')
    .notEmpty()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message is required and must be less than 10000 characters'),
  param('id')
    .isUUID()
    .withMessage('Invalid chatroom ID')
];

const validateChatroomId = [
  param('id')
    .isUUID()
    .withMessage('Invalid chatroom ID')
];

const validateUpdateChatroom = [
  param('id')
    .isUUID()
    .withMessage('Invalid chatroom ID'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Chatroom name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
];

// Routes
/**
 * @route   POST /chatroom
 * @desc    Create a new chatroom
 * @access  Private
 */
router.post('/', validateCreateChatroom, chatroomController.createChatroom);

/**
 * @route   GET /chatroom
 * @desc    Get all chatrooms for the user (cached)
 * @access  Private
 */
router.get('/', chatroomController.getChatrooms);

/**
 * @route   GET /chatroom/:id
 * @desc    Get specific chatroom with messages
 * @access  Private
 */
router.get('/:id', validateChatroomId, chatroomController.getChatroom);

/**
 * @route   POST /chatroom/:id/message
 * @desc    Send message in chatroom (with rate limiting)
 * @access  Private
 */
router.post('/:id/message', validateSendMessage, checkDailyLimit, chatroomController.sendMessage);

/**
 * @route   PUT /chatroom/:id
 * @desc    Update chatroom details
 * @access  Private
 */
router.put('/:id', validateUpdateChatroom, chatroomController.updateChatroom);

/**
 * @route   DELETE /chatroom/:id
 * @desc    Delete chatroom (soft delete)
 * @access  Private
 */
router.delete('/:id', validateChatroomId, chatroomController.deleteChatroom);

module.exports = router;