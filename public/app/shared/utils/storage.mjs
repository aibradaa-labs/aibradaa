/**
 * Storage Utility - IndexedDB + localStorage fallback
 * AI Bradaa PWA - Offline-first storage
 */

const DB_NAME = 'aibradaa_db';
const DB_VERSION = 1;
const STORE_NAMES = {
  auth: 'auth',
  cache: 'cache',
  preferences: 'preferences',
  history: 'history'
};

class StorageManager {
  constructor() {
    this.db = null;
    this.isIndexedDBAvailable = false;
  }

  async init() {
    try {
      // Try IndexedDB first
      this.db = await this.openIndexedDB();
      this.isIndexedDBAvailable = true;
      console.log('✅ IndexedDB initialized');
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error);
      this.isIndexedDBAvailable = false;
    }
  }

  openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORE_NAMES.auth)) {
          db.createObjectStore(STORE_NAMES.auth, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.cache)) {
          const cacheStore = db.createObjectStore(STORE_NAMES.cache, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.preferences)) {
          db.createObjectStore(STORE_NAMES.preferences, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.history)) {
          const historyStore = db.createObjectStore(STORE_NAMES.history, { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Token management
  async setToken(token) {
    if (this.isIndexedDBAvailable) {
      return this.setIndexedDB(STORE_NAMES.auth, { id: 'jwt_token', token, timestamp: Date.now() });
    } else {
      localStorage.setItem('jwt_token', token);
      return Promise.resolve();
    }
  }

  async getToken() {
    if (this.isIndexedDBAvailable) {
      const data = await this.getIndexedDB(STORE_NAMES.auth, 'jwt_token');
      return data?.token || null;
    } else {
      return localStorage.getItem('jwt_token');
    }
  }

  async clearToken() {
    if (this.isIndexedDBAvailable) {
      return this.deleteIndexedDB(STORE_NAMES.auth, 'jwt_token');
    } else {
      localStorage.removeItem('jwt_token');
      return Promise.resolve();
    }
  }

  // Cache management
  async setCache(key, value, ttl = 3600000) { // Default 1 hour TTL
    const cacheData = {
      key,
      value,
      timestamp: Date.now(),
      ttl
    };

    if (this.isIndexedDBAvailable) {
      return this.setIndexedDB(STORE_NAMES.cache, cacheData);
    } else {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
      return Promise.resolve();
    }
  }

  async getCache(key) {
    let cacheData;

    if (this.isIndexedDBAvailable) {
      cacheData = await this.getIndexedDB(STORE_NAMES.cache, key);
    } else {
      const stored = localStorage.getItem(`cache_${key}`);
      cacheData = stored ? JSON.parse(stored) : null;
    }

    if (!cacheData) return null;

    // Check TTL
    if (Date.now() - cacheData.timestamp > cacheData.ttl) {
      await this.clearCache(key);
      return null;
    }

    return cacheData.value;
  }

  async clearCache(key) {
    if (this.isIndexedDBAvailable) {
      return this.deleteIndexedDB(STORE_NAMES.cache, key);
    } else {
      localStorage.removeItem(`cache_${key}`);
      return Promise.resolve();
    }
  }

  // Preferences
  async setPreference(key, value) {
    if (this.isIndexedDBAvailable) {
      return this.setIndexedDB(STORE_NAMES.preferences, { key, value });
    } else {
      localStorage.setItem(`pref_${key}`, JSON.stringify(value));
      return Promise.resolve();
    }
  }

  async getPreference(key) {
    if (this.isIndexedDBAvailable) {
      const data = await this.getIndexedDB(STORE_NAMES.preferences, key);
      return data?.value || null;
    } else {
      const stored = localStorage.getItem(`pref_${key}`);
      return stored ? JSON.parse(stored) : null;
    }
  }

  // History
  async addHistory(item) {
    const historyItem = {
      ...item,
      timestamp: Date.now()
    };

    if (this.isIndexedDBAvailable) {
      return this.addIndexedDB(STORE_NAMES.history, historyItem);
    } else {
      const history = this.getHistoryFromLocalStorage();
      history.unshift(historyItem);
      // Keep only last 100 items
      const trimmed = history.slice(0, 100);
      localStorage.setItem('history', JSON.stringify(trimmed));
      return Promise.resolve();
    }
  }

  async getHistory(limit = 50) {
    if (this.isIndexedDBAvailable) {
      return this.getAllIndexedDB(STORE_NAMES.history, limit);
    } else {
      const history = this.getHistoryFromLocalStorage();
      return history.slice(0, limit);
    }
  }

  getHistoryFromLocalStorage() {
    const stored = localStorage.getItem('history');
    return stored ? JSON.parse(stored) : [];
  }

  // IndexedDB helpers
  setIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getIndexedDB(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  deleteIndexedDB(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  addIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getAllIndexedDB(storeName, limit = 50) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('timestamp');

      const request = index.openCursor(null, 'prev'); // Reverse order (newest first)
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const storage = new StorageManager();
