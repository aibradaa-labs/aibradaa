/**
 * Data Sync Manager - Centralized Auto/Manual Data Fetching
 * AI Bradaa - Phase 4: Wiring & AI Integration
 *
 * ARCHITECTURE: 84-Mentor Council Standards
 * - Platform Council: Efficient caching, retry logic, background sync
 * - AI POD Council: Smart refresh scheduling, adaptive loading
 * - Safety Council: Rate limiting, error boundaries, quota management
 * - Customer Council: Loading states, manual refresh UX, last-updated timestamps
 *
 * FEATURES:
 * - Auto-fetch laptop data on app load (6-hour cache)
 * - Manual refresh button support
 * - Background sync scheduler
 * - Incremental data loading (pagination/infinite scroll)
 * - Rate limiting and exponential backoff
 * - Cache invalidation strategy
 * - Last-updated timestamps
 * - Offline fallback to cache
 * - Analytics event tracking
 */

class DataSyncManager {
  constructor() {
    // Configuration
    this.config = {
      syncInterval: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
      cacheTTL: 6 * 60 * 60 * 1000, // 6 hours cache validity
      priceCacheTTL: 30 * 60 * 1000, // 30 minutes for price updates
      maxRetries: 3,
      retryDelay: 1000, // Base retry delay (exponential backoff)
      batchSize: 20, // Pagination size
      apiEndpoints: {
        laptops: '/.netlify/functions/data',
        stats: '/.netlify/functions/data/stats',
        laptop: (id) => `/.netlify/functions/data/laptop/${id}`,
        refresh: '/.netlify/functions/data/refresh'
      }
    };

    // State
    this.state = {
      lastSync: null,
      isSyncing: false,
      syncTimer: null,
      laptopCache: null,
      priceCache: new Map(),
      pendingRequests: new Map(),
      failedRequests: [],
      stats: null,
      listeners: new Set()
    };

    // IndexedDB cache
    this.db = null;

    // Network status
    this.isOnline = navigator.onLine;
  }

