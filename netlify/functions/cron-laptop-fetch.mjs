/**
 * Netlify Scheduled Function: Laptop Auto-Fetch + Rotation
 * Runs weekly on Sunday at 2 AM MYT to fetch latest laptops and reorganize catalogs
 *
 * Setup in netlify.toml:
 * [[functions]]
 *   path = "/cron-laptop-fetch"
 *   schedule = "0 2 * * 0"  # Sunday at 2 AM UTC (10 AM MYT)
 *
 * Features:
 * - Fetches from Lazada & Shopee Malaysia
 * - Gemini AI enrichment
 * - Launch date & compatibility validation
 * - Auto-rotation of featured/extended catalogs
 * - Database GROWS over time (laptops NEVER deleted)
 */

import { runAutoFetch, getAutoFetchStats } from '../../ai_pod/services/laptop_auto_fetch.mjs';
import { rotateLaptopDatabase, getRotationStats } from '../../ai_pod/services/laptop_rotation.mjs';
import { successResponse, errorResponse } from './utils/response.mjs';

/**
 * Netlify Scheduled Function Handler
 * Triggered by Netlify's scheduled functions plugin
 */
export async function handler(event, context) {
  console.log('[Cron-Laptop] Starting weekly laptop auto-fetch + rotation...');
  console.log('[Cron-Laptop] Timestamp:', new Date().toISOString());

  const results = {
    autoFetch: null,
    rotation: null,
    errors: [],
  };

  try {
    // Step 1: Run auto-fetch (fetch new laptops from retailers)
    console.log('📥 [Cron-Laptop] Step 1: Running auto-fetch...');

    try {
      results.autoFetch = await runAutoFetch();
      console.log('[Cron-Laptop] Auto-fetch completed:', results.autoFetch);
    } catch (error) {
      console.error('[Cron-Laptop] Auto-fetch error:', error);
      results.errors.push({
        step: 'auto-fetch',
        error: error.message,
      });
    }

    // Step 2: Run rotation (reorganize featured/extended catalogs)
    console.log('🔄 [Cron-Laptop] Step 2: Running rotation...');

    try {
      // Get pre-rotation stats
      const preStats = await getRotationStats();
      console.log('[Cron-Laptop] Pre-rotation stats:', preStats);

      // Run rotation
      const rotationResult = await rotateLaptopDatabase(100, 7.5);
      console.log('[Cron-Laptop] Rotation completed:', rotationResult);

      // Get post-rotation stats
      const postStats = await getRotationStats();

      results.rotation = {
        ...rotationResult,
        preStats,
        postStats,
      };
    } catch (error) {
      console.error('[Cron-Laptop] Rotation error:', error);
      results.errors.push({
        step: 'rotation',
        error: error.message,
      });
    }

    // Get overall stats
    const overallStats = await getRotationStats();

    console.log('[Cron-Laptop] Weekly maintenance completed successfully');

    return successResponse({
      message: 'Weekly laptop auto-fetch and rotation completed',
      timestamp: new Date().toISOString(),
      results: {
        autoFetch: {
          success: results.autoFetch?.success || false,
          fetched: results.autoFetch?.stats?.fetched || 0,
          added: results.autoFetch?.stats?.added || 0,
          rejected: results.autoFetch?.stats?.rejected || 0,
        },
        rotation: {
          featured: results.rotation?.featured || 0,
          extended: results.rotation?.extended || 0,
          total: results.rotation?.total || overallStats.total || 0,
          promoted: results.rotation?.movements?.promoted || 0,
          demoted: results.rotation?.movements?.demoted || 0,
        },
        database: {
          total: overallStats.total || 0,
          featured: overallStats.featured || 0,
          extended: overallStats.extended || 0,
          strategy: 'GROWING - Laptops NEVER deleted',
        },
        errors: results.errors,
      },
    });

  } catch (error) {
    console.error('[Cron-Laptop] Fatal error:', error);

    return errorResponse(
      'Weekly laptop maintenance failed',
      500,
      {
        error: error.message,
        timestamp: new Date().toISOString(),
        results,
      },
    );
  }
}

// Alternative: Can also be called as a regular function endpoint
// POST /.netlify/functions/cron-laptop-fetch (manual trigger for testing)
