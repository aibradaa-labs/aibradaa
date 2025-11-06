/**
 * Authentication Routes
 * Handles user registration, login, and magic link authentication
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

export default router;
