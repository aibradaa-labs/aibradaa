/**
 * Catchphrase Paraphrase Endpoint
 * POST /api/catchphrase/paraphrase
 *
 * Input: { originalText, tone }
 * Uses Gemini 2.5 Pro for paraphrasing
 * Returns: { paraphrasedText, manglishWords, confidence }
 * Minimum 75% confidence threshold
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  validateRequired
} from './utils/response.mjs';
import { getUserFromEvent, requireAuth } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import { getGeminiClient } from './utils/gemini.mjs';
import db from '../../database/connection.mjs';

// Initialize Gemini client
const gemini = getGeminiClient(process.env.GEMINI_API_KEY);

/**
 * Paraphrase catchphrase using Gemini 2.5 Pro
 */
async function paraphraseCatchphrase(originalText, tone = 'friendly') {
  try {
    const prompt = `You are a Manglish tone adapter for AI Bradaa, a Malaysian laptop recommendation platform.

TASK: Paraphrase the following catchphrase to make it IP-safe while maintaining the spirit and energy. Add light Manglish words (1-2 per 100 characters).

ORIGINAL TEXT: "${originalText}"
TONE: ${tone}

REQUIREMENTS:
1. Keep the energy and spirit of the original
2. Make it IP-safe (no direct quotes or character names)
3. Inject 1-2 Manglish words per 100 characters (lah, leh, can, wah, aiya, etc.)
4. Keep it natural and enthusiastic
5. Suitable for laptop recommendation context
6. Max 200 characters

IMPORTANT: Respond ONLY with a JSON object in this exact format:
{
  "paraphrased": "Your paraphrased text here",
  "manglishWords": ["lah", "wah"],
  "confidence": 0.92,
  "reasoning": "Brief explanation of changes"
}`;

    const result = await gemini.generate(prompt, {
      model: process.env.GEMINI_MODEL_PRO || 'gemini-exp-1206',
      temperature: 0.8,
      maxOutputTokens: 500
    });

    // Parse JSON response
    let parsed;
    try {
      // Extract JSON from potential markdown code blocks
      let jsonText = result.text.trim();
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[Paraphrase] Failed to parse Gemini response:', result.text);
      throw new Error('Invalid response format from AI');
    }

    // Validate confidence threshold
    if (parsed.confidence < 0.75) {
      throw new Error(`Low confidence (${parsed.confidence}). Minimum 0.75 required.`);
    }

    return {
      paraphrasedText: parsed.paraphrased,
      manglishWords: parsed.manglishWords || [],
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      tokens: result.tokens,
      cost: result.cost
    };

  } catch (error) {
    console.error('[Paraphrase] Error:', error);
    throw error;
  }
}

/**
 * Save paraphrased catchphrase to database
 */
async function saveParaphrase(originalId, paraphrasedData, approved = false, approvedBy = null) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    const result = await db.query(
      `INSERT INTO paraphrased_catchphrases (
        original_id,
        paraphrased_text,
        manglish_words,
        gemini_confidence,
        approved,
        approved_by,
        approved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at`,
      [
        originalId,
        paraphrasedData.paraphrasedText,
        paraphrasedData.manglishWords,
        paraphrasedData.confidence,
        approved,
        approvedBy,
        approved ? new Date() : null
      ]
    );

    return {
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at
    };

  } catch (error) {
    console.error('[Paraphrase] Save error:', error);
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
    // Require authentication (admin or pro+ users only)
    const user = requireAuth(event);

    // Apply rate limiting
    try {
      applyRateLimit(event, user.tier);
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
    validateRequired(body, ['originalText']);

    const { originalText, tone = 'friendly', originalId = null, autoApprove = false } = body;

    // Validate originalText length
    if (originalText.length < 10 || originalText.length > 500) {
      return errorResponse('Original text must be between 10 and 500 characters', 400);
    }

    // Paraphrase using Gemini
    const result = await paraphraseCatchphrase(originalText, tone);

    // Save to database if originalId provided
    let savedId = null;
    if (originalId) {
      const approved = autoApprove && (user.role === 'admin' || user.tier === 'ultimate');
      const saved = await saveParaphrase(
        originalId,
        result,
        approved,
        approved ? user.id : null
      );
      savedId = saved.id;
    }

    return successResponse({
      success: true,
      data: {
        paraphrased: result.paraphrasedText,
        manglishWords: result.manglishWords,
        confidence: result.confidence,
        reasoning: result.reasoning,
        savedId,
        approved: savedId ? (autoApprove && (user.role === 'admin' || user.tier === 'ultimate')) : null
      },
      usage: {
        tokens: result.tokens,
        cost: result.cost
      },
      meta: {
        model: process.env.GEMINI_MODEL_PRO || 'gemini-exp-1206',
        tone,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Paraphrase] Handler error:', error);

    // Handle specific error types
    if (error.message.includes('Authentication required')) {
      return errorResponse('Authentication required', 401);
    }

    if (error.message.includes('Low confidence')) {
      return errorResponse(error.message, 422);
    }

    if (error.message.includes('Invalid response format')) {
      return errorResponse('AI service error. Please try again.', 503);
    }

    return errorResponse(
      'Failed to paraphrase catchphrase',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
