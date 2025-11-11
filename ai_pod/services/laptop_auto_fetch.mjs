/**
 * LAPTOP AUTO-FETCH SERVICE
 * Weekly automated fetching of latest laptops from Malaysian retailers
 *
 * Features:
 * - Fetches from Lazada Malaysia & Shopee Malaysia
 * - Gemini AI spec enrichment
 * - Launch date filtering (≥1 year from production)
 * - Hardware compatibility validation (4+ years)
 * - Price tracking and review sentiment analysis
 * - Auto-integration with rotation system
 *
 * Schedule: Weekly Sunday at 2 AM MYT (via Netlify scheduled function)
 *
 * @module ai_pod/services/laptop_auto_fetch
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { AUTO_FETCH_CONFIG } from '../config.mjs';
import { calculateCompositeScore } from './laptop_scoring.mjs';
import { rotateLaptopDatabase } from './laptop_rotation.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', 'data');

// ============================================================================
// FETCH CONFIGURATION
// ============================================================================

const LAZADA_CONFIG = {
  baseUrl: 'https://www.lazada.com.my',
  categories: [
    '/shop-laptops/',
    '/gaming-laptops/',
    '/business-laptops/',
    '/ultrabooks/',
  ],
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
};

const SHOPEE_CONFIG = {
  baseUrl: 'https://shopee.com.my',
  categories: [
    '/Laptops-cat.11043248',
    '/Gaming-Laptops-cat.11043248.11045024',
  ],
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse launch date and validate it's within 1 year
 */
function validateLaunchDate(dateString) {
  if (!dateString) return false;

  const launchDate = new Date(dateString);
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  return launchDate >= oneYearAgo;
}

/**
 * Validate hardware compatibility for 4+ years
 */
function validateFutureCompatibility(laptop) {
  let score = 0;

  // Wi-Fi 6E/7
  if (laptop.specs?.connectivity?.wifi === 'Wi-Fi 7') score += 2;
  else if (laptop.specs?.connectivity?.wifi === 'Wi-Fi 6E') score += 1.5;
  else if (laptop.specs?.connectivity?.wifi === 'Wi-Fi 6') score += 1;

  // Thunderbolt 4
  if (laptop.specs?.ports?.thunderbolt >= 1) score += 1.5;

  // DDR5 RAM
  if (laptop.specs?.ramType === 'DDR5' || laptop.specs?.ramType === 'LPDDR5X') score += 1;

  // USB-C
  if (laptop.specs?.ports?.['usb-c'] >= 2) score += 1;

  // PCIe 4.0/5.0 SSD
  if (laptop.specs?.storageType?.includes('PCIe 4.0') || laptop.specs?.storageType?.includes('PCIe 5.0')) score += 0.5;

  // Minimum score of 4 for 4+ year compatibility
  return score >= 4;
}

/**
 * Extract specs from product HTML/API response
 * (Placeholder - actual implementation requires scraping or API integration)
 */
async function extractLaptopSpecs(productData) {
  // TODO: Implement actual scraping/API logic for Lazada/Shopee
  // For now, return a template structure

  return {
    id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    brand: productData.brand || 'unknown',
    brandName: productData.brandName || productData.brand || 'Unknown',
    model: productData.model || 'Unknown Model',
    fullName: productData.fullName || `${productData.brand} ${productData.model}`,
    sku: productData.sku || `AUTO-${Date.now()}`,
    segment: productData.segment || 'general',
    tier: productData.tier || 'midrange',
    price: productData.price || 0,
    originalPrice: productData.originalPrice || productData.price,
    discount: productData.discount || 0,
    rating: productData.rating || 4.0,
    specs: {
      cpu: productData.specs?.cpu || {},
      gpu: productData.specs?.gpu || {},
      ram: productData.specs?.ram || 16,
      ramType: productData.specs?.ramType || 'DDR5',
      storage: productData.specs?.storage || 512,
      storageType: productData.specs?.storageType || 'NVMe SSD',
      display: productData.specs?.display || {},
      battery: productData.specs?.battery || 60,
      batteryLife: productData.specs?.batteryLife || 8,
      weight: productData.specs?.weight || 2.0,
      thickness: productData.specs?.thickness || 20,
      ports: productData.specs?.ports || {},
      connectivity: productData.specs?.connectivity || {},
      keyboard: productData.specs?.keyboard || {},
      webcam: productData.specs?.webcam || '720p HD',
      audio: productData.specs?.audio || '2x speakers',
    },
    description: productData.description || '',
    availability: productData.availability || 'in_stock',
    url: productData.url || '',
    lastUpdated: new Date().toISOString(),
    source: productData.source || 'auto-fetch',
    metadata: {
      views: 0,
      comparisons: 0,
      favorites: 0,
      clicks: 0,
    },
  };
}

