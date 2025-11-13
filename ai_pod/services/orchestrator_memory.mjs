/**
 * Syeddy Orchestrator - Memory System (Redis/Upstash)
 *
 * 84-Mentor Governance: Per-user conversation persistence
 * Approved by: Geoffrey Hinton (AI Memory), Andrew Ng (User Experience)
 *
 * Features:
 * - Per-user conversation threads (UUID-based)
 * - 50-message rolling window
 * - 30-day TTL (PDPA compliance)
 * - Upstash Redis FREE tier (10k commands/day)
 * - Fallback to in-memory if Redis unavailable
 *
 * @module orchestrator_memory
 */

import { Redis } from '@upstash/redis';

// ============================================================================
// REDIS CLIENT CONFIGURATION
// ============================================================================

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Upstash Redis client
 */
function initializeRedis() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('[Orchestrator Memory] Redis credentials missing, using in-memory fallback');
    isRedisAvailable = false;
    return null;
  }

  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    isRedisAvailable = true;
    console.log('[Orchestrator Memory] Redis initialized successfully');
    return redisClient;
  } catch (error) {
    console.error('[Orchestrator Memory] Redis initialization failed:', error.message);
    isRedisAvailable = false;
    return null;
  }
}

// In-memory fallback (temporary storage if Redis unavailable)
const memoryCache = new Map();

// ============================================================================
// MEMORY OPERATIONS
// ============================================================================

/**
 * Store conversation message for user
 *
 * @param {string} userId - User UUID
 * @param {Object} message - Message object { role: 'user'|'assistant', content: string, timestamp: number }
 * @returns {Promise<boolean>} Success status
 */
export async function storeMessage(userId, message) {
  if (!userId) throw new Error('userId is required');
  if (!message || !message.role || !message.content) {
    throw new Error('Invalid message format');
  }

  const key = `orchestrator:conversation:${userId}`;
  const messageWithTimestamp = {
    ...message,
    timestamp: message.timestamp || Date.now(),
  };

  try {
    if (isRedisAvailable || redisClient) {
      const client = redisClient || initializeRedis();
      if (client) {
        // Get current messages
        const existingMessages = await client.get(key) || [];
        const messages = Array.isArray(existingMessages) ? existingMessages : [];

        // Add new message
        messages.push(messageWithTimestamp);

        // Keep only last 50 messages (rolling window)
        const limitedMessages = messages.slice(-50);

        // Store with 30-day TTL
        await client.set(key, limitedMessages, { ex: 30 * 24 * 60 * 60 });
        return true;
      }
    }

    // Fallback to in-memory
    const messages = memoryCache.get(key) || [];
    messages.push(messageWithTimestamp);
    memoryCache.set(key, messages.slice(-50));
    return true;

  } catch (error) {
    console.error('[Orchestrator Memory] Failed to store message:', error.message);

    // Emergency fallback
    const messages = memoryCache.get(key) || [];
    messages.push(messageWithTimestamp);
    memoryCache.set(key, messages.slice(-50));
    return false;
  }
}

/**
 * Retrieve conversation history for user
 *
 * @param {string} userId - User UUID
 * @param {number} limit - Maximum messages to retrieve (default: 50)
 * @returns {Promise<Array>} Array of message objects
 */
export async function getConversationHistory(userId, limit = 50) {
  if (!userId) throw new Error('userId is required');

  const key = `orchestrator:conversation:${userId}`;

  try {
    if (isRedisAvailable || redisClient) {
      const client = redisClient || initializeRedis();
      if (client) {
        const messages = await client.get(key);
        if (!messages) return [];

        const messageArray = Array.isArray(messages) ? messages : [];
        return messageArray.slice(-limit);
      }
    }

    // Fallback to in-memory
    const messages = memoryCache.get(key) || [];
    return messages.slice(-limit);

  } catch (error) {
    console.error('[Orchestrator Memory] Failed to retrieve history:', error.message);
    return memoryCache.get(key) || [];
  }
}

/**
 * Clear conversation history for user (PDPA compliance - user deletion)
 *
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} Success status
 */
export async function clearConversationHistory(userId) {
  if (!userId) throw new Error('userId is required');

  const key = `orchestrator:conversation:${userId}`;

  try {
    if (isRedisAvailable || redisClient) {
      const client = redisClient || initializeRedis();
      if (client) {
        await client.del(key);
      }
    }

    memoryCache.delete(key);
    return true;

  } catch (error) {
    console.error('[Orchestrator Memory] Failed to clear history:', error.message);
    memoryCache.delete(key);
    return false;
  }
}

/**
 * Get conversation summary (token count, message count)
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Summary { messageCount: number, estimatedTokens: number }
 */
export async function getConversationSummary(userId) {
  const messages = await getConversationHistory(userId);

  // Rough token estimation: ~4 chars = 1 token
  const totalChars = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  const estimatedTokens = Math.ceil(totalChars / 4);

  return {
    messageCount: messages.length,
    estimatedTokens,
    oldestMessage: messages[0]?.timestamp || null,
    latestMessage: messages[messages.length - 1]?.timestamp || null,
  };
}

/**
 * Health check for Redis connection
 *
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  try {
    if (isRedisAvailable || redisClient) {
      const client = redisClient || initializeRedis();
      if (client) {
        await client.ping();
        return { status: 'healthy', backend: 'redis' };
      }
    }

    return { status: 'degraded', backend: 'memory', message: 'Redis unavailable, using in-memory fallback' };

  } catch (error) {
    return { status: 'unhealthy', backend: 'memory', error: error.message };
  }
}

// Initialize on module load
initializeRedis();

export default {
  storeMessage,
  getConversationHistory,
  clearConversationHistory,
  getConversationSummary,
  healthCheck,
};
