/**
 * Command Netlify Function
 * Handles AI Bradaa Command queries via Syeddy Orchestrator
 * Routes: POST /, POST /parse
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  validateRequired
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get model configuration
 */
function getModelConfig(mode = 'fast') {
  const models = {
    fast: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    think: process.env.GEMINI_MODEL_PRO || 'gemini-exp-1206'
  };

  return models[mode] || models.fast;
}

/**
 * Build system prompt for Syeddy persona
 */
function buildSystemPrompt(userTier = 'free') {
  return `You are Syeddy, AI Bradaa's friendly AI advisor with a One Piece-inspired tone (Luffy-esque but professional). You help Malaysians find perfect laptops.

Tone Guidelines:
- Enthusiastic and supportive like Luffy
- Use light Manglish when appropriate ("lah", "leh", "can ah?")
- Never use direct One Piece quotes - paraphrase concepts
- Be concise and actionable

User Tier: ${userTier}
Available Commands: /match, /vs, /explore, /intel, /appendices, /camera

Your task: Understand the user's laptop needs and provide helpful guidance OR route them to the right section.`;
}

/**
 * Process command query
 */
async function processCommand(body, user) {
  const { query, mode = 'fast', context = {} } = body;

  // Validate required fields
  validateRequired(body, ['query']);

  // Select model based on mode
  const modelName = getModelConfig(mode);
  const model = genAI.getGenerativeModel({ model: modelName });

  // Build prompts
  const systemPrompt = buildSystemPrompt(user?.tier || 'free');
  const userPrompt = `${query}\n\nContext: ${JSON.stringify(context)}`;

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

  return {
    response: text,
    mode,
    model: modelName,
    tokens: {
      prompt: promptTokenCount,
      completion: completionTokens,
      total: promptTokenCount + completionTokens,
    },
    meta: {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      tier: user?.tier || 'free',
    }
  };
}

/**
 * Parse intent from query
 */
function parseIntent(query) {
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

  const lowerQuery = query.toLowerCase();

  for (const [intent, keywords] of Object.entries(intents)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        detectedIntent = intent;
        confidence = 0.8;
        break;
      }
    }
    if (detectedIntent) break;
  }

  return {
    query,
    intent: detectedIntent,
    confidence,
    route: detectedIntent ? `/${detectedIntent}` : '/command',
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Get user from token (optional for command)
    const user = getUserFromEvent(event);
    const tier = user?.tier || 'guest';

    // Apply rate limiting
    try {
      applyRateLimit(event, tier);
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

    // Parse request body
    const body = parseBody(event);

    // Route based on path
    const path = event.path.replace(/^\/\.netlify\/functions\/command/, '');

    if (path === '' || path === '/') {
      // Main command processing
      const result = await processCommand(body, user);
      return successResponse({
        success: true,
        data: result
      });
    } else if (path === '/parse') {
      // Intent parsing
      validateRequired(body, ['query']);
      const result = parseIntent(body.query);
      return successResponse({
        success: true,
        data: result
      });
    } else {
      return errorResponse('Endpoint not found', 404);
    }

  } catch (error) {
    console.error('Command error:', error);

    // Handle specific error types
    if (error.message.includes('Missing required fields')) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes('API key not valid')) {
      return errorResponse('AI service unavailable', 503);
    }

    return errorResponse(
      'Failed to process command',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
