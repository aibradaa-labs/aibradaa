/**
 * Rate Limiting Middleware
 * Implements tier-based rate limiting
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config.mjs';

/**
 * Base rate limiter for all API endpoints
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use user ID from JWT if available, otherwise use IP
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  // Skip rate limiting for health checks
  skip: (req) => {
    return req.path === '/api/health' || req.path === '/health';
  },
});

/**
 * Tier-specific rate limiters
 */
export const freeTierLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.freeTier,
  message: {
    error: 'Free tier limit exceeded',
    message: 'Upgrade to Pro for higher limits.',
    tier: 'free',
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

export const proTierLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.proTier,
  message: {
    error: 'Pro tier limit exceeded',
    message: 'You have reached your Pro tier limit. Consider upgrading to Ultimate.',
    tier: 'pro',
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

export const ultimateTierLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.ultimateTier,
  message: {
    error: 'Ultimate tier limit exceeded',
    message: 'Even Ultimate users have limits! Please wait before trying again.',
    tier: 'ultimate',
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

/**
 * Apply tier-based rate limiting based on user's subscription
 */
export function applyTierLimiter(req, res, next) {
  const userTier = req.user?.tier || 'free';

  switch (userTier) {
    case 'ultimate':
      return ultimateTierLimiter(req, res, next);
    case 'pro':
      return proTierLimiter(req, res, next);
    case 'free':
    default:
      return freeTierLimiter(req, res, next);
  }
}

export default rateLimitMiddleware;
