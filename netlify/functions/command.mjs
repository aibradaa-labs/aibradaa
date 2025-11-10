/**
 * Command Netlify Function
 * Handles AI Bradaa Command queries via Syeddy Orchestrator
 * Routes: POST /, POST /parse
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  validateRequired
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import { wrapForAI, calculateSavings } from './utils/toon.mjs';
import { getGeminiClient } from './utils/gemini.mjs';
import { enforceQuota } from './utils/quota.mjs';
import {
  detectEmotion,
  emotionalizeResponse,
} from '../../ai_pod/personas/catchphrases.mjs';

// Initialize Gemini client
const gemini = getGeminiClient(process.env.GEMINI_API_KEY);

/**
 * Get model configuration
 */
function getModelConfig(mode = 'fast') {
  const models = {
    fast: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    think: process.env.GEMINI_MODEL_PRO || 'gemini-exp-1206',
    research: process.env.GEMINI_MODEL_PRO || 'gemini-exp-1206'
  };

  return models[mode] || models.fast;
}

/**
 * Check if user has access to AI mode
 */
function checkAIModeAccess(user, mode) {
  const tierModes = {
    guest: ['fast'],
    free: ['fast'],
    pro: ['fast', 'think'],
    ultimate: ['fast', 'think', 'research'],
    enterprise: ['fast', 'think', 'research']
  };

  const allowedModes = tierModes[user?.tier || 'guest'] || ['fast'];
  return allowedModes.includes(mode);
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

  // Check AI mode access
  if (!checkAIModeAccess(user, mode)) {
    const requiredTier = mode === 'research' ? 'ultimate' : mode === 'think' ? 'pro' : 'free';
    throw new Error(
      `AI mode '${mode}' requires ${requiredTier.toUpperCase()} tier. ` +
      `Your current tier: ${user?.tier || 'guest'}. ` +
      `Upgrade at /pricing?upgrade=${requiredTier}`
    );
  }

  // Select model based on mode
  const modelName = getModelConfig(mode);

  // Build prompts
  const systemPrompt = buildSystemPrompt(user?.tier || 'free');

  // Use TOON compression for context if it has data (30-60% token savings)
  let contextString;
  let toonSavings = null;

  if (context && Object.keys(context).length > 0) {
    try {
      contextString = wrapForAI(context, 'Context');
      toonSavings = calculateSavings(context);
    } catch (error) {
      console.warn('TOON compression failed, falling back to JSON:', error.message);
      contextString = `Context: ${JSON.stringify(context)}`;
    }
  } else {
    contextString = '';
  }

  const fullPrompt = `${systemPrompt}\n\n${contextString ? `${query}\n\n${contextString}` : query}`;

  // Generate response with GeminiClient
  const result = await gemini.generate(fullPrompt, {
    model: modelName,
  });

  // Detect emotion and add catchphrase
  const emotionContext = {
    userMessage: query,
    conversationHistory: [],
    responseText: result.text,
    hasContext: Object.keys(context).length > 0,
  };

  const emotion = detectEmotion(emotionContext);
  const emotionalizedText = emotionalizeResponse(
    result.text,
    emotionContext,
    'greeting'
  );

  return {
    response: emotionalizedText,
    emotion: emotion.name,
    mode,
    model: modelName,
    tokens: {
      ...result.tokens,
      ...(toonSavings ? { toonSavings } : {}), // Include TOON savings if used
    },
    cost: result.cost,
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

      // Enforce quota BEFORE AI call
      const quotaCheck = await enforceQuota(user);
      if (!quotaCheck.allowed) {
        return quotaCheck.response;
      }

      const result = await processCommand(body, user);

      // Record usage AFTER AI call
      await quotaCheck.recordUsage(
        result.tokens.total,
        result.cost.sen,
        '/.netlify/functions/command',
        {
          model: result.model,
          mode: result.mode,
          emotion: result.emotion,
          queryLength: body.query?.length || 0,
        }
      );

      return successResponse({
        success: true,
        data: result,
        quota: quotaCheck.status.remaining,
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

    if (error.message.includes('AI mode')) {
      return errorResponse(error.message, 403, {
        feature: 'AI mode',
        upgradeUrl: error.message.match(/\/pricing\?upgrade=\w+/)?.[0] || '/pricing'
      });
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
