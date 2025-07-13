// src/controllers/chatroomController.js
const { Chatroom, Message, User } = require('../models');
const { getCachedData, setCachedData, deleteCachedData } = require('../services/cacheService');
const { addMessageToQueue } = require('../services/geminiService');
const { validationResult } = require('express-validator');

class ChatroomController {
  /**
   * Create a new chatroom
   */
  async createChatroom(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { name, description } = req.body;
      const userId = req.user.userId;

      // Create chatroom
      const chatroom = await Chatroom.create({
        name,
        description: description || null,
        userId
      });

      // Invalidate cache for this user's chatrooms
      await deleteCachedData(`chatrooms:${userId}`);

      res.status(201).json({
        success: true,
        message: 'Chatroom created successfully',
        data: {
          id: chatroom.id,
          name: chatroom.name,
          description: chatroom.description,
          createdAt: chatroom.createdAt
        }
      });

    } catch (error) {
      console.error('Create chatroom error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error creating chatroom',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get all chatrooms for the user (with caching)
   */
  async getChatrooms(req, res) {
    try {
      const userId = req.user.userId;
      const cacheKey = `chatrooms:${userId}`;

      // Try to get from cache first
      let chatrooms = await getCachedData(cacheKey);
      
      if (!chatrooms) {
        // If not in cache, fetch from database
        chatrooms = await Chatroom.findAll({
          where: { 
            userId, 
            isActive: true 
          },
          attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
          order: [['updatedAt', 'DESC']]
        });

        // Cache for 5 minutes (300 seconds)
        await setCachedData(cacheKey, chatrooms, 300);
        console.log(`Chatrooms cached for user ${userId}`);
      } else {
        console.log(`Chatrooms served from cache for user ${userId}`);
      }

      res.json({
        success: true,
        message: 'Chatrooms retrieved successfully',
        data: chatrooms,
        cached: !!chatrooms // Indicate if served from cache
      });

    } catch (error) {
      console.error('Get chatrooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error retrieving chatrooms',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get specific chatroom with messages
   */
  async getChatroom(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Validate chatroom ID
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Chatroom ID is required'
        });
      }

      // Get chatroom with messages
      const chatroom = await Chatroom.findOne({
        where: { 
          id, 
          userId, 
          isActive: true 
        },
        include: [
          {
            model: Message,
            as: 'messages',
            attributes: ['id', 'content', 'sender', 'inReplyTo', 'createdAt'],
            order: [['createdAt', 'ASC']],
            limit: 100 // Limit to last 100 messages
          }
        ]
      });

      if (!chatroom) {
        return res.status(404).json({
          success: false,
          message: 'Chatroom not found or access denied'
        });
      }

      res.json({
        success: true,
        message: 'Chatroom retrieved successfully',
        data: {
          id: chatroom.id,
          name: chatroom.name,
          description: chatroom.description,
          createdAt: chatroom.createdAt,
          updatedAt: chatroom.updatedAt,
          messages: chatroom.messages || []
        }
      });

    } catch (error) {
      console.error('Get chatroom error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error retrieving chatroom',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Send message in chatroom (async processing with Gemini)
   */
  async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user.userId;

      // Validate message content
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      // Check if chatroom exists and belongs to user
      const chatroom = await Chatroom.findOne({
        where: { 
          id, 
          userId, 
          isActive: true 
        }
      });

      if (!chatroom) {
        return res.status(404).json({
          success: false,
          message: 'Chatroom not found or access denied'
        });
      }

      // Create user message in database
      const userMessage = await Message.create({
        chatroomId: id,
        content: message.trim(),
        sender: 'user'
      });

      // Update chatroom's updatedAt timestamp
      await chatroom.update({
        updatedAt: new Date()
      });

      // Invalidate chatrooms cache since updatedAt changed
      await deleteCachedData(`chatrooms:${userId}`);

      // Add to Gemini processing queue
      try {
        await addMessageToQueue({
          chatroomId: id,
          userMessage: message.trim(),
          messageId: userMessage.id,
          userId: userId
        });
      } catch (queueError) {
        console.error('Queue error:', queueError);
        // Continue with response even if queue fails
      }

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          id: userMessage.id,
          content: userMessage.content,
          sender: userMessage.sender,
          createdAt: userMessage.createdAt,
          chatroomId: userMessage.chatroomId
        },
        dailyUsage: req.dailyUsage // Include usage info from rate limiter
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error sending message',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update chatroom details
   */
  async updateChatroom(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const userId = req.user.userId;

      // Find chatroom
      const chatroom = await Chatroom.findOne({
        where: { 
          id, 
          userId, 
          isActive: true 
        }
      });

      if (!chatroom) {
        return res.status(404).json({
          success: false,
          message: 'Chatroom not found or access denied'
        });
      }

      // Update chatroom
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      await chatroom.update(updateData);

      // Invalidate cache
      await deleteCachedData(`chatrooms:${userId}`);

      res.json({
        success: true,
        message: 'Chatroom updated successfully',
        data: {
          id: chatroom.id,
          name: chatroom.name,
          description: chatroom.description,
          updatedAt: chatroom.updatedAt
        }
      });

    } catch (error) {
      console.error('Update chatroom error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error updating chatroom',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete chatroom (soft delete)
   */
  async deleteChatroom(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Find chatroom
      const chatroom = await Chatroom.findOne({
        where: { 
          id, 
          userId, 
          isActive: true 
        }
      });

      if (!chatroom) {
        return res.status(404).json({
          success: false,
          message: 'Chatroom not found or access denied'
        });
      }

      // Soft delete
      await chatroom.update({
        isActive: false
      });

      // Invalidate cache
      await deleteCachedData(`chatrooms:${userId}`);

      res.json({
        success: true,
        message: 'Chatroom deleted successfully'
      });

    } catch (error) {
      console.error('Delete chatroom error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error deleting chatroom',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new ChatroomController();