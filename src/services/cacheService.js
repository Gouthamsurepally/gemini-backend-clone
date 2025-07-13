// src/services/cacheService.js - Production Ready
const redis = require('redis');

let client;

// Create Redis client based on environment
if (process.env.REDIS_URL) {
  // Railway provides REDIS_URL
  console.log('🔗 Using REDIS_URL for connection');
  client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: process.env.NODE_ENV === 'production',
      rejectUnauthorized: false
    }
  });
} else {
  // Fallback to individual environment variables
  console.log('🔗 Using individual Redis environment variables');
  client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.error('Redis server refused connection');
        return new Error('Redis server refused connection');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Redis retry time exhausted');
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });
}

client.on('connect', () => {
  console.log('✅ Connected to Redis');
});

client.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

client.on('ready', () => {
  console.log('🚀 Redis client ready');
});

// Connect to Redis
client.connect().catch((err) => {
  console.error('❌ Failed to connect to Redis:', err);
});

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed data or null if not found
 */
const getCachedData = async (key) => {
  try {
    if (!client.isOpen) {
      console.warn('⚠️ Redis client not connected');
      return null;
    }
    const cachedData = await client.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} - Success status
 */
const setCachedData = async (key, data, ttl = 300) => {
  try {
    if (!client.isOpen) {
      console.warn('⚠️ Redis client not connected');
      return false;
    }
    await client.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete cached data
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
const deleteCachedData = async (key) => {
  try {
    if (!client.isOpen) {
      console.warn('⚠️ Redis client not connected');
      return false;
    }
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Delete cached data by pattern
 * @param {string} pattern - Key pattern (e.g., 'chatrooms:*')
 * @returns {Promise<boolean>} - Success status
 */
const deleteCachedDataByPattern = async (pattern) => {
  try {
    if (!client.isOpen) {
      console.warn('⚠️ Redis client not connected');
      return false;
    }
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache delete by pattern error:', error);
    return false;
  }
};

/**
 * Check if Redis is connected
 * @returns {boolean} - Connection status
 */
const isConnected = () => {
  return client && client.isOpen;
};

module.exports = {
  getCachedData,
  setCachedData,
  deleteCachedData,
  deleteCachedDataByPattern,
  isConnected,
  client
};