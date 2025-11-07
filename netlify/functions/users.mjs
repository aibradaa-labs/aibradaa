/**
 * Users Netlify Function
 * Handles user profile and preferences
 * Routes: GET /profile, PUT /preferences, PATCH /tier
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody
} from './utils/response.mjs';
import { requireAuth } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';

// In-memory user store (replace with database in production)
// Note: This should be shared with auth.mjs in production
// Consider using: Netlify Identity, FaunaDB, Supabase, or DynamoDB
const users = new Map();

/**
 * Get user profile
 */
function getUserProfile(user) {
  const userData = users.get(user.email) || {
    id: user.id,
    email: user.email,
    tier: user.tier || 'free',
    preferences: {},
    createdAt: new Date().toISOString()
  };

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    tier: userData.tier,
    preferences: userData.preferences || {},
    createdAt: userData.createdAt
  };
}

/**
 * Update user preferences
 */
function updatePreferences(user, newPreferences) {
  const userData = users.get(user.email);

  if (!userData) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  userData.preferences = {
    ...userData.preferences,
    ...newPreferences
  };

  users.set(user.email, userData);

  return {
    message: 'Preferences updated successfully',
    preferences: userData.preferences
  };
}

/**
 * Update user tier (admin only or self-upgrade)
 */
function updateTier(user, newTier) {
  const validTiers = ['guest', 'free', 'pro'];

  if (!validTiers.includes(newTier)) {
    const error = new Error(`Invalid tier. Must be one of: ${validTiers.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const userData = users.get(user.email);

  if (!userData) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  userData.tier = newTier;
  users.set(user.email, userData);

  return {
    message: 'Tier updated successfully',
    tier: userData.tier
  };
}

/**
 * Main handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Require authentication
    const user = requireAuth(event);

    // Apply rate limiting
    try {
      applyRateLimit(event, user.tier || 'guest');
    } catch (rateLimitError) {
      if (rateLimitError.statusCode === 429) {
        return errorResponse(
          'Rate limit exceeded',
          429,
          { retryAfter: rateLimitError.retryAfter }
        );
      }
      throw rateLimitError;
    }

    // Route based on path and method
    const path = event.path.replace(/^\/\.netlify\/functions\/users/, '');

    // GET /profile
    if (path === '/profile' && event.httpMethod === 'GET') {
      const profile = getUserProfile(user);
      return successResponse({
        user: profile
      });
    }

    // PUT /preferences
    if (path === '/preferences' && event.httpMethod === 'PUT') {
      const body = parseBody(event);

      if (!body.preferences) {
        return errorResponse('Preferences object is required', 400);
      }

      const result = updatePreferences(user, body.preferences);
      return successResponse(result);
    }

    // PATCH /tier (for tier upgrades)
    if (path === '/tier' && event.httpMethod === 'PATCH') {
      const body = parseBody(event);

      if (!body.tier) {
        return errorResponse('Tier is required', 400);
      }

      const result = updateTier(user, body.tier);
      return successResponse(result);
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('Users error:', error);

    // Handle specific error types
    if (error.message.includes('Authentication required')) {
      return errorResponse(error.message, 401);
    }

    if (error.message.includes('User not found')) {
      return errorResponse(error.message, 404);
    }

    if (error.message.includes('Invalid tier')) {
      return errorResponse(error.message, 400);
    }

    const statusCode = error.statusCode || 500;
    return errorResponse(
      error.message || 'User operation failed',
      statusCode,
      process.env.NODE_ENV !== 'production' ? error.stack : null
    );
  }
}
