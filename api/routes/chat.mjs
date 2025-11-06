/**
 * Chat Routes
 * Handles AI chat interactions with Gemini
 */

import express from 'express';
import { chatWithGemini } from '../adapters/geminiAdapter.mjs';
import { ApiError } from '../middleware/errorHandler.mjs';

const router = express.Router();

// Chat with AI
router.post('/', async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      throw new ApiError('Message is required', 400);
    }

    const response = await chatWithGemini({
      message,
      context: context || [],
      userId: req.user.id
    });

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Stream chat response
router.post('/stream', async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      throw new ApiError('Message is required', 400);
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // TODO: Implement streaming with Gemini
    res.write(`data: ${JSON.stringify({ message: 'Streaming coming soon' })}\n\n`);
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;