/**
 * Enrich laptop specs using Gemini AI
 * (Placeholder - requires Gemini API integration)
 */
async function enrichWithGemini(laptop) {
  // TODO: Implement Gemini AI enrichment
  // - Fill missing specs
  // - Validate existing specs
  // - Add detailed descriptions
  // - Sentiment analysis of reviews

  console.log(`📝 [Auto-Fetch] Gemini enrichment for ${laptop.id} (placeholder)`);

  return laptop;
}

/**
 * Fetch price tracking data
 */
async function fetchPriceHistory(laptop) {
  // TODO: Implement price tracking
  // - Historical prices
  // - Price drops
  // - Best time to buy

  console.log(`💰 [Auto-Fetch] Price tracking for ${laptop.id} (placeholder)`);

  return {
    current: laptop.price,
    history: [],
    lowestPrice: laptop.price,
    highestPrice: laptop.originalPrice,
  };
}

// ============================================================================
// MAIN FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch laptops from Lazada Malaysia
 */
export async function fetchFromLazada() {
  console.log('🛒 [Auto-Fetch] Fetching from Lazada Malaysia...');

  const laptops = [];

  // TODO: Implement actual Lazada scraping/API
  // For now, return empty array with placeholder message

  console.log('⚠️  [Auto-Fetch] Lazada integration not yet implemented (placeholder)');
  console.log('   Implementation requires:');
  console.log('   - Lazada API integration OR web scraping');
  console.log('   - Product search and filtering');
  console.log('   - Spec extraction from product pages');

  return laptops;
}

/**
 * Fetch laptops from Shopee Malaysia
 */
export async function fetchFromShopee() {
  console.log('🛒 [Auto-Fetch] Fetching from Shopee Malaysia...');

  const laptops = [];

  // TODO: Implement actual Shopee scraping/API
  // For now, return empty array with placeholder message

  console.log('⚠️  [Auto-Fetch] Shopee integration not yet implemented (placeholder)');
  console.log('   Implementation requires:');
  console.log('   - Shopee API integration OR web scraping');
  console.log('   - Product search and filtering');
  console.log('   - Spec extraction from product pages');

  return laptops;
}

/**
 * Main auto-fetch function - runs weekly
 */
