/**
 * Affiliates Netlify Function
 * Handles affiliate link redirects and tracking
 * Routes: GET /out/:id/:slug, GET /stats
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  getQueryParams
} from './utils/response.mjs';
import { getUserFromEvent, requireAuth } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';

/**
 * In-memory affiliate tracking
 * In production, store in database (DynamoDB, FaunaDB, Supabase, etc.)
 */
const clicks = new Map();

/**
 * Get affiliate URL for a laptop
 * In production, load from database or configs/affiliate.json
 */
function getAffiliateUrl(laptopId, slug) {
  // Mock affiliate mappings
  const affiliates = {
    'macbook-pro-14-m4': {
      lazada: 'https://www.lazada.com.my/products/macbook-pro-14-m4?aff_token=YOUR_TOKEN',
      shopee: 'https://shopee.com.my/macbook-pro-14-m4?aff_sid=YOUR_SID',
    },
    'asus-rog-zephyrus-g14': {
      lazada: 'https://www.lazada.com.my/products/asus-rog-zephyrus-g14?aff_token=YOUR_TOKEN',
      shopee: 'https://shopee.com.my/asus-rog-zephyrus-g14?aff_sid=YOUR_SID',
    },
    'lenovo-thinkpad-x1-carbon': {
      lazada: 'https://www.lazada.com.my/products/lenovo-thinkpad-x1-carbon?aff_token=YOUR_TOKEN',
      shopee: 'https://shopee.com.my/lenovo-thinkpad-x1-carbon?aff_sid=YOUR_SID',
    },
  };

  // Default to Lazada if no slug specified
  const platform = slug || 'lazada';
  const urls = affiliates[laptopId];

  if (!urls) {
    return null;
  }

  return urls[platform] || urls.lazada || null;
}

/**
 * Track affiliate click
 */
function trackClick(laptopId, slug, event, refParam) {
  const clickId = `${laptopId}-${slug}`;
  const clickData = {
    id: clickId,
    laptopId,
    slug,
    timestamp: new Date().toISOString(),
    userAgent: event.headers['user-agent'] || 'unknown',
    ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown',
    referer: event.headers['referer'] || 'direct',
    ref: refParam,
  };

  // Store click
  if (!clicks.has(clickId)) {
    clicks.set(clickId, []);
  }
  clicks.get(clickId).push(clickData);

  // Log for analytics
  console.log('Affiliate click:', clickData);

  return clickData;
}

/**
 * Get affiliate click statistics
 */
function getStats() {
  const stats = {
    totalClicks: Array.from(clicks.values()).reduce((sum, arr) => sum + arr.length, 0),
    uniqueProducts: clicks.size,
    clicksByProduct: {},
  };

  clicks.forEach((clickArray, productId) => {
    stats.clicksByProduct[productId] = {
      count: clickArray.length,
      lastClick: clickArray[clickArray.length - 1]?.timestamp,
    };
  });

  return stats;
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
    // Get user from token (optional for redirects)
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

    // Route based on path and method
    const path = event.path.replace(/^\/\.netlify\/functions\/affiliates/, '');
    const queryParams = getQueryParams(event);

    // GET /stats (admin only - requires auth)
    if (path === '/stats' && event.httpMethod === 'GET') {
      // Require authentication for stats
      try {
        requireAuth(event);
      } catch (authError) {
        return errorResponse('Authentication required for affiliate stats', 401);
      }

      const stats = getStats();
      return successResponse({
        success: true,
        data: stats
      });
    }

    // GET /out/:id/:slug (affiliate redirect)
    // Path format: /out/laptop-id/platform-slug
    const outMatch = path.match(/^\/out\/([^\/]+)\/([^\/]+)$/);
    if (outMatch && event.httpMethod === 'GET') {
      const laptopId = outMatch[1];
      const slug = outMatch[2];
      const ref = queryParams.ref || 'aibradaa';

      // Track click
      trackClick(laptopId, slug, event, ref);

      // Get redirect URL
      const redirectUrl = getAffiliateUrl(laptopId, slug);

      if (!redirectUrl) {
        return errorResponse('Affiliate link not found', 404);
      }

      // Return 302 redirect
      return {
        statusCode: 302,
        headers: {
          'Location': redirectUrl,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: ''
      };
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('Affiliates error:', error);

    const statusCode = error.statusCode || 500;
    return errorResponse(
      error.message || 'Failed to process affiliate request',
      statusCode,
      process.env.NODE_ENV !== 'production' ? error.stack : null
    );
  }
}
