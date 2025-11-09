/**
 * Netlify Scheduled Function: Auto-Fetch One Piece Catchphrases
 * Runs daily at 3:00 AM MYT to fetch new catchphrases
 *
 * Setup in netlify.toml:
 * [[plugins]]
 *   package = "@netlify/plugin-scheduled-functions"
 *   [plugins.inputs]
 *     cron = "0 3 * * *"  # 3:00 AM daily
 */

import { runScheduledFetch, getFetchStats } from '../../ai_pod/services/catchphrase_auto_fetch.mjs';
import { successResponse, errorResponse } from './utils/response.mjs';

/**
 * Netlify Scheduled Function Handler
 * Triggered by Netlify's scheduled functions plugin
 */
export async function handler(event, context) {
  console.log('[Cron] Starting catchphrase auto-fetch...');

  try {
    // Run scheduled fetch
    await runScheduledFetch();

    // Get updated stats
    const stats = await getFetchStats();

    console.log('[Cron] Catchphrase auto-fetch completed:', stats);

    return successResponse({
      message: 'Catchphrase auto-fetch completed successfully',
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Cron] Catchphrase auto-fetch error:', error);

    return errorResponse(
      'Catchphrase auto-fetch failed',
      500,
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

// Alternative: Can also be called as a regular function endpoint
// POST /.netlify/functions/cron-catchphrase-fetch (manual trigger)
