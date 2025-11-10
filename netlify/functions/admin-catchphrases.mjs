/**
 * Admin Catchphrases Endpoint
 * Admin approval interface for paraphrased catchphrases
 *
 * Routes:
 * - POST /api/admin/catchphrase/approve - Approve single catchphrase
 * - POST /api/admin/catchphrase/bulk-approve - Bulk approve
 * - GET /api/admin/catchphrase/pending - Get pending approvals
 * - GET /api/admin/catchphrase/stats - Get statistics
 * - DELETE /api/admin/catchphrase/:id - Delete catchphrase
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  getQueryParams,
  validateRequired
} from './utils/response.mjs';
import { getUserFromEvent, requireAuth } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import db from '../../database/connection.mjs';

/**
 * Check if user is admin
 */
function requireAdmin(user) {
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return true;
}

/**
 * Get pending catchphrases
 */
async function getPendingCatchphrases(limit = 50, offset = 0) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    const result = await db.query(
      `SELECT
        pc.id,
        pc.paraphrased_text,
        pc.manglish_words,
        pc.gemini_confidence,
        pc.created_at,
        opc.original_text,
        opc.character,
        opc.tone,
        opc.episode_number
      FROM paraphrased_catchphrases pc
      JOIN one_piece_catchphrases opc ON pc.original_id = opc.id
      WHERE pc.approved = false
      ORDER BY pc.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM paraphrased_catchphrases WHERE approved = false'
    );

    return {
      items: result.rows.map(row => ({
        id: row.id,
        paraphrasedText: row.paraphrased_text,
        manglishWords: row.manglish_words,
        confidence: parseFloat(row.gemini_confidence),
        createdAt: row.created_at,
        original: {
          text: row.original_text,
          character: row.character,
          tone: row.tone,
          episode: row.episode_number
        }
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      }
    };

  } catch (error) {
    console.error('[Admin] Get pending error:', error);
    throw error;
  }
}

/**
 * Approve single catchphrase
 */
async function approveCatchphrase(id, userId) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    const result = await db.query(
      `UPDATE paraphrased_catchphrases
      SET approved = true,
          approved_by = $1,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, paraphrased_text, approved_at`,
      [userId, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Catchphrase not found');
    }

    return {
      id: result.rows[0].id,
      paraphrasedText: result.rows[0].paraphrased_text,
      approvedAt: result.rows[0].approved_at
    };

  } catch (error) {
    console.error('[Admin] Approve error:', error);
    throw error;
  }
}

/**
 * Bulk approve catchphrases
 */
async function bulkApproveCatchphrases(ids, userId) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    const result = await db.query(
      `UPDATE paraphrased_catchphrases
      SET approved = true,
          approved_by = $1,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = ANY($2::int[])
      RETURNING id`,
      [userId, ids]
    );

    return {
      approvedCount: result.rows.length,
      approvedIds: result.rows.map(row => row.id)
    };

  } catch (error) {
    console.error('[Admin] Bulk approve error:', error);
    throw error;
  }
}

/**
 * Delete catchphrase
 */
async function deleteCatchphrase(id) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    const result = await db.query(
      'DELETE FROM paraphrased_catchphrases WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Catchphrase not found');
    }

    return { id: result.rows[0].id };

  } catch (error) {
    console.error('[Admin] Delete error:', error);
    throw error;
  }
}

/**
 * Get statistics
 */
async function getStatistics() {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM one_piece_catchphrases) as total_originals,
        (SELECT COUNT(*) FROM paraphrased_catchphrases) as total_paraphrased,
        (SELECT COUNT(*) FROM paraphrased_catchphrases WHERE approved = true) as total_approved,
        (SELECT COUNT(*) FROM paraphrased_catchphrases WHERE approved = false) as total_pending,
        (SELECT COUNT(*) FROM catchphrase_usage_log) as total_usage,
        (SELECT AVG(gemini_confidence) FROM paraphrased_catchphrases) as avg_confidence,
        (SELECT COUNT(DISTINCT user_id) FROM catchphrase_usage_log) as unique_users
    `);

    const recentJobs = await db.query(
      `SELECT * FROM catchphrase_fetch_jobs
      ORDER BY fetch_date DESC
      LIMIT 5`
    );

    return {
      totals: {
        originals: parseInt(stats.rows[0].total_originals),
        paraphrased: parseInt(stats.rows[0].total_paraphrased),
        approved: parseInt(stats.rows[0].total_approved),
        pending: parseInt(stats.rows[0].total_pending),
        usage: parseInt(stats.rows[0].total_usage),
        uniqueUsers: parseInt(stats.rows[0].unique_users)
      },
      avgConfidence: parseFloat(stats.rows[0].avg_confidence || 0).toFixed(2),
      recentJobs: recentJobs.rows
    };

  } catch (error) {
    console.error('[Admin] Stats error:', error);
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

  try {
    // Require authentication and admin role
    const user = requireAuth(event);
    requireAdmin(user);

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

    // Route based on path and method
    const path = event.path.replace(/^\/\.netlify\/functions\/admin-catchphrases/, '');
    const queryParams = getQueryParams(event);

    // GET /pending - Get pending approvals
    if (path === '/pending' && event.httpMethod === 'GET') {
      const limit = parseInt(queryParams.limit || '50');
      const offset = parseInt(queryParams.offset || '0');

      const result = await getPendingCatchphrases(limit, offset);

      return successResponse({
        success: true,
        data: result
      });
    }

    // GET /stats - Get statistics
    if (path === '/stats' && event.httpMethod === 'GET') {
      const stats = await getStatistics();

      return successResponse({
        success: true,
        data: stats
      });
    }

    // POST /approve - Approve single catchphrase
    if (path === '/approve' && event.httpMethod === 'POST') {
      const body = parseBody(event);
      validateRequired(body, ['id']);

      const result = await approveCatchphrase(body.id, user.id);

      return successResponse({
        success: true,
        data: result,
        message: 'Catchphrase approved successfully'
      });
    }

    // POST /bulk-approve - Bulk approve
    if (path === '/bulk-approve' && event.httpMethod === 'POST') {
      const body = parseBody(event);
      validateRequired(body, ['ids']);

      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return errorResponse('ids must be a non-empty array', 400);
      }

      const result = await bulkApproveCatchphrases(body.ids, user.id);

      return successResponse({
        success: true,
        data: result,
        message: `${result.approvedCount} catchphrases approved successfully`
      });
    }

    // DELETE /:id - Delete catchphrase
    if (path.startsWith('/') && event.httpMethod === 'DELETE') {
      const id = parseInt(path.substring(1));

      if (!id) {
        return errorResponse('Invalid catchphrase ID', 400);
      }

      const result = await deleteCatchphrase(id);

      return successResponse({
        success: true,
        data: result,
        message: 'Catchphrase deleted successfully'
      });
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('[Admin] Handler error:', error);

    // Handle specific error types
    if (error.message.includes('Authentication required')) {
      return errorResponse('Authentication required', 401);
    }

    if (error.message.includes('Admin access required')) {
      return errorResponse('Admin access required', 403);
    }

    if (error.message.includes('not found')) {
      return errorResponse(error.message, 404);
    }

    return errorResponse(
      'Failed to process admin request',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
