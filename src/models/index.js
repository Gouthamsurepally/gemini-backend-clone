// src/models/index.js
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Import model definitions
const UserModel = require('./User');
const ChatroomModel = require('./Chatroom');
const MessageModel = require('./Message');
const SubscriptionModel = require('./Subscription');

// Initialize models
const User = UserModel(sequelize, DataTypes);
const Chatroom = ChatroomModel(sequelize, DataTypes);
const Message = MessageModel(sequelize, DataTypes);
const Subscription = SubscriptionModel(sequelize, DataTypes);

// Define associations
User.hasMany(Chatroom, { foreignKey: 'userId', as: 'chatrooms' });
User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });

Chatroom.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Chatroom.hasMany(Message, { foreignKey: 'chatroomId', as: 'messages' });

Message.belongsTo(Chatroom, { foreignKey: 'chatroomId', as: 'chatroom' });

Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Chatroom,
  Message,
  Subscription
};