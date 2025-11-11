/**
 * LAPTOP BENCHMARKING & SCORING SYSTEM
 * World-class scoring algorithm for laptop evaluation
 *
 * Scores laptops across 8 dimensions:
 * 1. Performance (CPU/GPU benchmarks)
 * 2. Value (price-to-performance ratio)
 * 3. Build Quality (materials, durability)
 * 4. Display Quality (resolution, color accuracy, refresh rate)
 * 5. Battery Life (real-world usage hours)
 * 6. Portability (weight, thickness)
 * 7. Upgradeability (RAM/storage expansion)
 * 8. Future-Proofing (tech compatibility for 4+ years)
 *
 * @module ai_pod/services/laptop_scoring
 */

import { SCORING_CONFIG } from '../config.mjs';

// ============================================================================
// CPU BENCHMARK DATABASE (Geekbench 6 Single/Multi-Core)
// ============================================================================

const CPU_BENCHMARKS = {
  // Intel 13th Gen
  'Core i9-13980HX': { single: 2900, multi: 20500, tier: 'flagship' },
  'Core i9-13900H': { single: 2700, multi: 16800, tier: 'premium' },
  'Core i7-13700H': { single: 2500, multi: 14200, tier: 'premium' },
  'Core i5-13500H': { single: 2200, multi: 11500, tier: 'midrange' },
  'Core i5-13420H': { single: 2100, multi: 10800, tier: 'midrange' },
  'Core i5-1335U': { single: 2000, multi: 8500, tier: 'budget' },

  // Intel 12th Gen
  'Core i7-12700H': { single: 2350, multi: 13000, tier: 'premium' },
  'Core i5-12500H': { single: 2100, multi: 10200, tier: 'midrange' },
  'Core i5-1235U': { single: 1900, multi: 7800, tier: 'budget' },

  // Intel 14th Gen (Ultra)
  'Core Ultra 9 185H': { single: 2800, multi: 17500, tier: 'flagship' },
  'Core Ultra 7 165U': { single: 2400, multi: 10500, tier: 'premium' },
  'Core Ultra 7 155H': { single: 2600, multi: 13800, tier: 'premium' },

  // AMD Ryzen 7000 Series
  'Ryzen 9 7945HX': { single: 2850, multi: 21000, tier: 'flagship' },
  'Ryzen 9 7940HS': { single: 2600, multi: 14500, tier: 'premium' },
  'Ryzen 7 7840HS': { single: 2500, multi: 13200, tier: 'premium' },
  'Ryzen 7 7735HS': { single: 2300, multi: 11800, tier: 'midrange' },
  'Ryzen 5 7535HS': { single: 2100, multi: 9500, tier: 'midrange' },
  'Ryzen 5 5625U': { single: 1800, multi: 7200, tier: 'budget' },
  'Ryzen 3 7320U': { single: 1600, multi: 5800, tier: 'budget' },

  // Apple Silicon
  'M3 Max': { single: 3100, multi: 21500, tier: 'flagship' },
  'M3 Pro': { single: 3000, multi: 15000, tier: 'premium' },
  'M3': { single: 2900, multi: 11500, tier: 'premium' },
  'M2': { single: 2600, multi: 9800, tier: 'midrange' },
};

// ============================================================================
// GPU BENCHMARK DATABASE (3DMark Time Spy Graphics Score)
// ============================================================================

