/**
 * Command Routes
 * Handles AI Bradaa Command queries via Syeddy Orchestrator
 */

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.mjs';
import { applyTierLimiter } from '../middleware/rate-limit.mjs';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * POST /api/command
 * Process natural language command and route to appropriate section
 */
router.post('/', applyTierLimiter, async (req, res) => {
  try {
    const { query, mode = 'fast', context = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query is required',
        code: 'MISSING_QUERY',
      });
    }

    // Select model based on mode
    const modelName = mode === 'think' ? config.gemini.modelPro : config.gemini.model;
    const model = genAI.getGenerativeModel({ model: modelName });

    // Build prompt with persona and context
    const systemPrompt = `You are Syeddy, AI Bradaa's friendly AI advisor with a One Piece-inspired tone (Luffy-esque but professional). You help Malaysians find perfect laptops.

Tone Guidelines:
- Enthusiastic and supportive like Luffy
- Use light Manglish when appropriate ("lah", "leh", "can ah?")
- Never use direct One Piece quotes - paraphrase concepts
- Be concise and actionable

User Tier: ${req.user?.tier || 'free'}
Available Commands: /match, /vs, /explore, /intel, /appendices, /camera

Your task: Understand the user's laptop needs and provide helpful guidance OR route them to the right section.`;

    const userPrompt = `${query}

Context: ${JSON.stringify(context)}`;

    // Generate response
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract metadata
    const promptTokenCount = (await model.countTokens([systemPrompt, userPrompt])).totalTokens;
    const candidates = response.candidates || [];
    const completionTokens = candidates[0]?.tokenCount || 0;

    res.json({
      success: true,
      data: {
        response: text,
        mode,
        model: modelName,
        tokens: {
          prompt: promptTokenCount,
          completion: completionTokens,
          total: promptTokenCount + completionTokens,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        tier: req.user?.tier || 'free',
      },
    });
  } catch (error) {
    console.error('Command error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to process command',
      code: 'COMMAND_ERROR',
    });
  }
});

/**
 * POST /api/command/parse
 * Parse natural language query and extract intent
 */
router.post('/parse', applyTierLimiter, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query is required',
      });
    }

    // Simple intent detection (in production, use NLU model)
    const intents = {
      matchmaker: ['find', 'recommend', 'suggest', 'match', 'looking for'],
      versus: ['compare', 'vs', 'versus', 'difference', 'better'],
      explorer: ['browse', 'explore', 'show me', 'list', 'all'],
      intel: ['news', 'price drop', 'deals', 'offers', 'latest'],
      appendices: ['full list', 'catalog', 'top 100'],
      camera: ['camera', 'sensor', 'photography', 'webcam'],
    };

    let detectedIntent = null;
    let confidence = 0;

    for (const [intent, keywords] of Object.entries(intents)) {
      for (const keyword of keywords) {
        if (query.toLowerCase().includes(keyword)) {
          detectedIntent = intent;
          confidence = 0.8;
          break;
        }
      }
      if (detectedIntent) break;
    }

    res.json({
      success: true,
      data: {
        query,
        intent: detectedIntent,
        confidence,
        route: detectedIntent ? `/${detectedIntent}` : '/command',
      },
    });
  } catch (error) {
    console.error('Parse error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to parse query',
    });
  }
});

export default router;
