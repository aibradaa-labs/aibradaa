/**
 * Affiliates Out Netlify Function
 * GET /api/affiliates/out/:id - Affiliate link tracking and redirect
 * - Click tracking (utm_source, utm_medium, utm_campaign)
 * - Redirect to actual offer URL
 * - Log clicks for analytics
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';

/**
 * Track affiliate click
 * In production, this would save to database for analytics
 */
function trackClick(laptopId, source, userId, userAgent, referrer) {
  const click = {
    laptopId,
    source,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
    userAgent,
    referrer,
    clickId: `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  console.log('[Affiliate] Click tracked:', click);

  // In production:
  // 1. Save to database
  // 2. Queue for analytics processing
  // 3. Update real-time stats

  return click;
}

/**
 * Add affiliate parameters to URL
 */
function addAffiliateParams(url, laptopId, source) {
  try {
    const parsedUrl = new URL(url);

    // Add UTM parameters for tracking
    parsedUrl.searchParams.set('utm_source', 'aibradaa');
    parsedUrl.searchParams.set('utm_medium', 'affiliate');
    parsedUrl.searchParams.set('utm_campaign', `laptop-${laptopId}`);

    // Add source-specific affiliate tags
    if (source === 'Shopee') {
      parsedUrl.searchParams.set('aff_sid', process.env.SHOPEE_AFFILIATE_ID || 'aibradaa');
    } else if (source === 'Lazada') {
      parsedUrl.searchParams.set('laz_trackid', process.env.LAZADA_AFFILIATE_ID || 'aibradaa');
    }

    return parsedUrl.toString();

  } catch (error) {
    console.error('[Affiliate] URL parsing error:', error);
    return url; // Return original URL if parsing fails
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
    // Get user from token (optional)
    const user = getUserFromEvent(event);

    // Parse path parameters
    const pathParts = event.path.split('/');
    const laptopId = pathParts[pathParts.length - 1];

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const targetUrl = params.url;

    if (!targetUrl) {
      return errorResponse('Missing target URL parameter', 400);
    }

    if (!laptopId) {
      return errorResponse('Missing laptop ID', 400);
    }

    // Decode URL
    const decodedUrl = decodeURIComponent(targetUrl);

    // Determine source from URL (basic detection)
    let source = 'Unknown';
    if (decodedUrl.includes('shopee')) source = 'Shopee';
    else if (decodedUrl.includes('lazada')) source = 'Lazada';
    else if (decodedUrl.includes('amazon')) source = 'Amazon';

    // Track click
    const clickData = trackClick(
      laptopId,
      source,
      user?.id,
      event.headers['user-agent'],
      event.headers['referer'] || event.headers['referrer']
    );

    // Add affiliate parameters
    const affiliateUrl = addAffiliateParams(decodedUrl, laptopId, source);

    // Redirect to affiliate URL
    return {
      statusCode: 302,
      headers: {
        'Location': affiliateUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Click-ID': clickData.clickId
      },
      body: ''
    };

  } catch (error) {
    console.error('[Affiliate Out] Error:', error);

    return errorResponse(
      'Failed to process affiliate link',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
