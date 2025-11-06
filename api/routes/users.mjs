/**
 * User Routes
 * Handles user profile and preferences
 */

import express from 'express';
import { ApiError } from '../middleware/errorHandler.mjs';

const router = express.Router();

// In-memory user store (replace with database)
const users = new Map();

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = users.get(req.user.email);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const { preferences } = req.body;

    const user = users.get(req.user.email);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    user.preferences = {
      ...user.preferences,
      ...preferences
    };

    users.set(req.user.email, user);

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    next(error);
  }
});

export default router;
