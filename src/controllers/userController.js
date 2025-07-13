// src/controllers/userController.js
const { User, Subscription } = require('../models');

class UserController {
  /**
   * Get current user details
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      // Get user with subscription details
      const user = await User.findByPk(userId, {
        attributes: ['id', 'mobile', 'name', 'email', 'isActive', 'createdAt', 'updatedAt'],
        include: [
          {
            model: Subscription,
            as: 'subscription',
            attributes: ['tier', 'status', 'currentPeriodStart', 'currentPeriodEnd']
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Format response
      const userProfile = {
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        subscription: {
          tier: user.subscription?.tier || 'basic',
          status: user.subscription?.status || 'inactive',
          currentPeriodStart: user.subscription?.currentPeriodStart || null,
          currentPeriodEnd: user.subscription?.currentPeriodEnd || null
        }
      };

      res.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: userProfile
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error retrieving profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { name, email } = req.body;

      // Find user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user details
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user.id,
          mobile: user.mobile,
          name: user.name,
          email: user.email,
          updatedAt: user.updatedAt
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error updating profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.userId;

      // Find user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Soft delete by setting isActive to false
      await user.update({
        isActive: false
      });

      res.json({
        success: true,
        message: 'Account deactivated successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error deleting account',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new UserController();