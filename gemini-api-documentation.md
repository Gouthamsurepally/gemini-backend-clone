# Gemini Backend Clone - API Documentation

**Version:** 1.0.0  
**Last Updated:** July 2025  
**Author:** Development Team  

---

# Gemini Backend Clone API Documentation

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://gemini-backend-clone-production.up.railway.app/`

## Authentication
The API uses JWT Bearer token authentication for protected endpoints. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. User Signup
**POST** `/auth/signup`

Creates a new user account.

**Request Body:**
```json
{
  "mobile": "9705343725",
  "name": "Test User",
  "email": "testgemini@yopmail.com",
  "password": "Password123"
}
```

**Response:** User registration confirmation

---

### 2. Send OTP
**POST** `/auth/send-otp`

Sends OTP to the provided mobile number for verification.

**Request Body:**
```json
{
  "mobile": "9705343725"
}
```

**Response:** OTP sent confirmation

---

### 3. Verify OTP and Login
**POST** `/auth/verify-otp`

Verifies the OTP and logs in the user.

**Request Body:**
```json
{
  "mobile": "9705343725",
  "otp": "515792"
}
```

**Response:** JWT token for authentication

---

### 4. Forgot Password
**POST** `/auth/forgot-password`

Initiates password reset process.

**Request Body:**
```json
{
  "mobile": "9705343724"
}
```

**Authentication:** Not required

**Response:** Password reset instructions

---

### 5. Change Password
**POST** `/auth/change-password`

Changes user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Authentication:** Required (Bearer token)

**Response:** Password change confirmation

---

## 👤 User Management Endpoints

### 1. Get User Profile
**GET** `/user/me`

Retrieves the current user's profile information.

**Authentication:** Required (Bearer token)

**Response:** User profile data

---

### 2. Update User Profile
**PUT** `/user/update-user`

Updates user profile information.

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

**Authentication:** Required (Bearer token)

**Response:** Updated user profile

---

## 💬 Chatroom Endpoints

### 1. Create Chatroom
**POST** `/chatroom/create-chatroom`

Creates a new chatroom.

**Request Body:**
```json
{
  "name": "My Initial Chat",
  "description": "Testing the my own chatroom"
}
```

**Authentication:** Required (Bearer token)

**Response:** Created chatroom details

---

### 2. Send Message
**POST** `/chatroom/{chatroom_id}/message`

Sends a message to a specific chatroom.

**Path Parameters:**
- `chatroom_id`: UUID of the chatroom

**Request Body:**
```json
{
  "message": "Hello Gemini AI, how's grook?"
}
```

**Authentication:** Required (Bearer token)

**Response:** Message sent confirmation and AI response

---

### 3. Get All Chatrooms
**GET** `/chatroom`

Retrieves all chatrooms for the authenticated user.

**Authentication:** Required (Bearer token)

**Response:** List of user's chatrooms

---

### 4. Get Chatroom by ID
**GET** `/chatroom/{chatroom_id}`

Retrieves a specific chatroom and its messages.

**Path Parameters:**
- `chatroom_id`: UUID of the chatroom

**Authentication:** Required (Bearer token)

**Response:** Chatroom details and message history

---

## 🔧 Debug & Monitoring Endpoints

### 1. Check Queue Status
**GET** `/debug/queue-status`

Checks the status of the message processing queue.

**Authentication:** Required (Bearer token)

**Response:** Current queue status and statistics

---

### 2. Gemini Health Check
**GET** `/debug/gemini-health`

Checks the health status of the Gemini AI integration.

**Authentication:** Required (Bearer token)

**Response:** Gemini AI service health status

---

## 💳 Subscription & Payment Endpoints

### 1. Subscribe to Pro
**POST** `/subscribe/pro`

Initiates a Pro subscription for the user.

**Authentication:** Required (Bearer token)

**Response:** Subscription details and payment instructions

---

### 2. Get Subscription Status
**GET** `/subscription/status`

Retrieves the current subscription status of the user.

**Authentication:** Required (Bearer token)

**Response:** Current subscription details and status

---

## 🔗 Webhook Endpoints

### 1. Stripe Webhook
**POST** `/webhook/stripe`

Handles Stripe payment webhooks.

**Authentication:** Not required (webhook signature verification)

**Response:** Webhook processing confirmation

---

### 2. Test Webhook
**POST** `/subscription/webhook/test`

Test endpoint for webhook functionality.

**Request Body:**
```json
{
  "eventType": "checkout.session.completed",
  "data": {
    "id": "cs_test_a1Y6XPhdLJRGx9XEeLeIYIo5dk9xfMk7oCE840MNutR1NNgrIfWmQVuuwa",
    "subscription": "sub_test_subscription_123",
    "customer_email": "testgemini@yopmail.com",
    "metadata": {
      "userId": "93d2d4f4-f04c-4a1d-b202-85fd333428fd"
    }
  }
}
```

**Authentication:** Not required

**Response:** Test webhook processing result

---

### 3. Manual Trigger Webhook
**POST** `/subscription/trigger-webhook`

Manually triggers webhook processing for testing.

**Request Body:**
```json
{
  "session_id": "cs_test_a1Y6XPhdLJRGx9XEeLeIYIo5dk9xfMk7oCE840MNutR1NNgrIfWmQVuuwa"
}
```

**Authentication:** Required (Bearer token)

**Response:** Manual trigger result

---

## 🏥 Health Check Endpoints

### 1. Application Health Check
**GET** `/health`

Checks the overall health status of the application.

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "message": "",
  "timestamp": ""
}
```

This endpoint is crucial for monitoring and ensuring that the application is running smoothly. It can be used in automated health checks and monitoring systems.

---

### 2. Production Health Check
**GET** `/` (Production only)

Production environment health check endpoint.

**Authentication:** Required (Bearer token)

**Response:** Production service health status

---

## 📝 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## 🔍 Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## 📋 Usage Notes

1. **JWT Token**: Store the JWT token received from login/OTP verification for authenticated requests
2. **Mobile Format**: Use the mobile number format as shown in examples
3. **Chatroom ID**: Use the UUID format for chatroom identification
4. **Environment**: Switch between development and production URLs as needed
5. **Rate Limiting**: Be mindful of rate limits for OTP and message sending
6. **Webhooks**: Stripe webhooks require proper signature verification in production

---

## 🚀 Getting Started

1. **Register**: Use `/auth/signup` to create an account
2. **Verify**: Send OTP with `/auth/send-otp` and verify with `/auth/verify-otp`
3. **Authenticate**: Use the received JWT token for all protected endpoints
4. **Create Chat**: Use `/chatroom/create-chatroom` to start chatting
5. **Send Messages**: Use `/chatroom/{id}/message` to interact with Gemini AI

This API provides a complete chat application backend with AI integration, user management, and subscription capabilities.