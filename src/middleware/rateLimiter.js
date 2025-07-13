// src/middleware/rateLimiter.js
const { User, Subscription, Message, Chatroom } = require('../models');
const { Op } = require('sequelize');

const checkDailyLimit = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get user's subscription
    const subscription = await Subscription.findOne({
      where: { userId }
    });

    const tier = subscription?.tier || 'basic';
    const dailyLimit = tier === 'basic' ? 
      parseInt(process.env.BASIC_TIER_DAILY_LIMIT) || 5 : 
      parseInt(process.env.PRO_TIER_DAILY_LIMIT) || 1000;

    // If pro tier with unlimited access
    if (tier === 'pro' && dailyLimit >= 1000) {
      req.dailyUsage = {
        used: 0,
        limit: 'unlimited',
        tier
      };
      return next();
    }

    // Count today's messages from user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const messageCount = await Message.count({
      include: [{
        model: Chatroom,
        as: 'chatroom',
        where: { userId },
        attributes: []
      }],
      where: {
        sender: 'user',
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    if (messageCount >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: tier === 'basic' ? 
          'Daily limit exceeded. Upgrade to Pro for unlimited messages.' : 
          'Daily limit exceeded. Please try again tomorrow.',
        dailyLimit,
        usedToday: messageCount,
        tier,
        upgradeRequired: tier === 'basic'
      });
    }

    req.dailyUsage = {
      used: messageCount,
      limit: dailyLimit,
      tier,
      remaining: dailyLimit - messageCount
    };

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking usage limits',
      error: error.message
    });
  }
};

module.exports = { checkDailyLimit };