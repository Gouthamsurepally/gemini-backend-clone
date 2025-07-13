// src/models/Chatroom.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Chatroom = sequelize.define('Chatroom', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'chatrooms',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['userId', 'isActive']
      }
    ]
  });

  return Chatroom;
};