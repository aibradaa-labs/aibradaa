/**
 * AI Bradaa - Usage Repository
 *
 * 84-Mentor Governance: Financial Controls (Buffett requirement)
 * Financial Red Lines:
 * - Free tier: 50k tokens/mo, $2 cost ceiling
 * - Pro tier: 500k tokens/mo, $10 cost ceiling
 * - Ultimate tier: 5M tokens/mo, $50 cost ceiling
 */

import db from '../connection.mjs';

class UsageRepository {
  /**
   * Get current month quota for user
   * Buffett requirement: Enforce cost ceilings from day 1
   */
  async getCurrentQuota(userId) {
    const query = `
      SELECT
        id,
        tokens_limit,
        tokens_used,
        requests_limit,
        requests_used,
        cost_limit_cents,
        cost_used_cents,
        period_start,
        period_end,
        (tokens_used::FLOAT / NULLIF(tokens_limit, 0) * 100) as tokens_usage_pct,
        (cost_used_cents::FLOAT / NULLIF(cost_limit_cents, 0) * 100) as cost_usage_pct
      FROM usage_quotas
      WHERE user_id = $1
        AND period_start = date_trunc('month', CURRENT_TIMESTAMP)
    `;

    const result = await db.query(query, [userId]);

    // Create quota if doesn't exist for current month
    if (result.rows.length === 0) {
      return await this.createQuotaForCurrentMonth(userId);
    }

    return result.rows[0];
  }

  /**
   * Check if user has quota available
   * Security: Prevent quota exhaustion attacks
   */
  async hasQuotaAvailable(userId, tokensNeeded = 0, costCents = 0) {
    const quota = await this.getCurrentQuota(userId);

    return {
      allowed: quota.tokens_used + tokensNeeded <= quota.tokens_limit &&
               quota.cost_used_cents + costCents <= quota.cost_limit_cents,
      quota,
      tokensRemaining: quota.tokens_limit - quota.tokens_used,
      costRemainingCents: quota.cost_limit_cents - quota.cost_used_cents
    };
  }

