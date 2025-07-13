// src/models/Message.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chatroomId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chatrooms',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    sender: {
      type: DataTypes.ENUM('user', 'ai'),
      allowNull: false,
      defaultValue: 'user'
    },
    inReplyTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        fields: ['chatroomId']
      },
      {
        fields: ['chatroomId', 'createdAt']
      },
      {
        fields: ['sender']
      }
    ]
  });

  return Message;
};