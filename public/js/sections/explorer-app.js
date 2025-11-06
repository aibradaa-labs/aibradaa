/**
 * Explorer App Logic
 * Handles laptop browsing with filters and search
 */

import { getDB } from '../utils/db.js';
import { LaptopCard } from '../components/laptop-card.js';
import { Toast, Loader } from '../components/ui.js';
import { getAnalytics } from '../utils/analytics.js';
import { debounce } from '../utils/helpers.js';
import { LazyLoader } from '../utils/performance.js';

export class ExplorerApp {
  constructor() {
    this.analytics = getAnalytics();
    this.laptops = [];
    this.filteredLaptops = [];
    this.currentSort = 'score';
    this.filters = {
      search: '',
      brands: [],
      minPrice: 0,
      maxPrice: 20000,
      minRam: 0,
      usageTypes: []
    };

    this.lazyLoader = new LazyLoader();

    this.init();
  }

  /**
   * Initialize app
   */
  async init() {
    await this.loadLaptops();
    this.setupFilters();
    this.attachEventListeners();
    this.render();

    // Track page view
    if (this.analytics) {
      this.analytics.pageView('/sections/explorer.html');
    }
  }

  /**
   * Load all laptops
   */
  async loadLaptops() {
    const loader = Loader.show({ text: 'Loading laptops...' });

    try {
      const db = await getDB();
      this.laptops = await db.getAllLaptops();
      this.filteredLaptops = [...this.laptops];

      console.log(`Loaded ${this.laptops.length} laptops`);
    } catch (error) {
      console.error('Failed to load laptops:', error);

      if (this.analytics) {
        this.analytics.error(error, { context: 'explorer_load' });
      }

      Toast.show({
        message: 'Failed to load laptops',
        type: 'error'
      });
    } finally {
      Loader.hide();
    }
  }

  /**
   * Setup filter UI
   */
  setupFilters() {
    // Price range
    const prices = this.laptops.map(l => l.price_MYR).filter(p => p != null);
    if (prices.length > 0) {
      this.filters.minPrice = Math.floor(Math.min(...prices) / 1000) * 1000;
      this.filters.maxPrice = Math.ceil(Math.max(...prices) / 1000) * 1000;

      // Update slider
      const minPriceSlider = document.getElementById('min-price');
      const maxPriceSlider = document.getElementById('max-price');

      if (minPriceSlider) {
        minPriceSlider.min = this.filters.minPrice;
        minPriceSlider.max = this.filters.maxPrice;
        minPriceSlider.value = this.filters.minPrice;
      }

      if (maxPriceSlider) {
        maxPriceSlider.min = this.filters.minPrice;
        maxPriceSlider.max = this.filters.maxPrice;
        maxPriceSlider.value = this.filters.maxPrice;
      }
    }

    // Get unique brands
    const brands = [...new Set(this.laptops.map(l => l.brand))].sort();
    this.populateBrandFilters(brands);
  }

