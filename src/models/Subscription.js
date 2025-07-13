// src/models/Subscription.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    stripeCustomerId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tier: {
      type: DataTypes.ENUM('basic', 'pro'),
      allowNull: false,
      defaultValue: 'basic'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'past_due'),
      allowNull: false,
      defaultValue: 'inactive'
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId']
      },
      {
        fields: ['stripeSubscriptionId']
      },
      {
        fields: ['tier', 'status']
      }
    ]
  });

  return Subscription;
};