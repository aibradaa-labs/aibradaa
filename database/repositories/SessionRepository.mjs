/**
 * AI Bradaa - Session Repository
 *
 * 84-Mentor Governance: Security-first session management
 * Security: Token hashing, expiration enforcement, device tracking
 * Observability: Session metrics for monitoring
 */

import crypto from 'crypto';
import db from '../connection.mjs';

class SessionRepository {
  /**
   * Create new session
   * Security: Store hashed token, not plaintext (Hinton requirement)
   */
  async create({
    userId,
    token,
    expiresIn = '7d', // Default 7 days
    ipAddress = null,
    userAgent = null,
    deviceFingerprint = null
  }) {
    // Hash token with SHA-256
    const tokenHash = this.hashToken(token);

    // Calculate expiration
    const expiresAt = this.calculateExpiration(expiresIn);

    const query = `
      INSERT INTO sessions (
        user_id,
        token_hash,
        ip_address,
        user_agent,
        device_fingerprint,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, status, expires_at, created_at
    `;

    const values = [
      userId,
      tokenHash,
      ipAddress,
      userAgent,
      deviceFingerprint,
      expiresAt
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('[SessionRepo] Create error:', error.message);
      throw error;
    }
  }

  /**
   * Find session by token
   * Security: Check status and expiration
   */
  async findByToken(token) {
    const tokenHash = this.hashToken(token);

    const query = `
      SELECT
        s.id,
        s.user_id,
        s.status,
        s.expires_at,
        s.created_at,
        s.last_activity_at,
        u.email,
        u.name,
        u.tier
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = $1
        AND s.status = 'active'
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.deleted_at IS NULL
    `;

    const result = await db.query(query, [tokenHash]);
    return result.rows[0] || null;
  }

  /**
   * Update last activity timestamp
   * Observability: Track active sessions
   */
  async updateActivity(sessionId) {
    const query = `
      UPDATE sessions
      SET last_activity_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await db.query(query, [sessionId]);
  }

  /**
   * Revoke session (logout)
   */
  async revoke(sessionId, reason = 'user_logout') {
    const query = `
      UPDATE sessions
      SET
        status = 'revoked',
        revoked_at = CURRENT_TIMESTAMP,
        revoke_reason = $1
      WHERE id = $2
      RETURNING user_id
    `;

    const result = await db.query(query, [reason, sessionId]);

    if (result.rows[0]) {
      // Audit log
      await this.logAudit(
        result.rows[0].user_id,
        'session_revoked',
        'auth',
        'info',
        `Session revoked: ${reason}`
      );
    }

    return result.rowCount > 0;
  }

  /**
   * Revoke all sessions for user
   * Security: Force logout across all devices
   */
  async revokeAllForUser(userId, reason = 'security_reset') {
    const query = `
      UPDATE sessions
      SET
        status = 'revoked',
        revoked_at = CURRENT_TIMESTAMP,
        revoke_reason = $1
      WHERE user_id = $2 AND status = 'active'
      RETURNING id
    `;

    const result = await db.query(query, [reason, userId]);
    const revokedCount = result.rowCount;

    // Audit log
    await this.logAudit(
      userId,
      'all_sessions_revoked',
      'security',
      'warning',
      `All sessions revoked: ${reason} (${revokedCount} sessions)`
    );

    return revokedCount;
  }

  /**
   * List active sessions for user
   */
  async listForUser(userId, limit = 10) {
    const query = `
      SELECT
        id,
        status,
        ip_address,
        user_agent,
        device_fingerprint,
        created_at,
        last_activity_at,
        expires_at
      FROM sessions
      WHERE user_id = $1
        AND status = 'active'
      ORDER BY last_activity_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Cleanup expired sessions
   * Maintenance: Run daily via cron job
   */
  async cleanupExpired() {
    const query = `
      UPDATE sessions
      SET status = 'expired'
      WHERE status = 'active'
        AND expires_at < CURRENT_TIMESTAMP
      RETURNING id
    `;

    const result = await db.query(query);
    const expiredCount = result.rowCount;

    console.log(`[SessionRepo] Expired ${expiredCount} sessions`);
    return expiredCount;
  }

  /**
   * Session statistics
   */
  async getStats() {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_sessions,
        COUNT(*) FILTER (WHERE status = 'revoked') as revoked_sessions,
        COUNT(*) FILTER (
          WHERE status = 'active'
            AND last_activity_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        ) as active_last_hour,
        COUNT(*) FILTER (
          WHERE status = 'active'
            AND last_activity_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
        ) as active_last_24h,
        AVG(EXTRACT(EPOCH FROM (expires_at - created_at))) as avg_session_duration_sec
      FROM sessions
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Helper: Hash token with SHA-256
   */
  hashToken(token) {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Helper: Calculate expiration timestamp
   */
  calculateExpiration(expiresIn) {
    // Parse duration string (e.g., "7d", "24h", "60m")
    const match = expiresIn.match(/^(\d+)([dhm])$/);
    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    const [, value, unit] = match;
    const milliseconds = {
      d: parseInt(value) * 24 * 60 * 60 * 1000,
      h: parseInt(value) * 60 * 60 * 1000,
      m: parseInt(value) * 60 * 1000
    }[unit];

    return new Date(Date.now() + milliseconds);
  }

  /**
   * Helper: Audit logging
   */
  async logAudit(userId, eventType, category, severity, description) {
    const query = `
      INSERT INTO audit_log (
        user_id, event_type, event_category,
        severity, description
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [userId, eventType, category, severity, description]);
  }
}

// Singleton instance
const sessionRepository = new SessionRepository();

export default sessionRepository;
export { SessionRepository };
