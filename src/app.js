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

// DEBUG: Add request logging to see if requests are reaching the app
app.use((req, res, next) => {
  console.log(`📥 Incoming request: ${req.method} ${req.url} from ${req.ip}`);
  console.log(`📋 Headers:`, req.headers);
  next();
});

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

// Health check endpoint - MOVED TO TOP for easier access
app.get('/health', (req, res) => {
  console.log('🏥 Health endpoint hit!');
  console.log('🔧 Request details:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
  });
});

// Base route for testing
app.get('/', (req, res) => {
  console.log('🏠 Base route hit!');
  res.json({
    success: true,
    message: 'Gemini Backend Clone API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      user: '/user/*',
      chatroom: '/chatroom/*',
      subscription: '/subscription/*',
      debug: '/debug/*'
    }
  });
});

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

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;