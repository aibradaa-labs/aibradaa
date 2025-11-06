/**
 * IndexedDB Manager
 * Handles all IndexedDB operations for offline data storage
 */

export class DBManager {
  constructor(dbName = 'ai_bradaa_db', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Laptops store
        if (!db.objectStoreNames.contains('laptops')) {
          const laptopsStore = db.createObjectStore('laptops', { keyPath: 'id' });
          laptopsStore.createIndex('brand', 'brand', { unique: false });
          laptopsStore.createIndex('price', 'price_MYR', { unique: false });
        }

        // User preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }

        // Cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'url' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Search history
        if (!db.objectStoreNames.contains('searchHistory')) {
          const searchStore = db.createObjectStore('searchHistory', { keyPath: 'id', autoIncrement: true });
          searchStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Favorites
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'laptopId' });
        }
      };
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Laptop-specific methods
  async saveLaptop(laptop) {
    return this.put('laptops', laptop);
  }

  async getLaptop(id) {
    return this.get('laptops', id);
  }

  async getAllLaptops() {
    return this.getAll('laptops');
  }

  async getLaptopsByBrand(brand) {
    return this.query('laptops', 'brand', brand);
  }

  // Favorites methods
  async addFavorite(laptopId) {
    return this.add('favorites', {
      laptopId,
      addedAt: new Date().toISOString()
    });
  }

  async removeFavorite(laptopId) {
    return this.delete('favorites', laptopId);
  }

  async getFavorites() {
    return this.getAll('favorites');
  }

  async isFavorite(laptopId) {
    const fav = await this.get('favorites', laptopId);
    return !!fav;
  }

  // Search history methods
  async addSearch(query, results) {
    return this.add('searchHistory', {
      query,
      results: results.length,
      timestamp: Date.now()
    });
  }

  async getSearchHistory(limit = 10) {
    const all = await this.getAll('searchHistory');
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async clearSearchHistory() {
    return this.clear('searchHistory');
  }

  // Cache methods with TTL
  async cacheData(url, data, ttlMinutes = 60) {
    return this.put('cache', {
      url,
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  async getCachedData(url) {
    const cached = await this.get('cache', url);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      await this.delete('cache', url);
      return null;
    }

    return cached.data;
  }

  // Preferences methods
  async setPreference(key, value) {
    return this.put('preferences', { key, value });
  }

  async getPreference(key) {
    const pref = await this.get('preferences', key);
    return pref?.value;
  }

  // Clear all data (for logout)
  async clearAll() {
    const storeNames = ['laptops', 'preferences', 'cache', 'searchHistory', 'favorites'];
    await Promise.all(storeNames.map(name => this.clear(name)));
  }

  // Database statistics
  async getStats() {
    const laptopsCount = (await this.getAll('laptops')).length;
    const favoritesCount = (await this.getAll('favorites')).length;
    const searchCount = (await this.getAll('searchHistory')).length;
    const cacheCount = (await this.getAll('cache')).length;

    return {
      laptops: laptopsCount,
      favorites: favoritesCount,
      searches: searchCount,
      cached: cacheCount
    };
  }
}

// Singleton instance
let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = new DBManager();
    await dbInstance.init();
  }
  return dbInstance;
}
