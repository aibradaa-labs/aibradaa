/**
 * Storage Utility
 * IndexedDB wrapper for offline data storage
 * (No localStorage per governance - use IndexedDB)
 */

const DB_NAME = 'ai_bradaa_db';
const DB_VERSION = 1;
const STORES = {
  laptops: 'laptops',
  favorites: 'favorites',
  history: 'history',
  cache: 'cache',
};

class StorageManager {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.laptops)) {
          db.createObjectStore(STORES.laptops, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.favorites)) {
          const favStore = db.createObjectStore(STORES.favorites, { keyPath: 'id', autoIncrement: true });
          favStore.createIndex('laptopId', 'laptopId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.history)) {
          const histStore = db.createObjectStore(STORES.history, { keyPath: 'id', autoIncrement: true });
          histStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.cache)) {
          const cacheStore = db.createObjectStore(STORES.cache, { keyPath: 'key' });
          cacheStore.createIndex('expires', 'expires', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get item from store
   */
  async get(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from store
   */
  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put item in store
   */
  async put(storeName, item) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete item from store
   */
  async delete(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear entire store
   */
  async clear(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache data with TTL
   */
  async setCache(key, data, ttlMs = 3600000) {
    const cacheItem = {
      key,
      data,
      expires: Date.now() + ttlMs,
    };
    return this.put(STORES.cache, cacheItem);
  }

  /**
   * Get cached data (returns null if expired)
   */
  async getCache(key) {
    const item = await this.get(STORES.cache, key);
    if (!item) return null;

    if (item.expires < Date.now()) {
      await this.delete(STORES.cache, key);
      return null;
    }

    return item.data;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    const allCache = await this.getAll(STORES.cache);
    const now = Date.now();

    for (const item of allCache) {
      if (item.expires < now) {
        await this.delete(STORES.cache, item.key);
      }
    }
  }
}

export const storage = new StorageManager();
export default storage;
