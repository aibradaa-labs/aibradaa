/**
 * Appendices - Full Top 100 Laptop Catalog
 * AI Bradaa - Complete catalog with best offers & affiliate tracking
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Appendices {
  constructor() {
    this.laptopDatabase = [];
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.searchQuery = '';
    this.sortBy = 'rank';
    this.userTier = 'free';
  }

  async init() {
    await this.loadUserTier();
    await this.loadLaptopDatabase();
    this.render();
    this.attachEventListeners();
  }

  async loadUserTier() {
    try {
      const response = await apiClient.getUserProfile();
      this.userTier = response.data.user.tier || 'free';
    } catch (error) {
      this.userTier = 'free';
    }
  }

  async loadLaptopDatabase() {
    try {
      const cached = await storage.getCache('laptops_db');
      if (cached) {
        this.laptopDatabase = cached;
        return;
      }

      const response = await fetch('/data/laptops.json');
      const fullData = await response.json();

      // Free tier: Top 35, Pro/Ultimate: All 100
      this.laptopDatabase = this.userTier === 'free'
        ? fullData.slice(0, 35)
        : fullData;

      await storage.setCache('laptops_db', fullData, 3600000);
    } catch (error) {
      console.error('Failed to load laptop database:', error);
      this.showError('Failed to load catalog');
    }
  }

  getFilteredData() {
    let filtered = [...this.laptopDatabase];

    // Search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(laptop =>
        `${laptop.brand} ${laptop.model} ${laptop.cpu?.gen || ''}`.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (this.sortBy) {
      case 'rank':
        // Keep original order (pre-sorted by rank)
        break;
      case 'price_asc':
        filtered.sort((a, b) => (a.price_myr || 0) - (b.price_myr || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.price_myr || 0) - (a.price_myr || 0));
        break;
      case 'brand':
        filtered.sort((a, b) => a.brand.localeCompare(b.brand));
        break;
    }

    return filtered;
  }

  getPaginatedData() {
    const filtered = this.getFilteredData();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  }

  getTotalPages() {
    const filtered = this.getFilteredData();
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  render() {
    const container = document.getElementById('appendicesContainer') || document.body;

    if (this.userTier === 'free' && this.laptopDatabase.length >= 35) {
      container.innerHTML = this.renderWithUpgradePrompt();
    } else {
      container.innerHTML = this.renderFullCatalog();
    }

    this.attachEventListeners();
  }

  renderFullCatalog() {
    const data = this.getPaginatedData();
    const totalPages = this.getTotalPages();

    return `
      <div class="appendices-wrapper">

        <!-- Header -->
        <div class="appendices-header">
          <h1>📚 Appendices</h1>
          <p>Full Top ${this.laptopDatabase.length} catalog with best offers</p>
          ${this.userTier === 'free' ? '<span class="tier-limit">Free: Top 35 only</span>' : ''}
        </div>

        <!-- Toolbar -->
        <div class="appendices-toolbar">
          <div class="search-box">
            <input type="text"
                   id="catalogSearch"
                   class="search-input"
                   placeholder="Search by brand, model, or specs..."
                   value="${this.searchQuery}">
          </div>

          <div class="toolbar-controls">
            <select id="sortSelect" class="sort-dropdown">
              <option value="rank" ${this.sortBy === 'rank' ? 'selected' : ''}>By Rank</option>
              <option value="price_asc" ${this.sortBy === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price_desc" ${this.sortBy === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="brand" ${this.sortBy === 'brand' ? 'selected' : ''}>By Brand (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- Catalog Table -->
        <div class="catalog-table-container">
          <table class="catalog-table">
            <thead>
              <tr>
                <th class="col-rank">#</th>
                <th class="col-brand">Brand</th>
                <th class="col-model">Model</th>
                <th class="col-specs">Key Specs</th>
                <th class="col-price">Best Price</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((laptop, index) => this.renderCatalogRow(laptop, index)).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        ${totalPages > 1 ? this.renderPagination(totalPages) : ''}

        <!-- Archive Note -->
        <div class="archive-note">
          <p><strong>Archive Policy:</strong> We never delete laptops from this catalog. Even discontinued models remain for reference.</p>
          <p><em>Prices updated daily. Affiliate links help keep AI Bradaa free.</em></p>
        </div>

      </div>
    `;
  }

  renderCatalogRow(laptop, index) {
    const rank = (this.currentPage - 1) * this.itemsPerPage + index + 1;

    return `
      <tr class="catalog-row" data-id="${laptop.id}">
        <td class="col-rank">
          ${rank <= 10 ? `<span class="top-badge">Top ${rank}</span>` : rank}
        </td>
        <td class="col-brand">
          <strong>${laptop.brand}</strong>
        </td>
        <td class="col-model">
          ${laptop.model}
          ${laptop.model_year ? `<span class="year-badge">${laptop.model_year}</span>` : ''}
        </td>
        <td class="col-specs">
          <div class="specs-summary">
            <span>${laptop.cpu?.gen || 'N/A'}</span>
            <span>•</span>
            <span>${laptop.ram?.gb || 0}GB</span>
            <span>•</span>
            <span>${laptop.storage?.gb || 0}GB</span>
            ${laptop.gpu ? `<span>• ${this.truncate(laptop.gpu.chip, 15)}</span>` : ''}
          </div>
        </td>
        <td class="col-price">
          <div class="price-cell">
            <span class="price-value">RM${this.formatPrice(laptop.price_myr)}</span>
            ${laptop.discount_percentage ? `
              <span class="discount-badge">-${laptop.discount_percentage}%</span>
            ` : ''}
          </div>
        </td>
        <td class="col-actions">
          <button class="btn btn-primary btn-small view-offer-btn"
                  data-id="${laptop.id}">
            View Offer
          </button>
        </td>
      </tr>
    `;
  }

  renderPagination(totalPages) {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return `
      <div class="pagination">
        <button class="pagination-btn"
                id="prevPageBtn"
                ${this.currentPage === 1 ? 'disabled' : ''}>
          ← Previous
        </button>

        <div class="pagination-pages">
          ${start > 1 ? `
            <button class="page-btn" data-page="1">1</button>
            ${start > 2 ? '<span class="pagination-ellipsis">...</span>' : ''}
          ` : ''}

          ${pages.map(page => `
            <button class="page-btn ${page === this.currentPage ? 'active' : ''}"
                    data-page="${page}">
              ${page}
            </button>
          `).join('')}

          ${end < totalPages ? `
            ${end < totalPages - 1 ? '<span class="pagination-ellipsis">...</span>' : ''}
            <button class="page-btn" data-page="${totalPages}">${totalPages}</button>
          ` : ''}
        </div>

        <button class="pagination-btn"
                id="nextPageBtn"
                ${this.currentPage === totalPages ? 'disabled' : ''}>
          Next →
        </button>
      </div>
    `;
  }

  renderWithUpgradePrompt() {
    return `
      <div class="appendices-with-upgrade">
        ${this.renderFullCatalog()}

        <div class="upgrade-overlay">
          <div class="upgrade-card">
            <h3>🔓 Unlock Full Top 100 Catalog</h3>
            <p>You're viewing the top 35 laptops. Upgrade to Pro for access to all 100 laptops with exclusive deals.</p>
            <a href="/pricing.html#pro" class="btn btn-primary">
              Upgrade to Pro - RM30/month
            </a>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Search
    const searchInput = document.getElementById('catalogSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    // View offer buttons
    document.querySelectorAll('.view-offer-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const laptopId = e.target.dataset.id;
        await this.viewOffer(laptopId);
      });
    });

    // Pagination
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.render();
          this.scrollToTop();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < this.getTotalPages()) {
          this.currentPage++;
          this.render();
          this.scrollToTop();
        }
      });
    }

    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentPage = parseInt(e.target.dataset.page);
        this.render();
        this.scrollToTop();
      });
    });
  }

  async viewOffer(laptopId) {
    const laptop = this.laptopDatabase.find(l => l.id === laptopId);
    if (!laptop) return;

    // Track affiliate click
    try {
      await apiClient.post('/.netlify/functions/track-affiliate', {
        laptopId,
        source: 'appendices'
      });
    } catch (error) {
      console.warn('Failed to track affiliate click:', error);
    }

    // Save to history
    await storage.addHistory({
      type: 'affiliate_click',
      laptopId,
      laptop: {
        brand: laptop.brand,
        model: laptop.model,
        price: laptop.price_myr
      }
    });

    // Open affiliate link
    const affiliateUrl = laptop.affiliate_url || `/out/${laptopId}`;
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatPrice(price) {
    if (!price) return '0';
    return price.toLocaleString('en-MY');
  }

  truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  showError(message) {
    const container = document.getElementById('appendicesContainer') || document.body;
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const appendices = new Appendices();
    appendices.init();
  });
} else {
  const appendices = new Appendices();
  appendices.init();
}
