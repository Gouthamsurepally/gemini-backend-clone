// src/controllers/authController.js
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP, validateOTP, generateOTPExpiry, sendOTPSMS } = require('../services/otpService');
const { validationResult } = require('express-validator');

class AuthController {
  /**
   * Register a new user
   */
  async signup(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { mobile, name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { mobile } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this mobile number'
        });
      }

      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 12);
      }

      // Create new user
      const user = await User.create({
        mobile,
        name: name || null,
        email: email || null,
        password: hashedPassword
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          mobile: user.mobile,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Send OTP to user's mobile
   */
  async sendOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { mobile } = req.body;

      // Find user by mobile
      const user = await User.findOne({ where: { mobile } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this mobile number'
        });
      }

      // Generate OTP and expiry
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry(10); // 10 minutes

      // Update user with OTP
      await user.update({
        lastOtp: otp,
        otpExpiry: otpExpiry
      });

      // Send OTP via SMS (mocked for now)
      await sendOTPSMS(mobile, otp);

      res.json({
        success: true,
        message: 'OTP sent successfully',
        // Remove this in production - only for testing
        ...(process.env.NODE_ENV === 'development' && { otp: otp })
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error sending OTP',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verify OTP and login user
   */
  async verifyOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { mobile, otp } = req.body;

      // Find user
      const user = await User.findOne({ where: { mobile } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate OTP
      if (!validateOTP(user.lastOtp, user.otpExpiry, otp)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Clear OTP after successful verification
      await user.update({
        lastOtp: null,
        otpExpiry: null
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          mobile: user.mobile 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        message: 'OTP verified successfully',
        token: token,
        user: {
          id: user.id,
          mobile: user.mobile,
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error verifying OTP',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Send OTP for password reset
   */
  async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { mobile } = req.body;
      console.log(req.body);
      // Find user
      const user = await User.findOne({ where: { mobile } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this mobile number'
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry(10);

      // Update user with reset OTP
      await user.update({
        lastOtp: otp,
        otpExpiry: otpExpiry
      });

      // Send OTP
      await sendOTPSMS(mobile, otp);

      res.json({
        success: true,
        message: 'Password reset OTP sent successfully',
        ...(process.env.NODE_ENV === 'development' && { otp: otp })
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error processing password reset',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // Find user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password if user has one
      if (user.password) {
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await user.update({
        password: hashedNewPassword
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error changing password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AuthController();