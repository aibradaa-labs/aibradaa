/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

import jwt from 'jsonwebtoken';
import { config } from '../config.mjs';

/**
 * Verify JWT token and attach user to request
 */
export function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided',
        code: 'NO_TOKEN',
      });
    }

    // Extract token (format: "Bearer <token>")
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
        code: 'INVALID_TOKEN_FORMAT',
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      tier: decoded.tier || 'free',
      roles: decoded.roles || [],
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }

    // Other errors
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate token',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Optional auth middleware
 * Attaches user if token is present, but doesn't require it
 */
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  try {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const decoded = jwt.verify(token, config.auth.jwtSecret);

      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        tier: decoded.tier || 'free',
        roles: decoded.roles || [],
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
}

/**
 * Require specific tier
 */
export function requireTier(minTier) {
  const tierLevels = {
    free: 0,
    pro: 1,
    ultimate: 2,
  };

  return (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    const userLevel = tierLevels[userTier] || 0;
    const requiredLevel = tierLevels[minTier] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This feature requires ${minTier} tier or higher`,
        code: 'INSUFFICIENT_TIER',
        currentTier: userTier,
        requiredTier: minTier,
      });
    }

    next();
  };
}

/**
 * Require specific role
 */
export function requireRole(role) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];

    if (!userRoles.includes(role) && !userRoles.includes('admin')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires ${role} role`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRole: role,
      });
    }

    next();
  };
}

export default authMiddleware;
