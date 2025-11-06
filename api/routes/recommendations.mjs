/**
 * Recommendation Routes
 * Handles laptop recommendations using Gemini API
 */

import express from 'express';
import { getRecommendations } from '../adapters/geminiAdapter.mjs';
import { ApiError } from '../middleware/errorHandler.mjs';

const router = express.Router();

// Get laptop recommendations
router.post('/', async (req, res, next) => {
  try {
    const { budget, usage, preferences } = req.body;

    // Validation
    if (!budget || !usage) {
      throw new ApiError('Budget and usage are required', 400);
    }

    // Get recommendations from Gemini
    const recommendations = await getRecommendations({
      budget,
      usage,
      preferences: preferences || {},
      userId: req.user.id
    });

    res.json({
      recommendations,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: req.user.id
      }
    });
  } catch (error) {
    next(error);
  }
});

// Compare laptops
router.post('/compare', async (req, res, next) => {
  try {
    const { laptopIds } = req.body;

    if (!Array.isArray(laptopIds) || laptopIds.length < 2) {
      throw new ApiError('At least 2 laptop IDs required for comparison', 400);
    }

    // TODO: Implement comparison logic
    res.json({
      message: 'Comparison feature coming soon',
      laptopIds
    });
  } catch (error) {
    next(error);
  }
});

export default router;
