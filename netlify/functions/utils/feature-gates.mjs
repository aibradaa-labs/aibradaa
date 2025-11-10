/**
 * Feature Gates Utility
 * Define which features are available for each tier
 *
 * 84-Mentor Approved: Revenue Protection System
 * Based on /configs/tiers.json pricing structure
 */

/**
 * Feature access matrix
 * Maps features to allowed tiers
 */
const FEATURE_ACCESS = {
  // Core sections (pages)
  matchmaker: ['free', 'pro', 'ultimate', 'enterprise'],
  versus: ['free', 'pro', 'ultimate', 'enterprise'],
  explorer: ['free', 'pro', 'ultimate', 'enterprise'],
  command: ['free', 'pro', 'ultimate', 'enterprise'],
  appendices: ['free', 'pro', 'ultimate', 'enterprise'],

  // Premium sections
  intel: ['pro', 'ultimate', 'enterprise'],
  cameraTech: ['pro', 'ultimate', 'enterprise'],

  // AI modes
  fastMode: ['free', 'pro', 'ultimate', 'enterprise'],
  thinkMode: ['pro', 'ultimate', 'enterprise'],
  researchMode: ['ultimate', 'enterprise'],

  // Intel features
  priceDrops: ['pro', 'ultimate', 'enterprise'],
  priceAlerts: ['pro', 'ultimate', 'enterprise'],
  priceAlertsCustom: ['ultimate', 'enterprise'],
  newsUpdates: ['pro', 'ultimate', 'enterprise'],
  etlRefresh: ['pro', 'ultimate', 'enterprise'],
  realTimeData: ['ultimate', 'enterprise'],

  // Versus features
  versus2Way: ['free', 'pro', 'ultimate', 'enterprise'],
  versus3Way: ['pro', 'ultimate', 'enterprise'],
  versus4Way: ['ultimate', 'enterprise'],

  // ABO-84 (Ultimate exclusive)
  abo84: ['ultimate', 'enterprise'],
  abo84Downloads: ['ultimate', 'enterprise'],

  // API access
  apiAccess: ['ultimate', 'enterprise'],
  apiUnlimited: ['enterprise'],

  // Advanced features
  ragAdvanced: ['pro', 'ultimate', 'enterprise'],
  ragCustom: ['enterprise'],
  historyUnlimited: ['ultimate', 'enterprise'],
  exportEnabled: ['pro', 'ultimate', 'enterprise'],

  // Branding
  watermarkRemoval: ['pro', 'ultimate', 'enterprise'],
  poweredByRemoval: ['ultimate', 'enterprise'],
  whiteLabel: ['enterprise'],
};

/**
 * Check if a tier has access to a feature
 *
 * @param {string} tier - User tier ('guest', 'free', 'pro', 'ultimate', 'enterprise')
 * @param {string} feature - Feature name
 * @returns {boolean} True if tier has access
 *
 * @example
 * checkFeatureAccess('pro', 'intel') // true
 * checkFeatureAccess('free', 'abo84') // false
 */
export function checkFeatureAccess(tier, feature) {
  // Handle guest tier (no paid access)
  if (tier === 'guest') {
    // Guests can only access free features
    const freeFeatures = ['matchmaker', 'versus', 'versus2Way', 'explorer', 'command', 'appendices', 'fastMode'];
    return freeFeatures.includes(feature);
  }

  // Check if feature exists in access matrix
  const allowedTiers = FEATURE_ACCESS[feature];

  if (!allowedTiers) {
    console.warn(`[FeatureGates] Unknown feature: ${feature}`);
    return false; // Deny access to unknown features by default
  }

  return allowedTiers.includes(tier);
}

/**
 * Get all features accessible by a tier
 *
 * @param {string} tier - User tier
 * @returns {Array<string>} Array of accessible feature names
 *
 * @example
 * getAccessibleFeatures('pro')
 * // ['matchmaker', 'versus', 'intel', 'thinkMode', ...]
 */
export function getAccessibleFeatures(tier) {
  return Object.keys(FEATURE_ACCESS).filter(feature =>
    checkFeatureAccess(tier, feature)
  );
}

/**
 * Get features NOT accessible by a tier (for upgrade prompts)
 *
 * @param {string} tier - User tier
 * @returns {Array<string>} Array of locked feature names
 *
 * @example
 * getLockedFeatures('free')
 * // ['intel', 'thinkMode', 'abo84', ...]
 */
