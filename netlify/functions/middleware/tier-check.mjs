/**
 * Tier Check Middleware
 * Check user tier on every API request
 * Enforce feature gates per tier
 * Block unauthorized access (403)
 *
 * 84-Mentor Approved: Revenue Protection System
 * Pricing:
 * - Free: RM0/month (30k tokens, 50 req/day)
 * - Pro: RM30/month (400k tokens, 800 req/day)
 * - Ultimate: RM80/month (3M tokens, 5k req/day)
 */

import { errorResponse } from '../utils/response.mjs';
import { checkFeatureAccess } from '../utils/feature-gates.mjs';

/**
 * Tier hierarchy levels
 */
const TIER_LEVELS = {
  guest: 0,
  free: 1,
  pro: 2,
  ultimate: 3,
  enterprise: 4, // Phase 2
};

/**
 * Check if user tier is sufficient for feature
 *
 * @param {Object} user - User object with tier property
 * @param {string} feature - Feature name (e.g., 'intel', 'thinkMode', 'researchMode')
 * @returns {boolean} True if user has access
 */
export function hasFeatureAccess(user, feature) {
  if (!user) {
    return checkFeatureAccess('guest', feature);
  }

  return checkFeatureAccess(user.tier, feature);
}

/**
 * Require minimum tier for feature
 *
 * @param {Object} user - User object with tier property
 * @param {string} minTier - Minimum required tier ('free', 'pro', 'ultimate')
 * @param {string} featureName - Feature name for error message
 * @throws {Error} If user tier is insufficient
 */
export function requireTier(user, minTier, featureName = 'this feature') {
  const userLevel = TIER_LEVELS[user?.tier] || 0;
  const requiredLevel = TIER_LEVELS[minTier] || 0;

  if (userLevel < requiredLevel) {
    const upgradeTier = getUpgradeTier(user?.tier, minTier);

    throw new Error(
      `Tier '${minTier}' or higher required for ${featureName}. ` +
      `Your current tier: ${user?.tier || 'guest'}. ` +
      `${upgradeTier.message}`
    );
  }

  return true;
}

/**
 * Require specific feature access
 *
 * @param {Object} user - User object with tier property
 * @param {string} feature - Feature name
 * @throws {Error} If user doesn't have access
 */
export function requireFeature(user, feature) {
  if (!hasFeatureAccess(user, feature)) {
    const requiredTiers = getRequiredTiersForFeature(feature);
    const upgradeTier = getUpgradeTier(user?.tier, requiredTiers[0]);

    throw new Error(
      `Feature '${feature}' is not available on your current tier (${user?.tier || 'guest'}). ` +
      `Required tier: ${requiredTiers.join(' or ')}. ` +
      `${upgradeTier.message}`
    );
  }

  return true;
}

/**
 * Get required tiers for a feature
 *
 * @param {string} feature - Feature name
 * @returns {Array<string>} Array of tier names that have access
 */
function getRequiredTiersForFeature(feature) {
  const allTiers = ['guest', 'free', 'pro', 'ultimate', 'enterprise'];
  return allTiers.filter(tier => checkFeatureAccess(tier, feature));
}

/**
 * Get upgrade recommendation
 *
 * @param {string} currentTier - Current user tier
 * @param {string} targetTier - Target tier needed
 * @returns {Object} Upgrade recommendation
 */
function getUpgradeTier(currentTier = 'guest', targetTier = 'pro') {
  const currentLevel = TIER_LEVELS[currentTier] || 0;
  const targetLevel = TIER_LEVELS[targetTier] || 0;

  // Already at or above target tier
  if (currentLevel >= targetLevel) {
    return {
      needed: false,
      message: 'You already have access to this feature.',
      tier: currentTier,
    };
  }

  // Recommend next tier up from current
  if (currentLevel === 0 || currentLevel === 1) {
    // Guest or Free -> recommend Pro
    return {
      needed: true,
      tier: 'pro',
      price: 30,
      currency: 'MYR',
      message: 'Upgrade to Pro (RM30/month) to access this feature.',
      url: '/pricing?upgrade=pro',
    };
  } else if (currentLevel === 2) {
    // Pro -> recommend Ultimate
    return {
      needed: true,
      tier: 'ultimate',
      price: 80,
      currency: 'MYR',
      message: 'Upgrade to Ultimate (RM80/month) to access this feature.',
      url: '/pricing?upgrade=ultimate',
    };
  }

  // Already at Ultimate
  return {
    needed: false,
    message: 'You are on the highest tier.',
    tier: currentTier,
  };
}

