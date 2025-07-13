// src/config/database.js - FIXED VERSION
const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Railway provides DATABASE_URL
  console.log('🔗 Using DATABASE_URL for Railway connection');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // Fallback for local development
  console.log('🔗 Using individual DB environment variables');
  sequelize = new Sequelize(
    process.env.DB_NAME || 'gemini_backend',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log,
    }
  );
}

module.exports = sequelize;