  /**
   * Record usage event
   * Observability: Granular tracking for debugging and billing
   */
  async recordUsage({
    userId,
    metricType,
    endpoint,
    tokensUsed,
    costCents,
    durationMs = null,
    requestId = null,
    ipAddress = null,
    success = true,
    errorMessage = null
  }) {
    // Get or create current quota
    const quota = await this.getCurrentQuota(userId);

    // Check if would exceed limits (fail-safe)
    if (quota.tokens_used + tokensUsed > quota.tokens_limit * 1.1) {
      throw new Error('Token quota exceeded');
    }
    if (quota.cost_used_cents + costCents > quota.cost_limit_cents * 1.1) {
      throw new Error('Cost quota exceeded');
    }

    return await db.transaction(async (client) => {
      // Insert usage event
      const eventQuery = `
        INSERT INTO usage_events (
          user_id,
          quota_id,
          metric_type,
          endpoint,
          tokens_used,
          cost_cents,
          duration_ms,
          request_id,
          ip_address,
          success,
          error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, created_at
      `;

      const eventValues = [
        userId,
        quota.id,
        metricType,
        endpoint,
        tokensUsed,
        costCents,
        durationMs,
        requestId,
        ipAddress,
        success,
        errorMessage
      ];

      const eventResult = await client.query(eventQuery, eventValues);

      // Update quota totals
      const updateQuery = `
        UPDATE usage_quotas
        SET
          tokens_used = tokens_used + $1,
          requests_used = requests_used + 1,
          cost_used_cents = cost_used_cents + $2
        WHERE id = $3
        RETURNING
          tokens_used,
          tokens_limit,
          cost_used_cents,
          cost_limit_cents
      `;

      const updateValues = [tokensUsed, costCents, quota.id];
      const updateResult = await client.query(updateQuery, updateValues);

      const updatedQuota = updateResult.rows[0];

      // Alert if approaching limits (90% threshold)
      if (updatedQuota.tokens_used / updatedQuota.tokens_limit >= 0.9) {
        await this.alertQuotaThreshold(userId, 'tokens', 90);
      }
      if (updatedQuota.cost_used_cents / updatedQuota.cost_limit_cents >= 0.9) {
        await this.alertQuotaThreshold(userId, 'cost', 90);
      }

      return {
        eventId: eventResult.rows[0].id,
        quota: updatedQuota
      };
    });
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId, period = 'current') {
    let periodCondition = '';

    if (period === 'current') {
      periodCondition = `AND ue.created_at >= date_trunc('month', CURRENT_TIMESTAMP)`;
    } else if (period === 'last30d') {
      periodCondition = `AND ue.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'`;
    } else if (period === 'all') {
      periodCondition = '';
    }

    const query = `
      SELECT
        COUNT(*) as total_requests,
        SUM(tokens_used) as total_tokens,
        SUM(cost_cents) as total_cost_cents,
        AVG(duration_ms) as avg_duration_ms,
        COUNT(*) FILTER (WHERE NOT success) as failed_requests,
        json_object_agg(
          metric_type,
          json_build_object(
            'count', COUNT(*),
            'tokens', SUM(tokens_used),
            'cost_cents', SUM(cost_cents)
          )
        ) FILTER (WHERE metric_type IS NOT NULL) as by_metric_type
      FROM usage_events ue
      WHERE ue.user_id = $1
        ${periodCondition}
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get top users by usage (admin dashboard)
   */
  async getTopUsers(limit = 10, orderBy = 'cost') {
    const orderColumn = orderBy === 'cost' ? 'cost_used_cents' : 'tokens_used';

    const query = `
      SELECT
        u.id,
        u.email,
        u.name,
        u.tier,
        uq.tokens_used,
        uq.tokens_limit,
        uq.cost_used_cents,
        uq.cost_limit_cents,
        (uq.tokens_used::FLOAT / uq.tokens_limit * 100) as tokens_usage_pct,
        (uq.cost_used_cents::FLOAT / uq.cost_limit_cents * 100) as cost_usage_pct
      FROM usage_quotas uq
      JOIN users u ON uq.user_id = u.id
      WHERE uq.period_start = date_trunc('month', CURRENT_TIMESTAMP)
        AND u.deleted_at IS NULL
      ORDER BY uq.${orderColumn} DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /**
   * Reset monthly quotas
   * Maintenance: Run on 1st of each month
   */
  async resetMonthlyQuotas() {
    // Mark old quotas as ended
    const endQuery = `
      UPDATE usage_quotas
      SET period_end = CURRENT_TIMESTAMP
      WHERE period_end > CURRENT_TIMESTAMP
        AND period_start < date_trunc('month', CURRENT_TIMESTAMP)
    `;
    await db.query(endQuery);

    // Create new quotas for all active users
    const createQuery = `
      INSERT INTO usage_quotas (user_id, period_start, period_end, tokens_limit, requests_limit, cost_limit_cents)
      SELECT
        u.id,
        date_trunc('month', CURRENT_TIMESTAMP),
        (date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month') - INTERVAL '1 second',
        CASE u.tier
          WHEN 'free' THEN 50000
          WHEN 'pro' THEN 500000
          WHEN 'ultimate' THEN 5000000
        END,
        CASE u.tier
          WHEN 'free' THEN 100
          WHEN 'pro' THEN 1000
          WHEN 'ultimate' THEN 10000
        END,
        CASE u.tier
          WHEN 'free' THEN 200
          WHEN 'pro' THEN 1000
          WHEN 'ultimate' THEN 5000
        END
      FROM users u
      WHERE u.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM usage_quotas uq
          WHERE uq.user_id = u.id
            AND uq.period_start = date_trunc('month', CURRENT_TIMESTAMP)
        )
    `;

    const result = await db.query(createQuery);
    console.log(`[UsageRepo] Created ${result.rowCount} new monthly quotas`);
    return result.rowCount;
  }

  /**
   * Helper: Create quota for current month
   */
  async createQuotaForCurrentMonth(userId) {
    // Get user tier
    const userQuery = 'SELECT tier FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const tier = userResult.rows[0].tier;

    // Create quota using stored function
    const quotaQuery = 'SELECT create_monthly_quota($1, $2) as quota_id';
    await db.query(quotaQuery, [userId, tier]);

    // Return the created quota
    return await this.getCurrentQuota(userId);
  }

  /**
   * Helper: Alert on quota threshold
   */
  async alertQuotaThreshold(userId, quotaType, percentage) {
    console.warn(`[UsageRepo] User ${userId} reached ${percentage}% of ${quotaType} quota`);

    // Log to audit trail
    const auditQuery = `
      INSERT INTO audit_log (
        user_id,
        event_type,
        event_category,
        severity,
        description
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await db.query(auditQuery, [
      userId,
      'quota_threshold',
      'billing',
      'warning',
      `Reached ${percentage}% of ${quotaType} quota`
    ]);

    // In production: Send email notification
    // TODO: Integrate with SendGrid
  }

  /**
   * Get system-wide usage statistics
   */
  async getSystemStats() {
    const query = `
      SELECT
        COUNT(DISTINCT user_id) as active_users,
        SUM(tokens_used) as total_tokens_used,
        SUM(cost_used_cents) as total_cost_cents,
        SUM(requests_used) as total_requests,
        AVG(tokens_used::FLOAT / NULLIF(tokens_limit, 0) * 100) as avg_quota_usage_pct,
        COUNT(*) FILTER (
          WHERE tokens_used::FLOAT / tokens_limit >= 0.9
        ) as users_near_limit
      FROM usage_quotas
      WHERE period_start = date_trunc('month', CURRENT_TIMESTAMP)
    `;

    const result = await db.query(query);
    return result.rows[0];
  }
}

// Singleton instance
const usageRepository = new UsageRepository();

export default usageRepository;
export { UsageRepository };
