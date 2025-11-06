/**
 * Database Helper
 * Enhanced IndexedDB operations for specific data types
 */

import { storage } from './storage.mjs';

/**
 * Laptop database operations
 */
export const laptopsDB = {
  async save(laptop) {
    return storage.put('laptops', laptop);
  },

  async get(id) {
    return storage.get('laptops', id);
  },

  async getAll() {
    return storage.getAll('laptops');
  },

  async delete(id) {
    return storage.delete('laptops', id);
  },

  async search(query) {
    const allLaptops = await this.getAll();
    const searchTerm = query.toLowerCase();

    return allLaptops.filter(laptop => {
      const searchText = [
        laptop.brand,
        laptop.model,
        laptop.specs?.cpu,
        laptop.specs?.gpu,
      ].join(' ').toLowerCase();

      return searchText.includes(searchTerm);
    });
  },
};

/**
 * Favorites database operations
 */
export const favoritesDB = {
  async add(laptopId) {
    return storage.put('favorites', {
      laptopId,
      addedAt: Date.now(),
    });
  },

  async remove(laptopId) {
    const favorites = await this.getAll();
    const favorite = favorites.find(f => f.laptopId === laptopId);
    if (favorite) {
      return storage.delete('favorites', favorite.id);
    }
  },

  async getAll() {
    return storage.getAll('favorites');
  },

  async isFavorite(laptopId) {
    const favorites = await this.getAll();
    return favorites.some(f => f.laptopId === laptopId);
  },

  async clear() {
    return storage.clear('favorites');
  },
};

/**
 * History database operations
 */
export const historyDB = {
  async add(action, data) {
    return storage.put('history', {
      action,
      data,
      timestamp: Date.now(),
    });
  },

  async getAll(limit = 50) {
    const allHistory = await storage.getAll('history');
    return allHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },

  async getByAction(action) {
    const allHistory = await this.getAll();
    return allHistory.filter(h => h.action === action);
  },

  async clear() {
    return storage.clear('history');
  },

  async clearOlderThan(days) {
    const allHistory = await storage.getAll('history');
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    for (const item of allHistory) {
      if (item.timestamp < cutoff) {
        await storage.delete('history', item.id);
      }
    }
  },
};

/**
 * Cache database operations
 */
export const cacheDB = {
  async set(key, data, ttl = 3600000) {
    return storage.setCache(key, data, ttl);
  },

  async get(key) {
    return storage.getCache(key);
  },

  async delete(key) {
    return storage.delete('cache', key);
  },

  async clear() {
    return storage.clear('cache');
  },

  async clearExpired() {
    return storage.clearExpiredCache();
  },
};

export default {
  laptopsDB,
  favoritesDB,
  historyDB,
  cacheDB,
};
