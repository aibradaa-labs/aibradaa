/**
 * AI Bradaa - User Repository
 *
 * 84-Mentor Governance: Technical Excellence + Governance & Safety Councils
 * Security: Bcrypt password hashing, email validation, soft deletes
 * PDPA: Consent tracking, data retention, user export/delete
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../connection.mjs';

class UserRepository {
  /**
   * Create new user with local auth
   * Hinton requirement: bcrypt hashing, no plaintext passwords
   */
  async create({ email, password, name, tier = 'free', consent = {} }) {
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength (min 8 chars, 1 uppercase, 1 number)
    if (password) {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
      }
    }

    // Hash password (Security Red Line compliance)
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const query = `
      INSERT INTO users (
        email,
        password_hash,
        name,
        tier,
        consent_marketing,
        consent_analytics,
        consent_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING
        id, email, name, tier, email_verified,
        consent_marketing, consent_analytics,
        created_at
    `;

    const values = [
      email.toLowerCase(),
      passwordHash,
      name,
      tier,
      consent.marketing || false,
      consent.analytics !== false // Default true
    ];

    try {
      const result = await db.query(query, values);
      const user = result.rows[0];

      // Create initial quota (Buffett requirement: cost controls from day 1)
      await this.createInitialQuota(user.id, user.tier);

      // Create default preferences
      await this.createDefaultPreferences(user.id);

      // Audit log
      await this.logAudit(user.id, 'user_created', 'auth', 'info', `User created with ${password ? 'local' : 'OAuth'} auth`);

      return user;

    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already registered');
      }
      throw error;
    }
  }

  /**
   * Create user from Google OAuth
   * Hinton requirement: Support OAuth without password
   */
  async createFromGoogle({ email, name, googleId, picture }) {
    const query = `
      INSERT INTO users (
        email,
        name,
        google_id,
        picture_url,
        email_verified,
        tier
      ) VALUES ($1, $2, $3, $4, TRUE, 'free')
      ON CONFLICT (email) DO UPDATE SET
        google_id = EXCLUDED.google_id,
        picture_url = EXCLUDED.picture_url,
        email_verified = TRUE,
        last_login_at = CURRENT_TIMESTAMP
      RETURNING
        id, email, name, google_id, picture_url,
        tier, email_verified, created_at
    `;

    const values = [email.toLowerCase(), name, googleId, picture];
    const result = await db.query(query, values);
    const user = result.rows[0];

    // Create quota if new user
    if (result.rowCount === 1) {
      await this.createInitialQuota(user.id, user.tier);
      await this.createDefaultPreferences(user.id);
      await this.logAudit(user.id, 'user_created', 'auth', 'info', 'User created via Google OAuth');
    } else {
      await this.logAudit(user.id, 'login_google', 'auth', 'info', 'User logged in via Google OAuth');
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const query = `
      SELECT
        id, email, password_hash, name, google_id, picture_url,
        tier, tier_started_at, email_verified,
        consent_marketing, consent_analytics,
        created_at, last_login_at
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;

    const result = await db.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    const query = `
      SELECT
        id, email, name, google_id, picture_url,
        tier, tier_started_at, email_verified,
        consent_marketing, consent_analytics,
        created_at, last_login_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId) {
    const query = `
      SELECT
        id, email, name, google_id, picture_url,
        tier, email_verified, created_at
      FROM users
      WHERE google_id = $1 AND deleted_at IS NULL
    `;

    const result = await db.query(query, [googleId]);
    return result.rows[0] || null;
  }

  /**
   * Verify password
   * Security: Constant-time comparison via bcrypt
   */
  async verifyPassword(user, password) {
    if (!user.password_hash) {
      return false; // OAuth-only user
    }
    return await bcrypt.compare(password, user.password_hash);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId) {
    const query = `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await db.query(query, [userId]);
  }

  /**
   * Update user tier
   * Buffett requirement: Track tier changes for billing
   */
  async updateTier(userId, newTier) {
    return await db.transaction(async (client) => {
      // Update tier
      const updateQuery = `
        UPDATE users
        SET
          tier = $1,
          tier_started_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING tier
      `;
      await client.query(updateQuery, [newTier, userId]);

      // Create new quota for current month
      await this.createInitialQuota(userId, newTier);

      // Audit log
      await this.logAudit(userId, 'tier_changed', 'billing', 'info', `Tier upgraded to ${newTier}`);

      return { tier: newTier };
    });
  }

  /**
   * Soft delete user (PDPA compliance)
   * Hinton requirement: Retain audit trail, anonymize PII
   */
  async delete(userId, reason = 'user_requested') {
    return await db.transaction(async (client) => {
      // Anonymize PII
      const anonymizeQuery = `
        UPDATE users
        SET
          email = $1,
          name = 'Deleted User',
          google_id = NULL,
          picture_url = NULL,
          password_hash = NULL,
          deleted_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      const anonymizedEmail = `deleted_${userId}@aibradaa.local`;
      await client.query(anonymizeQuery, [anonymizedEmail, userId]);

      // Revoke all sessions
      const revokeQuery = `
        UPDATE sessions
        SET
          status = 'revoked',
          revoked_at = CURRENT_TIMESTAMP,
          revoke_reason = $1
        WHERE user_id = $2
      `;
      await client.query(revokeQuery, [reason, userId]);

      // Audit log
      await this.logAudit(userId, 'user_deleted', 'data', 'warning', `User data deleted: ${reason}`);
    });
  }

  /**
   * Export user data (PDPA right to portability)
   */
  async exportData(userId) {
    const queries = {
      user: 'SELECT * FROM users WHERE id = $1',
      preferences: 'SELECT * FROM preferences WHERE user_id = $1',
      sessions: 'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      quotas: 'SELECT * FROM usage_quotas WHERE user_id = $1 ORDER BY period_start DESC LIMIT 6',
      usage: 'SELECT * FROM usage_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      audit: 'SELECT * FROM audit_log WHERE user_id = $1 ORDER BY created_at DESC'
    };

    const exportData = {};

    for (const [key, query] of Object.entries(queries)) {
      const result = await db.query(query, [userId]);
      exportData[key] = result.rows;
    }

    // Audit log
    await this.logAudit(userId, 'data_exported', 'data', 'info', 'User exported their data');

    return {
      exportDate: new Date().toISOString(),
      userId,
      data: exportData
    };
  }

  /**
   * Helper: Create initial usage quota
   */
  async createInitialQuota(userId, tier) {
    const query = 'SELECT create_monthly_quota($1, $2)';
    await db.query(query, [userId, tier]);
  }

  /**
   * Helper: Create default preferences
   */
  async createDefaultPreferences(userId) {
    const query = `
      INSERT INTO preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `;
    await db.query(query, [userId]);
  }

  /**
   * Helper: Audit logging
   */
  async logAudit(userId, eventType, category, severity, description, metadata = null) {
    const query = `
      INSERT INTO audit_log (
        user_id, event_type, event_category,
        severity, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.query(query, [userId, eventType, category, severity, description, metadata]);
  }

  /**
   * Statistics (for admin dashboard)
   */
  async getStats() {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_users,
        COUNT(*) FILTER (WHERE tier = 'free') as free_users,
        COUNT(*) FILTER (WHERE tier = 'pro') as pro_users,
        COUNT(*) FILTER (WHERE tier = 'ultimate') as ultimate_users,
        COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as new_users_30d,
        COUNT(*) FILTER (WHERE last_login_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as active_users_7d
      FROM users
    `;
    const result = await db.query(query);
    return result.rows[0];
  }
}

// Singleton instance
const userRepository = new UserRepository();

export default userRepository;
export { UserRepository };
