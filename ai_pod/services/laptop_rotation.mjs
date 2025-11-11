/**
 * LAPTOP DATABASE ROTATION SYSTEM - GROWING CATALOG
 * CRITICAL: Database GROWS over time - laptops are NEVER deleted
 *
 * Strategy:
 * - Featured Catalog (data/laptops.json): Top 100 scored laptops (shortlisted)
 * - Extended Catalog (data/laptops-extended.json): All other laptops (still accessible)
 * - Full Catalog (data/laptops-full.json): Complete database (featured + extended)
 *
 * Features:
 * - Score-based featured list (top 100 by composite score)
 * - Laptops moved to extended catalog remain accessible to AI Bradaa
 * - Database grows infinitely - NEVER deletes any laptop
 * - Age bonus (newer laptops get slight boost)
 * - Popularity bonus (highly viewed/compared laptops get boost)
 * - Full catalog rebuilt after each rotation
 *
 * @module ai_pod/services/laptop_rotation
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ROTATION_CONFIG } from '../config.mjs';
import { scoreAllLaptops } from './laptop_scoring.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', 'data');

// ============================================================================
// FILE PATHS
// ============================================================================

const FEATURED_FILE = join(DATA_DIR, 'laptops.json');
const EXTENDED_FILE = join(DATA_DIR, 'laptops-extended.json');
const FULL_CATALOG_FILE = join(DATA_DIR, 'laptops-full.json');
const ARCHIVE_FILE = join(DATA_DIR, 'archive.json');

// ============================================================================
// ROTATION FUNCTIONS
// ============================================================================

/**
 * Calculate adjusted score with bonuses
 */
function calculateAdjustedScore(laptop) {
  const baseScore = laptop.scoring.composite;
  let adjustedScore = baseScore;

  // Age bonus (0-0.1 points for laptops < 12 months old)
  const launchDate = new Date(laptop.lastUpdated || laptop.releaseDate || '2024-01-01');
  const now = new Date();
  const monthsSinceLaunch = (now - launchDate) / (1000 * 60 * 60 * 24 * 30);

  if (monthsSinceLaunch <= 12) {
    const ageBonus = ROTATION_CONFIG.laptops.featuredCriteria.ageBonus * (1 - monthsSinceLaunch / 12);
    adjustedScore += ageBonus;
  }

  // Popularity bonus (based on views, comparisons, favorites)
  if (laptop.metadata) {
    const popularityScore =
      (laptop.metadata.views || 0) * 0.0001 +
      (laptop.metadata.comparisons || 0) * 0.0005 +
      (laptop.metadata.favorites || 0) * 0.001 +
      (laptop.metadata.clicks || 0) * 0.0003;

    const popularityBonus = Math.min(popularityScore, ROTATION_CONFIG.laptops.featuredCriteria.popularityBonus);
    adjustedScore += popularityBonus;
  }

  return parseFloat(adjustedScore.toFixed(2));
}

/**
 * Rotate laptop database - NEVER delete, only reorganize
 * Featured (top 100) vs Extended (all others)
 */
export async function rotateLaptopDatabase(featuredCount = 100, minScore = 7.5) {
  console.log('🔄 [Rotation] Starting laptop database rotation (GROWING CATALOG)...');
  console.log('⚠️  [Rotation] CRITICAL: Laptops are NEVER deleted, database grows over time');

  // Read all existing catalogs
  const featured = await readFeaturedCatalog();
  const extended = await readExtendedCatalog();

  // Combine all laptops (featured + extended)
  const allLaptops = [...featured.laptops, ...extended.laptops];
  console.log(`📊 [Rotation] Total laptops in database: ${allLaptops.length}`);
  console.log(`   - Featured: ${featured.laptops.length}`);
  console.log(`   - Extended: ${extended.laptops.length}`);

  // Remove duplicates by ID (keep the one with latest update)
  const uniqueLaptops = deduplicateLaptops(allLaptops);
  console.log(`🔍 [Rotation] After deduplication: ${uniqueLaptops.length} unique laptops`);

  // Score all laptops
  console.log('🧮 [Rotation] Calculating composite scores for all laptops...');
  const scoredLaptops = await scoreAllLaptops(uniqueLaptops);

  // Calculate adjusted scores with bonuses
  const adjustedLaptops = scoredLaptops.map(laptop => ({
    ...laptop,
    scoring: {
      ...laptop.scoring,
      adjusted: calculateAdjustedScore(laptop),
    },
  }));

  // Sort by adjusted score (descending)
  adjustedLaptops.sort((a, b) => b.scoring.adjusted - a.scoring.adjusted);

  // Split into featured (top N) and extended (rest)
  const newFeatured = adjustedLaptops.slice(0, featuredCount);
  const newExtended = adjustedLaptops.slice(featuredCount);

  console.log(`📋 [Rotation] New distribution:`);
  console.log(`   - Featured (top ${featuredCount}): ${newFeatured.length} laptops`);
  console.log(`   - Extended (catalog): ${newExtended.length} laptops`);
  console.log(`   - Total database: ${adjustedLaptops.length} laptops ✅ GROWING`);

  // Track movements (for analytics)
  const movements = trackMovements(featured.laptops, extended.laptops, newFeatured, newExtended);
  console.log(`📦 [Rotation] Movements:`);
  console.log(`   - Promoted to featured: ${movements.promoted} laptops`);
  console.log(`   - Moved to extended: ${movements.demoted} laptops`);
  console.log(`   - Remained in featured: ${movements.remainedFeatured} laptops`);
  console.log(`   - Remained in extended: ${movements.remainedExtended} laptops`);

  // Save featured catalog
  await saveFeaturedCatalog(newFeatured);

  // Save extended catalog
  await saveExtendedCatalog(newExtended);

  // Rebuild full catalog
  await rebuildFullCatalog(newFeatured, newExtended);

  // Archive movements
  if (ROTATION_CONFIG.laptops.archive.trackMovements) {
    await archiveMovements(movements, adjustedLaptops.length);
  }

  console.log('✅ [Rotation] Database rotation completed successfully');
  console.log(`📈 [Rotation] Database is GROWING: ${adjustedLaptops.length} total laptops`);

  return {
    featured: newFeatured.length,
    extended: newExtended.length,
    total: adjustedLaptops.length,
    movements,
    topScore: newFeatured[0]?.scoring.composite,
    lowestFeaturedScore: newFeatured[newFeatured.length - 1]?.scoring.composite,
  };
}

