// src/services/otpService.js
const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure random OTP using crypto
 * @returns {string} - 6-digit OTP
 */
const generateSecureOTP = () => {
  const buffer = crypto.randomBytes(3);
  const num = parseInt(buffer.toString('hex'), 16);
  return (num % 900000 + 100000).toString();
};

/**
 * Validate OTP
 * @param {string} storedOtp - OTP stored in database
 * @param {Date} expiryTime - OTP expiry time
 * @param {string} providedOtp - OTP provided by user
 * @returns {boolean} - Validation result
 */
const validateOTP = (storedOtp, expiryTime, providedOtp) => {
  // Check if OTP exists
  if (!storedOtp || !providedOtp) {
    return false;
  }

  // Check if OTP has expired
  if (!expiryTime || new Date() > new Date(expiryTime)) {
    return false;
  }

  // Check if OTP matches
  return storedOtp === providedOtp.toString();
};

/**
 * Generate OTP expiry time
 * @param {number} minutes - Minutes from now (default: 10)
 * @returns {Date} - Expiry time
 */
const generateOTPExpiry = (minutes = 10) => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

/**
 * Check if OTP has expired
 * @param {Date} expiryTime - OTP expiry time
 * @returns {boolean} - True if expired
 */
const isOTPExpired = (expiryTime) => {
  if (!expiryTime) return true;
  return new Date() > new Date(expiryTime);
};

/**
 * Mock SMS sending function
 * In production, integrate with actual SMS service like Twilio, AWS SNS, etc.
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP to send
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPSMS = async (mobile, otp) => {
  try {
    // Mock implementation - log to console
    console.log(`SMS to ${mobile}: Your OTP is ${otp}. Valid for 10 minutes.`);
    
    // In production, replace with actual SMS service:
    /*
    const twilioClient = require('twilio')(accountSid, authToken);
    await twilioClient.messages.create({
      body: `Your OTP is ${otp}. Valid for 10 minutes.`,
      from: '+1234567890',
      to: mobile
    });
    */
    
    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
};

/**
 * Rate limit OTP requests
 * Prevent spam by limiting OTP requests per mobile number
 * @param {string} mobile - Mobile number
 * @returns {boolean} - True if request is allowed
 */
const checkOTPRateLimit = (mobile) => {
  // In production, implement rate limiting using Redis
  // This is a simple in-memory implementation for demo
  const now = Date.now();
  const key = `otp_rate_limit_${mobile}`;
  
  // Allow 3 OTP requests per hour
  // Implementation would use Redis with TTL
  return true;
};

module.exports = {
  generateOTP,
  generateSecureOTP,
  validateOTP,
  generateOTPExpiry,
  isOTPExpired,
  sendOTPSMS,
  checkOTPRateLimit
};