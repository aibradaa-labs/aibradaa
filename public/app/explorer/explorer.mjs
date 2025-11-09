/**
 * Explorer Tool - Browse Top 35 Laptops with Smart Filters
 * AI Bradaa - Grid view with advanced filtering
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Explorer {
  constructor() {
    this.laptopDatabase = [];
    this.filteredLaptops = [];
    this.currentView = 'grid'; // 'grid' or 'list'
    this.sortBy = 'price_asc';
    this.filters = {
      priceRange: [0, 15000],
      brands: [],
      categories: [],
      minRam: 0,
      hasGPU: false,
      maxWeight: 5
    };
    this.compareList = [];
  }

  async init() {
    await this.loadLaptopDatabase();
    this.applyFilters();
    this.render();
    this.attachEventListeners();
  }

  async loadLaptopDatabase() {
    try {
      const cached = await storage.getCache('laptops_db');
      if (cached) {
        this.laptopDatabase = cached;
        return;
      }

      const response = await fetch('/data/laptops.json');
      this.laptopDatabase = await response.json();
      await storage.setCache('laptops_db', this.laptopDatabase, 3600000);
    } catch (error) {
      console.error('Failed to load laptop database:', error);
      this.showError('Failed to load laptop database');
    }
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
          this.filters.categories.includes(cat)
        );
        if (!hasCategory) return false;
      }

      // RAM
      if ((laptop.ram?.gb || 0) < this.filters.minRam) {
        return false;
      }

      // GPU
      if (this.filters.hasGPU && !laptop.gpu?.chip) {
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
  }

  sortLaptops() {
    switch (this.sortBy) {
      case 'price_asc':
        this.filteredLaptops.sort((a, b) => (a.price_myr || 0) - (b.price_myr || 0));
        break;
      case 'price_desc':
        this.filteredLaptops.sort((a, b) => (b.price_myr || 0) - (a.price_myr || 0));
        break;
      case 'newest':
        this.filteredLaptops.sort((a, b) =>
          new Date(b.release_date || 0) - new Date(a.release_date || 0)
        );
        break;
      case 'performance':
        this.filteredLaptops.sort((a, b) =>
          this.calculatePerformanceScore(b) - this.calculatePerformanceScore(a)
        );
        break;
      case 'popular':
        // Keep default order (pre-sorted by popularity in database)
        break;
    }
  }

  calculatePerformanceScore(laptop) {
    let score = 0;
    score += (laptop.cpu?.cores || 0) * 10;
    score += laptop.gpu?.vram || 0;
    score += (laptop.ram?.gb || 0) * 2;
    score += laptop.npu_tops || 0;
    return score;
  }

  render() {
    const container = document.getElementById('explorerContainer') || document.body;

    container.innerHTML = `
      <div class="explorer-wrapper">

        <!-- Header -->
        <div class="explorer-header">
          <h1>🔍 Explorer</h1>
          <p>Browse Top 35 laptops with smart filters</p>
        </div>

        <!-- Toolbar -->
        <div class="explorer-toolbar">
          <div class="toolbar-left">
            <span class="result-count">${this.filteredLaptops.length} laptops</span>
            <button class="btn btn-small ${this.currentView === 'grid' ? 'active' : ''}"
                    id="gridViewBtn">
              Grid
            </button>
            <button class="btn btn-small ${this.currentView === 'list' ? 'active' : ''}"
                    id="listViewBtn">
              List
            </button>
          </div>

          <div class="toolbar-right">
            <select id="sortSelect" class="sort-dropdown">
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="performance">Best Performance</option>
            </select>
          </div>
        </div>

        <!-- Filters & Content -->
        <div class="explorer-layout">

          <!-- Sidebar Filters -->
          <aside class="explorer-sidebar">
            <div class="filter-section">
              <h3>Filters</h3>
              <button class="btn btn-secondary btn-small" id="clearFiltersBtn">Clear All</button>
            </div>

            <!-- Price Range -->
            <div class="filter-group">
              <h4>Price Range</h4>
              <div class="price-range-inputs">
                <input type="number" id="priceMin" value="${this.filters.priceRange[0]}"
                       placeholder="Min" min="0" max="20000" step="500">
                <span>to</span>
                <input type="number" id="priceMax" value="${this.filters.priceRange[1]}"
                       placeholder="Max" min="0" max="20000" step="500">
              </div>
              <input type="range" id="priceSlider" min="0" max="15000" value="${this.filters.priceRange[1]}" step="500">
              <div class="price-labels">
                <span>RM0</span>
                <span>RM15k+</span>
              </div>
            </div>

            <!-- Brands -->
            <div class="filter-group">
              <h4>Brand</h4>
              <div class="checkbox-group">
                ${this.getUniqueBrands().map(brand => `
                  <label class="checkbox-filter">
                    <input type="checkbox" class="brand-filter" value="${brand}"
                           ${this.filters.brands.includes(brand) ? 'checked' : ''}>
                    <span>${brand}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Categories -->
            <div class="filter-group">
              <h4>Use Case</h4>
              <div class="checkbox-group">
                ${['Gaming', 'Creative', 'Business', 'Student', 'AI'].map(cat => `
                  <label class="checkbox-filter">
                    <input type="checkbox" class="category-filter" value="${cat}"
                           ${this.filters.categories.includes(cat) ? 'checked' : ''}>
                    <span>${cat}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Specs -->
            <div class="filter-group">
              <h4>Minimum RAM</h4>
              <select id="ramFilter" class="filter-dropdown">
                <option value="0">Any</option>
                <option value="8" ${this.filters.minRam === 8 ? 'selected' : ''}>8GB+</option>
                <option value="16" ${this.filters.minRam === 16 ? 'selected' : ''}>16GB+</option>
                <option value="32" ${this.filters.minRam === 32 ? 'selected' : ''}>32GB+</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="checkbox-filter">
                <input type="checkbox" id="gpuFilter" ${this.filters.hasGPU ? 'checked' : ''}>
                <span>Has Dedicated GPU</span>
              </label>
            </div>

            <div class="filter-group">
              <h4>Max Weight</h4>
              <select id="weightFilter" class="filter-dropdown">
                <option value="5">Any</option>
                <option value="2" ${this.filters.maxWeight === 2 ? 'selected' : ''}>Under 2kg</option>
                <option value="2.5" ${this.filters.maxWeight === 2.5 ? 'selected' : ''}>Under 2.5kg</option>
                <option value="3" ${this.filters.maxWeight === 3 ? 'selected' : ''}>Under 3kg</option>
              </select>
            </div>
          </aside>

          <!-- Main Content -->
          <main class="explorer-content">
            ${this.currentView === 'grid' ? this.renderGrid() : this.renderList()}
          </main>

        </div>

        <!-- Compare Drawer -->
        ${this.compareList.length > 0 ? this.renderCompareDrawer() : ''}

      </div>
    `;

    this.attachEventListeners();
  }

  renderGrid() {
    if (this.filteredLaptops.length === 0) {
      return '<div class="no-results">No laptops match your filters</div>';
    }

    return `
      <div class="laptop-grid">
        ${this.filteredLaptops.map((laptop, index) => `
          <div class="laptop-card" data-id="${laptop.id}">
            ${index < 10 ? `<div class="rank-badge">Top ${index + 1}</div>` : ''}
            <div class="card-image">
              <img src="${laptop.image || '/assets/default-laptop.png'}"
                   alt="${laptop.brand} ${laptop.model}">
            </div>
            <div class="card-content">
              <h3 class="card-title">${laptop.brand}</h3>
              <p class="card-model">${laptop.model}</p>
              <div class="card-specs">
                <span title="Processor">💻 ${this.truncate(laptop.cpu?.gen || 'N/A', 20)}</span>
                <span title="RAM">🧠 ${laptop.ram?.gb || 0}GB</span>
                <span title="Storage">💾 ${laptop.storage?.gb || 0}GB</span>
                ${laptop.gpu ? `<span title="GPU">🎮 ${this.truncate(laptop.gpu.chip, 15)}</span>` : ''}
              </div>
              <div class="card-footer">
                <div class="card-price">RM${this.formatPrice(laptop.price_myr)}</div>
                <div class="card-actions">
                  <button class="btn btn-primary btn-small view-details-btn"
                          data-id="${laptop.id}">
                    View
                  </button>
                  <button class="btn btn-secondary btn-small compare-btn"
                          data-id="${laptop.id}"
                          title="Add to compare">
                    ${this.compareList.includes(laptop.id) ? '✓' : '+'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderList() {
    if (this.filteredLaptops.length === 0) {
      return '<div class="no-results">No laptops match your filters</div>';
    }

    return `
      <div class="laptop-list">
        ${this.filteredLaptops.map((laptop, index) => `
          <div class="laptop-list-item" data-id="${laptop.id}">
            <div class="list-rank">#${index + 1}</div>
            <div class="list-image">
              <img src="${laptop.image || '/assets/default-laptop.png'}"
                   alt="${laptop.brand} ${laptop.model}">
            </div>
            <div class="list-info">
              <h4>${laptop.brand} ${laptop.model}</h4>
              <p class="list-specs">
                ${laptop.cpu?.gen || 'N/A'} • ${laptop.ram?.gb || 0}GB RAM •
                ${laptop.storage?.gb || 0}GB SSD •
                ${laptop.display?.size || 0}" Display
                ${laptop.gpu ? `• ${laptop.gpu.chip}` : ''}
              </p>
            </div>
            <div class="list-price">RM${this.formatPrice(laptop.price_myr)}</div>
            <div class="list-actions">
              <button class="btn btn-primary btn-small view-details-btn"
                      data-id="${laptop.id}">
                View Details
              </button>
              <button class="btn btn-secondary btn-small compare-btn"
                      data-id="${laptop.id}">
                ${this.compareList.includes(laptop.id) ? 'Remove' : 'Compare'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCompareDrawer() {
    return `
      <div class="compare-drawer">
        <div class="drawer-header">
          <h4>Compare (${this.compareList.length}/3)</h4>
          <button class="btn btn-primary" id="goToCompareBtn"
                  ${this.compareList.length < 2 ? 'disabled' : ''}>
            Compare Now
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // View toggle
    document.getElementById('gridViewBtn')?.addEventListener('click', () => {
      this.currentView = 'grid';
      this.render();
    });

    document.getElementById('listViewBtn')?.addEventListener('click', () => {
      this.currentView = 'list';
      this.render();
    });

    // Sort
    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.applyFilters();
      this.render();
    });

    // Clear filters
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
      this.filters = {
        priceRange: [0, 15000],
        brands: [],
        categories: [],
        minRam: 0,
        hasGPU: false,
        maxWeight: 5
      };
      this.applyFilters();
      this.render();
    });

    // Price range
    document.getElementById('priceMin')?.addEventListener('change', (e) => {
      this.filters.priceRange[0] = parseInt(e.target.value) || 0;
      this.applyFilters();
      this.render();
    });

    document.getElementById('priceMax')?.addEventListener('change', (e) => {
      this.filters.priceRange[1] = parseInt(e.target.value) || 15000;
      this.applyFilters();
      this.render();
    });

    document.getElementById('priceSlider')?.addEventListener('input', (e) => {
      this.filters.priceRange[1] = parseInt(e.target.value);
      document.getElementById('priceMax').value = e.target.value;
      this.applyFilters();
      this.render();
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
        this.render();
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
        this.render();
      });
    });

    // RAM filter
    document.getElementById('ramFilter')?.addEventListener('change', (e) => {
      this.filters.minRam = parseInt(e.target.value) || 0;
      this.applyFilters();
      this.render();
    });

    // GPU filter
    document.getElementById('gpuFilter')?.addEventListener('change', (e) => {
      this.filters.hasGPU = e.target.checked;
      this.applyFilters();
      this.render();
    });

    // Weight filter
    document.getElementById('weightFilter')?.addEventListener('change', (e) => {
      this.filters.maxWeight = parseFloat(e.target.value) || 5;
      this.applyFilters();
      this.render();
    });

    // View details
    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const laptopId = e.target.dataset.id;
        this.showLaptopDetails(laptopId);
      });
    });

    // Compare buttons
    document.querySelectorAll('.compare-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const laptopId = e.target.dataset.id;
        this.toggleCompare(laptopId);
      });
    });

    // Go to compare
    document.getElementById('goToCompareBtn')?.addEventListener('click', () => {
      window.parent.postMessage({
        type: 'navigate',
        section: 'versus',
        laptopIds: this.compareList
      }, '*');
    });
  }

  toggleCompare(laptopId) {
    if (this.compareList.includes(laptopId)) {
      this.compareList = this.compareList.filter(id => id !== laptopId);
    } else {
      if (this.compareList.length < 3) {
        this.compareList.push(laptopId);
      } else {
        alert('Maximum 3 laptops for comparison');
        return;
      }
    }
    this.render();
  }

  showLaptopDetails(laptopId) {
    const laptop = this.laptopDatabase.find(l => l.id === laptopId);
    if (!laptop) return;

    // Send message to parent to open modal
    window.parent.postMessage({
      type: 'showLaptopModal',
      laptop
    }, '*');
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

  showError(message) {
    const container = document.getElementById('explorerContainer') || document.body;
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
    const explorer = new Explorer();
    explorer.init();
  });
} else {
  const explorer = new Explorer();
  explorer.init();
}
