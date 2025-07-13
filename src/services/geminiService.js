// // src/services/geminiService.js (Enhanced with queue debugging)
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const Bull = require('bull');
// const { Message } = require('../models');

// // Debug API key
// console.log('🔧 Gemini Service Initializing...');
// console.log('API Key loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
// console.log('API Key length:', process.env.GEMINI_API_KEY?.length || 0);
// console.log('Redis Host:', process.env.REDIS_HOST || 'localhost');
// console.log('Redis Port:', process.env.REDIS_PORT || 6379);

// // Initialize Gemini AI with the correct model name
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Try different model names - Google has updated them
// let model;
// let modelName = 'unknown';
// try {
//   // Try the new model name first
//   model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//   modelName = "gemini-1.5-flash";
//   console.log('✅ Using model: gemini-1.5-flash');
// } catch (error) {
//   try {
//     // Fallback to gemini-1.5-pro
//     model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
//     modelName = "gemini-1.5-pro";
//     console.log('✅ Using model: gemini-1.5-pro');
//   } catch (error2) {
//     try {
//       // Last fallback
//       model = genAI.getGenerativeModel({ model: "gemini-pro" });
//       modelName = "gemini-pro";
//       console.log('✅ Using model: gemini-pro');
//     } catch (error3) {
//       console.error('❌ Failed to initialize any Gemini model');
//     }
//   }
// }

// // Create Bull queue with enhanced debugging
// console.log('🔧 Initializing Bull queue...');
// // Enhanced configuration for Vercel
// const getRedisConfig = () => {
//   if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
//     console.log('🔧 Using REDIS_URL for production/Vercel');
//     return process.env.REDIS_URL;  // Use REDIS_URL instead of REDIS_PUBLIC_URL
//   } else {
//     console.log('🔧 Using localhost Redis for development');
//     return {
//       host: process.env.REDIS_HOST || 'localhost',
//       port: process.env.REDIS_PORT || 6379
//     };
//   }
// };

// src/services/geminiService.js (Enhanced with queue debugging)
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Bull = require('bull');
const { Message } = require('../models');

