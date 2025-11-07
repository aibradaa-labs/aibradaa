/**
 * Data Management Netlify Function
 * Handles database queries, stats, and refresh operations
 * Routes: GET /stats, POST /refresh, GET /laptop/:id
 */

import {
  successResponse,
  errorResponse,
  handleOptions
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import {
  getDatabaseStats,
  getAllLaptops,
  getLaptopById,
  searchLaptops,
  filterLaptops,
  loadLaptopDatabase
} from './utils/laptopDb.mjs';

/**
 * Get database statistics
 */
function getStats(user) {
  const stats = getDatabaseStats();

  // Add additional stats for admin users
  if (user && user.tier === 'admin') {
    const laptops = getAllLaptops();

    stats.advanced = {
      totalViews: laptops.reduce((sum, l) => sum + l.metadata.views, 0),
      totalComparisons: laptops.reduce((sum, l) => sum + l.metadata.comparisons, 0),
      totalFavorites: laptops.reduce((sum, l) => sum + l.metadata.favorites, 0),
      avgDiscount: (laptops.reduce((sum, l) => sum + l.discount, 0) / laptops.length).toFixed(1),
      stockValue: laptops
        .filter(l => l.availability.inStock)
        .reduce((sum, l) => sum + (l.price * l.availability.stockCount), 0)
    };
  }

  return stats;
}

/**
 * Refresh database cache (admin only)
 */
function refreshDatabase(user) {
  // Verify admin access
  if (!user || user.tier !== 'admin') {
    const error = new Error('Admin access required');
    error.statusCode = 403;
    throw error;
  }

  // Force reload database
  const database = loadLaptopDatabase(true);

  return {
    success: true,
    message: 'Database cache refreshed',
    timestamp: new Date().toISOString(),
    catalog: database.catalog
  };
}

/**
 * Get single laptop details
 */
function getLaptopDetails(laptopId) {
  const laptop = getLaptopById(laptopId);

  if (!laptop) {
    const error = new Error('Laptop not found');
    error.statusCode = 404;
    throw error;
  }

  return laptop;
}

/**
 * Search and filter laptops
 */
function queryLaptops(queryParams) {
  const {
    q, // text search
    segment,
    tier,
    brand,
    minPrice,
    maxPrice,
    minRam,
    minStorage,
    minRefreshRate,
    maxWeight,
    hasDiscreteGpu,
    useCase,
    inStockOnly,
    minRating,
    limit = 20,
    offset = 0
  } = queryParams;

  let results = [];

  // Text search takes priority
  if (q) {
    results = searchLaptops(q);
  } else {
    // Build filter object
    const filters = {};
    if (segment) filters.segment = segment;
    if (tier) filters.tier = tier;
    if (brand) filters.brand = brand;
    if (minPrice) filters.minPrice = parseInt(minPrice);
    if (maxPrice) filters.maxPrice = parseInt(maxPrice);
    if (minRam) filters.minRam = parseInt(minRam);
    if (minStorage) filters.minStorage = parseInt(minStorage);
    if (minRefreshRate) filters.minRefreshRate = parseInt(minRefreshRate);
    if (maxWeight) filters.maxWeight = parseFloat(maxWeight);
    if (hasDiscreteGpu !== undefined) filters.hasDiscreteGpu = hasDiscreteGpu === 'true';
    if (useCase) filters.useCase = useCase;
    if (inStockOnly) filters.inStockOnly = inStockOnly === 'true';
    if (minRating) filters.minRating = parseFloat(minRating);

    results = filterLaptops(filters);
  }

  // Pagination
  const total = results.length;
  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);
  const paginated = results.slice(offsetNum, offsetNum + limitNum);

  return {
    results: paginated,
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total
    }
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
    const path = event.path.replace(/^\/\.netlify\/functions\/data/, '');
    const queryParams = event.queryStringParameters || {};

    // GET /stats - Database statistics
    if (path === '/stats' && event.httpMethod === 'GET') {
      const stats = getStats(user);
      return successResponse(stats);
    }

    // POST /refresh - Refresh database cache (admin only)
    if (path === '/refresh' && event.httpMethod === 'POST') {
      const result = refreshDatabase(user);
      return successResponse(result);
    }

    // GET /laptop/:id - Get single laptop
    if (path.startsWith('/laptop/') && event.httpMethod === 'GET') {
      const laptopId = path.replace('/laptop/', '');
      const laptop = getLaptopDetails(laptopId);
      return successResponse(laptop);
    }

    // GET /search or GET / with query params - Search/filter laptops
    if ((path === '/search' || path === '/' || path === '') && event.httpMethod === 'GET') {
      const results = queryLaptops(queryParams);
      return successResponse(results);
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('Data function error:', error);

    const statusCode = error.statusCode || 500;
    return errorResponse(
      error.message || 'Failed to process data request',
      statusCode,
      process.env.NODE_ENV !== 'production' ? { stack: error.stack } : null
    );
  }
}
