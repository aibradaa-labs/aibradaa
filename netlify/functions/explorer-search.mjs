/**
 * Explorer Search Netlify Function
 * GET /api/explorer/laptops - Browse laptop catalog with smart filters
 * - Top-35 public grid (Free tier)
 * - Top-100 for Pro+ users
 * - Smart filters: price, use case, brand, screen, processor, RAM, GPU
 * - Pagination support (12 per page)
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';

/**
 * Mock laptop database (Top 100 curated)
 * In production, this would come from a real database
 */
const FULL_CATALOG = generateMockCatalog();

/**
 * Generate mock catalog for demonstration
 */
function generateMockCatalog() {
  const brands = ['Dell', 'Apple', 'Lenovo', 'HP', 'ASUS', 'Acer', 'MSI'];
  const useCases = ['work', 'gaming', 'creative', 'programming', 'student', 'general'];
  const processors = ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M2', 'Apple M3'];
  const ramOptions = [8, 16, 32, 64];
  const gpuOptions = ['Integrated', 'RTX 3050', 'RTX 4050', 'RTX 4060', 'RTX 4070', 'M2 GPU', 'M3 GPU'];

  const catalog = [];
  for (let i = 1; i <= 100; i++) {
    const brand = brands[i % brands.length];
    const useCase = useCases[i % useCases.length];
    const processor = processors[i % processors.length];
    const ram = ramOptions[Math.floor(i / 25) % ramOptions.length];
    const gpu = gpuOptions[i % gpuOptions.length];
    const price = 2000 + (i * 100) + (Math.random() * 500);
    const screenSize = [13, 14, 15, 16, 17][i % 5];

    catalog.push({
      id: `laptop-${i}`,
      rank: i,
      name: `${brand} ${brand === 'Apple' ? 'MacBook' : 'Laptop'} ${i}`,
      brand,
      price: Math.round(price),
      specs: {
        processor,
        ram: `${ram}GB`,
        storage: `${[256, 512, 1024][i % 3]}GB SSD`,
        gpu,
        screen: `${screenSize}"`,
        screenResolution: screenSize >= 15 ? '1920x1080' : '2560x1600'
      },
      useCase,
      badges: i <= 10 ? ['Top 10'] : i <= 35 ? ['Top 35'] : [],
      rating: 3.5 + (Math.random() * 1.5),
      reviews: Math.floor(100 + Math.random() * 900),
      image: `/assets/laptops/placeholder-${i % 10}.jpg`,
      available: true
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
 * Apply filters to catalog
 */
function applyFilters(catalog, filters) {
  return catalog.filter(laptop => {
    // Price range
    if (filters.minPrice && laptop.price < filters.minPrice) return false;
    if (filters.maxPrice && laptop.price > filters.maxPrice) return false;

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      if (!filters.brands.includes(laptop.brand)) return false;
    }

    // Use case filter
    if (filters.useCase && laptop.useCase !== filters.useCase) {
      return false;
    }

    // Screen size filter
    if (filters.screenSize) {
      const screenNum = parseInt(laptop.specs.screen);
      const filterNum = parseInt(filters.screenSize);
      if (screenNum !== filterNum) return false;
    }

    // Processor filter
    if (filters.processor && !laptop.specs.processor.includes(filters.processor)) {
      return false;
    }

    // RAM filter
    if (filters.minRam) {
      const laptopRam = parseInt(laptop.specs.ram);
      if (laptopRam < filters.minRam) return false;
    }

    // GPU filter (discrete vs integrated)
    if (filters.gpuType) {
      const hasDiscreteGPU = laptop.specs.gpu !== 'Integrated';
      if (filters.gpuType === 'discrete' && !hasDiscreteGPU) return false;
      if (filters.gpuType === 'integrated' && hasDiscreteGPU) return false;
    }

    // Search query
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchable = `${laptop.name} ${laptop.brand} ${laptop.specs.processor}`.toLowerCase();
      if (!searchable.includes(searchLower)) return false;
    }

    return true;
  });
}

/**
 * Apply sorting
 */
function applySort(catalog, sort) {
  const sortFunctions = {
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    'rating': (a, b) => b.rating - a.rating,
    'popular': (a, b) => b.reviews - a.reviews,
    'newest': (a, b) => a.rank - b.rank,
    'default': (a, b) => a.rank - b.rank
  };

  const sortFn = sortFunctions[sort] || sortFunctions.default;
  return [...catalog].sort(sortFn);
}

/**
 * Apply pagination
 */
function applyPagination(catalog, page, perPage) {
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    items: catalog.slice(start, end),
    pagination: {
      page,
      perPage,
      total: catalog.length,
      totalPages: Math.ceil(catalog.length / perPage),
      hasNext: end < catalog.length,
      hasPrev: page > 1
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

    // Parse query parameters
    const params = event.queryStringParameters || {};

    const filters = {
      search: params.search || null,
      minPrice: params.minPrice ? parseInt(params.minPrice) : null,
      maxPrice: params.maxPrice ? parseInt(params.maxPrice) : null,
      brands: params.brands ? params.brands.split(',') : null,
      useCase: params.useCase || null,
      screenSize: params.screenSize || null,
      processor: params.processor || null,
      minRam: params.minRam ? parseInt(params.minRam) : null,
      gpuType: params.gpuType || null // 'discrete' or 'integrated'
    };

    const sort = params.sort || 'default';
    const page = parseInt(params.page) || 1;
    const perPage = parseInt(params.perPage) || 12;

    // Step 1: Apply tier-based limit (Top 35 for free, Top 100 for Pro+)
    const catalogLimit = getCatalogLimit(tier);
    const tierLimitedCatalog = FULL_CATALOG.slice(0, catalogLimit);

    // Step 2: Apply filters
    const filtered = applyFilters(tierLimitedCatalog, filters);

    // Step 3: Apply sorting
    const sorted = applySort(filtered, sort);

    // Step 4: Apply pagination
    const result = applyPagination(sorted, page, perPage);

    return successResponse({
      success: true,
      data: {
        laptops: result.items,
        pagination: result.pagination,
        filters: filters,
        sort: sort,
        tierInfo: {
          currentTier: tier,
          catalogLimit: catalogLimit,
          totalAvailable: FULL_CATALOG.length,
          upgradeMessage: tier === 'free' || tier === 'guest'
            ? 'Upgrade to Pro+ to access all 100 laptops'
            : null
        }
      }
    });

  } catch (error) {
    console.error('[Explorer] Error:', error);

    return errorResponse(
      'Failed to search laptops',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
