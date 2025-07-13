# Gemini Backend Clone - Kuvaka Tech Assignment

A comprehensive backend system built with Node.js, Express, PostgreSQL, and Redis featuring OTP-based authentication, AI-powered chatrooms, and subscription management.

## 🚀 Live Deployment

**Production URL:** `https://your-railway-url.railway.app`

**API Documentation:** All endpoints are documented in the included Postman collection.

## 📋 Features Implemented

### ✅ Authentication System
- **OTP-based login** with mobile number only
- **JWT token management** with 24-hour expiry
- **Password reset** functionality via OTP
- **Secure authentication middleware**

### ✅ Chatroom Management  
- **Create and manage multiple chatrooms** per user
- **Real-time AI conversations** powered by Google Gemini API
- **Async message processing** using Bull Queue with Redis
- **Message history** with proper threading

### ✅ Caching Implementation
- **Redis caching** for chatroom lists (5-minute TTL)
- **Cache invalidation** on chatroom updates
- **Performance optimization** for frequently accessed data
- **Justification:** Chatrooms are frequently accessed but rarely modified

### ✅ Rate Limiting
- **Basic Tier:** 5 messages per day
- **Pro Tier:** Unlimited messages  
- **Daily usage tracking** with subscription-based limits
- **Graceful limit handling** with upgrade prompts

### ✅ Subscription & Payments
- **Stripe integration** (sandbox mode) for Pro subscriptions
- **Webhook handling** for payment events
- **Subscription status tracking** with period management
- **Cancel and reactivate** functionality

### ✅ API Endpoints (All Required)

| Endpoint | Method | Auth | Description |
|----------|---------|------|-------------|
| `/auth/signup` | POST | ❌ | Register new user |
| `/auth/send-otp` | POST | ❌ | Send OTP to mobile |
| `/auth/verify-otp` | POST | ❌ | Verify OTP and login |
| `/auth/forgot-password` | POST | ❌ | Password reset OTP |
| `/auth/change-password` | POST | ✅ | Change password |
| `/user/me` | GET | ✅ | Get user profile |
| `/chatroom` | POST | ✅ | Create chatroom |
| `/chatroom` | GET | ✅ | List chatrooms (cached) |
| `/chatroom/:id` | GET | ✅ | Get chatroom details |
| `/chatroom/:id/message` | POST | ✅ | Send message (rate limited) |
| `/subscribe/pro` | POST | ✅ | Create Pro subscription |
| `/webhook/stripe` | POST | ❌ | Handle Stripe webhooks |
| `/subscription/status` | GET | ✅ | Get subscription status |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │────│   Express API   │────│   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ├─────────────────┐
                              │                 │
                       ┌──────▼──────┐   ┌─────▼─────┐
                       │    Redis    │   │   Bull    │
                       │   (Cache)   │   │  (Queue)  │
                       └─────────────┘   └───────────┘
                              │
                       ┌──────▼──────┐
                       │   Gemini    │
                       │     API     │
                       └─────────────┘
```

## 🛠️ Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Cache:** Redis for caching and Bull Queue
- **Authentication:** JWT with OTP verification
- **AI Integration:** Google Gemini API
- **Payments:** Stripe (sandbox mode)
- **Deployment:** Railway (PostgreSQL + Redis + App)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### Local Development
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/gemini-backend-clone.git
cd gemini-backend-clone

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
DATABASE_URL=your_database_url
REDIS_PUBLIC_URL=your_REDIS_PUBLIC_URL
```

## 🧪 Testing

### Postman Collection
Import the included `Gemini_Backend_Clone.postman_collection.json` file for complete API testing.

### Test Flow
1. **Authentication:** Signup → Send OTP → Verify OTP
2. **Chatrooms:** Create → List (cache test) → Send Messages
3. **Rate Limiting:** Send 6 messages (5th succeeds, 6th fails)
4. **Subscriptions:** Check Status → Create Pro → Verify Upgrade

### SMS Service Note
OTP SMS is currently mocked for assignment purposes. The OTP is returned in the API response for easy testing. In production, this would integrate with services like Twilio or AWS SNS.

## 🚀 Deployment

### Railway Deployment
1. **Database:** PostgreSQL and Redis provisioned automatically
2. **Environment:** All variables configured in Railway dashboard  
3. **SSL:** Enabled for production database connections
4. **Monitoring:** Railway provides built-in monitoring and logs

### Production URL
`https://your-railway-url.railway.app`

## 📊 Key Implementation Details

### Caching Strategy
- **What:** Chatroom lists per user
- **TTL:** 5 minutes  
- **Invalidation:** On create, update, delete operations
- **Justification:** Frequently accessed on dashboard load, rarely modified

### Queue System
- **Technology:** Bull Queue with Redis
- **Purpose:** Async Gemini API calls to prevent blocking
- **Features:** Retry logic, job prioritization, error handling
- **Monitoring:** Queue statistics available via debug endpoints

### Rate Limiting
- **Implementation:** Database-based daily message counting
- **Basic Tier:** 5 messages/day
- **Pro Tier:** 1000 messages/day (effectively unlimited)
- **Reset:** Daily at midnight UTC

### Database Schema
- **Users:** Mobile-based authentication with optional email/name
- **Chatrooms:** User-owned conversation containers
- **Messages:** Threaded conversations with user/AI distinction
- **Subscriptions:** Stripe integration with status tracking

## 🔒 Security Features

- **JWT Authentication:** Secure token-based auth with expiry
- **Input Validation:** Comprehensive request validation
- **Rate Limiting:** Prevents API abuse
- **CORS Configuration:** Secure cross-origin requests
- **Helmet.js:** Security headers
- **SSL/TLS:** Production database encryption

## 📈 Performance Optimizations

- **Redis Caching:** Reduces database load for frequent queries
- **Connection Pooling:** Efficient database connections
- **Async Processing:** Non-blocking AI API calls
- **Query Optimization:** Indexed database queries
- **Compression:** Gzipped API responses

## 🐛 Error Handling

- **Comprehensive Logging:** Detailed error tracking
- **Graceful Failures:** User-friendly error messages
- **Retry Logic:** Automatic retry for transient failures
- **Validation Errors:** Clear field-specific error messages

## 📝 Assignment Compliance

This implementation fulfills all requirements from the Kuvaka Tech assignment:
- ✅ OTP-based authentication system
- ✅ JWT token management
- ✅ Chatroom creation and management
- ✅ Google Gemini API integration with queue
- ✅ Stripe subscription handling with webhooks
- ✅ All 13 required API endpoints
- ✅ Redis caching with justification
- ✅ Rate limiting for Basic vs Pro tiers
- ✅ PostgreSQL database with Sequelize
- ✅ Public deployment with working URL
- ✅ Postman collection with all endpoints
- ✅ Complete documentation

## 👨‍💻 Developer

**Assignment Submission for Kuvaka Tech Backend Developer Position**

- **GitHub:** https://github.com/YOUR_USERNAME/gemini-backend-clone
- **Live Demo:** https://your-railway-url.railway.app  
- **Postman Collection:** Included in repository

---

*This project demonstrates proficiency in modern backend development practices, API design, database management, third-party integrations, and cloud deployment.*