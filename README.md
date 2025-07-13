# Gemini Backend Clone

A comprehensive backend system with OTP authentication, AI chatrooms, and subscription management.

## Features
- OTP-based authentication
- JWT token management
- AI-powered chatrooms using Google Gemini
- Subscription management with Stripe
- Redis caching
- Rate limiting
- Async message processing

## OTP Implementation Note
- OTP is currently mocked for assignment/testing purposes
- In production, this would integrate with SMS services like Twilio, AWS SNS, or similar
- The OTP is returned in the API response for testing convenience## OTP Implementation Note


## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Start the server: `npm run dev`

## API Documentation
See POSTMAN collection for complete API documentation.

## Tech Stack
- Node.js + Express
- PostgreSQL + Sequelize
- Redis + Bull Queue
- Google Gemini API
- Stripe Payments