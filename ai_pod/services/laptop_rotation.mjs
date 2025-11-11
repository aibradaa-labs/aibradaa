/**
 * LAPTOP DATABASE AUTO-ROTATION SYSTEM
 * Maintains database at maximum 100 entries with automatic quality-based rotation
 *
 * Features:
 * - Score-based rotation (keeps top 100 by composite score)
 * - Automatic archiving of removed laptops
 * - Age bonus (newer laptops get slight boost)
 * - Popularity bonus (highly viewed/compared laptops get boost)
 * - Minimum score threshold enforcement
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
// ROTATION FUNCTIONS
// ============================================================================

/**
 * Calculate adjusted score with bonuses
 */
function calculateAdjustedScore(laptop) {
  const baseScore = laptop.scoring.composite;
  let adjustedScore = baseScore;

  // Age bonus (0-0.5 points for laptops < 12 months old)
  const launchDate = new Date(laptop.lastUpdated || laptop.releaseDate || '2024-01-01');
  const now = new Date();
  const monthsSinceLaunch = (now - launchDate) / (1000 * 60 * 60 * 24 * 30);

  if (monthsSinceLaunch <= 12) {
    const ageBonus = ROTATION_CONFIG.laptops.scoreRotation.ageBonus * (1 - monthsSinceLaunch / 12);
    adjustedScore += ageBonus;
  }

  // Popularity bonus (based on views, comparisons, favorites)
  if (laptop.metadata) {
    const popularityScore =
      (laptop.metadata.views || 0) * 0.0001 +
      (laptop.metadata.comparisons || 0) * 0.0005 +
      (laptop.metadata.favorites || 0) * 0.001 +
      (laptop.metadata.clicks || 0) * 0.0003;

    const popularityBonus = Math.min(popularityScore, ROTATION_CONFIG.laptops.scoreRotation.popularityBonus);
    adjustedScore += popularityBonus;
  }

  return parseFloat(adjustedScore.toFixed(2));
}

/**
 * Rotate laptop database to keep top N entries
 */
export async function rotateLaptopDatabase(maxEntries = 100, minScore = 7.5) {
  console.log('🔄 [Rotation] Starting laptop database rotation...');

  // Read current database
  const laptopsFile = join(DATA_DIR, 'laptops.json');
  const data = JSON.parse(await fs.readFile(laptopsFile, 'utf-8'));

  console.log(`📊 [Rotation] Current entries: ${data.laptops.length}`);

  // Score all laptops
  console.log('🧮 [Rotation] Calculating composite scores...');
  const scoredLaptops = await scoreAllLaptops(data.laptops);

  // Calculate adjusted scores with bonuses
  const adjustedLaptops = scoredLaptops.map(laptop => ({
    ...laptop,
    scoring: {
      ...laptop.scoring,
      adjusted: calculateAdjustedScore(laptop),
    },
  }));

  // Sort by adjusted score
  adjustedLaptops.sort((a, b) => b.scoring.adjusted - a.scoring.adjusted);

  // Filter by minimum score
  const qualifiedLaptops = adjustedLaptops.filter(
    laptop => laptop.scoring.composite >= minScore,
  );

  console.log(`✅ [Rotation] Qualified laptops (score ≥${minScore}): ${qualifiedLaptops.length}`);

  // Keep top N
  const keptLaptops = qualifiedLaptops.slice(0, maxEntries);
  const removedLaptops = adjustedLaptops.slice(maxEntries);

  console.log(`📋 [Rotation] Keeping top ${keptLaptops.length} laptops`);
  console.log(`🗑️  [Rotation] Removing ${removedLaptops.length} laptops`);

  // Archive removed laptops
  if (removedLaptops.length > 0 && ROTATION_CONFIG.laptops.archive.enabled) {
    await archiveRemovedLaptops(removedLaptops);
  }

  // Update database
  data.laptops = keptLaptops;
  data.catalog.totalLaptops = keptLaptops.length;
  data.catalog.lastUpdated = new Date().toISOString();
  data.catalog.notes = `Auto-rotated to top ${maxEntries} entries (min score: ${minScore}) on ${new Date().toISOString()}`;

  // Save updated database
  await fs.writeFile(laptopsFile, JSON.stringify(data, null, 2));

  console.log('✅ [Rotation] Database rotation completed successfully');

  return {
    kept: keptLaptops.length,
    removed: removedLaptops.length,
    minScore,
    maxEntries,
    topScore: keptLaptops[0]?.scoring.composite,
    lowestKeptScore: keptLaptops[keptLaptops.length - 1]?.scoring.composite,
  };
}

