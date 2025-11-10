/**
 * Intel Netlify Function
 * Handles laptop news, price drops, and ETL refresh triggers
 * Routes: GET /feed, POST /refresh, GET /price-drops
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  getQueryParams
} from './utils/response.mjs';
import { getUserFromEvent, requireTier } from './utils/auth.mjs';
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
 * Generate mock Intel feed
 */
function generateMockFeed(limit, offset, category) {
  const categories = ['news', 'price-drop', 'new-release', 'deal'];
  const items = [];

  for (let i = offset; i < offset + limit; i++) {
    const itemCategory = category === 'all' ? categories[i % categories.length] : category;

    items.push({
      id: `intel-${i}`,
      category: itemCategory,
      title: `${itemCategory === 'news' ? 'Breaking' : 'Hot'}: Sample Intel Item ${i}`,
      description: 'This is a sample Intel feed item for testing.',
      url: `https://example.com/intel/${i}`,
      source: ['TechNave', 'SoyaCincau', 'Lowyat'][i % 3],
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      metadata: {
        views: Math.floor(Math.random() * 1000),
        upvotes: Math.floor(Math.random() * 100),
      },
    });
  }

  return items;
}

/**
 * Get Intel feed
 */
function getIntelFeed(queryParams) {
  const limit = parseInt(queryParams.limit || '20');
  const offset = parseInt(queryParams.offset || '0');
  const category = queryParams.category || 'all';

  const items = generateMockFeed(limit, offset, category);

  return {
    items,
    pagination: {
      limit,
      offset,
      total: 100, // Mock total
    },
  };
}

/**
 * Generate AI-powered insights for Intel feed
 *
 * @param {Array} items - Feed items
 * @returns {Promise<Object>} AI insights
 */
async function generateIntelInsights(items) {
  if (!items || items.length === 0) {
    return null;
  }

  // Summarize top items for AI
  const topItems = items.slice(0, 5).map(item => ({
    title: item.title,
    category: item.category,
    source: item.source,
  }));

  const prompt = `You are AI Bradaa's Intel analyst. Summarize these recent laptop tech news for Malaysian users:

${topItems.map((item, i) => `${i + 1}. [${item.category}] ${item.title} - ${item.source}`).join('\n')}

Provide:
1. Brief overall summary (2-3 sentences)
2. Top trend or highlight
3. Key takeaway for laptop buyers

Keep it concise and exciting! Use light Manglish if appropriate.`;

  try {
    const result = await gemini.generate(prompt, {
      model: 'gemini-2.0-flash-exp',
    });

    return {
      summary: result.text,
      tokens: result.tokens,
      cost: result.cost,
    };
  } catch (error) {
    console.error('[Intel] AI insights generation failed:', error);
    return null;
  }
}

/**
 * Trigger ETL refresh
 */
function triggerRefresh(source, userId) {
  // In production, this would queue a job with a background worker
  // For serverless, consider: Netlify Background Functions, AWS Lambda, or queue service
  const jobId = `etl-${Date.now()}`;

  console.log(`ETL refresh triggered by user ${userId} for source: ${source}`);

  return {
    jobId,
    status: 'queued',
    message: 'ETL refresh has been queued. Check back in a few minutes.',
    source,
    note: 'In production, this would trigger actual ETL pipeline'
  };
}

/**
 * Get price drops
 */
function getPriceDrops(queryParams) {
  const days = parseInt(queryParams.days || '7');
  const minDiscount = parseFloat(queryParams.minDiscount || '10');

  // Mock data (in production, fetch from database)
  const priceDrops = [
    {
      id: 'macbook-pro-14-m4',
      name: 'MacBook Pro 14" M4',
      oldPrice: 7999,
      newPrice: 7199,
      discount: 800,
      percentage: 10.0,
      currency: 'MYR',
      source: 'Lazada',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'asus-rog-zephyrus-g14',
      name: 'ASUS ROG Zephyrus G14',
      oldPrice: 5499,
      newPrice: 4799,
      discount: 700,
      percentage: 12.73,
      currency: 'MYR',
      source: 'Shopee',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'lenovo-thinkpad-x1-carbon',
      name: 'Lenovo ThinkPad X1 Carbon Gen 11',
      oldPrice: 6499,
      newPrice: 5849,
      discount: 650,
      percentage: 10.0,
      currency: 'MYR',
      source: 'Official Store',
      timestamp: new Date().toISOString(),
    },
  ].filter(item => item.percentage >= minDiscount);

  return {
    priceDrops,
    filters: {
      days,
      minDiscount,
    },
  };
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
    // Get user from token (optional for some endpoints)
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
    const path = event.path.replace(/^\/\.netlify\/functions\/intel/, '');
    const queryParams = getQueryParams(event);

    // GET /feed - Free tier can access, but AI insights require Pro/Ultimate
    if (path === '/feed' && event.httpMethod === 'GET') {
      const result = getIntelFeed(queryParams);

      // Optional AI insights (enabled via ?insights=true query param)
      const enableInsights = queryParams.insights === 'true';
      let aiInsights = null;

      if (enableInsights && gemini) {
        // Enforce quota BEFORE AI call
        const quotaCheck = await enforceQuota(user);
        if (!quotaCheck.allowed) {
          // Return feed without AI insights if quota exceeded
          return successResponse({
            success: true,
            data: result,
            note: 'AI insights unavailable (quota exceeded)',
          });
        }

        aiInsights = await generateIntelInsights(result.items);

        // Record usage AFTER AI call
        if (aiInsights) {
          await quotaCheck.recordUsage(
            aiInsights.tokens.total,
            aiInsights.cost.sen,
            '/.netlify/functions/intel/feed',
            {
              itemCount: result.items.length,
              category: queryParams.category || 'all',
            }
          );
        }
      }

      return successResponse({
        success: true,
        data: {
          ...result,
          aiInsights: aiInsights ? aiInsights.summary : null,
        },
        ...(aiInsights ? { quota: user?.id ? (await enforceQuota(user)).status.remaining : null } : {}),
      });
    }

    // POST /refresh (Pro+ tier required)
    if (path === '/refresh' && event.httpMethod === 'POST') {
      // Require Pro tier
      if (!user) {
        return errorResponse('Authentication required', 401);
      }

      try {
        requireTier(user, 'pro');
      } catch (tierError) {
        return errorResponse('Pro tier or higher required for ETL refresh', 403, {
          currentTier: user?.tier || 'guest',
          requiredTier: 'pro',
          upgradeUrl: '/pricing?upgrade=pro'
        });
      }

      const body = parseBody(event);
      const source = body.source || 'all';

      const result = triggerRefresh(source, user.id);
      return successResponse({
        success: true,
        data: result
      });
    }

    // GET /price-drops
    if (path === '/price-drops' && event.httpMethod === 'GET') {
      const result = getPriceDrops(queryParams);
      return successResponse({
        success: true,
        data: result
      });
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('Intel error:', error);

    // Handle specific error types
    if (error.message.includes('Authentication required')) {
      return errorResponse(error.message, 401);
    }

    if (error.message.includes('tier required')) {
      return errorResponse(error.message, 403);
    }

    return errorResponse(
      'Failed to process Intel request',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
