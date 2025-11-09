/**
 * Authentication Utilities for Netlify Functions
 * JWT validation and API key checking
 */

import jwt from 'jsonwebtoken';

/**
 * Extract token from Authorization header
 */
export function extractToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader) {
    return null;
  }

  // Handle "Bearer TOKEN" format
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  // Handle direct token
  return authHeader;
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  if (!token) {
    throw new Error('No token provided');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Validate API key (for service-to-service auth)
 */
export function validateApiKey(event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];

  if (!apiKey) {
    throw new Error('API key required');
  }

  const validKey = process.env.API_KEY;
  if (!validKey) {
    throw new Error('API_KEY not configured');
  }

  if (apiKey !== validKey) {
    throw new Error('Invalid API key');
  }

  return true;
}

/**
 * Get user from token in event
 */
export function getUserFromEvent(event) {
  const token = extractToken(event);
  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication middleware
 */
export function requireAuth(event) {
  const user = getUserFromEvent(event);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Check if user has required tier
 */
export function requireTier(user, minTier) {
  const tierLevels = {
    'guest': 0,
    'free': 1,
    'pro': 2,
    'ultimate': 3,
    'enterprise': 4
  };

  const userLevel = tierLevels[user.tier] || 0;
  const requiredLevel = tierLevels[minTier] || 0;

  if (userLevel < requiredLevel) {
    throw new Error(`Tier '${minTier}' or higher required`);
  }

  return true;
}

/**
 * Generate JWT token
 */
export function generateToken(payload, expiresIn = '24h') {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(payload, secret, { expiresIn });
}
