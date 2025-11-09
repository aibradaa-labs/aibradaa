/**
 * Catchphrase GET Endpoint
 * GET /api/catchphrase?userId={id}&tone={tone}
 *
 * 84-Mentor Approved: INTERNAL ONLY System
 * Returns random paraphrased catchphrase with Manglish tone
 * Never repeats last 50 per user
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  getQueryParams
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import db from '../../database/connection.mjs';

/**
 * Get random catchphrase for user
 */
async function getRandomCatchphrase(userId, tone = null) {
  try {
    // Ensure database connection
    if (!db.isHealthy()) {
      await db.connect();
    }

    // Call database function to get random catchphrase
    const result = await db.query(
      'SELECT * FROM get_random_catchphrase($1, $2)',
      [userId, tone]
    );

    if (result.rows.length === 0) {
      // No available catchphrases (all used in last 50)
      return {
        available: false,
        message: 'All catchphrases used recently. Please try again later!',
        fallback: 'Yo nakama! Let me help you find your perfect laptop lah!'
      };
    }

    const catchphrase = result.rows[0];

    // Log usage
    await db.query(
      'SELECT log_catchphrase_usage($1, $2, $3)',
      [userId, catchphrase.id, 'api_request']
    );

    return {
      available: true,
      catchphrase: {
        id: catchphrase.id,
        text: catchphrase.paraphrased_text,
        manglishWords: catchphrase.manglish_words || [],
        originalCharacter: catchphrase.original_character,
        tone: catchphrase.tone
      }
    };

  } catch (error) {
    console.error('[Catchphrase] Database error:', error);

    // Fail-open: Return fallback catchphrase
    return {
      available: false,
      error: 'Database error',
      fallback: 'Yo nakama! Let me help you find your perfect laptop lah!',
      note: 'Using fallback due to database error'
    };
  }
}

/**
 * Get user catchphrase statistics
 */
async function getUserStats(userId) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    const result = await db.query(
      'SELECT * FROM get_user_catchphrase_stats($1)',
      [userId]
    );

    const stats = result.rows[0] || {
      total_used: 0,
      unique_catchphrases: 0,
      last_used_at: null,
      favorite_tone: null
    };

    return {
      totalUsed: stats.total_used,
      uniqueCatchphrases: stats.unique_catchphrases,
      lastUsedAt: stats.last_used_at,
      favoriteTone: stats.favorite_tone
    };

  } catch (error) {
    console.error('[Catchphrase] Stats error:', error);
    return null;
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Get user from token (optional - fallback to 'guest' if not authenticated)
    const user = getUserFromEvent(event);
    const userId = user?.id || 'guest';
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

    // Get query params
    const queryParams = getQueryParams(event);
    const tone = queryParams.tone || null; // friendly, determined, motivational, etc.
    const includeStats = queryParams.stats === 'true';

    // Get random catchphrase
    const result = await getRandomCatchphrase(userId, tone);

    // Optionally include user stats
    let stats = null;
    if (includeStats && userId !== 'guest') {
      stats = await getUserStats(userId);
    }

    return successResponse({
      success: true,
      data: {
        ...result,
        ...(stats ? { stats } : {})
      },
      meta: {
        userId: userId === 'guest' ? 'guest' : userId,
        tone: tone || 'any',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Catchphrase] Handler error:', error);

    return errorResponse(
      'Failed to fetch catchphrase',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