export async function runAutoFetch() {
  console.log('🚀 [Auto-Fetch] Starting weekly laptop auto-fetch...');
  console.log(`⏰ [Auto-Fetch] Timestamp: ${new Date().toISOString()}`);

  const config = AUTO_FETCH_CONFIG.laptops;

  if (!config.enabled) {
    console.log('⚠️  [Auto-Fetch] Auto-fetch is disabled in config');
    return {
      success: false,
      message: 'Auto-fetch disabled',
    };
  }

  const stats = {
    fetched: 0,
    enriched: 0,
    validated: 0,
    added: 0,
    rejected: 0,
    errors: [],
  };

  try {
    // Fetch from all sources
    const lazadaLaptops = await fetchFromLazada();
    const shopeeLaptops = await fetchFromShopee();

    const allFetched = [...lazadaLaptops, ...shopeeLaptops];
    stats.fetched = allFetched.length;

    console.log(`📊 [Auto-Fetch] Fetched ${stats.fetched} laptops from all sources`);

    if (stats.fetched === 0) {
      console.log('⚠️  [Auto-Fetch] No laptops fetched (sources not implemented)');
      return {
        success: true,
        message: 'Auto-fetch completed (placeholder)',
        stats,
      };
    }

    // Read current database
    const featuredFile = join(DATA_DIR, 'laptops.json');
    let currentDb;
    try {
      currentDb = JSON.parse(await fs.readFile(featuredFile, 'utf-8'));
    } catch (error) {
      currentDb = {
        catalog: {
          version: '2.0.0',
          type: 'featured',
          lastUpdated: new Date().toISOString(),
          totalLaptops: 0,
        },
        laptops: [],
      };
    }

    // Process each fetched laptop
    for (const rawLaptop of allFetched) {
      try {
        // Extract specs
        let laptop = await extractLaptopSpecs(rawLaptop);

        // Validate launch date (≥1 year from production)
        if (config.filters.minLaunchDate) {
          if (!validateLaunchDate(laptop.releaseDate || laptop.lastUpdated)) {
            console.log(`⏭️  [Auto-Fetch] Rejected ${laptop.id}: Too old (>1 year)`);
            stats.rejected++;
            continue;
          }
        }

        // Validate future compatibility (4+ years)
        if (config.filters.compatibilityYears) {
          if (!validateFutureCompatibility(laptop)) {
            console.log(`⏭️  [Auto-Fetch] Rejected ${laptop.id}: Insufficient future compatibility`);
            stats.rejected++;
            continue;
          }
        }

        stats.validated++;

        // Enrich with Gemini AI
        if (config.enrichment.geminiSpecs) {
          laptop = await enrichWithGemini(laptop);
          stats.enriched++;
        }

        // Price tracking
        if (config.enrichment.priceTracking) {
          laptop.priceHistory = await fetchPriceHistory(laptop);
        }

        // Calculate composite score
        const scoring = calculateCompositeScore(laptop);
        laptop.scoring = {
          composite: scoring.composite,
          ...scoring.breakdown,
          lastScored: new Date().toISOString(),
        };

        // Check minimum score
        if (laptop.scoring.composite < config.minScore) {
          console.log(`⏭️  [Auto-Fetch] Rejected ${laptop.id}: Score too low (${laptop.scoring.composite} < ${config.minScore})`);
          stats.rejected++;
          continue;
        }

        // Check for duplicates
        const existing = currentDb.laptops.find(l => l.id === laptop.id || l.sku === laptop.sku);
        if (existing) {
          console.log(`⏭️  [Auto-Fetch] Skipped ${laptop.id}: Already in database`);
          continue;
        }

        // Add to database
        currentDb.laptops.push(laptop);
        stats.added++;

        console.log(`✅ [Auto-Fetch] Added ${laptop.id}: ${laptop.fullName} (score: ${laptop.scoring.composite})`);

      } catch (error) {
        console.error(`❌ [Auto-Fetch] Error processing laptop:`, error);
        stats.errors.push(error.message);
      }
    }

    // Save updated database
    currentDb.catalog.totalLaptops = currentDb.laptops.length;
    currentDb.catalog.lastUpdated = new Date().toISOString();
    await fs.writeFile(featuredFile, JSON.stringify(currentDb, null, 2));

    console.log(`💾 [Auto-Fetch] Database updated: ${currentDb.laptops.length} total laptops`);

    // Run rotation to reorganize featured/extended
    if (stats.added > 0) {
      console.log('🔄 [Auto-Fetch] Running rotation to reorganize catalogs...');
      await rotateLaptopDatabase(config.featuredCount, config.minScore);
    }

    console.log('✅ [Auto-Fetch] Weekly auto-fetch completed successfully');

    return {
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ [Auto-Fetch] Fatal error:', error);
    return {
      success: false,
      error: error.message,
      stats,
    };
  }
}

/**
 * Get auto-fetch statistics
 */
export async function getAutoFetchStats() {
  // TODO: Implement stats tracking
  // - Fetch history
  // - Success rate
  // - Average laptops per fetch
  // - Source breakdown

  return {
    lastRun: null,
    totalFetches: 0,
    totalLaptopsAdded: 0,
    successRate: 0,
  };
}

export default {
  runAutoFetch,
  fetchFromLazada,
  fetchFromShopee,
  getAutoFetchStats,
};