/**
 * Middleware factory for tier enforcement
 *
 * Usage in Netlify Functions:
 * ```javascript
 * import { enforceTier } from './middleware/tier-check.mjs';
 *
 * export async function handler(event, context) {
 *   const user = getUserFromEvent(event);
 *
 *   // Option 1: Require minimum tier
 *   const tierCheck = enforceTier(user, 'pro', 'Intel features');
 *   if (!tierCheck.allowed) {
 *     return tierCheck.response; // Returns 403 error with upgrade prompt
 *   }
 *
 *   // Option 2: Require specific feature
 *   const featureCheck = enforceFeature(user, 'intel');
 *   if (!featureCheck.allowed) {
 *     return featureCheck.response;
 *   }
 *
 *   // ... proceed with request ...
 * }
 * ```
 */
export function enforceTier(user, minTier, featureName = 'this feature') {
  try {
    requireTier(user, minTier, featureName);

    return {
      allowed: true,
      tier: user?.tier,
      message: 'Access granted',
    };

  } catch (error) {
    const upgradeTier = getUpgradeTier(user?.tier, minTier);

    return {
      allowed: false,
      response: errorResponse(
        error.message,
        403,
        {
          currentTier: user?.tier || 'guest',
          requiredTier: minTier,
          feature: featureName,
          upgrade: upgradeTier.needed ? {
            tier: upgradeTier.tier,
            price: upgradeTier.price,
            currency: upgradeTier.currency,
            url: upgradeTier.url,
          } : null,
        }
      ),
    };
  }
}

/**
 * Enforce feature access
 *
 * @param {Object} user - User object
 * @param {string} feature - Feature name
 * @returns {Object} Access check result
 */
export function enforceFeature(user, feature) {
  try {
    requireFeature(user, feature);

    return {
      allowed: true,
      tier: user?.tier,
      feature,
      message: 'Access granted',
    };

  } catch (error) {
    const requiredTiers = getRequiredTiersForFeature(feature);
    const upgradeTier = getUpgradeTier(user?.tier, requiredTiers[0]);

    return {
      allowed: false,
      response: errorResponse(
        error.message,
        403,
        {
          currentTier: user?.tier || 'guest',
          requiredTiers,
          feature,
          upgrade: upgradeTier.needed ? {
            tier: upgradeTier.tier,
            price: upgradeTier.price,
            currency: upgradeTier.currency,
            url: upgradeTier.url,
          } : null,
        }
      ),
    };
  }
}

/**
 * Get tier-specific limits
 *
 * @param {string} tier - User tier
 * @returns {Object} Tier limits
 */
export function getTierLimits(tier = 'free') {
  const limits = {
    guest: {
      tokensPerDay: 1000,
      tokensPerMonth: 10000,
      requestsPerDay: 10,
      aiModes: ['fast'],
      features: [],
    },
    free: {
      tokensPerDay: 1000,
      tokensPerMonth: 30000,
      requestsPerDay: 50,
      aiModes: ['fast'],
      features: ['matchmaker', 'versus', 'explorer', 'command', 'appendices'],
    },
    pro: {
      tokensPerDay: 13333,
      tokensPerMonth: 400000,
      requestsPerDay: 800,
      aiModes: ['fast', 'think'],
      features: ['matchmaker', 'versus', 'explorer', 'command', 'intel', 'appendices', 'cameraTech', 'priceAlerts'],
    },
    ultimate: {
      tokensPerDay: 100000,
      tokensPerMonth: 3000000,
      requestsPerDay: 5000,
      aiModes: ['fast', 'think', 'research'],
      features: [
        'matchmaker', 'versus', 'explorer', 'command', 'intel', 'appendices',
        'cameraTech', 'priceAlerts', 'abo84', 'apiAccess', 'realTimeData'
      ],
    },
  };

  return limits[tier] || limits.free;
}

/**
 * Check AI mode access
 *
 * @param {Object} user - User object
 * @param {string} mode - AI mode ('fast', 'think', 'research')
 * @returns {boolean} True if user has access
 */
export function hasAIModeAccess(user, mode) {
  const limits = getTierLimits(user?.tier || 'guest');
  return limits.aiModes.includes(mode);
}

/**
 * Require AI mode access
 *
 * @param {Object} user - User object
 * @param {string} mode - AI mode
 * @throws {Error} If user doesn't have access
 */
export function requireAIMode(user, mode) {
  if (!hasAIModeAccess(user, mode)) {
    const requiredTier = mode === 'research' ? 'ultimate' : mode === 'think' ? 'pro' : 'free';
    const upgradeTier = getUpgradeTier(user?.tier, requiredTier);

    throw new Error(
      `AI mode '${mode}' is not available on your current tier (${user?.tier || 'guest'}). ` +
      `Required tier: ${requiredTier}. ` +
      `${upgradeTier.message}`
    );
  }

  return true;
}

export default {
  hasFeatureAccess,
  requireTier,
  requireFeature,
  enforceTier,
  enforceFeature,
  getTierLimits,
  hasAIModeAccess,
  requireAIMode,
};
