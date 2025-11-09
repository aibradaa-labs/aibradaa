/**
 * Explorer Tool - Browse Top 35 Laptops with Smart Filters
 * AI Bradaa - Grid view with advanced filtering
 *
 * ARCHITECTURE: Hybrid Enhancement Pattern
 * - HTML provides static structure (sidebar, toolbar, grid container)
 * - JavaScript enhances with dynamic content (filters, laptop cards, sorting)
 * - Progressive enhancement approach (no innerHTML replacement)
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Explorer {
  constructor() {
    this.laptopDatabase = [];
    this.filteredLaptops = [];
    this.displayedLaptops = []; // For infinite scroll
    this.currentView = 'grid'; // 'grid' or 'list'
    this.sortBy = 'rank';
    this.filters = {
      priceRange: [0, 15000],
      brands: [],
      categories: [],
      minRam: 0,
      hasGPU: false,
      maxWeight: 5
    };
    this.compareList = [];
    this.wishlist = []; // Persistent wishlist with IndexedDB
    this.searchDebounce = null;
    this.isLoading = false;
    this.currentPage = 1;
    this.itemsPerPage = 12; // Load 12 at a time for infinite scroll

    // DOM references (existing elements)
    this.filtersSidebar = null;
    this.filtersContent = null;
    this.laptopsGrid = null;
    this.resultsCount = null;
    this.sortSelect = null;
    this.emptyState = null;
    this.gridViewBtn = null;
    this.listViewBtn = null;
    this.clearFiltersBtn = null;
    this.mobileFiltersBtn = null;
    this.filtersOverlay = null;
    this.wishlistDrawer = null;
    this.scrollObserver = null;
  }

  async init() {
    // Get existing DOM elements
    this.filtersSidebar = document.getElementById('filtersSidebar');
    this.filtersContent = document.getElementById('filtersContent');
    this.laptopsGrid = document.getElementById('laptopsGrid');
    this.resultsCount = document.getElementById('resultsCount');
    this.sortSelect = document.getElementById('sortSelect');
    this.emptyState = document.getElementById('emptyState');
    this.gridViewBtn = document.getElementById('gridViewBtn');
    this.listViewBtn = document.getElementById('listViewBtn');
    this.clearFiltersBtn = document.getElementById('clearFilters');
    this.mobileFiltersBtn = document.getElementById('mobileFiltersBtn');
    this.filtersOverlay = document.getElementById('filtersOverlay');

    // Validation
    if (!this.filtersContent || !this.laptopsGrid || !this.resultsCount) {
      console.error('Required elements not found! explorer.mjs needs #filtersContent, #laptopsGrid, #resultsCount');
      return;
    }

    // Load laptop database
    await this.loadLaptopDatabase();

    // Load wishlist from IndexedDB
    await this.loadWishlist();

    // Create wishlist drawer
    this.createWishlistDrawer();

    // Render filters (populate filtersContent)
    this.renderFilters();

    // Apply filters and render laptops
    this.applyFilters();
    this.renderLaptops();

    // Attach event listeners
    this.attachEventListeners();

    // Setup infinite scroll observer
    this.setupInfiniteScroll();

    // Load from cache
    await this.loadFromCache();
  }

  async loadLaptopDatabase() {
    try {
      // Try cache first
      const cached = await storage.getCache('laptops_db');
      if (cached) {
        this.laptopDatabase = cached;
        return;
      }

      // Fetch from server
      const response = await fetch('/data/laptops.json');
      if (!response.ok) throw new Error('Failed to fetch laptop database');

      const data = await response.json();

      // Transform data from new format to expected format
      this.laptopDatabase = this.transformLaptopData(data);

      // Cache for 1 hour
      await storage.setCache('laptops_db', this.laptopDatabase, 3600000);
    } catch (error) {
      console.error('Failed to load laptop database:', error);
      this.showNotification('Failed to load laptop database. Using demo data.', 'error');
      this.laptopDatabase = this.getDemoData();
    }
  }

  /**
   * Transform laptop data from new JSON format to expected format
   * @param {Object} data - Raw laptop database with catalog metadata
   * @returns {Array} Transformed laptop array
   */
  transformLaptopData(data) {
    const laptops = data.laptops || data;

    return laptops.map(laptop => ({
      id: laptop.id,
      brand: laptop.brandName || laptop.brand,
      model: laptop.model || laptop.fullName,
      price_myr: laptop.price,
      cpu: {
        gen: laptop.specs?.cpu?.model || 'N/A',
        cores: laptop.specs?.cpu?.cores || 0
      },
      ram: {
        gb: laptop.specs?.ram || 0
      },
      gpu: {
        chip: laptop.specs?.gpu?.model || 'Integrated',
        vram: laptop.specs?.gpu?.vram || 0
      },
      storage: {
        gb: laptop.specs?.storage || 0
      },
      display: {
        size: laptop.specs?.display?.size || 0,
        res: laptop.specs?.display?.resolution || '',
        refresh: laptop.specs?.display?.refreshRate || 60
      },
      battery_wh: laptop.specs?.battery || 0,
      weight_kg: laptop.specs?.weight || 0,
      category: [laptop.segment, laptop.tier].filter(Boolean),
      image: laptop.image || `/assets/laptops/${laptop.id}.png`,
      rating: laptop.rating || 0,
      rank: laptop.rank || 999,
      release_date: laptop.releaseDate,
      popularity: laptop.popularity || 0
    }));
  }

  /**
   * Load wishlist from IndexedDB
   */
  async loadWishlist() {
    try {
      this.wishlist = await storage.getCache('explorer_wishlist') || [];
    } catch (error) {
      console.warn('Failed to load wishlist:', error);
      this.wishlist = [];
    }
  }

  /**
   * Save wishlist to IndexedDB
   */
  async saveWishlist() {
    try {
      await storage.setCache('explorer_wishlist', this.wishlist, 31536000000); // 1 year
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  }

  /**
   * Toggle laptop in wishlist
   */
  async toggleWishlist(laptopId) {
    const index = this.wishlist.indexOf(laptopId);

    if (index > -1) {
      this.wishlist.splice(index, 1);
      this.showNotification('Removed from wishlist', 'info');
    } else {
      this.wishlist.push(laptopId);
      this.showNotification('Added to wishlist', 'success');
    }

    await this.saveWishlist();
    this.updateWishlistDrawer();
    this.renderLaptops(); // Re-render to update heart icons
  }

  /**
   * Create wishlist drawer UI
   */
  createWishlistDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'wishlistDrawer';
    drawer.className = 'wishlist-drawer';
    drawer.innerHTML = `
      <div class="wishlist-header">
        <h3>My Wishlist</h3>
        <button class="wishlist-close" id="wishlistCloseBtn">&times;</button>
      </div>
      <div class="wishlist-content" id="wishlistContent">
        <div class="wishlist-empty">
          <span class="wishlist-empty-icon">❤️</span>
          <p>Your wishlist is empty</p>
          <small>Click the heart icon on laptops to save them here</small>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
    this.wishlistDrawer = drawer;

    // Add toggle button to toolbar
    const toolbar = document.querySelector('.explorer-toolbar');
    if (toolbar) {
      const wishlistBtn = document.createElement('button');
      wishlistBtn.className = 'wishlist-toggle-btn';
      wishlistBtn.id = 'wishlistToggleBtn';
      wishlistBtn.innerHTML = `
        <span class="wishlist-icon">❤️</span>
        <span class="wishlist-count">${this.wishlist.length}</span>
      `;
      wishlistBtn.title = 'View Wishlist';
      toolbar.appendChild(wishlistBtn);

      wishlistBtn.addEventListener('click', () => this.openWishlistDrawer());
    }

    // Close button
    drawer.querySelector('#wishlistCloseBtn').addEventListener('click', () => this.closeWishlistDrawer());
  }

  /**
   * Open wishlist drawer
   */
  openWishlistDrawer() {
    if (this.wishlistDrawer) {
      this.wishlistDrawer.classList.add('active');
      this.updateWishlistDrawer();
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close wishlist drawer
   */
  closeWishlistDrawer() {
    if (this.wishlistDrawer) {
      this.wishlistDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Update wishlist drawer content
   */
  updateWishlistDrawer() {
    const content = document.getElementById('wishlistContent');
    if (!content) return;

    // Update count badge
    const countBadge = document.querySelector('.wishlist-count');
    if (countBadge) {
      countBadge.textContent = this.wishlist.length;
      countBadge.style.display = this.wishlist.length > 0 ? 'block' : 'none';
    }

    if (this.wishlist.length === 0) {
      content.innerHTML = `
        <div class="wishlist-empty">
          <span class="wishlist-empty-icon">❤️</span>
          <p>Your wishlist is empty</p>
          <small>Click the heart icon on laptops to save them here</small>
        </div>
      `;
      return;
    }

    const wishlistLaptops = this.laptopDatabase.filter(l => this.wishlist.includes(l.id));

    content.innerHTML = wishlistLaptops.map(laptop => `
      <div class="wishlist-item" data-id="${laptop.id}">
        <div class="wishlist-item-image">
          <img src="${laptop.image || '/assets/default-laptop.png'}" alt="${laptop.brand} ${laptop.model}">
        </div>
        <div class="wishlist-item-info">
          <h4>${laptop.brand}</h4>
          <p>${laptop.model}</p>
          <span class="wishlist-item-price">RM${this.formatPrice(laptop.price_myr)}</span>
        </div>
        <div class="wishlist-item-actions">
          <button class="wishlist-item-view" data-id="${laptop.id}">View</button>
          <button class="wishlist-item-remove" data-id="${laptop.id}">✕</button>
        </div>
      </div>
    `).join('');

    // Attach listeners
    content.querySelectorAll('.wishlist-item-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.showLaptopDetails(id);
      });
    });

    content.querySelectorAll('.wishlist-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.toggleWishlist(id);
      });
    });
  }

  /**
   * Setup infinite scroll with Intersection Observer
   */
  setupInfiniteScroll() {
    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    };

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading) {
          this.loadMoreLaptops();
        }
      });
    }, options);

    // Create sentinel element
    const sentinel = document.createElement('div');
    sentinel.id = 'scrollSentinel';
    sentinel.style.height = '1px';
    this.laptopsGrid.parentElement.appendChild(sentinel);
    this.scrollObserver.observe(sentinel);
  }

  /**
   * Load more laptops for infinite scroll
   */
  async loadMoreLaptops() {
    if (this.isLoading) return;

    const start = this.displayedLaptops.length;
    const end = start + this.itemsPerPage;
    const nextBatch = this.filteredLaptops.slice(start, end);

    if (nextBatch.length === 0) return; // No more items

    this.isLoading = true;
    this.showLoadingIndicator();

    // Simulate network delay for smoother UX
    await new Promise(resolve => setTimeout(resolve, 300));

    this.displayedLaptops.push(...nextBatch);
    this.appendLaptops(nextBatch);

    this.hideLoadingIndicator();
    this.isLoading = false;
  }

  /**
   * Append new laptops to grid (for infinite scroll)
   */
  appendLaptops(laptops) {
    if (!this.laptopsGrid) return;

    const fragment = document.createDocumentFragment();
    laptops.forEach(laptop => {
      const card = this.createLaptopCardElement(laptop);
      fragment.appendChild(card);
    });

    this.laptopsGrid.appendChild(fragment);
    this.attachLaptopListeners();
  }

  /**
   * Create laptop card DOM element
   */
  createLaptopCardElement(laptop) {
    const div = document.createElement('div');
    div.className = 'laptop-card';
    div.dataset.id = laptop.id;

    const isWishlisted = this.wishlist.includes(laptop.id);
    const isCompared = this.compareList.includes(laptop.id);

    div.innerHTML = `
      <button class="wishlist-heart ${isWishlisted ? 'active' : ''}" data-id="${laptop.id}" title="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
        ${isWishlisted ? '❤️' : '🤍'}
      </button>
      <div class="laptop-image">
        <img src="${laptop.image || '/assets/default-laptop.png'}"
             alt="${laptop.brand} ${laptop.model}"
             loading="lazy">
      </div>
      <div class="laptop-info">
        <h3 class="laptop-brand">${laptop.brand}</h3>
        <p class="laptop-model">${laptop.model}</p>
        <div class="laptop-specs">
          <span class="spec-item" title="Processor">
            <span class="spec-icon">💻</span>
            <span class="spec-text">${this.truncate(laptop.cpu?.gen || 'N/A', 15)}</span>
          </span>
          <span class="spec-item" title="RAM">
            <span class="spec-icon">🧠</span>
            <span class="spec-text">${laptop.ram?.gb || 0}GB</span>
          </span>
          <span class="spec-item" title="Storage">
            <span class="spec-icon">💾</span>
            <span class="spec-text">${laptop.storage?.gb || 0}GB</span>
          </span>
          ${laptop.gpu?.vram ? `
            <span class="spec-item" title="GPU">
              <span class="spec-icon">🎮</span>
              <span class="spec-text">${this.truncate(laptop.gpu.chip, 12)}</span>
            </span>
          ` : ''}
        </div>
      </div>
      <div class="laptop-footer">
        <div class="laptop-price">
          <span class="price-label">RM</span>
          <span class="price-amount">${this.formatPrice(laptop.price_myr)}</span>
        </div>
        <div class="laptop-actions">
          <button class="btn-view" data-id="${laptop.id}" title="View details">
            View
          </button>
          <button class="btn-compare ${isCompared ? 'active' : ''}"
                  data-id="${laptop.id}"
                  title="${isCompared ? 'Remove from compare' : 'Add to compare'}">
            ${isCompared ? '✓' : '+'}
          </button>
        </div>
      </div>
    `;

    return div;
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    let indicator = document.getElementById('loadingIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'loadingIndicator';
      indicator.className = 'loading-indicator';
      indicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading more laptops...</p>
      `;
      this.laptopsGrid.parentElement.appendChild(indicator);
    }
    indicator.style.display = 'flex';
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  renderFilters() {
    if (!this.filtersContent) return;

    const brands = this.getUniqueBrands();
    const categories = ['gaming', 'business', 'creative', 'budget', 'ultrabook'];

    this.filtersContent.innerHTML = `
      <!-- Price Range Filter -->
      <div class="filter-group">
        <h4 class="filter-group-title">Price Range</h4>
        <div class="price-range-container">
          <div class="price-inputs">
            <input type="number" id="priceMin" class="price-input"
                   value="${this.filters.priceRange[0]}"
                   placeholder="Min" min="0" max="20000" step="500">
            <span class="price-separator">-</span>
            <input type="number" id="priceMax" class="price-input"
                   value="${this.filters.priceRange[1]}"
                   placeholder="Max" min="0" max="20000" step="500">
          </div>
          <input type="range" id="priceSlider" class="price-slider"
                 min="0" max="15000" value="${this.filters.priceRange[1]}" step="500">
          <div class="price-labels">
            <span>RM0</span>
            <span>RM15k+</span>
          </div>
        </div>
      </div>

      <!-- Brand Filter -->
      <div class="filter-group">
        <h4 class="filter-group-title">Brand</h4>
        <div class="filter-checkboxes">
          ${brands.slice(0, 10).map(brand => `
            <label class="filter-checkbox">
              <input type="checkbox" class="brand-filter" value="${brand}"
                     ${this.filters.brands.includes(brand) ? 'checked' : ''}>
              <span class="filter-checkbox-label">${brand}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Category Filter -->
      <div class="filter-group">
        <h4 class="filter-group-title">Category</h4>
        <div class="filter-checkboxes">
          ${categories.map(cat => `
            <label class="filter-checkbox">
              <input type="checkbox" class="category-filter" value="${cat}"
                     ${this.filters.categories.includes(cat) ? 'checked' : ''}>
              <span class="filter-checkbox-label">${this.capitalize(cat)}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- RAM Filter -->
      <div class="filter-group">
        <h4 class="filter-group-title">Minimum RAM</h4>
        <select id="ramFilter" class="filter-select">
          <option value="0">Any</option>
          <option value="8" ${this.filters.minRam === 8 ? 'selected' : ''}>8GB+</option>
          <option value="16" ${this.filters.minRam === 16 ? 'selected' : ''}>16GB+</option>
          <option value="32" ${this.filters.minRam === 32 ? 'selected' : ''}>32GB+</option>
        </select>
      </div>

      <!-- GPU Filter -->
      <div class="filter-group">
        <label class="filter-checkbox">
          <input type="checkbox" id="gpuFilter" ${this.filters.hasGPU ? 'checked' : ''}>
          <span class="filter-checkbox-label">Dedicated GPU Only</span>
        </label>
      </div>

      <!-- Weight Filter -->
      <div class="filter-group">
        <h4 class="filter-group-title">Maximum Weight</h4>
        <select id="weightFilter" class="filter-select">
          <option value="5">Any</option>
          <option value="1.5" ${this.filters.maxWeight === 1.5 ? 'selected' : ''}>Under 1.5kg</option>
          <option value="2" ${this.filters.maxWeight === 2 ? 'selected' : ''}>Under 2kg</option>
          <option value="2.5" ${this.filters.maxWeight === 2.5 ? 'selected' : ''}>Under 2.5kg</option>
          <option value="3" ${this.filters.maxWeight === 3 ? 'selected' : ''}>Under 3kg</option>
        </select>
      </div>
    `;

    // Attach filter event listeners
    this.attachFilterListeners();
  }

  attachFilterListeners() {
    // Price range inputs
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceSlider = document.getElementById('priceSlider');

    priceMin?.addEventListener('change', (e) => {
      this.filters.priceRange[0] = parseInt(e.target.value) || 0;
      this.applyFilters();
      this.renderLaptops();
      this.saveToCache();
    });

    priceMax?.addEventListener('change', (e) => {
      this.filters.priceRange[1] = parseInt(e.target.value) || 15000;
      if (priceSlider) priceSlider.value = e.target.value;
      this.applyFilters();
      this.renderLaptops();
      this.saveToCache();
    });

    priceSlider?.addEventListener('input', (e) => {
      this.filters.priceRange[1] = parseInt(e.target.value);
      if (priceMax) priceMax.value = e.target.value;
      this.applyFilters();
      this.renderLaptops();
      this.saveToCache();
    });

    // Brand filters
    document.querySelectorAll('.brand-filter').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filters.brands.push(e.target.value);
        } else {
          this.filters.brands = this.filters.brands.filter(b => b !== e.target.value);
        }
        this.applyFilters();
        this.renderLaptops();
        this.saveToCache();
      });
    });

    // Category filters
    document.querySelectorAll('.category-filter').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filters.categories.push(e.target.value);
        } else {
          this.filters.categories = this.filters.categories.filter(c => c !== e.target.value);
        }
        this.applyFilters();
        this.renderLaptops();
        this.saveToCache();
      });
    });

    // RAM filter
    const ramFilter = document.getElementById('ramFilter');
    ramFilter?.addEventListener('change', (e) => {
      this.filters.minRam = parseInt(e.target.value) || 0;
      this.applyFilters();
      this.renderLaptops();
      this.saveToCache();
    });

    // GPU filter
    const gpuFilter = document.getElementById('gpuFilter');
    gpuFilter?.addEventListener('change', (e) => {
      this.filters.hasGPU = e.target.checked;
      this.applyFilters();
      this.renderLaptops();
      this.saveToCache();
    });

    // Weight filter
    const weightFilter = document.getElementById('weightFilter');
    weightFilter?.addEventListener('change', (e) => {
      this.filters.maxWeight = parseFloat(e.target.value) || 5;
      this.applyFilters();
      this.renderLaptops();
      this.saveToCache();
    });
  }

  applyFilters() {
    this.filteredLaptops = this.laptopDatabase.filter(laptop => {
      // Price range
      const price = laptop.price_myr || 0;
      if (price < this.filters.priceRange[0] || price > this.filters.priceRange[1]) {
        return false;
      }

      // Brands
      if (this.filters.brands.length > 0 && !this.filters.brands.includes(laptop.brand)) {
        return false;
      }

      // Categories
      if (this.filters.categories.length > 0) {
        const hasCategory = laptop.category?.some(cat =>
          this.filters.categories.includes(cat.toLowerCase())
        );
        if (!hasCategory) return false;
      }

      // RAM
      if ((laptop.ram?.gb || 0) < this.filters.minRam) {
        return false;
      }

      // GPU
      if (this.filters.hasGPU && !laptop.gpu?.vram) {
        return false;
      }

      // Weight
      if ((laptop.weight_kg || 0) > this.filters.maxWeight) {
        return false;
      }

      return true;
    });

    this.sortLaptops();

    // Limit to top 35 for free tier
    this.filteredLaptops = this.filteredLaptops.slice(0, 35);

    // Update results count
    this.updateResultsCount();
  }

  sortLaptops() {
    switch (this.sortBy) {
      case 'price-asc':
        this.filteredLaptops.sort((a, b) => (a.price_myr || 0) - (b.price_myr || 0));
        break;
      case 'price-desc':
        this.filteredLaptops.sort((a, b) => (b.price_myr || 0) - (a.price_myr || 0));
        break;
      case 'newest':
        this.filteredLaptops.sort((a, b) =>
          new Date(b.release_date || 0) - new Date(a.release_date || 0)
        );
        break;
      case 'rating':
        this.filteredLaptops.sort((a, b) =>
          (b.rating || 0) - (a.rating || 0)
        );
        break;
      case 'popular':
        this.filteredLaptops.sort((a, b) =>
          (b.popularity || 0) - (a.popularity || 0)
        );
        break;
      case 'rank':
      default:
        // Keep default order (pre-sorted by rank in database)
        break;
    }
  }

  updateResultsCount() {
    if (!this.resultsCount) return;

    const count = this.filteredLaptops.length;
    this.resultsCount.innerHTML = `Showing <strong>${count}</strong> laptop${count !== 1 ? 's' : ''}`;
  }

  renderLaptops() {
    if (!this.laptopsGrid) return;

    // Show/hide empty state
    if (this.filteredLaptops.length === 0) {
      this.laptopsGrid.style.display = 'none';
      if (this.emptyState) this.emptyState.style.display = 'block';
      return;
    }

    this.laptopsGrid.style.display = 'grid';
    if (this.emptyState) this.emptyState.style.display = 'none';

    // Reset displayed laptops for infinite scroll
    this.displayedLaptops = [];
    this.laptopsGrid.innerHTML = '';

    // Initial load (first batch)
    const initialBatch = this.filteredLaptops.slice(0, this.itemsPerPage);
    this.displayedLaptops = initialBatch;

    // Render based on current view
    if (this.currentView === 'grid') {
      this.appendLaptops(initialBatch);
    } else {
      this.renderListView();
    }

    // Attach laptop card listeners
    this.attachLaptopListeners();
  }

  renderGridView() {
    this.laptopsGrid.className = 'laptops-grid';

    this.laptopsGrid.innerHTML = this.filteredLaptops.map((laptop, index) => `
      <div class="laptop-card" data-id="${laptop.id}">
        ${index < 10 ? `<div class="laptop-rank">Top ${index + 1}</div>` : ''}
        <div class="laptop-image">
          <img src="${laptop.image || '/assets/default-laptop.png'}"
               alt="${laptop.brand} ${laptop.model}"
               loading="lazy">
        </div>
        <div class="laptop-info">
          <h3 class="laptop-brand">${laptop.brand}</h3>
          <p class="laptop-model">${laptop.model}</p>
          <div class="laptop-specs">
            <span class="spec-item" title="Processor">
              <span class="spec-icon">💻</span>
              <span class="spec-text">${this.truncate(laptop.cpu?.gen || 'N/A', 15)}</span>
            </span>
            <span class="spec-item" title="RAM">
              <span class="spec-icon">🧠</span>
              <span class="spec-text">${laptop.ram?.gb || 0}GB</span>
            </span>
            <span class="spec-item" title="Storage">
              <span class="spec-icon">💾</span>
              <span class="spec-text">${laptop.storage?.gb || 0}GB</span>
            </span>
            ${laptop.gpu?.vram ? `
              <span class="spec-item" title="GPU">
                <span class="spec-icon">🎮</span>
                <span class="spec-text">${this.truncate(laptop.gpu.chip, 12)}</span>
              </span>
            ` : ''}
          </div>
        </div>
        <div class="laptop-footer">
          <div class="laptop-price">
            <span class="price-label">RM</span>
            <span class="price-amount">${this.formatPrice(laptop.price_myr)}</span>
          </div>
          <div class="laptop-actions">
            <button class="btn-view" data-id="${laptop.id}" title="View details">
              View
            </button>
            <button class="btn-compare ${this.compareList.includes(laptop.id) ? 'active' : ''}"
                    data-id="${laptop.id}"
                    title="${this.compareList.includes(laptop.id) ? 'Remove from compare' : 'Add to compare'}">
              ${this.compareList.includes(laptop.id) ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderListView() {
    this.laptopsGrid.className = 'laptops-list';

    this.laptopsGrid.innerHTML = this.filteredLaptops.map((laptop, index) => `
      <div class="laptop-list-item" data-id="${laptop.id}">
        <div class="list-rank">#${index + 1}</div>
        <div class="list-image">
          <img src="${laptop.image || '/assets/default-laptop.png'}"
               alt="${laptop.brand} ${laptop.model}"
               loading="lazy">
        </div>
        <div class="list-info">
          <h4 class="list-title">${laptop.brand} ${laptop.model}</h4>
          <p class="list-specs">
            ${laptop.cpu?.gen || 'N/A'} •
            ${laptop.ram?.gb || 0}GB RAM •
            ${laptop.storage?.gb || 0}GB SSD •
            ${laptop.display?.size || 0}" Display
            ${laptop.gpu?.vram ? ` • ${laptop.gpu.chip}` : ''}
          </p>
        </div>
        <div class="list-price">
          <span class="price-label">RM</span>
          <span class="price-amount">${this.formatPrice(laptop.price_myr)}</span>
        </div>
        <div class="list-actions">
          <button class="btn-view" data-id="${laptop.id}">View Details</button>
          <button class="btn-compare ${this.compareList.includes(laptop.id) ? 'active' : ''}"
                  data-id="${laptop.id}">
            ${this.compareList.includes(laptop.id) ? 'Remove' : 'Compare'}
          </button>
        </div>
      </div>
    `).join('');
  }

  attachLaptopListeners() {
    // Wishlist heart buttons
    document.querySelectorAll('.wishlist-heart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const laptopId = e.target.dataset.id;
        this.toggleWishlist(laptopId);
      });
    });

    // View details buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const laptopId = e.target.dataset.id;
        this.showLaptopDetails(laptopId);
      });
    });

    // Compare buttons
    document.querySelectorAll('.btn-compare').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const laptopId = e.target.dataset.id;
        this.toggleCompare(laptopId);
      });
    });

    // Card click (also opens details)
    document.querySelectorAll('.laptop-card, .laptop-list-item').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking buttons
        if (e.target.classList.contains('btn-view') ||
            e.target.classList.contains('btn-compare') ||
            e.target.classList.contains('wishlist-heart')) {
          return;
        }
        const laptopId = card.dataset.id;
        this.showLaptopDetails(laptopId);
      });
    });
  }

  attachEventListeners() {
    // Clear filters button
    this.clearFiltersBtn?.addEventListener('click', () => {
      this.filters = {
        priceRange: [0, 15000],
        brands: [],
        categories: [],
        minRam: 0,
        hasGPU: false,
        maxWeight: 5
      };
      this.renderFilters(); // Re-render filters to reset checkboxes
      this.applyFilters();
      this.renderLaptops();
      this.saveToCache();
    });

    // Sort select
    this.sortSelect?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.applyFilters();
      this.renderLaptops();
      this.saveToCache();
    });

    // View toggle buttons
    this.gridViewBtn?.addEventListener('click', () => {
      if (this.currentView === 'grid') return;
      this.currentView = 'grid';
      this.gridViewBtn.classList.add('active');
      this.listViewBtn.classList.remove('active');
      this.renderLaptops();
      this.saveToCache();
    });

    this.listViewBtn?.addEventListener('click', () => {
      if (this.currentView === 'list') return;
      this.currentView = 'list';
      this.listViewBtn.classList.add('active');
      this.gridViewBtn.classList.remove('active');
      this.renderLaptops();
      this.saveToCache();
    });

    // Mobile filters toggle
    this.mobileFiltersBtn?.addEventListener('click', () => {
      this.filtersSidebar.classList.add('active');
      this.filtersOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    this.filtersOverlay?.addEventListener('click', () => {
      this.filtersSidebar.classList.remove('active');
      this.filtersOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  toggleCompare(laptopId) {
    if (this.compareList.includes(laptopId)) {
      this.compareList = this.compareList.filter(id => id !== laptopId);
      this.showNotification('Removed from compare list', 'info');
    } else {
      if (this.compareList.length >= 3) {
        this.showNotification('Maximum 3 laptops for comparison', 'warning');
        return;
      }
      this.compareList.push(laptopId);
      this.showNotification('Added to compare list', 'success');
    }
    this.renderLaptops(); // Re-render to update button states
    this.saveToCache();

    // If we have 2+ laptops, show compare notification
    if (this.compareList.length >= 2) {
      this.showComparePrompt();
    }
  }

  showComparePrompt() {
    // Create floating compare prompt
    const existingPrompt = document.getElementById('comparePrompt');
    if (existingPrompt) existingPrompt.remove();

    const prompt = document.createElement('div');
    prompt.id = 'comparePrompt';
    prompt.className = 'compare-prompt';
    prompt.innerHTML = `
      <div class="compare-prompt-content">
        <span class="compare-prompt-text">${this.compareList.length} laptops selected</span>
        <button class="compare-prompt-btn" id="goToCompareBtn">Compare Now</button>
      </div>
    `;
    prompt.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #00F0FF;
      color: #0D1117;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 240, 255, 0.3);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 16px;
      font-weight: 600;
      animation: slideInUp 0.3s ease;
    `;

    document.body.appendChild(prompt);

    document.getElementById('goToCompareBtn').addEventListener('click', () => {
      this.goToVersus();
    });
  }

  goToVersus() {
    // Navigate to versus tool with selected laptops
    if (this.compareList.length < 2) return;

    // Save to localStorage for versus tool
    localStorage.setItem('versusPreload', JSON.stringify(this.compareList));

    // Navigate to versus
    window.location.href = '/versus';
  }

  showLaptopDetails(laptopId) {
    const laptop = this.laptopDatabase.find(l => l.id === laptopId);
    if (!laptop) return;

    // Create modal
    const modal = this.createDetailsModal(laptop);
    document.body.appendChild(modal);

    // Show modal
    setTimeout(() => modal.classList.add('active'), 10);

    // Save to history
    storage.addHistory({
      type: 'view',
      timestamp: Date.now(),
      laptop: {
        id: laptop.id,
        brand: laptop.brand,
        model: laptop.model
      }
    });
  }

  createDetailsModal(laptop) {
    const modal = document.createElement('div');
    modal.className = 'laptop-details-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="modal-body">
          <div class="modal-image">
            <img src="${laptop.image || '/assets/default-laptop.png'}" alt="${laptop.brand} ${laptop.model}">
          </div>
          <div class="modal-info">
            <h2 class="modal-title">${laptop.brand} ${laptop.model}</h2>
            <div class="modal-price">RM${this.formatPrice(laptop.price_myr)}</div>

            <div class="modal-specs-grid">
              <div class="modal-spec">
                <span class="spec-label">Processor</span>
                <span class="spec-value">${laptop.cpu?.gen || 'N/A'}</span>
              </div>
              <div class="modal-spec">
                <span class="spec-label">Cores</span>
                <span class="spec-value">${laptop.cpu?.cores || 'N/A'}</span>
              </div>
              <div class="modal-spec">
                <span class="spec-label">RAM</span>
                <span class="spec-value">${laptop.ram?.gb || 0}GB</span>
              </div>
              <div class="modal-spec">
                <span class="spec-label">Storage</span>
                <span class="spec-value">${laptop.storage?.gb || 0}GB SSD</span>
              </div>
              <div class="modal-spec">
                <span class="spec-label">GPU</span>
                <span class="spec-value">${laptop.gpu?.chip || 'Integrated'}</span>
              </div>
              <div class="modal-spec">
                <span class="spec-label">Display</span>
                <span class="spec-value">${laptop.display?.size || 0}" ${laptop.display?.res || ''}</span>
              </div>
              <div class="modal-spec">
                <span class="spec-label">Battery</span>
                <span class="spec-value">${laptop.battery_wh || 'N/A'}Wh</span>
              </div>
              <div class="modal-spec">
                <span class="spec-label">Weight</span>
                <span class="spec-value">${laptop.weight_kg || 'N/A'}kg</span>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-primary modal-action-btn" id="addToCompareModalBtn">
                ${this.compareList.includes(laptop.id) ? 'Remove from Compare' : 'Add to Compare'}
              </button>
              <button class="btn-secondary modal-action-btn" id="viewOnVersusBtn">
                Compare with Others
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach modal listeners
    const close = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.modal-backdrop').addEventListener('click', close);

    modal.querySelector('#addToCompareModalBtn').addEventListener('click', () => {
      this.toggleCompare(laptop.id);
      close();
    });

    modal.querySelector('#viewOnVersusBtn').addEventListener('click', () => {
      if (!this.compareList.includes(laptop.id)) {
        this.compareList.push(laptop.id);
      }
      this.goToVersus();
    });

    return modal;
  }

  async saveToCache() {
    await storage.setCache('explorer_state', {
      filters: this.filters,
      sortBy: this.sortBy,
      currentView: this.currentView,
      compareList: this.compareList
    }, 86400000); // 24 hours
  }

  async loadFromCache() {
    const cached = await storage.getCache('explorer_state');
    if (cached) {
      this.filters = cached.filters || this.filters;
      this.sortBy = cached.sortBy || this.sortBy;
      this.currentView = cached.currentView || this.currentView;
      this.compareList = cached.compareList || this.compareList;

      // Update UI
      if (this.sortSelect) this.sortSelect.value = this.sortBy;
      if (this.currentView === 'list') {
        this.listViewBtn?.classList.add('active');
        this.gridViewBtn?.classList.remove('active');
      }

      // Re-render
      this.renderFilters();
      this.applyFilters();
      this.renderLaptops();

      // Show compare prompt if needed
      if (this.compareList.length >= 2) {
        this.showComparePrompt();
      }
    }
  }

  getUniqueBrands() {
    const brands = [...new Set(this.laptopDatabase.map(l => l.brand))];
    return brands.sort();
  }

  formatPrice(price) {
    if (!price) return '0';
    return price.toLocaleString('en-MY');
  }

  truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `explorer-notification explorer-notification-${type}`;
    notification.textContent = message;

    const bgColors = {
      success: '#00F0FF',
      error: '#D83F87',
      warning: '#FFD700',
      info: '#A8B2CC'
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${bgColors[type] || bgColors.info};
      color: #0D1117;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  getDemoData() {
    // Fallback demo data if fetch fails
    return [
      {
        id: 'demo-1',
        brand: 'Apple',
        model: 'MacBook Air M3',
        price_myr: 5299,
        cpu: { gen: 'M3', cores: 8 },
        ram: { gb: 16 },
        gpu: { chip: 'M3 GPU', vram: 0 },
        storage: { gb: 512 },
        display: { size: 13.6, res: '2560x1664', refresh: 60, nits: 500 },
        battery_wh: 52,
        weight_kg: 1.24,
        category: ['ultrabook', 'creative']
      },
      {
        id: 'demo-2',
        brand: 'Lenovo',
        model: 'Legion 5 Pro',
        price_myr: 4999,
        cpu: { gen: 'AMD Ryzen 7 7735H', cores: 8 },
        ram: { gb: 16 },
        gpu: { chip: 'RTX 4060', vram: 8 },
        storage: { gb: 512 },
        display: { size: 16, res: '2560x1600', refresh: 165, nits: 500 },
        battery_wh: 80,
        weight_kg: 2.5,
        category: ['gaming']
      },
      {
        id: 'demo-3',
        brand: 'Dell',
        model: 'XPS 13 Plus',
        price_myr: 6499,
        cpu: { gen: 'Intel Core i7-1360P', cores: 12 },
        ram: { gb: 16 },
        gpu: { chip: 'Iris Xe', vram: 0 },
        storage: { gb: 512 },
        display: { size: 13.4, res: '1920x1200', refresh: 60, nits: 500 },
        battery_wh: 55,
        weight_kg: 1.26,
        category: ['ultrabook', 'business']
      }
    ];
  }
}

// Export for module usage
export default Explorer;