/**
 * Archive removed laptops
 */
async function archiveRemovedLaptops(laptops) {
  const archiveFile = join(DATA_DIR, 'archive.json');

  // Read existing archive
  let archive;
  try {
    archive = JSON.parse(await fs.readFile(archiveFile, 'utf-8'));
  } catch (error) {
    // Create new archive if doesn't exist
    archive = {
      metadata: {
        created: new Date().toISOString(),
        totalArchived: 0,
      },
      laptops: [],
    };
  }

  // Add removal metadata to each laptop
  const archivedLaptops = laptops.map(laptop => ({
    ...laptop,
    archivedAt: new Date().toISOString(),
    archivedReason: 'Rotated out (score-based)',
    archivedScore: laptop.scoring.composite,
  }));

  // Append to archive
  archive.laptops.push(...archivedLaptops);
  archive.metadata.totalArchived = archive.laptops.length;
  archive.metadata.lastUpdated = new Date().toISOString();

  // Retention policy (keep only recent archives if configured)
  if (ROTATION_CONFIG.laptops.archive.retentionDays) {
    const retentionMs = ROTATION_CONFIG.laptops.archive.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);

    archive.laptops = archive.laptops.filter(laptop => {
      const archivedDate = new Date(laptop.archivedAt);
      return archivedDate >= cutoffDate;
    });

    archive.metadata.totalArchived = archive.laptops.length;
  }

  // Save archive
  await fs.writeFile(archiveFile, JSON.stringify(archive, null, 2));

  console.log(`📦 [Rotation] Archived ${archivedLaptops.length} laptops to ${archiveFile}`);
}

/**
 * Get rotation statistics
 */
export async function getRotationStats() {
  const laptopsFile = join(DATA_DIR, 'laptops.json');
  const data = JSON.parse(await fs.readFile(laptopsFile, 'utf-8'));

  const scoredLaptops = await scoreAllLaptops(data.laptops);

  const stats = {
    totalLaptops: scoredLaptops.length,
    maxAllowed: ROTATION_CONFIG.laptops.maxEntries,
    minScoreThreshold: ROTATION_CONFIG.laptops.scoreRotation.minScoreThreshold,
    scores: {
      highest: scoredLaptops[0]?.scoring.composite,
      lowest: scoredLaptops[scoredLaptops.length - 1]?.scoring.composite,
      average: (scoredLaptops.reduce((sum, l) => sum + l.scoring.composite, 0) / scoredLaptops.length).toFixed(2),
    },
    belowThreshold: scoredLaptops.filter(l => l.scoring.composite < ROTATION_CONFIG.laptops.scoreRotation.minScoreThreshold).length,
    needsRotation: scoredLaptops.length > ROTATION_CONFIG.laptops.maxEntries,
  };

  return stats;
}

/**
 * Validate database integrity
 */
export async function validateDatabaseIntegrity() {
  const laptopsFile = join(DATA_DIR, 'laptops.json');
  const data = JSON.parse(await fs.readFile(laptopsFile, 'utf-8'));

  const issues = [];

  // Check for duplicates
  const ids = data.laptops.map(l => l.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    issues.push({ type: 'duplicate_ids', count: duplicateIds.length, ids: duplicateIds });
  }

  // Check for missing required fields
  data.laptops.forEach((laptop, index) => {
    const required = ['id', 'brand', 'model', 'price', 'specs'];
    const missing = required.filter(field => !laptop[field]);
    if (missing.length > 0) {
      issues.push({ type: 'missing_fields', index, id: laptop.id, missing });
    }
  });

  // Check for outdated entries (>2 years old)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const outdated = data.laptops.filter(laptop => {
    const launchDate = new Date(laptop.lastUpdated || laptop.releaseDate || '2024-01-01');
    return launchDate < twoYearsAgo;
  });

  if (outdated.length > 0) {
    issues.push({ type: 'outdated_entries', count: outdated.length });
  }

  return {
    valid: issues.length === 0,
    issues,
    totalLaptops: data.laptops.length,
  };
}

export default {
  rotateLaptopDatabase,
  getRotationStats,
  validateDatabaseIntegrity,
};