const GPU_BENCHMARKS = {
  // NVIDIA RTX 40 Series
  'GeForce RTX 4090': { score: 22000, tier: 'flagship' },
  'GeForce RTX 4080': { score: 18500, tier: 'flagship' },
  'GeForce RTX 4070': { score: 14200, tier: 'premium' },
  'GeForce RTX 4060': { score: 10800, tier: 'midrange' },
  'GeForce RTX 4050': { score: 8500, tier: 'midrange' },

  // NVIDIA RTX 30 Series
  'GeForce RTX 3070': { score: 12500, tier: 'premium' },
  'GeForce RTX 3060': { score: 9200, tier: 'midrange' },
  'GeForce RTX 3050': { score: 6800, tier: 'budget' },
  'GeForce GTX 1650': { score: 4200, tier: 'budget' },

  // AMD Radeon
  'Radeon RX 7700M': { score: 13500, tier: 'premium' },
  'Radeon RX 7600M': { score: 10200, tier: 'midrange' },
  'Radeon RX 6500M': { score: 5200, tier: 'budget' },

  // Integrated Graphics
  'Iris Xe Graphics': { score: 1800, tier: 'integrated' },
  'UHD Graphics': { score: 800, tier: 'integrated' },
  'Radeon 680M': { score: 2500, tier: 'integrated' },
  'Integrated Graphics': { score: 1200, tier: 'integrated' },

  // Apple Silicon
  'M3 Max GPU': { score: 19000, tier: 'flagship' },
  'M3 Pro GPU': { score: 13500, tier: 'premium' },
  'M3 GPU': { score: 8500, tier: 'midrange' },
  'M3 (10-core GPU)': { score: 8500, tier: 'midrange' },
  'M2 GPU': { score: 7200, tier: 'midrange' },
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate performance score (0-10)
 */
export function calculatePerformanceScore(laptop) {
  const cpuModel = laptop.specs.cpu.model;
  const gpuModel = laptop.specs.gpu.model;

  const cpuBench = CPU_BENCHMARKS[cpuModel] || { single: 1500, multi: 6000 };
  const gpuBench = GPU_BENCHMARKS[gpuModel] || { score: 1000 };

  // Normalize scores (0-10 scale)
  const cpuSingle = Math.min(cpuBench.single / 300, 10);
  const cpuMulti = Math.min(cpuBench.multi / 2100, 10);
  const gpuScore = Math.min(gpuBench.score / 2200, 10);

  // Weighted average (40% single, 30% multi, 30% GPU)
  const performanceScore = (cpuSingle * 0.4) + (cpuMulti * 0.3) + (gpuScore * 0.3);

  return parseFloat(performanceScore.toFixed(2));
}

/**
 * Calculate value score (price-to-performance ratio) (0-10)
 */
export function calculateValueScore(laptop) {
  const performanceScore = calculatePerformanceScore(laptop);
  const price = laptop.price;

  // Value = (Performance Score / Price) * 10000
  // Normalized to 0-10 scale
  const valueRatio = (performanceScore / price) * 10000;
  const valueScore = Math.min(valueRatio * 4, 10); // Scale appropriately

  return parseFloat(valueScore.toFixed(2));
}

/**
 * Calculate build quality score (0-10)
 */
export function calculateBuildQualityScore(laptop) {
  let score = 5; // Base score

  // Material quality (based on tier)
  if (laptop.tier === 'flagship') score += 2.5;
  else if (laptop.tier === 'premium') score += 2.0;
  else if (laptop.tier === 'midrange') score += 1.0;

  // Brand reputation bonus
  const premiumBrands = ['apple', 'dell', 'lenovo', 'hp', 'lg'];
  if (premiumBrands.includes(laptop.brand)) score += 1.0;

  // Business/workstation segment bonus
  if (laptop.segment === 'business' || laptop.segment === 'workstation') score += 1.0;

  // Rating bonus
  score += (laptop.rating - 4.0) * 0.5;

  return Math.min(parseFloat(score.toFixed(2)), 10);
}

/**
 * Calculate display quality score (0-10)
 */
export function calculateDisplayQualityScore(laptop) {
  const display = laptop.specs.display;
  let score = 0;

  // Resolution (0-3 points)
  const resWidth = parseInt(display.resolution.split('x')[0]);
  if (resWidth >= 3840) score += 3.0; // 4K+
  else if (resWidth >= 2560) score += 2.5; // QHD+
  else if (resWidth >= 1920) score += 2.0; // FHD
  else score += 1.0;

  // Refresh rate (0-2 points)
  if (display.refreshRate >= 240) score += 2.0;
  else if (display.refreshRate >= 144) score += 1.5;
  else if (display.refreshRate >= 120) score += 1.0;
  else score += 0.5;

  // Panel type (0-2 points)
  if (display.panelType.includes('OLED') || display.panelType.includes('Mini-LED')) score += 2.0;
  else if (display.panelType.includes('IPS')) score += 1.5;
  else score += 1.0;

  // Brightness (0-1.5 points)
  if (display.brightness >= 500) score += 1.5;
  else if (display.brightness >= 400) score += 1.0;
  else if (display.brightness >= 300) score += 0.5;

  // Color gamut (0-1.5 points)
  if (display.colorGamut.includes('DCI-P3 100%') || display.colorGamut.includes('P3 wide')) score += 1.5;
  else if (display.colorGamut.includes('sRGB 100%')) score += 1.0;
  else score += 0.5;

  return Math.min(parseFloat(score.toFixed(2)), 10);
}

/**
 * Calculate battery life score (0-10)
 */
export function calculateBatteryLifeScore(laptop) {
  const batteryLife = laptop.specs.batteryLife;

  // Score based on battery life hours
  let score = 0;
  if (batteryLife >= 18) score = 10;
  else if (batteryLife >= 15) score = 9;
  else if (batteryLife >= 12) score = 8;
  else if (batteryLife >= 10) score = 7;
  else if (batteryLife >= 8) score = 6;
  else if (batteryLife >= 6) score = 5;
  else if (batteryLife >= 4) score = 4;
  else score = 3;

  return score;
}

/**
 * Calculate portability score (0-10)
 */
export function calculatePortabilityScore(laptop) {
  const weight = laptop.specs.weight;
  const thickness = laptop.specs.thickness;

  // Weight score (0-5 points)
  let weightScore = 0;
  if (weight <= 1.2) weightScore = 5;
  else if (weight <= 1.5) weightScore = 4.5;
  else if (weight <= 1.8) weightScore = 4;
  else if (weight <= 2.0) weightScore = 3.5;
  else if (weight <= 2.5) weightScore = 3;
  else weightScore = 2;

  // Thickness score (0-5 points)
  let thicknessScore = 0;
  if (thickness <= 14) thicknessScore = 5;
  else if (thickness <= 16) thicknessScore = 4.5;
  else if (thickness <= 18) thicknessScore = 4;
  else if (thickness <= 20) thicknessScore = 3.5;
  else if (thickness <= 24) thicknessScore = 3;
  else thicknessScore = 2;

  return parseFloat((weightScore + thicknessScore).toFixed(2));
}

/**
 * Calculate upgradeability score (0-10)
 */
export function calculateUpgradeabilityScore(laptop) {
  let score = 0;

  // RAM upgradeable (0-5 points)
  if (laptop.specs.ramUpgradable) {
    score += 3;
    if (laptop.specs.ramMax >= 64) score += 2;
    else if (laptop.specs.ramMax >= 32) score += 1;
  }

  // Storage upgradeable (0-5 points)
  if (laptop.specs.storageUpgradable) {
    score += 3;
    if (laptop.specs.storageSlots >= 2) score += 2;
    else score += 1;
  }

  return score;
}

/**
 * Calculate future-proofing score (0-10)
 */
export function calculateFutureProofScore(laptop) {
  let score = 5; // Base score

  const conn = laptop.specs.connectivity;
  const ports = laptop.specs.ports;

  // Wi-Fi 7 / Wi-Fi 6E (0-1.5 points)
  if (conn.wifi === 'Wi-Fi 7') score += 1.5;
  else if (conn.wifi === 'Wi-Fi 6E') score += 1.0;
  else if (conn.wifi === 'Wi-Fi 6') score += 0.5;

  // Thunderbolt 4 (0-1.5 points)
  if (ports.thunderbolt >= 2) score += 1.5;
  else if (ports.thunderbolt >= 1) score += 1.0;

  // DDR5 RAM (0-1 point)
  if (laptop.specs.ramType === 'DDR5' || laptop.specs.ramType === 'LPDDR5X') score += 1.0;

  // USB-C / USB 4.0 (0-1 point)
  if (ports['usb-c'] >= 2) score += 1.0;
  else if (ports['usb-c'] >= 1) score += 0.5;

  // Launch date (within 1 year) (0-1 point)
  const launchDate = new Date(laptop.lastUpdated || laptop.releaseDate || '2024-01-01');
  const now = new Date();
  const monthsSinceLaunch = (now - launchDate) / (1000 * 60 * 60 * 24 * 30);
  if (monthsSinceLaunch <= 12) score += 1.0;
  else if (monthsSinceLaunch <= 24) score += 0.5;

  return Math.min(parseFloat(score.toFixed(2)), 10);
}

/**
 * Calculate composite score (0-10)
 * Weighted average of all dimensions
 */
export function calculateCompositeScore(laptop) {
  const weights = SCORING_CONFIG.laptops.weights;

  const scores = {
    performance: calculatePerformanceScore(laptop),
    value: calculateValueScore(laptop),
    buildQuality: calculateBuildQualityScore(laptop),
    displayQuality: calculateDisplayQualityScore(laptop),
    batteryLife: calculateBatteryLifeScore(laptop),
    portability: calculatePortabilityScore(laptop),
    upgradeability: calculateUpgradeabilityScore(laptop),
    futureProof: calculateFutureProofScore(laptop),
  };

  const compositeScore =
    (scores.performance * weights.performance) +
    (scores.value * weights.value) +
    (scores.buildQuality * weights.buildQuality) +
    (scores.displayQuality * weights.displayQuality) +
    (scores.batteryLife * weights.batteryLife) +
    (scores.portability * weights.portability) +
    (scores.upgradeability * weights.upgradeability) +
    (scores.futureProof * weights.futureProof);

  return {
    composite: parseFloat(compositeScore.toFixed(2)),
    breakdown: scores,
  };
}

/**
 * Score all laptops in database
 */
export async function scoreAllLaptops(laptops) {
  const scored = laptops.map(laptop => {
    const scoring = calculateCompositeScore(laptop);

    return {
      ...laptop,
      scoring: {
        composite: scoring.composite,
        performance: scoring.breakdown.performance,
        value: scoring.breakdown.value,
        buildQuality: scoring.breakdown.buildQuality,
        displayQuality: scoring.breakdown.displayQuality,
        batteryLife: scoring.breakdown.batteryLife,
        portability: scoring.breakdown.portability,
        upgradeability: scoring.breakdown.upgradeability,
        futureProof: scoring.breakdown.futureProof,
        lastScored: new Date().toISOString(),
      },
    };
  });

  // Sort by composite score (descending)
  scored.sort((a, b) => b.scoring.composite - a.scoring.composite);

  return scored;
}

/**
 * Get top N laptops by composite score
 */
export function getTopLaptops(scoredLaptops, n = 100) {
  return scoredLaptops.slice(0, n);
}

/**
 * Filter laptops by minimum score threshold
 */
export function filterByMinScore(scoredLaptops, minScore = 7.5) {
  return scoredLaptops.filter(laptop => laptop.scoring.composite >= minScore);
}

export default {
  calculateCompositeScore,
  scoreAllLaptops,
  getTopLaptops,
  filterByMinScore,
};
