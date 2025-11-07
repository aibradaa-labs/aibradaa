/**
 * Authentication Netlify Function
 * Handles user registration, login, and magic link authentication
 * Routes: POST /register, POST /login, POST /magic-link, GET /verify/:token
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  validateRequired,
  getPathParam
} from './utils/response.mjs';
import { generateToken } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';

// In-memory stores (replace with database in production)
// For serverless, consider: Netlify Identity, FaunaDB, Supabase, or DynamoDB
const users = new Map();
const magicLinks = new Map();

/**
 * Register new user
 */
async function registerUser(body) {
  const { email, password, name } = body;

  // Validate required fields
  validateRequired(body, ['email', 'password', 'name']);

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Password strength validation (min 8 chars)
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if user exists
  if (users.has(email)) {
    const error = new Error('User already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = {
    id: crypto.randomUUID(),
    email,
    name,
    password: hashedPassword,
    tier: 'free', // Default tier
    createdAt: new Date().toISOString(),
    preferences: {}
  };

  users.set(email, user);

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    tier: user.tier
  });

  return {
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier
    },
    token
  };
}

/**
 * Login user
 */
async function loginUser(body) {
  const { email, password } = body;

  // Validate required fields
  validateRequired(body, ['email', 'password']);

  // Find user
  const user = users.get(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    tier: user.tier
  });

  return {
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier
    },
    token
  };
}

/**
 * Request magic link
 */
async function requestMagicLink(body) {
  const { email } = body;

  // Validate required fields
  validateRequired(body, ['email']);

  // Generate magic token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  magicLinks.set(token, { email, expiresAt });

  // TODO: Send email (integrate with email service)
  // For now, return token in response (DEV ONLY - remove in production)
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    message: 'Magic link sent to your email',
    ...(isDev && {
      dev_token: token,
      dev_link: `${process.env.BASE_URL || 'http://localhost:8888'}/api/auth/verify/${token}`
    })
  };
}

/**
 * Verify magic link
 */
function verifyMagicLink(token) {
  const linkData = magicLinks.get(token);

  if (!linkData) {
    const error = new Error('Invalid or expired magic link');
    error.statusCode = 401;
    throw error;
  }

  if (Date.now() > linkData.expiresAt) {
    magicLinks.delete(token);
    const error = new Error('Magic link has expired');
    error.statusCode = 401;
    throw error;
  }

  const user = users.get(linkData.email);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete used magic link
  magicLinks.delete(token);

  // Generate JWT
  const jwtToken = generateToken({
    id: user.id,
    email: user.email,
    tier: user.tier
  });

  return {
    message: 'Magic link verified',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier
    },
    token: jwtToken
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
    // Apply rate limiting (strict for auth endpoints)
    try {
      applyRateLimit(event, 'guest'); // All auth endpoints use guest rate limit
    } catch (rateLimitError) {
      if (rateLimitError.statusCode === 429) {
        return errorResponse(
          'Too many authentication attempts. Please try again later.',
          429,
          { retryAfter: rateLimitError.retryAfter }
        );
      }
      throw rateLimitError;
    }

    // Route based on path and method
    const path = event.path.replace(/^\/\.netlify\/functions\/auth/, '');

    // POST /register
    if (path === '/register' && event.httpMethod === 'POST') {
      const body = parseBody(event);
      const result = await registerUser(body);
      return successResponse(result, 201);
    }

    // POST /login
    if (path === '/login' && event.httpMethod === 'POST') {
      const body = parseBody(event);
      const result = await loginUser(body);
      return successResponse(result);
    }

    // POST /magic-link
    if (path === '/magic-link' && event.httpMethod === 'POST') {
      const body = parseBody(event);
      const result = await requestMagicLink(body);
      return successResponse(result);
    }

    // GET /verify/:token
    if (path.startsWith('/verify/') && event.httpMethod === 'GET') {
      const token = path.replace('/verify/', '');
      if (!token) {
        return errorResponse('Token is required', 400);
      }
      const result = verifyMagicLink(token);
      return successResponse(result);
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('Auth error:', error);

    // Handle specific error types
    const statusCode = error.statusCode || 500;

    return errorResponse(
      error.message || 'Authentication failed',
      statusCode,
      process.env.NODE_ENV !== 'production' ? error.stack : null
    );
  }
}