export function getLockedFeatures(tier) {
  return Object.keys(FEATURE_ACCESS).filter(feature =>
    !checkFeatureAccess(tier, feature)
  );
}

/**
 * Get minimum tier required for a feature
 *
 * @param {string} feature - Feature name
 * @returns {string|null} Minimum tier name or null if feature doesn't exist
 *
 * @example
 * getMinimumTierForFeature('intel') // 'pro'
 * getMinimumTierForFeature('abo84') // 'ultimate'
 */
export function getMinimumTierForFeature(feature) {
  const allowedTiers = FEATURE_ACCESS[feature];

  if (!allowedTiers || allowedTiers.length === 0) {
    return null;
  }

  // Tier hierarchy
  const tierOrder = ['guest', 'free', 'pro', 'ultimate', 'enterprise'];

  // Find lowest tier in allowed tiers
  for (const tier of tierOrder) {
    if (allowedTiers.includes(tier)) {
      return tier;
    }
  }

  return null;
}

/**
 * Get upgrade path from current tier to access a feature
 *
 * @param {string} currentTier - Current user tier
 * @param {string} feature - Desired feature
 * @returns {Object} Upgrade recommendation
 *
 * @example
 * getUpgradePathForFeature('free', 'intel')
 * // { needed: true, targetTier: 'pro', price: 30, currency: 'MYR' }
 */
export function getUpgradePathForFeature(currentTier, feature) {
  // Check if already has access
  if (checkFeatureAccess(currentTier, feature)) {
    return {
      needed: false,
      message: 'You already have access to this feature.',
      currentTier,
    };
  }

  // Get minimum tier for feature
  const targetTier = getMinimumTierForFeature(feature);

  if (!targetTier) {
    return {
      needed: false,
      message: 'Feature not found.',
      error: 'FEATURE_NOT_FOUND',
    };
  }

  // Pricing from /configs/tiers.json
  const pricing = {
    free: { price: 0, currency: 'MYR' },
    pro: { price: 30, currency: 'MYR' },
    ultimate: { price: 80, currency: 'MYR' },
    enterprise: { price: null, currency: 'MYR', contact: true },
  };

  return {
    needed: true,
    currentTier,
    targetTier,
    feature,
    price: pricing[targetTier]?.price,
    currency: pricing[targetTier]?.currency,
    contact: pricing[targetTier]?.contact || false,
    upgradeUrl: pricing[targetTier]?.contact
      ? '/contact-sales'
      : `/pricing?upgrade=${targetTier}`,
    message: pricing[targetTier]?.contact
      ? `Feature '${feature}' requires Enterprise tier. Contact sales for pricing.`
      : `Upgrade to ${targetTier.toUpperCase()} (RM${pricing[targetTier]?.price}/month) to access '${feature}'.`,
  };
}

/**
 * Bulk check features for a tier
 *
 * @param {string} tier - User tier
 * @param {Array<string>} features - Array of feature names to check
 * @returns {Object} Map of feature -> boolean
 *
 * @example
 * bulkCheckFeatures('pro', ['intel', 'abo84', 'thinkMode'])
 * // { intel: true, abo84: false, thinkMode: true }
 */
export function bulkCheckFeatures(tier, features) {
  return features.reduce((acc, feature) => {
    acc[feature] = checkFeatureAccess(tier, feature);
    return acc;
  }, {});
}

/**
 * Get tier comparison matrix (for pricing page)
 *
 * @param {Array<string>} features - Features to compare
 * @returns {Object} Matrix of tier -> feature -> boolean
 *
 * @example
 * getTierComparisonMatrix(['intel', 'abo84', 'thinkMode'])
 * // {
 * //   free: { intel: false, abo84: false, thinkMode: false },
 * //   pro: { intel: true, abo84: false, thinkMode: true },
 * //   ultimate: { intel: true, abo84: true, thinkMode: true }
 * // }
 */
export function getTierComparisonMatrix(features) {
  const tiers = ['free', 'pro', 'ultimate', 'enterprise'];

  return tiers.reduce((acc, tier) => {
    acc[tier] = bulkCheckFeatures(tier, features);
    return acc;
  }, {});
}

export default {
  checkFeatureAccess,
  getAccessibleFeatures,
  getLockedFeatures,
  getMinimumTierForFeature,
  getUpgradePathForFeature,
  bulkCheckFeatures,
  getTierComparisonMatrix,
};