/**
 * Read featured catalog (laptops.json)
 */
async function readFeaturedCatalog() {
  try {
    const data = JSON.parse(await fs.readFile(FEATURED_FILE, 'utf-8'));
    return data;
  } catch (error) {
    console.log('⚠️  [Rotation] Featured catalog not found, creating new...');
    return {
      catalog: {
        version: '2.0.0',
        type: 'featured',
        description: 'Top 100 shortlisted laptops for main recommendations',
        lastUpdated: new Date().toISOString(),
        totalLaptops: 0,
      },
      laptops: [],
    };
  }
}

/**
 * Read extended catalog (laptops-extended.json)
 */
async function readExtendedCatalog() {
  try {
    const data = JSON.parse(await fs.readFile(EXTENDED_FILE, 'utf-8'));
    return data;
  } catch (error) {
    console.log('⚠️  [Rotation] Extended catalog not found, creating new...');
    return {
      catalog: {
        version: '2.0.0',
        type: 'extended',
        description: 'Extended laptop catalog - all laptops accessible by AI Bradaa based on relevance',
        lastUpdated: new Date().toISOString(),
        totalLaptops: 0,
      },
      laptops: [],
    };
  }
}

/**
 * Deduplicate laptops by ID (keep the one with latest update)
 */
function deduplicateLaptops(laptops) {
  const laptopMap = new Map();

  laptops.forEach(laptop => {
    const existing = laptopMap.get(laptop.id);

    if (!existing) {
      laptopMap.set(laptop.id, laptop);
    } else {
      // Keep the one with latest update
      const existingDate = new Date(existing.lastUpdated || existing.updatedAt || '2020-01-01');
      const currentDate = new Date(laptop.lastUpdated || laptop.updatedAt || '2020-01-01');

      if (currentDate > existingDate) {
        laptopMap.set(laptop.id, laptop);
      }
    }
  });

  return Array.from(laptopMap.values());
}

/**
 * Track movements between catalogs
 */
function trackMovements(oldFeatured, oldExtended, newFeatured, newExtended) {
  const oldFeaturedIds = new Set(oldFeatured.map(l => l.id));
  const oldExtendedIds = new Set(oldExtended.map(l => l.id));
  const newFeaturedIds = new Set(newFeatured.map(l => l.id));
  const newExtendedIds = new Set(newExtended.map(l => l.id));

  const promoted = [];
  const demoted = [];

  // Find promoted (from extended to featured)
  newFeaturedIds.forEach(id => {
    if (oldExtendedIds.has(id)) {
      promoted.push(id);
    }
  });

  // Find demoted (from featured to extended)
  newExtendedIds.forEach(id => {
    if (oldFeaturedIds.has(id)) {
      demoted.push(id);
    }
  });

  const remainedFeatured = newFeatured.filter(l => oldFeaturedIds.has(l.id)).length;
  const remainedExtended = newExtended.filter(l => oldExtendedIds.has(l.id)).length;

  return {
    promoted: promoted.length,
    demoted: demoted.length,
    remainedFeatured,
    remainedExtended,
    promotedIds: promoted,
    demotedIds: demoted,
  };
}

/**
 * Save featured catalog
 */
async function saveFeaturedCatalog(laptops) {
  const data = {
    catalog: {
      version: '2.0.0',
      type: 'featured',
      description: 'Top 100 shortlisted laptops for main recommendations',
      lastUpdated: new Date().toISOString(),
      totalLaptops: laptops.length,
      currency: 'MYR',
      market: 'Malaysia',
      rotationStrategy: 'score-based-featured',
      notes: 'This is the FEATURED catalog. Extended catalog available in laptops-extended.json',
    },
    laptops,
  };

  await fs.writeFile(FEATURED_FILE, JSON.stringify(data, null, 2));
  console.log(`✅ [Rotation] Featured catalog saved: ${laptops.length} laptops`);
}

