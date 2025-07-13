// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Request logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Raw body for Stripe webhooks
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Raw body for Stripe webhooks
// app.use('/webhook/stripe', express.raw({ type: 'application/json' }));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const chatroomRoutes = require('./routes/chatroom');
const subscriptionRoutes = require('./routes/subscription');
const debugRoutes = require('./routes/debug');


app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/chatroom', chatroomRoutes);
app.use('/subscribe', subscriptionRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/debug', debugRoutes);

// Webhook route (separate from rate limiting)
const { handleWebhook } = require('./controllers/subscriptionController');
app.post('/webhook/stripe', handleWebhook);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;