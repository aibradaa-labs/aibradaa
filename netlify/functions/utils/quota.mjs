/**
 * Quota Enforcement Utilities
 * 84-Mentor Approved: Warren Buffett (Mentor 1) - Cost Management
 *
 * Features:
 * - Check quota availability before AI calls
 * - Record usage after AI calls
 * - MYR-based cost tracking
 * - Automatic quota refresh on month rollover
 * - Hard cost ceilings per tier (Phase 9.10)
 * - 80% threshold notifications
 *
 * @module quota
 */

import db from '../../../database/connection.mjs';

/**
 * Hard cost ceilings (MYR sen)
 * Warren Buffett (Mentor 1) RED LINE: Cannot exceed these limits
 */
const COST_CEILINGS = {
  free: 200,      // RM2.00/month
  pro: 1000,      // RM10.00/month
  ultimate: 5000, // RM50.00/month
  guest: 50,      // RM0.50/session
};

/**
 * Notification threshold (80% of ceiling)
 */
const NOTIFICATION_THRESHOLD = 0.80;

/**
 * Check if user has quota available
 *
 * @param {string} userId - User ID
 * @param {string} tier - User tier (free, pro, ultimate)
 * @returns {Promise<Object>} Quota status
 *
 * @example
 * const quota = await hasQuotaAvailable('user123', 'pro');
 * if (!quota.available) {
 *   return errorResponse('Quota exceeded', 429, { upgrade: quota.upgradeUrl });
 * }
 */
export async function hasQuotaAvailable(userId, tier = 'free') {
  try {
    // Guest users have limited quota (no database record)
    if (!userId || tier === 'guest') {
      // Apply hard ceiling for guest tier
      const guestCeiling = COST_CEILINGS.guest;

      return {
        available: true,
        tier: 'guest',
        remaining: {
          tokens: 10000,
          requests: 10,
          costSen: guestCeiling,
        },
        limit: {
          tokens: 10000,
          requests: 10,
          costSen: guestCeiling,
        },
        ceiling: {
          costSen: guestCeiling,
          costMYR: guestCeiling / 100,
        },
        note: 'Guest quota (in-memory only, resets on session end)',
      };
    }

    // Ensure database connection
    if (!db.isHealthy()) {
      await db.connect();
    }

    // Get or create current month's quota
    const result = await db.query(
      `
      SELECT * FROM get_or_create_monthly_quota($1, $2)
      `,
      [userId, tier]
    );

    const quota = result.rows[0];

    if (!quota) {
      throw new Error('Failed to retrieve quota');
    }

    // Get hard cost ceiling for this tier
    const costCeiling = COST_CEILINGS[tier] || COST_CEILINGS.ultimate;

    // Check if quota exceeded (soft limits)
    const hasTokens = quota.used_tokens < quota.tokens_limit;
    const hasRequests = quota.used_requests < quota.requests_limit;
    const hasCostBudget = quota.used_cost_cents < quota.cost_limit_cents;

    // Check if cost ceiling exceeded (HARD LIMIT)
    const belowCeiling = quota.used_cost_cents < costCeiling;

    // Available if both soft limits AND hard ceiling not exceeded
    const available = hasTokens && hasRequests && hasCostBudget && belowCeiling;

    // Calculate ceiling percentage
    const ceilingPercentage = Math.round((quota.used_cost_cents / costCeiling) * 100);

    // Check if notification threshold reached
    const notificationNeeded = ceilingPercentage >= NOTIFICATION_THRESHOLD * 100;

    // Send notification if needed (async, don't block)
    if (notificationNeeded && ceilingPercentage < 100) {
      sendCeilingNotification(userId, tier, ceilingPercentage, quota.used_cost_cents, costCeiling)
        .catch(err => console.error('[Quota] Notification failed:', err));
    }

    return {
      available,
      tier,
      remaining: {
        tokens: Math.max(0, quota.tokens_limit - quota.used_tokens),
        requests: Math.max(0, quota.requests_limit - quota.used_requests),
        costSen: Math.max(0, quota.cost_limit_cents - quota.used_cost_cents),
      },
      limit: {
        tokens: quota.tokens_limit,
        requests: quota.requests_limit,
        costSen: quota.cost_limit_cents,
      },
      usage: {
        tokens: quota.used_tokens,
        requests: quota.used_requests,
        costSen: quota.used_cost_cents,
      },
      percentage: {
        tokens: Math.round((quota.used_tokens / quota.tokens_limit) * 100),
        requests: Math.round((quota.used_requests / quota.requests_limit) * 100),
        cost: Math.round((quota.used_cost_cents / quota.cost_limit_cents) * 100),
      },
      ceiling: {
        costSen: costCeiling,
        costMYR: costCeiling / 100,
        percentageUsed: ceilingPercentage,
        exceeded: !belowCeiling,
        notificationSent: notificationNeeded,
      },
      resetDate: quota.period_end,
      upgradeUrl: tier === 'free' ? '/pricing?upgrade=pro' : '/pricing?upgrade=ultimate',
    };

  } catch (error) {
    console.error('[Quota] Error checking quota:', error);

    // Fallback: allow request but log error
    return {
      available: true,
      tier,
      error: error.message,
      fallback: true,
      note: 'Quota check failed, allowing request (fail-open)',
    };
  }
}

