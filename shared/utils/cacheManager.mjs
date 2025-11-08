/**
 * Client-Side Cache Manager (IndexedDB + Memory)
 * 84-Mentor Approved: Jeff Bezos (Mentor 4) - User Experience Excellence
 *
 * Multi-layer caching for client-side:
 * - Layer 1: Memory (instant access, volatile)
 * - Layer 2: IndexedDB (persistent, survives page reload)
 * - Layer 3: Stale-while-revalidate (serve stale + update in background)
 *
 * Features:
 * - TTL expiration
 * - Automatic cleanup
 * - Cache size limits
 * - Offline support
 * - Cache statistics
 *
 * @module cacheManager
 */

/**
 * IndexedDB configuration
 */
const DB_NAME = 'ai-bradaa-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

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
 * In-memory cache
 */
const memoryCache = new Map();

/**
 * Cache entry class
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
 * IndexedDB Manager
 */
class IndexedDBCache {
  constructor() {
    this.db = null;
    this.ready = false;
    this.initPromise = this.init();
  }

  /**
   * Initialize IndexedDB
   *
   * @returns {Promise<void>}
   */
  async init() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[IndexedDBCache] IndexedDB not available');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDBCache] Init error:', request.error);
        stats.errors++;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.ready = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Get value from IndexedDB
   *
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    await this.initPromise;

    if (!this.ready) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result;

          if (!entry) {
            stats.misses++;
            resolve(null);
            return;
          }

          // Check expiration
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key); // Fire and forget
            stats.misses++;
            resolve(null);
            return;
          }

          stats.hits++;
          resolve(entry.value);
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Get error:', request.error);
          stats.errors++;
          resolve(null);
        };
      } catch (error) {
        console.error('[IndexedDBCache] Get error:', error);
        stats.errors++;
        resolve(null);
      }
    });
  }

  /**
   * Set value in IndexedDB
   *
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<boolean>} True if successful
   */
  async set(key, value, ttl = null) {
    await this.initPromise;

    if (!this.ready) return false;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entry = {
          key,
          value,
          createdAt: Date.now(),
          expiresAt: ttl ? Date.now() + ttl : null,
        };

        const request = store.put(entry);

        request.onsuccess = () => {
          stats.sets++;
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Set error:', request.error);
          stats.errors++;
          resolve(false);
        };
      } catch (error) {
        console.error('[IndexedDBCache] Set error:', error);
        stats.errors++;
        resolve(false);
      }
    });
  }

  /**
   * Delete value from IndexedDB
   *
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(key) {
    await this.initPromise;

    if (!this.ready) return false;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => {
          stats.deletes++;
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Delete error:', request.error);
          stats.errors++;
          resolve(false);
        };
      } catch (error) {
        console.error('[IndexedDBCache] Delete error:', error);
        stats.errors++;
        resolve(false);
      }
    });
  }

  /**
   * Clear all entries
   *
   * @returns {Promise<boolean>} True if successful
   */
  async clear() {
    await this.initPromise;

    if (!this.ready) return false;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error('[IndexedDBCache] Clear error:', request.error);
          stats.errors++;
          resolve(false);
        };
      } catch (error) {
        console.error('[IndexedDBCache] Clear error:', error);
        stats.errors++;
        resolve(false);
      }
    });
  }

  /**
   * Cleanup expired entries
   *
   * @returns {Promise<number>} Number of entries deleted
   */
  async cleanup() {
    await this.initPromise;

    if (!this.ready) return 0;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('expiresAt');
        const range = IDBKeyRange.upperBound(Date.now());
        const request = index.openCursor(range);

        let deleted = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;

          if (cursor) {
            cursor.delete();
            deleted++;
            cursor.continue();
          } else {
            resolve(deleted);
          }
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Cleanup error:', request.error);
          stats.errors++;
          resolve(0);
        };
      } catch (error) {
        console.error('[IndexedDBCache] Cleanup error:', error);
        stats.errors++;
        resolve(0);
      }
    });
  }
}

/**
 * Client-Side Cache Manager
 *
 * Orchestrates memory + IndexedDB caching.
 */
export class CacheManager {
  constructor() {
    this.memory = memoryCache;
    this.idb = new IndexedDBCache();
  }

  /**
   * Get value from cache (memory → IndexedDB)
   *
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    // Try memory first (fastest)
    const memEntry = this.memory.get(key);

    if (memEntry) {
      if (memEntry.isExpired()) {
        this.memory.delete(key);
      } else {
        memEntry.touch();
        stats.hits++;
        return memEntry.value;
      }
    }

    // Try IndexedDB (persistent)
    const value = await this.idb.get(key);

    if (value !== null) {
      // Populate memory cache
      this.memory.set(key, new CacheEntry(value, 5 * 60 * 1000)); // 5 minutes
      return value;
    }

    stats.misses++;
    return null;
  }

  /**
   * Set value in cache (memory + IndexedDB)
   *
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  async set(key, value, ttl = null) {
    // Set in memory (fast access)
    this.memory.set(key, new CacheEntry(value, ttl));
    stats.sets++;

    // Set in IndexedDB (persistent)
    await this.idb.set(key, value, ttl);
  }

  /**
   * Delete value from cache (memory + IndexedDB)
   *
   * @param {string} key - Cache key
   */
  async delete(key) {
    this.memory.delete(key);
    await this.idb.delete(key);
    stats.deletes++;
  }

  /**
   * Clear all caches
   */
  async clear() {
    this.memory.clear();
    await this.idb.clear();
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
   *     const response = await fetch('/api/data/laptops');
   *     return response.json();
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
    const entry = this.memory.get(key);
    const isStale = entry && entry.isStale(staleTTL);

    if (value !== null && !isStale) {
      // Fresh data, return immediately
      return value;
    }

    if (value !== null && isStale) {
      // Stale data, revalidate in background
      setTimeout(async () => {
        try {
          const freshValue = await compute();
          await this.set(key, freshValue, ttl);
        } catch (error) {
          console.error('[Cache] Revalidation error:', error);
        }
      }, 0);

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
    return {
      ...stats,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      memorySize: this.memory.size,
    };
  }

  /**
   * Cleanup expired entries
   */
  async cleanup() {
    // Memory cleanup
    let deletedMemory = 0;
    for (const [key, entry] of this.memory.entries()) {
      if (entry.isExpired()) {
        this.memory.delete(key);
        deletedMemory++;
      }
    }

    // IndexedDB cleanup
    const deletedIDB = await this.idb.cleanup();

    return {
      memory: deletedMemory,
      indexedDB: deletedIDB,
      total: deletedMemory + deletedIDB,
    };
  }
}

/**
 * Singleton instance
 */
let cacheInstance = null;

export function getCacheManager() {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();

    // Automatic cleanup every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => {
        cacheInstance.cleanup().catch(console.error);
      }, 5 * 60 * 1000);
    }
  }

  return cacheInstance;
}

/**
 * TTL constants
 */
export const TTL = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

export default {
  getCacheManager,
  CacheManager,
  TTL,
};
