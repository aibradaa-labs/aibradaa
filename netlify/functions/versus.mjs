/**
 * Versus (Comparison) Netlify Function
 * AI-powered laptop comparisons with tier-based limits
 *
 * Routes: POST /
 * Tier limits:
 * - Free: 2-way comparison
 * - Pro: 3-way comparison
 * - Ultimate: 4-way comparison
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
import { getGeminiClient } from './utils/gemini.mjs';
import { enforceQuota } from './utils/quota.mjs';
import {
  detectEmotion,
  emotionalizeResponse,
} from '../../ai_pod/personas/catchphrases.mjs';

// Initialize Gemini client
const gemini = getGeminiClient(process.env.GEMINI_API_KEY);

/**
 * Get comparison limit based on tier
 */
function getComparisonLimit(tier) {
  const limits = {
    guest: 2,
    free: 2,
    pro: 3,
    ultimate: 4,
    enterprise: 4
  };

  return limits[tier] || 2;
}

/**
 * Validate laptop models
 */
function validateLaptopModels(laptops, tier) {
  if (!Array.isArray(laptops) || laptops.length < 2) {
    throw new Error('At least 2 laptops required for comparison');
  }

  const maxLaptops = getComparisonLimit(tier);

  if (laptops.length > maxLaptops) {
    const requiredTier = laptops.length >= 4 ? 'ultimate' : 'pro';
    throw new Error(
      `${laptops.length}-way comparison requires ${requiredTier.toUpperCase()} tier. ` +
      `Your current tier (${tier}) supports up to ${maxLaptops}-way comparisons. ` +
      `Upgrade at /pricing?upgrade=${requiredTier}`
    );
  }

  // Validate each laptop object
  laptops.forEach((laptop, index) => {
    if (!laptop.name || typeof laptop.name !== 'string') {
      throw new Error(`Invalid laptop name at index ${index}`);
    }
  });

  return true;
}

/**
 * Build comparison prompt
 */
function buildComparisonPrompt(laptops, userPreferences = {}) {
  const laptopNames = laptops.map((l, i) => `${i + 1}. ${l.name}`).join('\n');

  return `You are Syeddy, AI Bradaa's expert laptop advisor for Malaysia.

TASK: Compare these ${laptops.length} laptops and provide a helpful, detailed comparison:

${laptopNames}

User preferences: ${JSON.stringify(userPreferences || {})}

REQUIREMENTS:
1. Compare all ${laptops.length} laptops side-by-side
2. Highlight key differences (specs, price, performance)
3. Recommend the best one based on user needs
4. Use light Manglish tone (lah, leh, can)
5. Be enthusiastic but professional
6. Include price comparisons (if available)
7. Mention pros and cons for each
8. Provide a clear winner with reasoning

FORMAT:
- Start with quick summary
- Detailed comparison table
- Pros/cons for each
- Final recommendation

Keep it helpful and easy to understand!`;
}

/**
 * Perform AI-powered comparison
 */
async function compareLaptops(laptops, userPreferences, user) {
  try {
    const prompt = buildComparisonPrompt(laptops, userPreferences);

    const result = await gemini.generate(prompt, {
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    });

    // Detect emotion and add catchphrase
    const emotionContext = {
      userMessage: `Compare ${laptops.map(l => l.name).join(' vs ')}`,
      conversationHistory: [],
      responseText: result.text,
      hasContext: Object.keys(userPreferences || {}).length > 0,
    };

    const emotion = detectEmotion(emotionContext);
    const emotionalizedText = emotionalizeResponse(
      result.text,
      emotionContext,
      'comparison'
    );

    return {
      comparison: emotionalizedText,
      laptops: laptops.map(l => l.name),
      emotion: emotion.name,
      tokens: result.tokens,
      cost: result.cost,
      meta: {
        laptopCount: laptops.length,
        tier: user?.tier || 'guest',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('[Versus] Comparison error:', error);
    throw error;
  }
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
    // Get user from token (optional for versus)
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
    validateRequired(body, ['laptops']);

    const { laptops, preferences = {} } = body;

    // Validate laptop models and tier limits
    validateLaptopModels(laptops, tier);

    // Enforce quota BEFORE AI call
    const quotaCheck = await enforceQuota(user);
    if (!quotaCheck.allowed) {
      return quotaCheck.response;
    }

    // Perform comparison
    const result = await compareLaptops(laptops, preferences, user);

    // Record usage AFTER AI call
    await quotaCheck.recordUsage(
      result.tokens.total,
      result.cost.sen,
      '/.netlify/functions/versus',
      {
        laptopCount: laptops.length,
        laptops: result.laptops,
        emotion: result.emotion,
      }
    );

    return successResponse({
      success: true,
      data: result,
      quota: quotaCheck.status.remaining,
      tierInfo: {
        currentTier: tier,
        maxComparisons: getComparisonLimit(tier),
        usedComparisons: laptops.length
      }
    });

  } catch (error) {
    console.error('[Versus] Handler error:', error);

    // Handle specific error types
    if (error.message.includes('Missing required fields')) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes('At least 2 laptops required')) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes('way comparison requires')) {
      return errorResponse(error.message, 403, {
        feature: 'multi-way comparison',
        upgradeUrl: error.message.match(/\/pricing\?upgrade=\w+/)?.[0] || '/pricing'
      });
    }

    if (error.message.includes('API key not valid')) {
      return errorResponse('AI service unavailable', 503);
    }

    return errorResponse(
      'Failed to compare laptops',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
