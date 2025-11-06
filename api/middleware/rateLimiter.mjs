/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting requests per time window
 */

// In-memory store for rate limiting
// In production, use Redis for distributed rate limiting
const requestCounts = new Map();

/**
 * Rate limiter middleware factory
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware
 */
export function rateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    maxRequests = 100, // 100 requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => {
      // Use IP address or user ID if authenticated
      return req.user?.id || req.ip || req.connection.remoteAddress;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);

    if (!key) {
      return next();
    }

    const now = Date.now();
    const record = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    // Increment request count
    record.count++;
    requestCounts.set(key, record);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    // Check if limit exceeded
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        error: {
          message,
          statusCode: 429,
          retryAfter,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance per request
      cleanupOldEntries();
    }

    next();
  };
}

/**
 * Create rate limiter with specific limits
 */
export const createRateLimiter = {
  /**
   * Standard API rate limit (100 req/min)
   */
  standard: () => rateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'API rate limit exceeded. Please try again in a minute.'
  }),

  /**
   * Strict limit for expensive operations (10 req/min)
   */
  strict: () => rateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Rate limit exceeded for this operation. Please wait before trying again.'
  }),

  /**
   * Lenient limit for lightweight operations (200 req/min)
   */
  lenient: () => rateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 200,
    message: 'Too many requests. Please slow down.'
  }),

  /**
   * Auth rate limit (5 attempts per 15 minutes)
   */
  auth: () => rateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    skipSuccessfulRequests: true
  }),

  /**
   * Camera/Vision API limit (10 req/min due to cost)
   */
  vision: () => rateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Image analysis rate limit exceeded. Please wait before uploading another image.'
  })
};

/**
 * Cleanup old entries from memory
 */
function cleanupOldEntries() {
  const now = Date.now();
  const entries = Array.from(requestCounts.entries());

  for (const [key, record] of entries) {
    // Remove entries that have expired and had time to reset
    if (now > record.resetTime + 60000) { // 1 minute grace period
      requestCounts.delete(key);
    }
  }

  // Log cleanup if significant
  if (entries.length - requestCounts.size > 100) {
    console.log(`Rate limiter: Cleaned up ${entries.length - requestCounts.size} old entries`);
  }
}

/**
 * Get current rate limit stats (for monitoring)
 */
export function getRateLimitStats() {
  const now = Date.now();
  const activeKeys = Array.from(requestCounts.entries())
    .filter(([_, record]) => now <= record.resetTime)
    .length;

  return {
    totalKeys: requestCounts.size,
    activeKeys,
    memoryUsage: process.memoryUsage().heapUsed
  };
}

/**
 * Reset rate limits for a specific key (admin function)
 */
export function resetRateLimit(key) {
  requestCounts.delete(key);
  return { success: true, key };
}

/**
 * Clear all rate limits (admin function)
 */
export function clearAllRateLimits() {
  const count = requestCounts.size;
  requestCounts.clear();
  return { success: true, cleared: count };
}

export default rateLimiter;