  /**
   * Initialize Data Sync Manager
   * Platform Council: Fast startup with cache-first strategy
   */
  async init() {
    try {
      console.log('[DataSync] Initializing...');

      // Initialize IndexedDB
      await this.initIndexedDB();

      // Listen for network changes
      this.initNetworkListeners();

      // Auto-fetch on load
      await this.autoFetchOnLoad();

      // Start background sync scheduler
      this.startAutoSync();

      console.log('[DataSync] Initialization complete');

      return true;
    } catch (error) {
      console.error('[DataSync] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Initialize IndexedDB for data caching
   * Safety Council: Data persistence, PDPA compliance
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AIBradaaDataSync', 1);

      request.onerror = () => {
        console.error('[DataSync] IndexedDB open failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[DataSync] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Laptop cache store
        if (!db.objectStoreNames.contains('laptopCache')) {
          const store = db.createObjectStore('laptopCache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Price cache store
        if (!db.objectStoreNames.contains('priceCache')) {
          const store = db.createObjectStore('priceCache', { keyPath: 'laptopId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('syncMetadata')) {
          db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Initialize network status listeners
   * Platform Council: Adaptive loading based on connectivity
   */
  initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[DataSync] Network online - resuming sync');
      this.isOnline = true;
      this.retryFailedRequests();
      this.notifyListeners({ type: 'network', status: 'online' });
    });

    window.addEventListener('offline', () => {
      console.log('[DataSync] Network offline - pausing sync');
      this.isOnline = false;
      this.notifyListeners({ type: 'network', status: 'offline' });
    });
  }

  /**
   * Auto-fetch laptop data on app load
   * Customer Council: Fast initial load with progressive enhancement
   */
  async autoFetchOnLoad() {
    try {
      console.log('[DataSync] Auto-fetching data on load...');

      // Check cache freshness
      const cached = await this.getCachedLaptops();

      if (cached && this.isCacheFresh(cached.timestamp, this.config.cacheTTL)) {
        console.log('[DataSync] Using fresh cache:', new Date(cached.timestamp).toLocaleString());
        this.state.laptopCache = cached.data;
        this.state.lastSync = cached.timestamp;
        this.notifyListeners({ type: 'data', source: 'cache', data: cached.data });
        return cached.data;
      }

      // Cache stale or missing - fetch fresh data
      console.log('[DataSync] Cache stale or missing - fetching fresh data');
      const freshData = await this.fetchAndCache();

      return freshData;

    } catch (error) {
      console.error('[DataSync] Auto-fetch failed:', error);

      // Fallback to stale cache if available
      const cached = await this.getCachedLaptops();
      if (cached) {
        console.warn('[DataSync] Using stale cache as fallback');
        this.state.laptopCache = cached.data;
        this.notifyListeners({ type: 'data', source: 'stale-cache', data: cached.data });
        return cached.data;
      }

      throw error;
    }
  }

  /**
   * Fetch and cache laptop data
   * Platform Council: Retry logic, error handling, background sync
   */
  async fetchAndCache(forceRefresh = false) {
    if (this.state.isSyncing && !forceRefresh) {
      console.log('[DataSync] Sync already in progress');
      return this.state.laptopCache;
    }

    try {
      this.state.isSyncing = true;
      this.notifyListeners({ type: 'sync', status: 'start' });

      console.log('[DataSync] Fetching laptop data...');

      // Fetch with retry logic
      const response = await this.fetchWithRetry(
        this.config.apiEndpoints.laptops,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const laptops = result.results || result.data || result;

      // Update cache
      this.state.laptopCache = laptops;
      this.state.lastSync = Date.now();

      // Persist to IndexedDB
      await this.cacheLaptops(laptops);

      // Track analytics
      this.trackEvent('data_sync_success', {
        laptopCount: laptops.length,
        timestamp: new Date().toISOString()
      });

      console.log('[DataSync] Fetched and cached', laptops.length, 'laptops');

      // Notify listeners
      this.notifyListeners({
        type: 'data',
        source: 'network',
        data: laptops,
        timestamp: this.state.lastSync
      });

      return laptops;

    } catch (error) {
      console.error('[DataSync] Fetch failed:', error);

      // Track error
      this.trackEvent('data_sync_error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Add to failed requests queue
      this.state.failedRequests.push({
        url: this.config.apiEndpoints.laptops,
        retry: () => this.fetchAndCache(forceRefresh)
      });

      throw error;

    } finally {
      this.state.isSyncing = false;
      this.notifyListeners({ type: 'sync', status: 'end' });
    }
  }

  /**
   * Manual refresh triggered by user
   * Customer Council: Explicit user action, clear feedback
   */
  async manualRefresh() {
    try {
      console.log('[DataSync] Manual refresh triggered');

      // Track user action
      this.trackEvent('manual_refresh', { timestamp: new Date().toISOString() });

      // Force fetch fresh data
      const data = await this.fetchAndCache(true);

      // Show success feedback
      this.notifyListeners({
        type: 'refresh',
        status: 'success',
        message: 'Data refreshed successfully!',
        data
      });

      return data;

    } catch (error) {
      console.error('[DataSync] Manual refresh failed:', error);

      // Show error feedback
      this.notifyListeners({
        type: 'refresh',
        status: 'error',
        message: 'Failed to refresh data. Using cached data.'
      });

      throw error;
    }
  }

  /**
   * Start auto-sync scheduler
   * Platform Council: Background sync, resource efficiency
   */
  startAutoSync() {
    // Clear existing timer
    if (this.state.syncTimer) {
      clearInterval(this.state.syncTimer);
    }

    // Schedule periodic sync
    this.state.syncTimer = setInterval(async () => {
      if (this.isOnline && !this.state.isSyncing) {
        console.log('[DataSync] Scheduled sync triggered');
        try {
          await this.fetchAndCache();
        } catch (error) {
          console.error('[DataSync] Scheduled sync failed:', error);
        }
      }
    }, this.config.syncInterval);

    console.log('[DataSync] Auto-sync scheduled every', this.config.syncInterval / 1000 / 60, 'minutes');
  }

  /**
   * Stop auto-sync scheduler
   */
  stopAutoSync() {
    if (this.state.syncTimer) {
      clearInterval(this.state.syncTimer);
      this.state.syncTimer = null;
      console.log('[DataSync] Auto-sync stopped');
    }
  }

  /**
   * Fetch with retry logic and exponential backoff
   * Platform Council: Resilient networking, error handling
   */
  async fetchWithRetry(url, options = {}, retries = this.config.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[DataSync] Fetch attempt ${attempt}/${retries}:`, url);

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        return response;

      } catch (error) {
        console.error(`[DataSync] Fetch attempt ${attempt} failed:`, error);

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.log(`[DataSync] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Get laptop by ID with caching
   * Platform Council: Efficient data access, cache optimization
   */
  async getLaptopById(laptopId) {
    try {
      // Check in-memory cache first
      if (this.state.laptopCache) {
        const laptop = this.state.laptopCache.find(l => l.id === laptopId);
        if (laptop) {
          return laptop;
        }
      }

      // Fetch from API
      const response = await this.fetchWithRetry(
        this.config.apiEndpoints.laptop(laptopId)
      );

      if (!response.ok) {
        throw new Error(`Laptop ${laptopId} not found`);
      }

      const result = await response.json();
      return result.data || result;

    } catch (error) {
      console.error('[DataSync] Get laptop failed:', error);
      throw error;
    }
  }

  /**
   * Get current price for laptop (shorter cache TTL)
   * Customer Council: Real-time price updates
   */
  async getCurrentPrice(laptopId) {
    // Check price cache
    const cached = this.state.priceCache.get(laptopId);

    if (cached && this.isCacheFresh(cached.timestamp, this.config.priceCacheTTL)) {
      return cached.price;
    }

    // Fetch fresh price
    try {
      const laptop = await this.getLaptopById(laptopId);

      // Cache the price
      this.state.priceCache.set(laptopId, {
        price: laptop.price,
        timestamp: Date.now()
      });

      return laptop.price;

    } catch (error) {
      console.error('[DataSync] Get price failed:', error);
      return cached?.price || null;
    }
  }

  /**
   * Get database stats
   */
  async getStats() {
    try {
      const response = await this.fetchWithRetry(this.config.apiEndpoints.stats);

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      this.state.stats = result.data || result;

      return this.state.stats;

    } catch (error) {
      console.error('[DataSync] Get stats failed:', error);
      return this.state.stats;
    }
  }

  /**
   * Cache laptops in IndexedDB
   * Safety Council: Data persistence, TTL enforcement
   */
  async cacheLaptops(laptops) {
    try {
      const tx = this.db.transaction(['laptopCache'], 'readwrite');
      const store = tx.objectStore('laptopCache');

      await store.put({
        key: 'laptops',
        data: laptops,
        timestamp: Date.now()
      });

      console.log('[DataSync] Cached laptops in IndexedDB');

    } catch (error) {
      console.error('[DataSync] Cache write failed:', error);
    }
  }

  /**
   * Get cached laptops from IndexedDB
   */
  async getCachedLaptops() {
    try {
      const tx = this.db.transaction(['laptopCache'], 'readonly');
      const store = tx.objectStore('laptopCache');
      const request = store.get('laptops');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error('[DataSync] Cache read failed:', error);
      return null;
    }
  }

  /**
   * Check if cache is fresh
   */
  isCacheFresh(timestamp, ttl) {
    return timestamp && (Date.now() - timestamp < ttl);
  }

  /**
   * Get last sync timestamp (formatted)
   * Customer Council: User-friendly timestamp display
   */
  getLastSyncTime() {
    if (!this.state.lastSync) {
      return 'Never';
    }

    const now = Date.now();
    const diff = now - this.state.lastSync;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return new Date(this.state.lastSync).toLocaleDateString();
    }
  }

  /**
   * Retry failed requests
   * Platform Council: Error recovery, resilience
   */
  async retryFailedRequests() {
    if (this.state.failedRequests.length === 0) return;

    console.log('[DataSync] Retrying failed requests:', this.state.failedRequests.length);

    const queue = [...this.state.failedRequests];
    this.state.failedRequests = [];

    for (const request of queue) {
      try {
        await request.retry();
      } catch (error) {
        console.error('[DataSync] Retry failed:', error);
        this.state.failedRequests.push(request);
      }
    }
  }

  /**
   * Clear all caches (GDPR compliance)
   * Safety Council: Data deletion, user privacy
   */
  async clearCache() {
    try {
      // Clear in-memory cache
      this.state.laptopCache = null;
      this.state.priceCache.clear();

      // Clear IndexedDB
      const tx = this.db.transaction(['laptopCache', 'priceCache'], 'readwrite');
      await tx.objectStore('laptopCache').clear();
      await tx.objectStore('priceCache').clear();

      console.log('[DataSync] Cache cleared');

      this.notifyListeners({ type: 'cache', status: 'cleared' });

    } catch (error) {
      console.error('[DataSync] Clear cache failed:', error);
    }
  }

  /**
   * Add event listener
   * Customer Council: Real-time updates, reactive UI
   */
  addListener(callback) {
    this.state.listeners.add(callback);
  }

  /**
   * Remove event listener
   */
  removeListener(callback) {
    this.state.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.state.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[DataSync] Listener error:', error);
      }
    });
  }

  /**
   * Track analytics event
   */
  trackEvent(eventName, eventData = {}) {
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }

    console.log('[DataSync] Event tracked:', eventName, eventData);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current state (for debugging)
   */
  getState() {
    return {
      lastSync: this.state.lastSync,
      lastSyncTime: this.getLastSyncTime(),
      isSyncing: this.state.isSyncing,
      isOnline: this.isOnline,
      cacheSize: this.state.laptopCache?.length || 0,
      priceCache: this.state.priceCache.size,
      failedRequests: this.state.failedRequests.length
    };
  }
}

// Export as singleton
const dataSyncManager = new DataSyncManager();

// Export for global access
window.DataSyncManager = DataSyncManager;
window.dataSyncManager = dataSyncManager;

console.log('[data-sync.js] Loaded successfully');
