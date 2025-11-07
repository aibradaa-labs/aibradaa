/**
 * Rate Limiter for Netlify Functions
 * Simple in-memory rate limiting (for serverless, use external service in production)
 */

// In-memory store (resets with each cold start)
const requestCounts = new Map();

/**
 * Rate limit configuration by tier
 */
const RATE_LIMITS = {
  guest: {
    windowMs: 60000, // 1 minute
    maxRequests: 10
  },
  free: {
    windowMs: 60000,
    maxRequests: 30
  },
  pro: {
    windowMs: 60000,
    maxRequests: 100
  }
};

/**
 * Check rate limit for user/IP
 */
export function checkRateLimit(identifier, tier = 'guest') {
  const limit = RATE_LIMITS[tier] || RATE_LIMITS.guest;
  const now = Date.now();
  const key = `${identifier}:${tier}`;

  // Get or initialize request history
  if (!requestCounts.has(key)) {
    requestCounts.set(key, []);
  }

  const requests = requestCounts.get(key);

  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => {
    return now - timestamp < limit.windowMs;
  });

  // Check if limit exceeded
  if (validRequests.length >= limit.maxRequests) {
    const oldestRequest = Math.min(...validRequests);
    const resetTime = oldestRequest + limit.windowMs;
    const retryAfter = Math.ceil((resetTime - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfter
    };
  }

  // Add current request
  validRequests.push(now);
  requestCounts.set(key, validRequests);

  return {
    allowed: true,
    remaining: limit.maxRequests - validRequests.length,
    resetTime: now + limit.windowMs,
    retryAfter: null
  };
}

/**
 * Get client identifier (IP address)
 */
export function getClientIdentifier(event) {
  // Netlify provides client IP in headers
  return event.headers['x-forwarded-for'] ||
         event.headers['x-nf-client-connection-ip'] ||
         'unknown';
}

/**
 * Middleware: Apply rate limiting
 */
export function applyRateLimit(event, tier = 'guest') {
  const identifier = getClientIdentifier(event);
  const result = checkRateLimit(identifier, tier);

  if (!result.allowed) {
    const error = new Error('Rate limit exceeded');
    error.statusCode = 429;
    error.retryAfter = result.retryAfter;
    throw error;
  }

  return {
    rateLimit: {
      remaining: result.remaining,
      resetTime: result.resetTime
    }
  };
}

/**
 * Cleanup old entries periodically (prevent memory leak)
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [key, requests] of requestCounts.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < maxAge);

    if (validRequests.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, validRequests);
    }
  }
}, 600000); // Clean up every 10 minutes
