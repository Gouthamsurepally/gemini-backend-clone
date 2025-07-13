// // server.js
// const app = require('./src/app');
// const { sequelize } = require('./src/models');
// require('dotenv').config();

// const PORT = process.env.PORT || 3000;

// const startServer = async () => {
//   try {
//     // Debug logging for Vercel
//     console.log('🔧 PORT environment variable:', process.env.PORT);
//     console.log('🔧 Using PORT:', PORT);
//     console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
//     console.log('🔧 Platform: Vercel Serverless');

//     // Test database connection
//     await sequelize.authenticate();
//     console.log('✅ Database connected successfully');

//     // Sync models (creates tables if they don't exist)
//     // In production, use migrations instead
//     await sequelize.sync({ 
//       alter: process.env.NODE_ENV === 'development' 
//     });
//     console.log('✅ Database models synced');

//     // Start the server - Remove 0.0.0.0 binding for Vercel
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//       console.log(`📖 Health endpoint: /health`);
//       console.log(`🌐 Platform: Vercel Serverless`);
//       console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
//     });

//   } catch (error) {
//     console.error('❌ Unable to start server:', error);
//     process.exit(1);
//   }
// };

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err, promise) => {
//   console.error('Unhandled Promise Rejection:', err.message);
//   // Close server & exit process
//   process.exit(1);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception:', err.message);
//   process.exit(1);
// });

// // Graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('SIGTERM received. Shutting down gracefully...');
//   try {
//     await sequelize.close();
//     console.log('Database connection closed.');
//     process.exit(0);
//   } catch (error) {
//     console.error('Error during shutdown:', error);
//     process.exit(1);
//   }
// });

// process.on('SIGINT', async () => {
//   console.log('SIGINT received. Shutting down gracefully...');
//   try {
//     await sequelize.close();
//     console.log('Database connection closed.');
//     process.exit(0);
//   } catch (error) {
//     console.error('Error during shutdown:', error);
//     process.exit(1);
//   }
// });

// startServer();

// server.js
const app = require('./src/app');
const { sequelize } = require('./src/models');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Add debugging for Railway
    console.log('🔧 PORT environment variable:', process.env.PORT);
    console.log('🔧 Using PORT:', PORT);
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync models (creates tables if they don't exist)
    // In production, use migrations instead
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development' 
    });
    console.log('✅ Database models synced');

    // Start the server - IMPORTANT: Bind to 0.0.0.0 for Railway
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📖 Health endpoint: /health`);
      console.log(`🌐 Public URL: https://gemini-backend-clone-production.up.railway.app`);
      console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();