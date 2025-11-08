/**
 * AI Bradaa - Database Connection Module
 *
 * 84-Mentor Governance: Technical Excellence Council approved
 * Patterns: Connection pooling, health checks, graceful shutdown
 * Security: Environment-based config, no hardcoded credentials
 */

import pg from 'pg';
const { Pool } = pg;

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection pool
   * 84-Mentor Pattern: Fail fast on startup if DB unavailable
   */
  async connect() {
    if (this.isConnected) {
      console.log('[DB] Already connected');
      return this.pool;
    }

    try {
      // Connection config from environment
      const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'ai_bradaa',
        user: process.env.DB_USER || 'aibradaa',
        password: process.env.DB_PASSWORD,

        // Pool settings (optimized for serverless)
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '5000'),

        // SSL for production
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: true,
          ca: process.env.DB_SSL_CA
        } : false
      };

      // Validate required config
      if (!config.password) {
        throw new Error('DB_PASSWORD environment variable is required');
      }

      // Create pool
      this.pool = new Pool(config);

      // Error handler
      this.pool.on('error', (err) => {
        console.error('[DB] Unexpected pool error:', err);
        // Don't exit process, but log for monitoring
      });

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as now, version() as version');
      client.release();

      this.isConnected = true;
      console.log('[DB] Connected successfully');
      console.log(`[DB] PostgreSQL version: ${result.rows[0].version.split(' ')[1]}`);
      console.log(`[DB] Server time: ${result.rows[0].now}`);

      return this.pool;

    } catch (error) {
      console.error('[DB] Connection failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Health check
   * 84-Mentor Pattern: Explicit health monitoring
   */
  async healthCheck() {
    if (!this.pool) {
      return { healthy: false, error: 'Pool not initialized' };
    }

    try {
      const start = Date.now();
      const result = await this.pool.query('SELECT 1 as health');
      const latency = Date.now() - start;

      return {
        healthy: true,
        latency: `${latency}ms`,
        connections: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount
        }
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Execute query with automatic retry
   * 84-Mentor Pattern: Resilience with exponential backoff
   */
  async query(text, params, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const start = Date.now();
        const result = await this.pool.query(text, params);
        const duration = Date.now() - start;

        // Log slow queries (Observability requirement)
        if (duration > 1000) {
          console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
        }

        return result;

      } catch (error) {
        console.error(`[DB] Query error (attempt ${attempt}/${maxRetries}):`, error.message);

        // Retry on connection errors
        if (this.isRetryableError(error) && attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[DB] Retrying in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }
  }

  /**
   * Transaction support
   * 84-Mentor Pattern: ACID compliance for data integrity
   */
  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[DB] Transaction rolled back:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Graceful shutdown
   * 84-Mentor Pattern: Clean resource cleanup
   */
  async disconnect() {
    if (!this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.isConnected = false;
      console.log('[DB] Disconnected successfully');
    } catch (error) {
      console.error('[DB] Disconnect error:', error.message);
      throw error;
    }
  }

  /**
   * Maintenance operations
   */
  async cleanupExpiredSessions() {
    const result = await this.query('SELECT cleanup_expired_sessions()');
    const deletedCount = result.rows[0].cleanup_expired_sessions;
    console.log(`[DB] Cleaned up ${deletedCount} expired sessions`);
    return deletedCount;
  }

  async cleanupExpiredMagicLinks() {
    const result = await this.query('SELECT cleanup_expired_magic_links()');
    const deletedCount = result.rows[0].cleanup_expired_magic_links;
    console.log(`[DB] Cleaned up ${deletedCount} expired magic links`);
    return deletedCount;
  }

  /**
   * Helper methods
   */
  isRetryableError(error) {
    const retryableCodes = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      '57P03', // PostgreSQL: cannot connect now
      '53300', // PostgreSQL: too many connections
    ];
    return retryableCodes.includes(error.code);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Getters
   */
  getPool() {
    return this.pool;
  }

  isHealthy() {
    return this.isConnected && this.pool && this.pool.totalCount > 0;
  }
}

// Singleton instance (84-Mentor Pattern: Resource efficiency)
const db = new DatabaseConnection();

export default db;
export { db };
