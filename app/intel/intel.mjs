/**
 * Intel Module
 * News feed, price drops, and ETL refresh triggers
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Intel {
  constructor() {
    this.feed = [];
    this.priceDrops = [];
    this.currentCategory = 'all'; // 'all', 'news', 'price-drop', 'new-release', 'deal'
    this.currentPage = 1;
    this.itemsPerPage = 20;
  }

  /**
   * Load Intel feed
   */
  async loadFeed(category = 'all', page = 1) {
    this.currentCategory = category;
    this.currentPage = page;

    try {
      // Check cache first
      const cacheKey = `intel-feed-${category}-${page}`;
      const cached = await storage.getCache(cacheKey);

      if (cached) {
        this.feed = cached;
        return this.feed;
      }

      // Fetch from API
      const response = await apiClient.get('/api/intel/feed', {
        params: {
          category,
          limit: this.itemsPerPage,
          offset: (page - 1) * this.itemsPerPage,
        },
      });

      this.feed = response.data.items || [];

      // Cache for 30 minutes
      await storage.setCache(cacheKey, this.feed, 1800000);

      return this.feed;
    } catch (error) {
      console.error('Failed to load Intel feed:', error);
      throw error;
    }
  }

  /**
   * Load price drops
   */
  async loadPriceDrops(days = 7, minDiscount = 10) {
    try {
      const response = await apiClient.get('/api/intel/price-drops', {
        params: { days, minDiscount },
      });

      this.priceDrops = response.data.priceDrops || [];
      return this.priceDrops;
    } catch (error) {
      console.error('Failed to load price drops:', error);
      throw error;
    }
  }

  /**
   * Trigger ETL refresh (Pro/Ultimate only)
   */
  async refreshData(source = 'all') {
    try {
      const response = await apiClient.post('/api/intel/refresh', { source });

      return {
        jobId: response.data.jobId,
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('ETL refresh requires Pro tier or higher');
      }
      throw error;
    }
  }

  /**
   * Filter feed by category
   */
  filterByCategory(category) {
    this.currentCategory = category;
    this.currentPage = 1;
    return this.loadFeed(category, 1);
  }

  /**
   * Get next page
   */
  async nextPage() {
    this.currentPage++;
    return this.loadFeed(this.currentCategory, this.currentPage);
  }

  /**
   * Get previous page
   */
  async previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      return this.loadFeed(this.currentCategory, this.currentPage);
    }
    return this.feed;
  }

  /**
   * Get feed summary
   */
  getSummary() {
    const categories = this.feed.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.feed.length,
      byCategory: categories,
      currentCategory: this.currentCategory,
      currentPage: this.currentPage,
    };
  }

  /**
   * Mark item as read
   */
  async markAsRead(itemId) {
    // Store in IndexedDB for offline
    try {
      await storage.put('history', {
        id: `intel-${itemId}`,
        itemId,
        action: 'read',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  /**
   * Share item
   */
  async shareItem(item) {
    const shareData = {
      title: item.title,
      text: item.description,
      url: item.url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        return false;
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(item.url);
        return true;
      } catch (error) {
        console.error('Copy failed:', error);
        return false;
      }
    }
  }
}

export default Intel;
