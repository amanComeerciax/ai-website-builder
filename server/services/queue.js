const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Use Upstash Redis URL from Env, fallback to local for development
const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});

/**
 * Main Generation Queue where user API requests are dropped
 * The AI Worker process will pull from this queue sequentially.
 */
const generationQueue = new Queue('AI_Generation_Queue', { 
  connection,
  defaultJobOptions: {
    attempts: 3,                 // Automatic retry on failure
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,      // Keep Redis RAM usage low
    removeOnFail: 100            // Keep last 100 failed jobs for debugging
  }
});

module.exports = { generationQueue };
