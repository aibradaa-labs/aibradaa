/**
 * Laptop Database Access Layer
 * Provides comprehensive query, filter, and search functions for the laptop database
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache for laptop database
let laptopCache = null;
let lastLoadTime = null;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Load laptop database from JSON file
 */
export function loadLaptopDatabase(forceReload = false) {
  const now = Date.now();

  // Return cached data if available and not expired
  if (!forceReload && laptopCache && lastLoadTime && (now - lastLoadTime < CACHE_TTL)) {
    return laptopCache;
  }

  try {
    // Load database file
    const dbPath = join(__dirname, '..', '..', '..', 'data', 'laptops.json');
    const fileContent = readFileSync(dbPath, 'utf-8');
    const database = JSON.parse(fileContent);

    // Cache the data
    laptopCache = database;
    lastLoadTime = now;

    console.log(`✅ Loaded ${database.catalog.totalLaptops} laptops from database`);
    return database;
  } catch (error) {
    console.error('Failed to load laptop database:', error);
    throw new Error('Database not available');
  }
}

/**
 * Get all laptops
 */
export function getAllLaptops() {
  const db = loadLaptopDatabase();
  return db.laptops;
}

/**
 * Get laptop by ID
 */
export function getLaptopById(id) {
  const laptops = getAllLaptops();
  return laptops.find(laptop => laptop.id === id);
}

/**
 * Get laptops by brand
 */
export function getLaptopsByBrand(brandKey) {
  const laptops = getAllLaptops();
  return laptops.filter(laptop => laptop.brand === brandKey.toLowerCase());
}

/**
 * Get laptops by segment
 */
export function getLaptopsBySegment(segment) {
  const laptops = getAllLaptops();
  return laptops.filter(laptop => laptop.segment === segment.toLowerCase());
}

/**
 * Get laptops by tier
 */
export function getLaptopsByTier(tier) {
  const laptops = getAllLaptops();
  return laptops.filter(laptop => laptop.tier === tier.toLowerCase());
}

/**
 * Get laptops in price range
 */
export function getLaptopsInPriceRange(minPrice, maxPrice) {
  const laptops = getAllLaptops();
  return laptops.filter(laptop =>
    laptop.price >= minPrice && laptop.price <= maxPrice
  );
}

/**
 * Search laptops by text query
 * Searches in: brand, model, description, tags, use cases
 */
export function searchLaptops(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const laptops = getAllLaptops();
  const searchTerm = query.toLowerCase().trim();

  return laptops.filter(laptop => {
    const searchableText = [
      laptop.brandName,
      laptop.series,
      laptop.model,
      laptop.fullName,
      laptop.description,
      ...laptop.tags,
      ...laptop.useCases,
      laptop.specs.cpu.brand,
      laptop.specs.cpu.model,
      laptop.specs.gpu.brand,
      laptop.specs.gpu.model || ''
    ].join(' ').toLowerCase();

    return searchableText.includes(searchTerm);
  });
}

/**
 * Advanced filter laptops by multiple criteria
 */
export function filterLaptops(filters = {}) {
  let laptops = getAllLaptops();

  // Filter by segment
  if (filters.segment) {
    laptops = laptops.filter(l => l.segment === filters.segment.toLowerCase());
  }

  // Filter by tier
  if (filters.tier) {
    laptops = laptops.filter(l => l.tier === filters.tier.toLowerCase());
  }

  // Filter by brand
  if (filters.brand) {
    const brandFilter = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
    laptops = laptops.filter(l => brandFilter.includes(l.brand.toLowerCase()));
  }

  // Filter by price range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const minPrice = filters.minPrice || 0;
    const maxPrice = filters.maxPrice || Infinity;
    laptops = laptops.filter(l => l.price >= minPrice && l.price <= maxPrice);
  }

  // Filter by RAM (minimum)
  if (filters.minRam) {
    laptops = laptops.filter(l => l.specs.ram >= filters.minRam);
  }

  // Filter by storage (minimum)
  if (filters.minStorage) {
    laptops = laptops.filter(l => l.specs.storage >= filters.minStorage);
  }

  // Filter by display size
  if (filters.displaySize) {
    laptops = laptops.filter(l => l.specs.display.size === filters.displaySize);
  }

  // Filter by refresh rate (minimum)
  if (filters.minRefreshRate) {
    laptops = laptops.filter(l => l.specs.display.refreshRate >= filters.minRefreshRate);
  }

  // Filter by weight (maximum)
  if (filters.maxWeight) {
    laptops = laptops.filter(l => l.specs.weight <= filters.maxWeight);
  }

  // Filter by GPU type
  if (filters.hasDiscreteGpu !== undefined) {
    laptops = laptops.filter(l =>
      filters.hasDiscreteGpu ? !l.specs.gpu.integrated : l.specs.gpu.integrated
    );
  }

  // Filter by use case
  if (filters.useCase) {
    laptops = laptops.filter(l => l.useCases.includes(filters.useCase.toLowerCase()));
  }

  // Filter by tags
  if (filters.tags) {
    const tagFilter = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
    laptops = laptops.filter(l =>
      tagFilter.some(tag => l.tags.includes(tag.toLowerCase()))
    );
  }

  // Filter by availability
  if (filters.inStockOnly) {
    laptops = laptops.filter(l => l.availability.inStock);
  }

  // Filter by rating (minimum)
  if (filters.minRating) {
    laptops = laptops.filter(l => l.rating >= filters.minRating);
  }

  return laptops;
}