/**
 * Save extended catalog
 */
async function saveExtendedCatalog(laptops) {
  const data = {
    catalog: {
      version: '2.0.0',
      type: 'extended',
      description: 'Extended laptop catalog - all laptops accessible by AI Bradaa based on relevance',
      lastUpdated: new Date().toISOString(),
      totalLaptops: laptops.length,
      currency: 'MYR',
      market: 'Malaysia',
      notes: 'These laptops are NOT deleted - they remain accessible to AI Bradaa for relevance-based recommendations',
      aiAccessible: true,
      keepForever: true,
    },
    laptops,
  };

  await fs.writeFile(EXTENDED_FILE, JSON.stringify(data, null, 2));
  console.log(`✅ [Rotation] Extended catalog saved: ${laptops.length} laptops`);
}

/**
 * Rebuild full catalog (featured + extended)
 */
async function rebuildFullCatalog(featured, extended) {
  const data = {
    catalog: {
      version: '2.0.0',
      type: 'full',
      description: 'Complete laptop database - Featured + Extended',
      lastUpdated: new Date().toISOString(),
      totalLaptops: featured.length + extended.length,
      featuredCount: featured.length,
      extendedCount: extended.length,
      currency: 'MYR',
      market: 'Malaysia',
      notes: 'This catalog GROWS over time - laptops are NEVER deleted',
    },
    featured: {
      count: featured.length,
      description: 'Top 100 shortlisted laptops',
      laptops: featured,
    },
    extended: {
      count: extended.length,
      description: 'Extended catalog - accessible by AI Bradaa',
      laptops: extended,
    },
  };

  await fs.writeFile(FULL_CATALOG_FILE, JSON.stringify(data, null, 2));
  console.log(`✅ [Rotation] Full catalog rebuilt: ${data.catalog.totalLaptops} total laptops`);
}

/**
 * Archive movements (track rotations over time)
 */
async function archiveMovements(movements, totalLaptops) {
  let archive;
  try {
    archive = JSON.parse(await fs.readFile(ARCHIVE_FILE, 'utf-8'));
  } catch (error) {
    archive = {
      metadata: {
        created: new Date().toISOString(),
        description: 'Historical tracking of laptop catalog rotations',
        totalRotations: 0,
      },
      rotations: [],
    };
  }

  // Add rotation entry
  archive.rotations.push({
    timestamp: new Date().toISOString(),
    totalLaptops,
    promoted: movements.promoted,
    demoted: movements.demoted,
    promotedIds: movements.promotedIds,
    demotedIds: movements.demotedIds,
  });

  archive.metadata.totalRotations = archive.rotations.length;
  archive.metadata.lastRotation = new Date().toISOString();

  await fs.writeFile(ARCHIVE_FILE, JSON.stringify(archive, null, 2));
  console.log(`📦 [Rotation] Movements archived: ${archive.rotations.length} total rotations tracked`);
}

/**
 * Get rotation statistics
 */
export async function getRotationStats() {
  const featured = await readFeaturedCatalog();
  const extended = await readExtendedCatalog();

  const allLaptops = [...featured.laptops, ...extended.laptops];
  const scoredLaptops = await scoreAllLaptops(allLaptops);

  const stats = {
    featured: featured.laptops.length,
    extended: extended.laptops.length,
    total: allLaptops.length,
    maxFeatured: ROTATION_CONFIG.laptops.featuredCount,
    minScoreThreshold: ROTATION_CONFIG.laptops.featuredCriteria.minScoreThreshold,
    scores: {
      highest: scoredLaptops[0]?.scoring.composite,
      lowest: scoredLaptops[scoredLaptops.length - 1]?.scoring.composite,
      average: (scoredLaptops.reduce((sum, l) => sum + l.scoring.composite, 0) / scoredLaptops.length).toFixed(2),
    },
    growth: {
      total: allLaptops.length,
      strategy: 'NEVER DELETE - Database grows over time',
    },
  };

  return stats;
}

/**
 * Validate database integrity
 */
export async function validateDatabaseIntegrity() {
  const featured = await readFeaturedCatalog();
  const extended = await readExtendedCatalog();
  const allLaptops = [...featured.laptops, ...extended.laptops];

  const issues = [];

  // Check for duplicates across both catalogs
  const ids = allLaptops.map(l => l.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    issues.push({ type: 'duplicate_ids', count: duplicateIds.length, ids: [...new Set(duplicateIds)] });
  }

  // Check for missing required fields
  allLaptops.forEach((laptop, index) => {
    const required = ['id', 'brand', 'model', 'price', 'specs'];
    const missing = required.filter(field => !laptop[field]);
    if (missing.length > 0) {
      issues.push({ type: 'missing_fields', index, id: laptop.id, missing });
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    totalLaptops: allLaptops.length,
    featured: featured.laptops.length,
    extended: extended.laptops.length,
  };
}

export default {
  rotateLaptopDatabase,
  getRotationStats,
  validateDatabaseIntegrity,
};
