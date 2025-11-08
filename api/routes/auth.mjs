/**
 * Authentication Routes
 * Handles user registration, login, magic link authentication, and OAuth
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from '../middleware/errorHandler.mjs';
import { sendMagicLink } from '../adapters/emailAdapter.mjs';

const router = express.Router();

// In-memory user store (replace with database in production)
const users = new Map();
const magicLinks = new Map();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw new ApiError('Email, password, and name are required', 400);
    }

    // Check if user exists
    if (users.has(email)) {
      throw new ApiError('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      preferences: {}
    };

    users.set(email, user);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }

    // Find user
    const user = users.get(email);
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Request magic link
router.post('/magic-link', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError('Email is required', 400);
    }

    // Generate magic token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    magicLinks.set(token, { email, expiresAt });

    // Send email
    await sendMagicLink(email, token);

    res.json({
      message: 'Magic link sent to your email'
    });
  } catch (error) {
    next(error);
  }
});

// Verify magic link
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const linkData = magicLinks.get(token);

    if (!linkData) {
      throw new ApiError('Invalid or expired magic link', 401);
    }

    if (Date.now() > linkData.expiresAt) {
      magicLinks.delete(token);
      throw new ApiError('Magic link has expired', 401);
    }

    const user = users.get(linkData.email);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Delete used magic link
    magicLinks.delete(token);

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Magic link verified',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token: jwtToken
    });
  } catch (error) {
    next(error);
  }
});

// Google OAuth - Initiate flow
router.get('/google', (req, res) => {
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  const params = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  };

  googleAuthUrl.search = new URLSearchParams(params).toString();

  res.redirect(googleAuthUrl.toString());
});

// Google OAuth - Callback
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error) {
      throw new ApiError(`OAuth error: ${error}`, 400);
    }

    if (!code) {
      throw new ApiError('Authorization code not provided', 400);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new ApiError(`Failed to exchange code for tokens: ${errorData}`, 500);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new ApiError('Failed to fetch user info from Google', 500);
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = users.get(googleUser.email);

    if (!user) {
      // Create new user from Google profile
      user = {
        id: crypto.randomUUID(),
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        googleId: googleUser.id,
        createdAt: new Date().toISOString(),
        preferences: {}
      };
      users.set(googleUser.email, user);
    } else {
      // Update existing user with Google info if not present
      user.googleId = googleUser.id;
      user.picture = user.picture || googleUser.picture;
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const redirectUrl = new URL('/app', process.env.APP_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('token', jwtToken);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    next(error);
  }
});

export default router;
