// src/routes/debug.js
const express = require('express');
const { getQueueStats, healthCheck } = require('../services/geminiService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Queue status endpoint
router.get('/queue-status', authenticateToken, async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json({
      success: true,
      message: 'Queue status retrieved',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting queue status',
      error: error.message
    });
  }
});

// Gemini API health check
router.get('/gemini-health', authenticateToken, async (req, res) => {
  try {
    const isHealthy = await healthCheck();
    res.json({
      success: true,
      message: 'Gemini API health check',
      data: {
        healthy: isHealthy,
        apiKeySet: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gemini API health check failed',
      error: error.message
    });
  }
});

// Test direct Gemini call
router.post('/test-gemini', authenticateToken, async (req, res) => {
  try {
    const { generateDirectResponse } = require('../services/geminiService');
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const response = await generateDirectResponse(message);
    res.json({
      success: true,
      message: 'Direct Gemini call successful',
      data: {
        userMessage: message,
        aiResponse: response
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Direct Gemini call failed',
      error: error.message
    });
  }
});

module.exports = router;