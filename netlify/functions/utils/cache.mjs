/**
 * Server-Side Cache Manager (Netlify Blobs + In-Memory)
 * 84-Mentor Approved: Jeff Bezos (Mentor 4) - Technical Excellence
 *
 * Multi-layer caching for Netlify Functions:
 * - Layer 1: In-memory (fastest, volatile)
 * - Layer 2: Netlify Blobs (persistent, serverless-friendly)
 * - Layer 3: Stale-while-revalidate (serve stale + update in background)
 *
 * Features:
 * - TTL expiration
 * - Cache keys with hashing
 * - Compression (gzip)
 * - Cache statistics
 * - Automatic cleanup
 *
 * @module cache
 */

import crypto from 'crypto';
import { promisify } from 'util';
import zlib from 'zlib';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * In-memory cache (shared across invocations within same instance)
 */
const memoryCache = new Map();

/**
 * Cache statistics
 */
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

/**
 * Generate cache key from object
 *
 * @param {any} keyData - Data to hash (string, object, array)
 * @returns {string} SHA-256 hash (hex)
 */
export function generateCacheKey(keyData) {
  const keyString = typeof keyData === 'string'
    ? keyData
    : JSON.stringify(keyData);

  return crypto
    .createHash('sha256')
    .update(keyString)
    .digest('hex');
}

/**
 * Cache entry structure
 */
class CacheEntry {
  constructor(value, ttl) {
    this.value = value;
    this.createdAt = Date.now();
    this.expiresAt = ttl ? Date.now() + ttl : null;
    this.hits = 0;
    this.lastAccessedAt = Date.now();
  }

  isExpired() {
    return this.expiresAt && Date.now() > this.expiresAt;
  }

  isStale(staleTTL) {
    if (!staleTTL) return false;
    return Date.now() > this.createdAt + staleTTL;
  }

  touch() {
    this.hits++;
    this.lastAccessedAt = Date.now();
  }
}

/**
 * In-Memory Cache Manager
 *
 * Fast, volatile cache for frequently accessed data.
 * Data lost when function instance is recycled.
 */