/**
 * Get top laptops by segment
 */
export function getTopLaptopsBySegment(segment, limit = 10) {
  const laptops = getLaptopsBySegment(segment);
  return laptops
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

/**
 * Get budget recommendations
 */
export function getBudgetRecommendations(budget, options = {}) {
  const {
    segment = null,
    useCase = null,
    limit = 5
  } = options;

  let laptops = getAllLaptops();

  // Filter by price (within budget, allowing 10% overage)
  laptops = laptops.filter(l => l.price <= budget * 1.1);

  // Filter by segment if specified
  if (segment) {
    laptops = laptops.filter(l => l.segment === segment.toLowerCase());
  }

  // Filter by use case if specified
  if (useCase) {
    laptops = laptops.filter(l => l.useCases.includes(useCase.toLowerCase()));
  }

  // Sort by value score (considering price and rating)
  laptops = laptops.map(laptop => ({
    ...laptop,
    valueScore: calculateValueScore(laptop, budget)
  }));

  laptops.sort((a, b) => b.valueScore - a.valueScore);

  return laptops.slice(0, limit).map(laptop => {
    const { valueScore, ...rest } = laptop;
    return rest;
  });
}

/**
 * Calculate value score for a laptop relative to budget
 */
function calculateValueScore(laptop, budget) {
  const priceRatio = laptop.price / budget;
  const ratingScore = laptop.rating * 20; // Convert to 100-point scale
  const discountBonus = laptop.discount; // Discount percentage
  const availabilityBonus = laptop.availability.inStock ? 10 : 0;

  // Penalize if way over budget, reward if well under budget
  const budgetScore = priceRatio > 1.0
    ? (2.0 - priceRatio) * 50 // Penalty for over budget
    : (1.0 - priceRatio) * 30 + 50; // Bonus for under budget

  return ratingScore + budgetScore + discountBonus + availabilityBonus;
}

/**
 * Find similar laptops based on specs and price
 */
export function findSimilarLaptops(laptopId, limit = 5) {
  const targetLaptop = getLaptopById(laptopId);
  if (!targetLaptop) return [];

  const allLaptops = getAllLaptops();

  // Calculate similarity score for each laptop
  const similarLaptops = allLaptops
    .filter(l => l.id !== laptopId)
    .map(laptop => ({
      ...laptop,
      similarityScore: calculateSimilarity(targetLaptop, laptop)
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return similarLaptops.map(laptop => {
    const { similarityScore, ...rest } = laptop;
    return rest;
  });
}

/**
 * Calculate similarity score between two laptops
 */
function calculateSimilarity(laptop1, laptop2) {
  let score = 0;

  // Same brand: +20 points
  if (laptop1.brand === laptop2.brand) score += 20;

  // Same segment: +30 points
  if (laptop1.segment === laptop2.segment) score += 30;

  // Similar price (±20%): +25 points
  const priceDiff = Math.abs(laptop1.price - laptop2.price) / laptop1.price;
  if (priceDiff <= 0.2) score += 25;
  else if (priceDiff <= 0.4) score += 15;

  // Similar RAM: +10 points
  if (laptop1.specs.ram === laptop2.specs.ram) score += 10;

  // Similar storage: +5 points
  if (laptop1.specs.storage === laptop2.specs.storage) score += 5;

  // Similar display size (±1 inch): +10 points
  if (Math.abs(laptop1.specs.display.size - laptop2.specs.display.size) <= 1) {
    score += 10;
  }

  return score;
}

/**
 * Find better alternatives (higher rating, similar or lower price)
 */
export function findBetterAlternatives(laptopId, limit = 5) {
  const targetLaptop = getLaptopById(laptopId);
  if (!targetLaptop) return [];

  const allLaptops = getAllLaptops();

  return allLaptops
    .filter(l =>
      l.id !== laptopId &&
      l.rating > targetLaptop.rating &&
      l.price <= targetLaptop.price * 1.15 // Allow 15% higher price
    )
    .map(laptop => ({
      ...laptop,
      reason: generateAlternativeReason(targetLaptop, laptop)
    }))
    .sort((a, b) => {
      // Sort by rating difference (better rating = higher priority)
      const ratingDiff = (b.rating - targetLaptop.rating) - (a.rating - targetLaptop.rating);
      if (Math.abs(ratingDiff) > 0.1) return ratingDiff;

      // If similar ratings, sort by price (lower = better)
      return a.price - b.price;
    })
    .slice(0, limit);
}

/**
 * Generate reason why alternative is better
 */
function generateAlternativeReason(original, alternative) {
  const reasons = [];

  const ratingDiff = alternative.rating - original.rating;
  const priceDiff = alternative.price - original.price;

  if (ratingDiff >= 0.5) {
    reasons.push('Significantly higher rating');
  } else if (ratingDiff >= 0.2) {
    reasons.push('Better rating');
  }

  if (priceDiff < 0) {
    reasons.push('Lower price');
  } else if (priceDiff === 0) {
    reasons.push('Same price');
  }

  if (alternative.specs.ram > original.specs.ram) {
    reasons.push('More RAM');
  }

  if (alternative.specs.storage > original.specs.storage) {
    reasons.push('More storage');
  }

  if (alternative.specs.display.refreshRate > original.specs.display.refreshRate) {
    reasons.push('Higher refresh rate');
  }

  if (alternative.discount > original.discount) {
    reasons.push('Better discount');
  }

  return reasons.slice(0, 3).join(', ') || 'Better overall value';
}

/**
 * Smart recommendations based on user preferences
 */
export function getSmartRecommendations(preferences = {}, limit = 3) {
  const {
    budget,
    usage = [], // Array of use cases: ['gaming', 'productivity', etc.]
    preferences: userPrefs = {} // Additional preferences
  } = preferences;

  let laptops = getAllLaptops();

  // Filter by budget if provided
  if (budget) {
    laptops = laptops.filter(l => l.price <= budget * 1.1); // Allow 10% over budget
  }

  // Filter by use cases
  if (usage.length > 0) {
    laptops = laptops.filter(l =>
      usage.some(use => l.useCases.includes(use.toLowerCase()))
    );
  }

  // Apply user preferences
  if (userPrefs.portability) {
    laptops = laptops.filter(l => l.specs.weight <= 2.0);
  }

  if (userPrefs.performance) {
    laptops = laptops.filter(l =>
      !l.specs.gpu.integrated && l.specs.ram >= 16
    );
  }

  if (userPrefs.batteryLife) {
    laptops = laptops.filter(l => l.specs.batteryLife >= 10);
  }

  if (userPrefs.display) {
    laptops = laptops.filter(l =>
      l.specs.display.refreshRate >= 120 || l.specs.display.panelType === 'OLED'
    );
  }

  // Calculate recommendation score
  laptops = laptops.map(laptop => ({
    ...laptop,
    recommendationScore: calculateRecommendationScore(laptop, preferences)
  }));

  // Sort by score
  laptops.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return laptops.slice(0, limit).map(laptop => {
    const { recommendationScore, ...rest } = laptop;
    return rest;
  });
}

/**
 * Calculate recommendation score
 */
function calculateRecommendationScore(laptop, preferences) {
  let score = 0;

  // Base rating score (0-100)
  score += laptop.rating * 20;

  // Budget fit score
  if (preferences.budget) {
    const budgetFit = laptop.price / preferences.budget;
    if (budgetFit <= 0.9) score += 30; // Under budget bonus
    else if (budgetFit <= 1.0) score += 20; // Perfect fit
    else if (budgetFit <= 1.1) score += 10; // Slight over
    else score -= 20; // Over budget penalty
  }

  // Use case match score
  if (preferences.usage && preferences.usage.length > 0) {
    const matchCount = preferences.usage.filter(use =>
      laptop.useCases.includes(use.toLowerCase())
    ).length;
    score += matchCount * 15;
  }

  // Availability bonus
  if (laptop.availability.inStock) score += 10;

  // Discount bonus
  score += laptop.discount * 0.5;

  // User preference bonuses
  const prefs = preferences.preferences || {};
  if (prefs.portability && laptop.specs.weight <= 1.5) score += 15;
  if (prefs.performance && laptop.specs.ram >= 32) score += 15;
  if (prefs.batteryLife && laptop.specs.batteryLife >= 12) score += 15;
  if (prefs.display && laptop.specs.display.refreshRate >= 144) score += 10;

  return score;
}

/**
 * Identify laptop from image analysis results
 */
export function identifyLaptopFromAnalysis(analysis) {
  const { brand, model, confidence } = analysis;

  if (confidence === 'low' || !brand) {
    return null;
  }

  const laptops = getAllLaptops();

  // Try exact match first
  if (model) {
    const exactMatch = laptops.find(l =>
      l.brandName.toLowerCase() === brand.toLowerCase() &&
      l.model.toLowerCase().includes(model.toLowerCase())
    );
    if (exactMatch) return exactMatch;
  }

  // Try brand + series match
  const brandMatches = laptops.filter(l =>
    l.brandName.toLowerCase() === brand.toLowerCase()
  );

  if (brandMatches.length === 0) return null;

  // Return highest rated from same brand
  return brandMatches.sort((a, b) => b.rating - a.rating)[0];
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  const db = loadLaptopDatabase();
  const laptops = db.laptops;

  const stats = {
    total: laptops.length,
    bySegment: {},
    byTier: {},
    byBrand: {},
    priceRange: {
      min: Math.min(...laptops.map(l => l.price)),
      max: Math.max(...laptops.map(l => l.price)),
      avg: Math.round(laptops.reduce((sum, l) => sum + l.price, 0) / laptops.length)
    },
    inStock: laptops.filter(l => l.availability.inStock).length,
    avgRating: (laptops.reduce((sum, l) => sum + l.rating, 0) / laptops.length).toFixed(2),
    lastUpdated: db.catalog.lastUpdated
  };

  laptops.forEach(laptop => {
    stats.bySegment[laptop.segment] = (stats.bySegment[laptop.segment] || 0) + 1;
    stats.byTier[laptop.tier] = (stats.byTier[laptop.tier] || 0) + 1;
    stats.byBrand[laptop.brandName] = (stats.byBrand[laptop.brandName] || 0) + 1;
  });

  return stats;
}

/**
 * Compare multiple laptops side-by-side
 */
export function compareLaptops(laptopIds) {
  const laptops = laptopIds
    .map(id => getLaptopById(id))
    .filter(Boolean);

  if (laptops.length === 0) return null;

  return {
    laptops,
    comparison: {
      priceRange: {
        min: Math.min(...laptops.map(l => l.price)),
        max: Math.max(...laptops.map(l => l.price)),
        diff: Math.max(...laptops.map(l => l.price)) - Math.min(...laptops.map(l => l.price))
      },
      bestRating: laptops.reduce((best, l) => l.rating > best.rating ? l : best),
      bestValue: laptops.reduce((best, l) =>
        (l.rating / l.price) > (best.rating / best.price) ? l : best
      ),
      lightest: laptops.reduce((light, l) =>
        l.specs.weight < light.specs.weight ? l : light
      ),
      longestBattery: laptops.reduce((best, l) =>
        l.specs.batteryLife > best.specs.batteryLife ? l : best
      )
    }
  };
}

export default {
  loadLaptopDatabase,
  getAllLaptops,
  getLaptopById,
  getLaptopsByBrand,
  getLaptopsBySegment,
  getLaptopsByTier,
  getLaptopsInPriceRange,
  searchLaptops,
  filterLaptops,
  getTopLaptopsBySegment,
  getBudgetRecommendations,
  findSimilarLaptops,
  findBetterAlternatives,
  getSmartRecommendations,
  identifyLaptopFromAnalysis,
  getDatabaseStats,
  compareLaptops
};