  /**
   * Populate brand filter checkboxes
   */
  populateBrandFilters(brands) {
    const container = document.getElementById('brand-filters');

    if (!container) return;

    container.innerHTML = brands.map(brand => `
      <label class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
        <input type="checkbox" value="${brand}" class="brand-filter">
        <span>${brand}</span>
        <span class="ml-auto text-sm text-gray-500">(${this.laptops.filter(l => l.brand === brand).length})</span>
      </label>
    `).join('');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filters.search = e.target.value.toLowerCase();
        this.applyFilters();

        // Track search
        if (this.analytics && this.filters.search) {
          this.analytics.search(this.filters.search, this.filteredLaptops.length);
        }
      }, 300));
    }

    // Brand filters
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('brand-filter')) {
        this.updateBrandFilters();
      }
    });

    // Price range
    const minPriceSlider = document.getElementById('min-price');
    const maxPriceSlider = document.getElementById('max-price');

    if (minPriceSlider) {
      minPriceSlider.addEventListener('input', debounce((e) => {
        this.filters.minPrice = parseInt(e.target.value);
        this.updatePriceDisplay();
        this.applyFilters();
      }, 200));
    }

    if (maxPriceSlider) {
      maxPriceSlider.addEventListener('input', debounce((e) => {
        this.filters.maxPrice = parseInt(e.target.value);
        this.updatePriceDisplay();
        this.applyFilters();
      }, 200));
    }

    // Sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.applySort();
        this.render();
      });
    }

    // Clear filters
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      this.clearFilters();
    });

    // View toggle (grid/list)
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.toggleView(view);
      });
    });
  }

  /**
   * Update brand filters
   */
  updateBrandFilters() {
    const checked = Array.from(document.querySelectorAll('.brand-filter:checked'))
      .map(cb => cb.value);

    this.filters.brands = checked;
    this.applyFilters();
  }

  /**
   * Update price display
   */
  updatePriceDisplay() {
    const minDisplay = document.getElementById('min-price-display');
    const maxDisplay = document.getElementById('max-price-display');

    if (minDisplay) {
      minDisplay.textContent = `RM ${this.filters.minPrice.toLocaleString()}`;
    }

    if (maxDisplay) {
      maxDisplay.textContent = `RM ${this.filters.maxPrice.toLocaleString()}`;
    }
  }

  /**
   * Apply filters
   */
  applyFilters() {
    this.filteredLaptops = this.laptops.filter(laptop => {
      // Search filter
      if (this.filters.search) {
        const searchTerm = this.filters.search;
        const searchable = `${laptop.brand} ${laptop.model} ${laptop.cpu?.gen}`.toLowerCase();

        if (!searchable.includes(searchTerm)) {
          return false;
        }
      }

      // Brand filter
      if (this.filters.brands.length > 0) {
        if (!this.filters.brands.includes(laptop.brand)) {
          return false;
        }
      }

      // Price filter
      if (laptop.price_MYR < this.filters.minPrice || laptop.price_MYR > this.filters.maxPrice) {
        return false;
      }

      // RAM filter
      if (laptop.ram?.gb < this.filters.minRam) {
        return false;
      }

      return true;
    });

    this.applySort();
    this.render();
  }

  /**
   * Apply sorting
   */
  applySort() {
    const sortFunctions = {
      score: (a, b) => (b.score_composite || 0) - (a.score_composite || 0),
      price_low: (a, b) => (a.price_MYR || 0) - (b.price_MYR || 0),
      price_high: (a, b) => (b.price_MYR || 0) - (a.price_MYR || 0),
      brand: (a, b) => a.brand.localeCompare(b.brand),
      newest: (a, b) => (b.releaseDate || 0) - (a.releaseDate || 0)
    };

    const sortFn = sortFunctions[this.currentSort] || sortFunctions.score;
    this.filteredLaptops.sort(sortFn);
  }

  /**
   * Render laptops
   */
  async render() {
    const container = document.getElementById('laptops-grid');
    const resultsCount = document.getElementById('results-count');

    if (!container) return;

    // Update results count
    if (resultsCount) {
      resultsCount.textContent = `${this.filteredLaptops.length} laptops found`;
    }

    // Clear container
    container.innerHTML = '';

    // Show empty state if no results
    if (this.filteredLaptops.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">No laptops found</h3>
          <p class="text-gray-600 mb-4">Try adjusting your filters</p>
          <button id="reset-filters" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Reset Filters
          </button>
        </div>
      `;

      document.getElementById('reset-filters')?.addEventListener('click', () => {
        this.clearFilters();
      });

      return;
    }

    // Render laptop cards
    for (const laptop of this.filteredLaptops) {
      const card = await LaptopCard.create(laptop, {
        showFavorite: true,
        showCompare: true,
        showSpecs: true
      });

      container.appendChild(card);
    }

    // Setup lazy loading for images
    const images = container.querySelectorAll('img[loading="lazy"]');
    this.lazyLoader.observe(images);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    // Reset filter values
    this.filters = {
      search: '',
      brands: [],
      minPrice: Math.min(...this.laptops.map(l => l.price_MYR)),
      maxPrice: Math.max(...this.laptops.map(l => l.price_MYR)),
      minRam: 0,
      usageTypes: []
    };

    // Reset UI
    document.getElementById('search-input').value = '';
    document.querySelectorAll('.brand-filter').forEach(cb => cb.checked = false);

    const minPriceSlider = document.getElementById('min-price');
    const maxPriceSlider = document.getElementById('max-price');

    if (minPriceSlider) minPriceSlider.value = this.filters.minPrice;
    if (maxPriceSlider) maxPriceSlider.value = this.filters.maxPrice;

    this.updatePriceDisplay();
    this.applyFilters();

    Toast.show({
      message: 'Filters cleared',
      type: 'info'
    });
  }

  /**
   * Toggle view mode (grid/list)
   */
  toggleView(view) {
    const container = document.getElementById('laptops-grid');

    if (view === 'list') {
      container.classList.remove('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
      container.classList.add('grid-cols-1');
    } else {
      container.classList.remove('grid-cols-1');
      container.classList.add('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    }

    // Update active button
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ExplorerApp();
  });
} else {
  new ExplorerApp();
}
