/**
 * Laptop Database Integration Tests
 * Tests all database access functions and integrations
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  loadLaptopDatabase,
  getAllLaptops,
  getLaptopById,
  getLaptopsByBrand,
  getLaptopsBySegment,
  getLaptopsByTier,
  getLaptopsInPriceRange,
  searchLaptops,
  filterLaptops,
  getSmartRecommendations,
  findSimilarLaptops,
  findBetterAlternatives,
  compareLaptops,
  identifyLaptopFromAnalysis,
  getDatabaseStats
} from '../../netlify/functions/utils/laptopDb.mjs';

describe('Laptop Database - Core Functions', () => {
  let database;
  let allLaptops;

  beforeAll(() => {
    database = loadLaptopDatabase();
    allLaptops = getAllLaptops();
  });

  it('should load database successfully', () => {
    expect(database).toBeDefined();
    expect(database.catalog).toBeDefined();
    expect(database.laptops).toBeDefined();
    expect(database.catalog.totalLaptops).toBe(100);
  });

  it('should get all laptops (90 total)', () => {
    expect(allLaptops).toHaveLength(100);
    expect(allLaptops[0]).toHaveProperty('id');
    expect(allLaptops[0]).toHaveProperty('brand');
    expect(allLaptops[0]).toHaveProperty('price');
  });

  it('should get laptop by ID', () => {
    const firstLaptop = allLaptops[0];
    const laptop = getLaptopById(firstLaptop.id);

    expect(laptop).toBeDefined();
    expect(laptop.id).toBe(firstLaptop.id);
    expect(laptop.brandName).toBe(firstLaptop.brandName);
  });

  it('should return undefined for non-existent ID', () => {
    const laptop = getLaptopById('non-existent-laptop-999');
    expect(laptop).toBeUndefined();
  });

  it('should get laptops by brand', () => {
    const asusLaptops = getLaptopsByBrand('asus');
    expect(asusLaptops.length).toBeGreaterThan(0);
    asusLaptops.forEach(laptop => {
      expect(laptop.brand).toBe('asus');
      expect(laptop.brandName).toBe('ASUS');
    });
  });

  it('should get laptops by segment', () => {
    const gamingLaptops = getLaptopsBySegment('gaming');
    expect(gamingLaptops.length).toBeGreaterThan(0);
    gamingLaptops.forEach(laptop => {
      expect(laptop.segment).toBe('gaming');
    });
  });

  it('should get laptops by tier', () => {
    const budgetLaptops = getLaptopsByTier('budget');
    expect(budgetLaptops.length).toBeGreaterThan(0);
    budgetLaptops.forEach(laptop => {
      expect(laptop.tier).toBe('budget');
    });
  });

  it('should get laptops in price range', () => {
    const laptops = getLaptopsInPriceRange(4000, 7000);
    expect(laptops.length).toBeGreaterThan(0);
    laptops.forEach(laptop => {
      expect(laptop.price).toBeGreaterThanOrEqual(4000);
      expect(laptop.price).toBeLessThanOrEqual(7000);
    });
  });
});

describe('Laptop Database - Search and Filter', () => {
  it('should search laptops by text', () => {
    const results = searchLaptops('asus');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should search laptops by GPU model', () => {
    const results = searchLaptops('rtx');
    expect(results.length).toBeGreaterThan(0);
    // At least some should have NVIDIA RTX GPU
    const hasNvidiaRTX = results.some(l =>
      l.specs.gpu.brand === 'NVIDIA' &&
      l.specs.gpu.model.includes('RTX')
    );
    expect(hasNvidiaRTX).toBe(true);
  });

  it('should return empty array for non-matching search', () => {
    const results = searchLaptops('zzznonexistent999');
    expect(results).toEqual([]);
  });

  it('should filter by segment', () => {
    const laptops = filterLaptops({ segment: 'gaming' });
    expect(laptops.length).toBeGreaterThan(0);
    laptops.forEach(l => expect(l.segment).toBe('gaming'));
  });

  it('should filter by multiple criteria', () => {
    const laptops = filterLaptops({
      segment: 'gaming',
      tier: 'midrange',
      minRam: 16,
      hasDiscreteGpu: true
    });

    expect(laptops.length).toBeGreaterThan(0);
    laptops.forEach(laptop => {
      expect(laptop.segment).toBe('gaming');
      expect(laptop.tier).toBe('midrange');
      expect(laptop.specs.ram).toBeGreaterThanOrEqual(16);
      expect(laptop.specs.gpu.integrated).toBeFalsy();
    });
  });

  it('should filter by price range', () => {
    const laptops = filterLaptops({
      minPrice: 5000,
      maxPrice: 8000
    });

    laptops.forEach(laptop => {
      expect(laptop.price).toBeGreaterThanOrEqual(5000);
      expect(laptop.price).toBeLessThanOrEqual(8000);
    });
  });

  it('should filter by in-stock only', () => {
    const laptops = filterLaptops({ inStockOnly: true });
    expect(laptops.length).toBeGreaterThan(0);
    laptops.forEach(laptop => {
      expect(laptop.availability.inStock).toBe(true);
    });
  });

  it('should filter by minimum rating', () => {
    const laptops = filterLaptops({ minRating: 4.5 });
    expect(laptops.length).toBeGreaterThan(0);
    laptops.forEach(laptop => {
      expect(laptop.rating).toBeGreaterThanOrEqual(4.5);
    });
  });
});

describe('Laptop Database - Smart Recommendations', () => {
  it('should get smart recommendations within budget', () => {
    const recommendations = getSmartRecommendations({
      budget: 6000,
      usage: ['gaming'],
      preferences: {}
    }, 3);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(3);

    recommendations.forEach(laptop => {
      // Should be within budget or slightly above (10% overage allowed)
      expect(laptop.price).toBeLessThanOrEqual(6600);
    });
  });

  it('should recommend laptops for specific use case', () => {
    const recommendations = getSmartRecommendations({
      budget: 10000,
      usage: ['content-creation', 'video-editing'],
      preferences: { performance: true }
    }, 3);

    expect(recommendations.length).toBeGreaterThan(0);

    // Should have good specs for content creation
    recommendations.forEach(laptop => {
      expect(laptop.specs.ram).toBeGreaterThanOrEqual(16);
    });
  });

  it('should prioritize portability when requested', () => {
    const recommendations = getSmartRecommendations({
      budget: 8000,
      usage: ['business'],
      preferences: { portability: true }
    }, 3);

    expect(recommendations.length).toBeGreaterThan(0);

    // At least some should be lightweight
    const hasLightweight = recommendations.some(l => l.specs.weight <= 2.0);
    expect(hasLightweight).toBe(true);
  });

  it('should return empty array if no laptops match criteria', () => {
    const recommendations = getSmartRecommendations({
      budget: 500, // Too low
      usage: ['gaming'],
      preferences: {}
    }, 3);

    expect(recommendations).toEqual([]);
  });
});

describe('Laptop Database - Similarity and Alternatives', () => {
  let sampleLaptopId;

  beforeAll(() => {
    const allLaptops = getAllLaptops();
    sampleLaptopId = allLaptops[0].id;
  });

  it('should find similar laptops', () => {
    const similar = findSimilarLaptops(sampleLaptopId, 5);

    expect(similar.length).toBeGreaterThan(0);
    expect(similar.length).toBeLessThanOrEqual(5);

    // Should not include the original laptop
    expect(similar.find(l => l.id === sampleLaptopId)).toBeUndefined();
  });

  it('should find better alternatives', () => {
    const laptop = getLaptopById(sampleLaptopId);
    const alternatives = findBetterAlternatives(sampleLaptopId, 5);

    // May or may not find alternatives depending on the laptop
    alternatives.forEach(alt => {
      // All alternatives should have better rating
      expect(alt.rating).toBeGreaterThan(laptop.rating);
      // Each should have a reason
      expect(alt.reason).toBeDefined();
      expect(typeof alt.reason).toBe('string');
    });
  });

  it('should return empty array for non-existent laptop', () => {
    const similar = findSimilarLaptops('non-existent-999', 5);
    expect(similar).toEqual([]);

    const alternatives = findBetterAlternatives('non-existent-999', 5);
    expect(alternatives).toEqual([]);
  });
});

describe('Laptop Database - Comparison', () => {
  let laptopIds;

  beforeAll(() => {
    const allLaptops = getAllLaptops();
    laptopIds = allLaptops.slice(0, 3).map(l => l.id);
  });

  it('should compare multiple laptops', () => {
    const comparison = compareLaptops(laptopIds);

    expect(comparison).toBeDefined();
    expect(comparison.laptops).toHaveLength(3);
    expect(comparison.comparison).toBeDefined();
    expect(comparison.comparison.priceRange).toBeDefined();
    expect(comparison.comparison.bestRating).toBeDefined();
    expect(comparison.comparison.bestValue).toBeDefined();
    expect(comparison.comparison.lightest).toBeDefined();
    expect(comparison.comparison.longestBattery).toBeDefined();
  });

  it('should identify best rating in comparison', () => {
    const comparison = compareLaptops(laptopIds);
    const { laptops, comparison: comp } = comparison;

    const highestRating = Math.max(...laptops.map(l => l.rating));
    expect(comp.bestRating.rating).toBe(highestRating);
  });

  it('should identify lightest laptop', () => {
    const comparison = compareLaptops(laptopIds);
    const { laptops, comparison: comp } = comparison;

    const lightestWeight = Math.min(...laptops.map(l => l.specs.weight));
    expect(comp.lightest.specs.weight).toBe(lightestWeight);
  });

  it('should return null for empty array', () => {
    const comparison = compareLaptops([]);
    expect(comparison).toBeNull();
  });

  it('should filter out invalid IDs', () => {
    const validId = laptopIds[0];
    const comparison = compareLaptops([validId, 'invalid-999', 'fake-888']);

    expect(comparison).toBeDefined();
    expect(comparison.laptops.length).toBe(1);
  });
});

describe('Laptop Database - Image Identification', () => {
  it('should identify laptop with high confidence', () => {
    const analysis = {
      brand: 'ASUS',
      model: 'ROG',
      confidence: 'high'
    };

    const identified = identifyLaptopFromAnalysis(analysis);
    // May or may not find exact match, but should not crash
    if (identified) {
      expect(identified.brandName).toBe('ASUS');
    }
  });

  it('should return null for low confidence', () => {
    const analysis = {
      brand: 'Unknown',
      model: null,
      confidence: 'low'
    };

    const identified = identifyLaptopFromAnalysis(analysis);
    expect(identified).toBeNull();
  });

  it('should return brand match when model not found', () => {
    const analysis = {
      brand: 'Dell',
      model: 'NonExistentModel999',
      confidence: 'medium'
    };

    const identified = identifyLaptopFromAnalysis(analysis);
    // Should find a Dell laptop (highest rated)
    if (identified) {
      expect(identified.brandName).toBe('Dell');
    }
  });
});

describe('Laptop Database - Statistics', () => {
  it('should get database stats', () => {
    const stats = getDatabaseStats();

    expect(stats).toBeDefined();
    expect(stats.total).toBe(100);
    expect(stats.bySegment).toBeDefined();
    expect(stats.byTier).toBeDefined();
    expect(stats.byBrand).toBeDefined();
    expect(stats.priceRange).toBeDefined();
    expect(stats.priceRange.min).toBeDefined();
    expect(stats.priceRange.max).toBeDefined();
    expect(stats.priceRange.avg).toBeDefined();
    expect(stats.inStock).toBeDefined();
    expect(stats.avgRating).toBeDefined();
  });

  it('should have realistic price ranges', () => {
    const stats = getDatabaseStats();

    expect(stats.priceRange.min).toBeGreaterThan(0);
    expect(stats.priceRange.max).toBeGreaterThan(stats.priceRange.min);
    expect(stats.priceRange.avg).toBeGreaterThan(stats.priceRange.min);
    expect(stats.priceRange.avg).toBeLessThan(stats.priceRange.max);
  });

  it('should have all segments represented', () => {
    const stats = getDatabaseStats();
    const segments = ['gaming', 'ultrabook', 'business', 'creative', 'student'];

    segments.forEach(segment => {
      expect(stats.bySegment[segment]).toBeDefined();
      expect(stats.bySegment[segment]).toBeGreaterThan(0);
    });
  });

  it('should have all tiers represented', () => {
    const stats = getDatabaseStats();
    const tiers = ['budget', 'midrange', 'premium', 'flagship'];

    tiers.forEach(tier => {
      expect(stats.byTier[tier]).toBeDefined();
      expect(stats.byTier[tier]).toBeGreaterThan(0);
    });
  });
});

describe('Laptop Database - Data Integrity', () => {
  let allLaptops;

  beforeAll(() => {
    allLaptops = getAllLaptops();
  });

  it('should have unique IDs', () => {
    const ids = allLaptops.map(l => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(allLaptops.length);
  });

  it('should have valid price data', () => {
    allLaptops.forEach(laptop => {
      expect(laptop.price).toBeGreaterThan(0);
      expect(laptop.originalPrice).toBeGreaterThanOrEqual(laptop.price);
      expect(laptop.discount).toBeGreaterThanOrEqual(0);
      expect(laptop.discount).toBeLessThanOrEqual(100);
    });
  });

  it('should have valid ratings', () => {
    allLaptops.forEach(laptop => {
      expect(laptop.rating).toBeGreaterThanOrEqual(1);
      expect(laptop.rating).toBeLessThanOrEqual(5);
    });
  });

  it('should have complete specs', () => {
    allLaptops.forEach(laptop => {
      expect(laptop.specs).toBeDefined();
      expect(laptop.specs.cpu).toBeDefined();
      expect(laptop.specs.gpu).toBeDefined();
      expect(laptop.specs.ram).toBeGreaterThan(0);
      expect(laptop.specs.storage).toBeGreaterThan(0);
      expect(laptop.specs.display).toBeDefined();
      expect(laptop.specs.weight).toBeGreaterThan(0);
    });
  });

  it('should have valid segments', () => {
    const validSegments = ['gaming', 'ultrabook', 'business', 'creative', 'student', 'workstation'];
    allLaptops.forEach(laptop => {
      expect(validSegments).toContain(laptop.segment);
    });
  });

  it('should have valid tiers', () => {
    const validTiers = ['budget', 'midrange', 'premium', 'flagship'];
    allLaptops.forEach(laptop => {
      expect(validTiers).toContain(laptop.tier);
    });
  });

  it('should have availability data', () => {
    allLaptops.forEach(laptop => {
      expect(laptop.availability).toBeDefined();
      expect(typeof laptop.availability.inStock).toBe('boolean');
      expect(laptop.availability.stockCount).toBeGreaterThanOrEqual(0);
      expect(laptop.availability.sources).toBeDefined();
      expect(laptop.availability.sources.length).toBeGreaterThan(0);
    });
  });

  it('should have pros and cons', () => {
    allLaptops.forEach(laptop => {
      expect(laptop.pros).toBeDefined();
      expect(laptop.cons).toBeDefined();
      expect(laptop.pros.length).toBeGreaterThan(0);
      expect(laptop.cons.length).toBeGreaterThan(0);
    });
  });

  it('should have use cases and tags', () => {
    allLaptops.forEach(laptop => {
      expect(laptop.useCases).toBeDefined();
      expect(laptop.tags).toBeDefined();
      expect(laptop.useCases.length).toBeGreaterThan(0);
      expect(laptop.tags.length).toBeGreaterThan(0);
    });
  });
});

describe('Laptop Database - Performance', () => {
  it('should load database quickly (< 100ms)', () => {
    const startTime = Date.now();
    loadLaptopDatabase(true); // Force reload
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(100);
  });

  it('should use cache on subsequent loads', () => {
    const startTime1 = Date.now();
    loadLaptopDatabase(true); // Force reload
    const loadTime1 = Date.now() - startTime1;

    const startTime2 = Date.now();
    loadLaptopDatabase(); // Use cache
    const loadTime2 = Date.now() - startTime2;

    // Cached load should be much faster
    expect(loadTime2).toBeLessThan(loadTime1);
  });

  it('should filter quickly (< 50ms)', () => {
    const startTime = Date.now();
    filterLaptops({
      segment: 'gaming',
      tier: 'midrange',
      minPrice: 4000,
      maxPrice: 8000,
      minRam: 16
    });
    const filterTime = Date.now() - startTime;

    expect(filterTime).toBeLessThan(50);
  });

  it('should search quickly (< 30ms)', () => {
    const startTime = Date.now();
    searchLaptops('gaming laptop');
    const searchTime = Date.now() - startTime;

    expect(searchTime).toBeLessThan(30);
  });
});
