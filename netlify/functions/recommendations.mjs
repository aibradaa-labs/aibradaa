/**
 * Recommendations Netlify Function
 * Handles laptop recommendations using Gemini API
 * Routes: POST /, POST /compare
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
 * Get laptop recommendations
 */
async function getRecommendations({ budget, usage, preferences, userId }) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
  });

  const prompt = `You are an expert laptop advisor for AI Bradaa, a Malaysia-first laptop recommendation service.

User Requirements:
- Budget: MYR ${budget}
- Primary Usage: ${usage}
- Preferences: ${JSON.stringify(preferences || {})}

Based on these requirements, recommend the top 3 laptops that would be perfect for this user.
Consider performance, value for money, and availability in Malaysia.

Return your response as JSON with this structure:
{
  "recommendations": [
    {
      "name": "Laptop Model Name",
      "brand": "Brand",
      "price": 0000,
      "reasoning": "Why this laptop is recommended",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "score": 85
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Try to parse JSON from response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse recommendations JSON:', e);
    // If JSON parsing fails, return as text
    return { recommendations: [], rawText: text };
  }

  return { recommendations: [] };
}

/**
 * Compare laptops
 */
async function compareLaptops(laptopIds, userId) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
  });

  const prompt = `Compare these laptops: ${laptopIds.join(', ')}

Provide a detailed comparison covering:
- Performance
- Value for money
- Build quality
- Battery life
- Portability
- Best use cases

Return as JSON:
{
  "comparison": {
    "laptops": [
      {
        "id": "laptop-id",
        "name": "Laptop Name",
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1"],
        "bestFor": "Use case description",
        "score": 85
      }
    ],
    "recommendation": "Which laptop is best and why",
    "summary": "Overall comparison summary"
  }
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Try to parse JSON from response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse comparison JSON:', e);
    return { comparison: { laptops: [], summary: text } };
  }

  return { comparison: { laptops: [] } };
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
    // Get user from token (optional)
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
    const path = event.path.replace(/^\/\.netlify\/functions\/recommendations/, '');

    if (path === '' || path === '/') {
      // Get recommendations
      validateRequired(body, ['budget', 'usage']);

      const result = await getRecommendations({
        budget: body.budget,
        usage: body.usage,
        preferences: body.preferences || {},
        userId: user?.id
      });

      return successResponse({
        ...result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: user?.id,
          tier: user?.tier || 'guest'
        }
      });
    } else if (path === '/compare') {
      // Compare laptops
      validateRequired(body, ['laptopIds']);

      if (!Array.isArray(body.laptopIds) || body.laptopIds.length < 2) {
        return errorResponse('At least 2 laptop IDs required for comparison', 400);
      }

      const result = await compareLaptops(body.laptopIds, user?.id);

      return successResponse({
        ...result,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: user?.id
        }
      });
    } else {
      return errorResponse('Endpoint not found', 404);
    }

  } catch (error) {
    console.error('Recommendations error:', error);

    // Handle specific error types
    if (error.message.includes('Missing required fields')) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes('API key not valid')) {
      return errorResponse('AI service unavailable', 503);
    }

    return errorResponse(
      'Failed to get recommendations',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