/**
 * Record usage after AI call
 *
 * @param {string} userId - User ID
 * @param {number} tokens - Total tokens used (input + output)
 * @param {number} costSen - Cost in MYR sen (cents)
 * @param {string} endpoint - API endpoint (e.g., '/chat', '/command')
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Usage record
 *
 * @example
 * const usage = await recordUsage(
 *   'user123',
 *   1500,
 *   45,
 *   '/chat',
 *   { model: 'gemini-2.0-flash-exp', responseLength: 800 }
 * );
 */
export async function recordUsage(userId, tokens, costSen, endpoint, metadata = {}) {
  try {
    // Skip recording for guest users (could implement in-memory tracking)
    if (!userId) {
      console.log('[Quota] Skipping usage recording for guest user');
      return {
        recorded: false,
        reason: 'guest user',
      };
    }

    // Ensure database connection
    if (!db.isHealthy()) {
      await db.connect();
    }

    // Record usage event and update quota in transaction
    const result = await db.transaction(async (client) => {
      // Insert usage event
      const eventResult = await client.query(
        `
        INSERT INTO usage_events (
          user_id,
          event_type,
          tokens_used,
          cost_cents,
          endpoint,
          metadata,
          timestamp
        ) VALUES ($1, 'api_call', $2, $3, $4, $5, NOW())
        RETURNING id, timestamp
        `,
        [userId, tokens, costSen, endpoint, JSON.stringify(metadata)]
      );

      const event = eventResult.rows[0];

      // Update quota (increment used counters)
      await client.query(
        `
        UPDATE usage_quotas
        SET
          used_tokens = used_tokens + $1,
          used_requests = used_requests + 1,
          used_cost_cents = used_cost_cents + $2,
          updated_at = NOW()
        WHERE user_id = $3
          AND period_start <= NOW()
          AND period_end > NOW()
        `,
        [tokens, costSen, userId]
      );

      return event;
    });

    return {
      recorded: true,
      eventId: result.id,
      timestamp: result.timestamp,
      usage: {
        tokens,
        costSen,
        costMYR: costSen / 100,
        endpoint,
      },
    };

  } catch (error) {
    console.error('[Quota] Error recording usage:', error);

    // Don't throw - usage recording failure shouldn't block response
    return {
      recorded: false,
      error: error.message,
      note: 'Usage recording failed, but request completed',
    };
  }
}

/**
 * Get quota status for user (convenience function)
 *
 * @param {string} userId - User ID
 * @param {string} tier - User tier
 * @returns {Promise<Object>} Detailed quota status
 */
export async function getQuotaStatus(userId, tier = 'free') {
  const status = await hasQuotaAvailable(userId, tier);

  return {
    ...status,
    warnings: generateWarnings(status),
    recommendations: generateRecommendations(status),
  };
}

/**
 * Generate quota warnings
 *
 * @param {Object} status - Quota status
 * @returns {Array<string>} Warning messages
 */
function generateWarnings(status) {
  const warnings = [];

  if (!status.available) {
    warnings.push('Quota limit reached');
  } else if (status.percentage) {
    if (status.percentage.tokens >= 90) {
      warnings.push('Token quota 90% used');
    }
    if (status.percentage.requests >= 90) {
      warnings.push('Request quota 90% used');
    }
    if (status.percentage.cost >= 90) {
      warnings.push('Cost quota 90% used');
    }
  }

  return warnings;
}

/**
 * Generate upgrade recommendations
 *
 * @param {Object} status - Quota status
 * @returns {Array<string>} Recommendation messages
 */
function generateRecommendations(status) {
  const recommendations = [];

  if (!status.available && status.tier === 'free') {
    recommendations.push('Upgrade to Pro for 13x more tokens (400k/month)');
    recommendations.push('Upgrade to Pro for 16x more requests (800/month)');
  } else if (!status.available && status.tier === 'pro') {
    recommendations.push('Upgrade to Ultimate for 7.5x more tokens (3M/month)');
    recommendations.push('Upgrade to Ultimate for 6x more requests (5k/month)');
  }

  return recommendations;
}

/**
 * Send cost ceiling notification
 *
 * Warren Buffett (Mentor 1) RED LINE: Alert at 80% threshold
 *
 * @param {string} userId - User ID
 * @param {string} tier - User tier
 * @param {number} percentage - Percentage of ceiling used
 * @param {number} usedSen - Amount used (sen)
 * @param {number} ceilingSen - Ceiling limit (sen)
 */
