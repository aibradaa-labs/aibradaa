/**
 * Appendices App Logic
 * Top-100 laptop catalog with best offers (Shopee, Lazada, official stores)
 * Free tier: Top-35, Pro+: Full 100
 * Affiliate tracking via /out/* rewrites
 */

export class AppendicesApp {
  constructor() {
    this.catalog = [];
    this.currentSort = 'rank';
    this.currentFilters = {
      search: '',
      brands: [],
      minPrice: 0,
      maxPrice: 99999
    };
    this.currentPage = 1;
    this.perPage = 20;
    this.init();
  }

  /**
   * Initialize app
   */
  async init() {
    console.log('[Appendices] Initializing...');
    await this.loadCatalog();
    this.attachEventListeners();
    this.renderCatalog();
  }

  /**
   * Get user tier
   */
  getUserTier() {
    return window.authManager?.user?.tier || localStorage.getItem('userTier') || 'free';
  }

  /**
   * Check if Pro+ user
   */
  isProPlus() {
    const tier = this.getUserTier();
    return ['pro', 'ultimate', 'enterprise'].includes(tier);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Search
    document.getElementById('appendices-search')?.addEventListener('input', (e) => {
      this.currentFilters.search = e.target.value.toLowerCase();
      this.renderCatalog();
    });

    // Sort select
    document.getElementById('appendices-sort')?.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.renderCatalog();
    });

    // Filter buttons
    document.querySelectorAll('.appendices-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        this.toggleFilter(filter);
      });
    });

    // Clear filters
    document.getElementById('appendices-clear-filters')?.addEventListener('click', () => {
      this.clearFilters();
    });
  }

  /**
   * Load catalog from API
   */
  async loadCatalog() {
    const loadingEl = document.getElementById('appendices-loading');
    if (loadingEl) loadingEl.style.display = 'block';

    try {
      const response = await fetch('/.netlify/functions/appendices-catalog');
      const data = await response.json();

      if (data.success) {
        this.catalog = data.data.catalog;
        this.renderTierInfo(data.data.tierInfo);
      } else {
        throw new Error(data.error || 'Failed to load catalog');
      }

    } catch (error) {
      console.error('[Appendices] Catalog load error:', error);
      this.showError('Failed to load laptop catalog. Please try again.');
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  /**
   * Render tier info
   */
  renderTierInfo(tierInfo) {
    const container = document.getElementById('appendices-tier-info');
    if (!container) return;

    if (tierInfo.upgradeMessage) {
      container.innerHTML = `
        <div class="tier-banner">
          <span class="tier-icon">⭐</span>
          <span class="tier-message">${tierInfo.upgradeMessage}</span>
          <a href="/pricing?upgrade=pro" class="btn-primary btn-small">Upgrade Now</a>
        </div>
      `;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }

  /**
   * Apply filters and sorting
   */
  getFilteredAndSorted() {
    let filtered = [...this.catalog];

    // Apply search filter
    if (this.currentFilters.search) {
      filtered = filtered.filter(laptop => {
        const searchable = `${laptop.name} ${laptop.brand} ${laptop.specs.processor}`.toLowerCase();
        return searchable.includes(this.currentFilters.search);
      });
    }

    // Apply brand filters
    if (this.currentFilters.brands.length > 0) {
      filtered = filtered.filter(laptop =>
        this.currentFilters.brands.includes(laptop.brand)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(laptop =>
      laptop.price >= this.currentFilters.minPrice &&
      laptop.price <= this.currentFilters.maxPrice
    );

    // Apply sorting
    const sortFunctions = {
      'rank': (a, b) => a.rank - b.rank,
      'price-low': (a, b) => a.price - b.price,
      'price-high': (a, b) => b.price - a.price,
      'name': (a, b) => a.name.localeCompare(b.name),
      'brand': (a, b) => a.brand.localeCompare(b.brand)
    };

    const sortFn = sortFunctions[this.currentSort] || sortFunctions.rank;
    filtered.sort(sortFn);

    return filtered;
  }

  /**
   * Render catalog
   */
  renderCatalog() {
    const container = document.getElementById('appendices-catalog-list');
    if (!container) return;

    const filtered = this.getFilteredAndSorted();

    // Update results count
    const countEl = document.getElementById('appendices-count');
    if (countEl) {
      countEl.textContent = `${filtered.length} laptops`;
    }

    // Empty state
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>No laptops found</h3>
          <p>Try adjusting your filters</p>
          <button class="btn-secondary" onclick="window.appendicesApp.clearFilters()">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    // Pagination
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    const paginated = filtered.slice(start, end);

    // Render list items
    container.innerHTML = paginated.map(laptop => `
      <div class="catalog-item">
        <div class="catalog-rank">
          <span class="rank-number">#${laptop.rank}</span>
          ${laptop.badges.length > 0 ? `
            <span class="rank-badge">${laptop.badges[0]}</span>
          ` : ''}
        </div>
        <div class="catalog-image">
          <img src="${laptop.image}" alt="${laptop.name}" loading="lazy">
        </div>
        <div class="catalog-info">
          <div class="catalog-brand">${laptop.brand}</div>
          <h3 class="catalog-name">${laptop.name}</h3>
          <div class="catalog-specs">
            <span class="spec-item">${laptop.specs.processor}</span>
            <span class="spec-divider">•</span>
            <span class="spec-item">${laptop.specs.ram}</span>
            <span class="spec-divider">•</span>
            <span class="spec-item">${laptop.specs.storage}</span>
          </div>
        </div>
        <div class="catalog-price">
          <div class="price-label">Best Price</div>
          <div class="price-value">RM ${laptop.price.toLocaleString()}</div>
          <div class="price-source">${laptop.bestOffer.source}</div>
        </div>
        <div class="catalog-actions">
          <a
            href="${this.getAffiliateLink(laptop.id, laptop.bestOffer.url)}"
            class="btn-primary"
            target="_blank"
            rel="noopener noreferrer"
            onclick="window.appendicesApp.trackAffiliateClick('${laptop.id}', '${laptop.bestOffer.source}')"
          >
            View Offer
          </a>
          ${laptop.alternativeOffers && laptop.alternativeOffers.length > 0 ? `
            <button
              class="btn-secondary btn-small"
              onclick="window.appendicesApp.showAlternativeOffers('${laptop.id}')"
            >
              +${laptop.alternativeOffers.length} more
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Render pagination
    this.renderPagination(filtered.length);

    // Show affiliate disclosure
    this.showAffiliateDisclosure();
  }

  /**
   * Get affiliate link
   */
  getAffiliateLink(laptopId, originalUrl) {
    // Route through affiliate tracking endpoint
    return `/.netlify/functions/affiliates-out/${laptopId}?url=${encodeURIComponent(originalUrl)}`;
  }

  /**
   * Track affiliate click
   */
  trackAffiliateClick(laptopId, source) {
    console.log('[Appendices] Affiliate click:', { laptopId, source });

    // Track with analytics if available
    if (window.gtag) {
      window.gtag('event', 'affiliate_click', {
        laptop_id: laptopId,
        source: source
      });
    }
  }

  /**
   * Show alternative offers modal
   */
  showAlternativeOffers(laptopId) {
    const laptop = this.catalog.find(l => l.id === laptopId);
    if (!laptop || !laptop.alternativeOffers) return;

    const modal = document.getElementById('alternative-offers-modal');
    const content = document.getElementById('alternative-offers-content');

    if (!modal || !content) return;

    content.innerHTML = `
      <h3>Alternative Offers for ${laptop.name}</h3>
      <div class="offers-list">
        ${laptop.alternativeOffers.map(offer => `
          <div class="offer-item">
            <div class="offer-source">${offer.source}</div>
            <div class="offer-price">RM ${offer.price.toLocaleString()}</div>
            <a
              href="${this.getAffiliateLink(laptop.id, offer.url)}"
              class="btn-secondary btn-small"
              target="_blank"
              rel="noopener noreferrer"
              onclick="window.appendicesApp.trackAffiliateClick('${laptop.id}', '${offer.source}')"
            >
              View
            </a>
          </div>
        `).join('')}
      </div>
    `;

    modal.style.display = 'flex';
  }

  /**
   * Render pagination
   */
  renderPagination(totalItems) {
    const container = document.getElementById('appendices-pagination');
    if (!container) return;

    const totalPages = Math.ceil(totalItems / this.perPage);

    if (totalPages <= 1) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = `
      <button
        class="page-btn"
        ${this.currentPage === 1 ? 'disabled' : ''}
        onclick="window.appendicesApp.goToPage(${this.currentPage - 1})"
      >
        ← Previous
      </button>
      <div class="page-numbers">
        ${this.getPageNumbers(totalPages).map(page => `
          ${page === '...' ? `<span class="page-ellipsis">...</span>` : `
            <button
              class="page-num ${page === this.currentPage ? 'active' : ''}"
              onclick="window.appendicesApp.goToPage(${page})"
            >
              ${page}
            </button>
          `}
        `).join('')}
      </div>
      <button
        class="page-btn"
        ${this.currentPage === totalPages ? 'disabled' : ''}
        onclick="window.appendicesApp.goToPage(${this.currentPage + 1})"
      >
        Next →
      </button>
    `;
  }

  /**
   * Get page numbers with ellipsis
   */
  getPageNumbers(totalPages) {
    const pages = [];
    const current = this.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  }

  /**
   * Go to page
   */
  goToPage(page) {
    this.currentPage = page;
    this.renderCatalog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Toggle filter
   */
  toggleFilter(filter) {
    // Implementation depends on filter UI
    console.log('[Appendices] Toggle filter:', filter);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.currentFilters = {
      search: '',
      brands: [],
      minPrice: 0,
      maxPrice: 99999
    };

    // Clear UI
    const searchInput = document.getElementById('appendices-search');
    if (searchInput) searchInput.value = '';

    this.currentPage = 1;
    this.renderCatalog();

    this.showSuccess('Filters cleared');
  }

  /**
   * Show affiliate disclosure
   */
  showAffiliateDisclosure() {
    const disclosure = document.getElementById('affiliate-disclosure');
    if (!disclosure) return;

    disclosure.innerHTML = `
      <div class="disclosure-content">
        <span class="disclosure-icon">ℹ️</span>
        <span class="disclosure-text">
          <strong>Transparency:</strong> We earn a small commission when you purchase through our affiliate links.
          This helps keep AI Bradaa free for everyone. Thank you for supporting us!
        </span>
      </div>
    `;

    disclosure.style.display = 'block';
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (window.Toast && window.Toast.show) {
      window.Toast.show({ message, type: 'success' });
    } else {
      console.log('[Appendices] Success:', message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.Toast && window.Toast.show) {
      window.Toast.show({ message, type: 'error' });
    } else {
      alert(message);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.appendicesApp = new AppendicesApp();
  });
} else {
  window.appendicesApp = new AppendicesApp();
}