// Debug API key
console.log('🔧 Gemini Service Initializing...');
console.log('API Key loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
console.log('API Key length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('Redis Host:', process.env.REDIS_HOST || 'localhost');
console.log('Redis Port:', process.env.REDIS_PORT || 6379);

// Initialize Gemini AI with the correct model name
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try different model names - Google has updated them
let model;
let modelName = 'unknown';
try {
  // Try the new model name first
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  modelName = "gemini-1.5-flash";
  console.log('✅ Using model: gemini-1.5-flash');
} catch (error) {
  try {
    // Fallback to gemini-1.5-pro
    model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    modelName = "gemini-1.5-pro";
    console.log('✅ Using model: gemini-1.5-pro');
  } catch (error2) {
    try {
      // Last fallback
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
      modelName = "gemini-pro";
      console.log('✅ Using model: gemini-pro');
    } catch (error3) {
      console.error('❌ Failed to initialize any Gemini model');
    }
  }
}

// Create Bull queue with enhanced debugging
console.log('🔧 Initializing Bull queue...');
// Enhanced configuration
const getRedisConfig = () => {
  if (process.env.NODE_ENV === 'production' || process.env.REDIS_PUBLIC_URL) {
    console.log('🔧 Using REDIS_PUBLIC_URL for production/Railway');
    return process.env.REDIS_PUBLIC_URL;  // Just return the URL string
  } else {
    console.log('🔧 Using localhost Redis for development');
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    };
  }
};

const geminiQueue = new Bull('gemini processing', {
  redis: getRedisConfig(),
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

console.log('✅ Bull queue initialized');

// Test Redis connection
geminiQueue.client.on('connect', () => {
  console.log('✅ Bull queue Redis client connected');
});

geminiQueue.client.on('error', (err) => {
  console.error('❌ Bull queue Redis client error:', err);
});

// Enhanced job processing with better logging
console.log('🔧 Setting up queue processor...');

geminiQueue.process('process-message', async (job) => {
  const { chatroomId, userMessage, messageId, userId } = job.data;

  console.log(`\n🤖 [JOB ${job.id}] Processing Gemini request`);
  console.log(`📝 [JOB ${job.id}] Message ID: ${messageId}`);
  console.log(`📝 [JOB ${job.id}] User message: "${userMessage}"`);
  console.log(`📝 [JOB ${job.id}] Chatroom ID: ${chatroomId}`);

  try {
    // Generate response from Gemini
    console.log(`📡 [JOB ${job.id}] Calling Gemini API (${modelName})...`);
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ [JOB ${job.id}] Gemini response received (${text.length} chars)`);
    console.log(`📝 [JOB ${job.id}] Response preview: "${text.substring(0, 100)}..."`);

    // Save AI response to database
    console.log(`💾 [JOB ${job.id}] Saving AI response to database...`);
    const aiMessage = await Message.create({
      chatroomId,
      content: text,
      sender: 'ai',
      inReplyTo: messageId,
      metadata: {
        model: modelName,
        processedAt: new Date(),
        processingTime: Date.now() - job.timestamp,
        jobId: job.id
      }
    });

    console.log(`✅ [JOB ${job.id}] AI response saved with ID: ${aiMessage.id}`);

    return {
      success: true,
      response: text,
      aiMessageId: aiMessage.id,
      processingTime: Date.now() - job.timestamp
    };

  } catch (error) {
    console.error(`❌ [JOB ${job.id}] Gemini API Error:`, error.message);
    console.error(`❌ [JOB ${job.id}] Error details:`, {
      message: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 200)
    });
    
    // Save error message to database
    try {
      console.log(`💾 [JOB ${job.id}] Saving error message to database...`);
      const errorMessage = await Message.create({
        chatroomId,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        sender: 'ai',
        inReplyTo: messageId,
        metadata: {
          error: true,
          errorMessage: error.message,
          processedAt: new Date(),
          jobId: job.id
        }
      });
      console.log(`✅ [JOB ${job.id}] Error message saved with ID: ${errorMessage.id}`);
    } catch (dbError) {
      console.error(`❌ [JOB ${job.id}] Failed to save error message:`, dbError.message);
    }

    // Re-throw error for Bull to handle retries
    throw new Error(`Gemini API Error: ${error.message}`);
  }
});

console.log('✅ Queue processor set up');

// Enhanced queue event listeners
geminiQueue.on('ready', () => {
  console.log('🔄 Queue is ready and listening for jobs');
});

geminiQueue.on('error', (error) => {
  console.error('❌ Queue error:', error.message);
});

geminiQueue.on('waiting', (jobId) => {
  console.log(`⏳ Job ${jobId} is waiting`);
});

geminiQueue.on('active', (job, jobPromise) => {
  console.log(`🔄 Job ${job.id} started processing`);
});

geminiQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully in ${Date.now() - job.timestamp}ms`);
});

geminiQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

geminiQueue.on('stalled', (job) => {
  console.warn(`⚠️  Job ${job.id} stalled`);
});

geminiQueue.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`);
});

/**
 * Add message processing job to queue
 */
const addMessageToQueue = async (jobData) => {
  try {
    console.log(`\n📤 Adding message to queue:`);
    console.log(`   Chatroom ID: ${jobData.chatroomId}`);
    console.log(`   Message ID: ${jobData.messageId}`);
    console.log(`   User ID: ${jobData.userId}`);
    console.log(`   Message: "${jobData.userMessage?.substring(0, 50)}..."`);

    const job = await geminiQueue.add('process-message', jobData, {
      priority: 1,
      delay: 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    console.log(`✅ Message ${jobData.messageId} added to queue with job ID ${job.id}`);
    
    // Check queue health immediately after adding
    const waiting = await geminiQueue.getWaiting();
    const active = await geminiQueue.getActive();
    console.log(`📊 Queue status: ${waiting.length} waiting, ${active.length} active`);
    
    return job;
  } catch (error) {
    console.error('❌ Error adding message to queue:', error);
    throw error;
  }
};

/**
 * Get queue statistics
 */
const getQueueStats = async () => {
  try {
    const waiting = await geminiQueue.getWaiting();
    const active = await geminiQueue.getActive();
    const completed = await geminiQueue.getCompleted();
    const failed = await geminiQueue.getFailed();

    const stats = {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      jobs: {
        waiting: waiting.map(job => ({ 
          id: job.id, 
          data: {
            messageId: job.data.messageId,
            chatroomId: job.data.chatroomId,
            userMessage: job.data.userMessage?.substring(0, 50) + '...'
          }
        })),
        active: active.map(job => ({ 
          id: job.id, 
          data: {
            messageId: job.data.messageId,
            chatroomId: job.data.chatroomId,
            userMessage: job.data.userMessage?.substring(0, 50) + '...'
          }
        })),
        failed: failed.map(job => ({ 
          id: job.id, 
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade
        }))
      }
    };

    console.log('📊 Current queue stats:', {
      waiting: stats.waiting,
      active: stats.active,
      completed: stats.completed,
      failed: stats.failed
    });

    return stats;
  } catch (error) {
    console.error('❌ Error getting queue stats:', error);
    return null;
  }
};

/**
 * Manual job processor (for testing)
 */
const processNextJob = async () => {
  try {
    console.log('🔧 Manually processing next job...');
    const waiting = await geminiQueue.getWaiting();
    if (waiting.length === 0) {
      console.log('ℹ️  No jobs waiting in queue');
      return null;
    }
    
    const job = waiting[0];
    console.log(`🔄 Processing job ${job.id} manually...`);
    // The queue processor will handle this automatically
    return job;
  } catch (error) {
    console.error('❌ Error processing job manually:', error);
    return null;
  }
};

/**
 * Direct call to Gemini API (for testing)
 */
const generateDirectResponse = async (message) => {
  try {
    console.log(`🔧 Direct Gemini API call for: "${message}"`);
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    console.log(`✅ Direct response: "${text.substring(0, 100)}..."`);
    return text;
  } catch (error) {
    console.error('❌ Direct Gemini API Error:', error);
    throw error;
  }
};

/**
 * Health check for Gemini API
 */
const healthCheck = async () => {
  try {
    await generateDirectResponse("Hello");
    return true;
  } catch (error) {
    console.error('❌ Gemini API health check failed:', error);
    return false;
  }
};

/**
 * List available models (for debugging)
 */
const listAvailableModels = async () => {
  try {
    const models = await genAI.listModels();
    console.log('📋 Available models:');
    for await (const model of models) {
      console.log(`  - ${model.name}`);
    }
    return models;
  } catch (error) {
    console.error('❌ Error listing models:', error);
    return [];
  }
};

module.exports = {
  addMessageToQueue,
  getQueueStats,
  generateDirectResponse,
  healthCheck,
  listAvailableModels,
  processNextJob,
  geminiQueue
};