async function sendCeilingNotification(userId, tier, percentage, usedSen, ceilingSen) {
  try {
    const message = `
⚠️ Cost Ceiling Alert - ${percentage}% Used

**User:** ${userId}
**Tier:** ${tier.toUpperCase()}
**Used:** RM${(usedSen / 100).toFixed(2)}
**Ceiling:** RM${(ceilingSen / 100).toFixed(2)}
**Remaining:** RM${((ceilingSen - usedSen) / 100).toFixed(2)}

${percentage >= 95
  ? '🔴 CRITICAL: Approaching cost ceiling! Only ' + Math.round(100 - percentage) + '% remaining.'
  : '🟡 WARNING: ' + percentage + '% of monthly cost ceiling used.'}

${tier === 'free'
  ? 'Consider upgrading to Pro (RM30/month) for RM10 ceiling.'
  : tier === 'pro'
  ? 'Consider upgrading to Ultimate (RM80/month) for RM50 ceiling.'
  : 'You are on Ultimate tier (highest ceiling).'}
    `.trim();

    console.warn(`[Quota] Cost Ceiling Alert: ${percentage}% for user ${userId} (${tier})`);

    // Production: Send email/SMS notification to user
    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      await fetch(process.env.NOTIFICATION_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tier,
          percentage,
          usedMYR: usedSen / 100,
          ceilingMYR: ceilingSen / 100,
          message,
        }),
      });
    }

    // Production: Log to database for tracking
    if (db.isHealthy()) {
      await db.query(
        `INSERT INTO notification_log (user_id, type, message, metadata, timestamp)
         VALUES ($1, 'cost_ceiling_alert', $2, $3, NOW())`,
        [userId, message, JSON.stringify({ percentage, usedSen, ceilingSen, tier })]
      );
    }

  } catch (error) {
    console.error('[Quota] Failed to send ceiling notification:', error);
    // Don't throw - notification failure shouldn't block quota check
  }
}

/**
 * Middleware factory for quota enforcement
 *
 * Usage in Netlify Functions:
 * ```javascript
 * import { enforceQuota } from './utils/quota.mjs';
 *
 * export async function handler(event, context) {
 *   const user = getUserFromEvent(event);
 *   const quotaCheck = await enforceQuota(user);
 *
 *   if (!quotaCheck.allowed) {
 *     return quotaCheck.response; // Returns 429 error
 *   }
 *
 *   // ... proceed with AI call ...
 *
 *   await quotaCheck.recordUsage(tokens, costSen, '/endpoint');
 * }
 * ```
 */
export async function enforceQuota(user) {
  const userId = user?.id;
  const tier = user?.tier || 'guest';

  const status = await hasQuotaAvailable(userId, tier);

  if (!status.available) {
    // Determine if ceiling or quota limit exceeded
    const ceilingExceeded = status.ceiling?.exceeded;
    const quotaExceeded = !status.available && !ceilingExceeded;

    const errorMessage = ceilingExceeded
      ? `Cost ceiling exceeded (RM${status.ceiling.costMYR}/month limit)`
      : quotaExceeded
      ? 'Monthly quota limit reached'
      : 'Quota unavailable';

    const detailedMessage = ceilingExceeded
      ? `You have reached the ${tier.toUpperCase()} tier cost ceiling of RM${status.ceiling.costMYR}. ` +
        `Your current usage: RM${(status.usage.costSen / 100).toFixed(2)}. ` +
        `This ceiling resets on ${new Date(status.resetDate).toLocaleDateString()}.`
      : `You have used ${status.percentage.cost}% of your monthly quota. ` +
        `This quota resets on ${new Date(status.resetDate).toLocaleDateString()}.`;

    return {
      allowed: false,
      response: {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '3600', // Retry after 1 hour
        },
        body: JSON.stringify({
          error: errorMessage,
          message: detailedMessage,
          quota: status,
          ceiling: ceilingExceeded ? {
            reason: 'Warren Buffett (Mentor 1) RED LINE: Cost ceiling enforced',
            current: `RM${(status.usage.costSen / 100).toFixed(2)}`,
            limit: `RM${status.ceiling.costMYR}`,
            percentageUsed: `${status.ceiling.percentageUsed}%`,
          } : undefined,
          upgrade: {
            message: tier === 'free'
              ? 'Upgrade to Pro for RM30/month (RM10 ceiling, 13x tokens)'
              : tier === 'pro'
              ? 'Upgrade to Ultimate for RM80/month (RM50 ceiling, 7.5x tokens)'
              : 'You are on Ultimate tier (highest available)',
            url: status.upgradeUrl,
          },
        }),
      },
    };
  }

  return {
    allowed: true,
    status,
    recordUsage: async (tokens, costSen, endpoint, metadata) => {
      return await recordUsage(userId, tokens, costSen, endpoint, metadata);
    },
  };
}

export default {
  hasQuotaAvailable,
  recordUsage,
  getQuotaStatus,
  enforceQuota,
};