export class MemoryCache {
  /**
   * Get value from memory cache
   *
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  get(key) {
    const entry = memoryCache.get(key);

    if (!entry) {
      stats.misses++;
      return null;
    }

    if (entry.isExpired()) {
      memoryCache.delete(key);
      stats.misses++;
      return null;
    }

    entry.touch();
    stats.hits++;
    return entry.value;
  }

  /**
   * Set value in memory cache
   *
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = null) {
    memoryCache.set(key, new CacheEntry(value, ttl));
    stats.sets++;
  }

  /**
   * Delete value from memory cache
   *
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted
   */
  delete(key) {
    const deleted = memoryCache.delete(key);
    if (deleted) stats.deletes++;
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear() {
    memoryCache.clear();
  }

  /**
   * Get cache size
   *
   * @returns {number} Number of entries
   */
  size() {
    return memoryCache.size;
  }

  /**
   * Clean up expired entries
   *
   * @returns {number} Number of entries deleted
   */
  cleanup() {
    let deleted = 0;

    for (const [key, entry] of memoryCache.entries()) {
      if (entry.isExpired()) {
        memoryCache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      ...stats,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      size: memoryCache.size,
    };
  }
}

/**
 * Netlify Blobs Cache Manager
 *
 * Persistent cache using Netlify Blobs (serverless key-value store).
 * Survives function instance recycling.
 *
 * Note: Requires Netlify Blobs addon (free tier: 1GB storage)
 * Install: `npm install @netlify/blobs`
 */
export class BlobsCache {
  constructor() {
    this.enabled = false;
    this.store = null;

    try {
      // Lazy load @netlify/blobs (optional dependency)
      const { getStore } = require('@netlify/blobs');
      this.store = getStore({ name: 'ai-bradaa-cache', siteID: process.env.SITE_ID });
      this.enabled = true;
    } catch (error) {
      console.warn('[BlobsCache] Netlify Blobs not available:', error.message);
    }
  }

  /**
   * Get value from Netlify Blobs
   *
   * @param {string} key - Cache key
   * @param {Object} options - Options
   * @param {boolean} options.decompress - Decompress gzipped data
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key, options = {}) {
    if (!this.enabled) return null;

    try {
      const data = await this.store.get(key);

      if (!data) {
        stats.misses++;
        return null;
      }

      // Parse JSON metadata
      const entry = JSON.parse(data);

      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        stats.misses++;
        return null;
      }

      // Decompress if needed
      let value = entry.value;
      if (options.decompress && entry.compressed) {
        const buffer = Buffer.from(value, 'base64');
        const decompressed = await gunzip(buffer);
        value = JSON.parse(decompressed.toString());
      }

      stats.hits++;
      return value;

    } catch (error) {
      console.error('[BlobsCache] Get error:', error);
      stats.errors++;
      return null;
    }
  }

  /**
   * Set value in Netlify Blobs
   *
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   * @param {Object} options - Options
   * @param {boolean} options.compress - Compress data with gzip
   * @returns {Promise<boolean>} True if successful
   */
  async set(key, value, ttl = null, options = {}) {
    if (!this.enabled) return false;

    try {
      let finalValue = value;
      let compressed = false;

      // Compress large objects
      if (options.compress) {
        const json = JSON.stringify(value);
        const buffer = await gzip(Buffer.from(json));
        finalValue = buffer.toString('base64');
        compressed = true;
      }

      const entry = {
        value: finalValue,
        createdAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : null,
        compressed,
      };

      await this.store.set(key, JSON.stringify(entry));
      stats.sets++;
      return true;

    } catch (error) {
      console.error('[BlobsCache] Set error:', error);
      stats.errors++;
      return false;
    }
  }

  /**
   * Delete value from Netlify Blobs
   *
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(key) {
    if (!this.enabled) return false;

    try {
      await this.store.delete(key);
      stats.deletes++;
      return true;
    } catch (error) {
      console.error('[BlobsCache] Delete error:', error);
      stats.errors++;
      return false;
    }
  }
}

/**
 * Multi-Layer Cache Manager
 *
 * Orchestrates memory + blobs caching with stale-while-revalidate pattern.
 */
export class CacheManager {
  constructor() {
    this.memory = new MemoryCache();
    this.blobs = new BlobsCache();
  }

  /**
   * Get value from cache (memory → blobs)
   *
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    // Try memory first (fastest)
    let value = this.memory.get(key);
    if (value !== null) {
      return value;
    }

    // Try blobs (persistent)
    value = await this.blobs.get(key, { decompress: true });
    if (value !== null) {
      // Populate memory cache
      this.memory.set(key, value, 5 * 60 * 1000); // 5 minutes
      return value;
    }

    return null;
  }

  /**
   * Set value in cache (memory + blobs)
   *
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  async set(key, value, ttl = null) {
    // Set in memory (fast access)
    this.memory.set(key, value, ttl);

    // Set in blobs (persistent)
    await this.blobs.set(key, value, ttl, { compress: true });
  }

  /**
   * Delete value from cache (memory + blobs)
   *
   * @param {string} key - Cache key
   */
  async delete(key) {
    this.memory.delete(key);
    await this.blobs.delete(key);
  }

  /**
   * Get or compute value with caching
   *
   * @param {string} key - Cache key
   * @param {Function} compute - Async function to compute value
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>} Cached or computed value
   *
   * @example
   * const laptops = await cache.getOrCompute(
   *   'laptops:top100',
   *   async () => {
   *     return await fetchLaptopsFromDB();
   *   },
   *   60 * 60 * 1000 // 1 hour
   * );
   */
  async getOrCompute(key, compute, ttl = null) {
    // Try cache first
    let value = await this.get(key);
    if (value !== null) {
      return value;
    }

    // Compute value
    value = await compute();

    // Cache it
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Stale-while-revalidate pattern
   *
   * Serve stale data immediately while revalidating in background.
   *
   * @param {string} key - Cache key
   * @param {Function} compute - Async function to compute fresh value
   * @param {number} ttl - Fresh TTL in milliseconds
   * @param {number} staleTTL - Stale TTL in milliseconds
   * @returns {Promise<any>} Stale or fresh value
   */
  async staleWhileRevalidate(key, compute, ttl, staleTTL) {
    // Try cache
    let value = await this.get(key);

    // Check if stale
    const entry = memoryCache.get(key);
    const isStale = entry && entry.isStale(staleTTL);

    if (value !== null && !isStale) {
      // Fresh data, return immediately
      return value;
    }

    if (value !== null && isStale) {
      // Stale data, revalidate in background
      setImmediate(async () => {
        try {
          const freshValue = await compute();
          await this.set(key, freshValue, ttl);
        } catch (error) {
          console.error('[Cache] Revalidation error:', error);
        }
      });

      // Return stale data immediately
      return value;
    }

    // No cache, compute and cache
    value = await compute();
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache stats
   */
  getStats() {
    return this.memory.getStats();
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    return this.memory.cleanup();
  }
}

/**
 * Singleton instance
 */
let cacheInstance = null;

export function getCacheManager() {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
}

export default {
  getCacheManager,
  CacheManager,
  MemoryCache,
  BlobsCache,
  generateCacheKey,
};
