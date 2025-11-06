/**
 * Appendices Module
 * Full Top-100 catalog with pagination and affiliate tracking
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Appendices {
  constructor() {
    this.laptops = [];
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.sortBy = 'rank'; // 'rank', 'price', 'value', 'newest'
    this.filterBySegment = 'all'; // 'all', 'budget', 'midrange', 'premium', 'flagship'
  }

  /**
   * Load full Top-100 catalog
   */
  async loadCatalog() {
    try {
      // Check cache first
      const cached = await storage.getCache('laptops-top100');

      if (cached) {
        this.laptops = cached;
        return this.applyFilters();
      }

      // Fetch from API
      const response = await apiClient.get('/api/laptops/top100');
      this.laptops = response.data || [];

      // Cache for 6 hours
      await storage.setCache('laptops-top100', this.laptops, 21600000);

      return this.applyFilters();
    } catch (error) {
      console.error('Failed to load catalog:', error);
      throw error;
    }
  }

  /**
   * Apply segment filter and sorting
   */
  applyFilters() {
    let filtered = this.laptops;

    // Filter by segment
    if (this.filterBySegment !== 'all') {
      filtered = filtered.filter(laptop => laptop.segment === this.filterBySegment);
    }

    // Sort
    switch (this.sortBy) {
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'value':
        filtered.sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
        break;
      case 'rank':
      default:
        filtered.sort((a, b) => (a.rank || 999) - (b.rank || 999));
        break;
    }

    return filtered;
  }

  /**
   * Get paginated results
   */
  getPage(pageNumber = this.currentPage) {
    this.currentPage = pageNumber;

    const filtered = this.applyFilters();
    const start = (pageNumber - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    return {
      laptops: filtered.slice(start, end),
      currentPage: pageNumber,
      totalPages: Math.ceil(filtered.length / this.itemsPerPage),
      totalItems: filtered.length,
      hasNext: end < filtered.length,
      hasPrev: pageNumber > 1,
    };
  }

  /**
   * Set segment filter
   */
  setSegmentFilter(segment) {
    this.filterBySegment = segment;
    this.currentPage = 1;
    return this.getPage(1);
  }

  /**
   * Set sorting
   */
  setSortBy(sortBy) {
    this.sortBy = sortBy;
    this.currentPage = 1;
    return this.getPage(1);
  }

  /**
   * Get laptop by ID
   */
  getLaptop(id) {
    return this.laptops.find(laptop => laptop.id === id);
  }

  /**
   * Get best offers
   */
  getBestOffers(limit = 10) {
    return this.laptops
      .filter(laptop => laptop.hasOffer || laptop.discount > 0)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, limit);
  }

  /**
   * Track affiliate click
   */
  async trackAffiliateClick(laptopId, platform = 'lazada') {
    try {
      // Track in analytics
      await storage.put('history', {
        id: `affiliate-${Date.now()}`,
        laptopId,
        platform,
        action: 'affiliate-click',
        timestamp: Date.now(),
      });

      // Get affiliate URL from API
      const laptop = this.getLaptop(laptopId);
      if (!laptop) {
        throw new Error('Laptop not found');
      }

      // Redirect to affiliate link
      const affiliateUrl = `/out/${laptopId}/${platform}`;
      window.open(affiliateUrl, '_blank');

      return true;
    } catch (error) {
      console.error('Affiliate tracking failed:', error);
      return false;
    }
  }

  /**
   * Get segment distribution
   */
  getSegmentDistribution() {
    const distribution = this.laptops.reduce((acc, laptop) => {
      const segment = laptop.segment || 'other';
      acc[segment] = (acc[segment] || 0) + 1;
      return acc;
    }, {});

    return distribution;
  }

  /**
   * Search catalog
   */
  search(query) {
    if (!query || query.trim() === '') {
      return this.laptops;
    }

    const searchTerm = query.toLowerCase().trim();

    return this.laptops.filter(laptop => {
      const searchableText = [
        laptop.brand,
        laptop.model,
        laptop.specs?.cpu,
        laptop.specs?.gpu,
        laptop.segment,
        ...(laptop.tags || []),
      ].join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }

  /**
   * Export catalog as CSV
   */
  exportCSV() {
    const headers = ['Rank', 'Brand', 'Model', 'CPU', 'GPU', 'RAM', 'Storage', 'Display', 'Price', 'Value Score'];

    const rows = this.laptops.map(laptop => [
      laptop.rank || '',
      laptop.brand || '',
      laptop.model || '',
      laptop.specs?.cpu || '',
      laptop.specs?.gpu || '',
      `${laptop.specs?.ram || ''}GB`,
      `${laptop.specs?.storage || ''}GB`,
      `${laptop.specs?.displaySize || ''}" ${laptop.specs?.resolution || ''}`,
      `RM ${laptop.price || 0}`,
      laptop.valueScore || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Download catalog as CSV file
   */
  downloadCSV() {
    const csv = this.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-bradaa-top100-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export default Appendices;
