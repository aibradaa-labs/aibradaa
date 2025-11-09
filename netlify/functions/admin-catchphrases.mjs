/**
 * Admin Catchphrase Management
 * Routes:
 * - POST /trigger - Manual fetch trigger
 * - GET /stats - Get fetch statistics
 * - POST /approve - Approve pending catchphrases
 * - POST /feedback - Submit feedback on catchphrase
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  validateRequired,
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { triggerManualFetch, getFetchStats } from '../../ai_pod/services/catchphrase_auto_fetch.mjs';
import { submitCatchphraseFeedback, getUserCatchphraseStats } from '../../ai_pod/personas/one_piece_catchphrase_engine_v4.mjs';
import db from '../../database/connection.mjs';

/**
 * Check if user is admin
 */
function isAdmin(user) {
  // TODO: Implement proper admin check
  // For now, check if user tier is 'ultimate' or specific admin flag
  return user?.tier === 'ultimate' || user?.isAdmin === true;
}

/**
 * Main handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Get user from token
    const user = getUserFromEvent(event);

    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    // Parse request body for POST requests
    const body = event.httpMethod === 'POST' ? parseBody(event) : {};

    // Route based on path
    const path = event.path.replace(/^\/\.netlify\/functions\/admin-catchphrases/, '');

    // ========================================================================
    // POST /trigger - Manual fetch trigger (admin only)
    // ========================================================================
    if (path === '/trigger' && event.httpMethod === 'POST') {
      if (!isAdmin(user)) {
        return errorResponse('Admin access required', 403);
      }

      const fetchType = body.type || 'all'; // 'onepiece', 'manglish', 'all'

      const result = await triggerManualFetch(fetchType);

      if (!result.success) {
        return errorResponse('Manual fetch failed', 500, { error: result.error });
      }

      const stats = await getFetchStats();

      return successResponse({
        message: 'Manual fetch completed successfully',
        type: fetchType,
        stats,
        timestamp: new Date().toISOString(),
      });
    }

    // ========================================================================
    // GET /stats - Get fetch statistics (admin only)
    // ========================================================================
    if (path === '/stats' && event.httpMethod === 'GET') {
      if (!isAdmin(user)) {
        return errorResponse('Admin access required', 403);
      }

      const stats = await getFetchStats();

      return successResponse({
        stats,
        timestamp: new Date().toISOString(),
      });
    }

    // ========================================================================
    // POST /approve - Approve pending catchphrases (admin only)
    // ========================================================================
    if (path === '/approve' && event.httpMethod === 'POST') {
      if (!isAdmin(user)) {
        return errorResponse('Admin access required', 403);
      }

      validateRequired(body, ['catchphraseId']);

      const { catchphraseId, approved, notes } = body;

      await db.query(
        `UPDATE one_piece_catchphrases
         SET is_approved = $1,
             approved_by = $2,
             approved_at = NOW(),
             legal_notes = $3,
             legal_review_status = 'approved'
         WHERE id = $4`,
        [approved, user.id, notes || null, catchphraseId]
      );

      return successResponse({
        message: `Catchphrase ${approved ? 'approved' : 'rejected'}`,
        catchphraseId,
      });
    }

    // ========================================================================
    // POST /feedback - Submit feedback on catchphrase (any user)
    // ========================================================================
    if (path === '/feedback' && event.httpMethod === 'POST') {
      validateRequired(body, ['catchphraseId', 'rating']);

      const { catchphraseId, rating, reaction } = body;

      // Validate rating
      if (rating < 1 || rating > 5) {
        return errorResponse('Rating must be between 1 and 5', 400);
      }

      await submitCatchphraseFeedback(
        user.id,
        catchphraseId,
        rating,
        reaction || 'neutral'
      );

      return successResponse({
        message: 'Feedback submitted successfully',
        catchphraseId,
        rating,
      });
    }

    // ========================================================================
    // GET /user-stats - Get user's catchphrase statistics
    // ========================================================================
    if (path === '/user-stats' && event.httpMethod === 'GET') {
      const stats = await getUserCatchphraseStats(user.id);

      return successResponse({
        stats,
        timestamp: new Date().toISOString(),
      });
    }

    // ========================================================================
    // GET /pending - Get pending approval catchphrases (admin only)
    // ========================================================================
    if (path === '/pending' && event.httpMethod === 'GET') {
      if (!isAdmin(user)) {
        return errorResponse('Admin access required', 403);
      }

      const result = await db.query(
        `SELECT
           id,
           original_text,
           character_name,
           paraphrased_text,
           emotion,
           source_type,
           confidence_score,
           created_at
         FROM one_piece_catchphrases
         WHERE is_approved = FALSE
         ORDER BY confidence_score DESC, created_at DESC
         LIMIT 100`
      );

      return successResponse({
        pending: result.rows,
        count: result.rows.length,
      });
    }

    // ========================================================================
    // Unknown route
    // ========================================================================
    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('[AdminCatchphrases] Error:', error);

    return errorResponse(
      'Failed to process request',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
