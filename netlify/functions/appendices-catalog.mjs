/**
 * Appendices Catalog Netlify Function
 * GET /api/appendices/catalog - Full laptop catalog with best offers
 * - Free tier: Top-35
 * - Pro+: Full Top-100
 * - Best offer per device (Shopee, Lazada, official stores)
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';

/**
 * Mock catalog (Top 100)
 * In production, this would come from database with real-time pricing
 */
function generateCatalog() {
  const brands = ['Dell', 'Apple', 'Lenovo', 'HP', 'ASUS', 'Acer', 'MSI'];
  const processors = ['Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M2', 'Apple M3'];
  const sources = ['Shopee', 'Lazada', 'Official Store', 'Amazon'];

  const catalog = [];

  for (let i = 1; i <= 100; i++) {
    const brand = brands[i % brands.length];
    const processor = processors[i % processors.length];
    const basePrice = 2000 + (i * 80) + Math.random() * 400;

    // Generate best offer + alternative offers
    const offers = sources.map(source => ({
      source,
      price: Math.round(basePrice + (Math.random() - 0.5) * 300),
      url: `https://example.com/${source.toLowerCase()}/laptop-${i}`,
      inStock: Math.random() > 0.1,
      shipping: source === 'Official Store' ? 'Free' : 'RM 15',
      deliveryDays: Math.floor(Math.random() * 5) + 1
    }));

    // Sort to get best offer
    offers.sort((a, b) => a.price - b.price);
    const bestOffer = offers[0];
    const alternativeOffers = offers.slice(1);

    catalog.push({
      id: `laptop-${i}`,
      rank: i,
      name: `${brand} ${brand === 'Apple' ? 'MacBook' : 'Laptop'} ${i}`,
      brand,
      price: bestOffer.price,
      specs: {
        processor,
        ram: `${[8, 16, 32][i % 3]}GB`,
        storage: `${[256, 512, 1024][i % 3]}GB SSD`,
        gpu: i % 3 === 0 ? 'RTX 4060' : 'Integrated',
        screen: `${[13, 14, 15, 16][i % 4]}"`,
      },
      image: `/assets/laptops/placeholder-${i % 10}.jpg`,
      badges: i <= 10 ? ['Top 10'] : i <= 35 ? ['Top 35'] : [],
      bestOffer: {
        ...bestOffer,
        savings: alternativeOffers.length > 0
          ? Math.round(alternativeOffers[0].price - bestOffer.price)
          : 0
      },
      alternativeOffers: alternativeOffers.filter(o => o.inStock)
    });
  }

  return catalog;
}

/**
 * Get tier-based catalog limit
 */
function getCatalogLimit(tier) {
  const limits = {
    guest: 35,
    free: 35,
    pro: 100,
    ultimate: 100,
    enterprise: 100
  };

  return limits[tier] || 35;
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

    // Generate full catalog
    const fullCatalog = generateCatalog();

    // Apply tier-based limit
    const catalogLimit = getCatalogLimit(tier);
    const tierLimitedCatalog = fullCatalog.slice(0, catalogLimit);

    return successResponse({
      success: true,
      data: {
        catalog: tierLimitedCatalog,
        tierInfo: {
          currentTier: tier,
          catalogLimit: catalogLimit,
          totalAvailable: fullCatalog.length,
          upgradeMessage: tier === 'free' || tier === 'guest'
            ? 'Upgrade to Pro+ to access all 100 laptops with best prices'
            : null
        },
        meta: {
          timestamp: new Date().toISOString(),
          cacheExpiry: 1800, // 30 minutes
          affiliateDisclosure: 'We earn commission on purchases through our links. Thank you for supporting AI Bradaa!'
        }
      }
    });

  } catch (error) {
    console.error('[Appendices Catalog] Error:', error);

    return errorResponse(
      'Failed to load catalog',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
