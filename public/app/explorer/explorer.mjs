// Explorer Module - Real Laptop Data Integration
export class Explorer {
  constructor() {
    this.laptops = [];
    this.filteredLaptops = [];
    this.currentView = 'grid';
    this.currentSort = 'rank';
    this.filters = {
      brands: [],
      categories: [],
      priceMin: 0,
      priceMax: 10000
    };
  }

  async init() {
    try {
      // Load laptop data
      await this.loadLaptops();

      // Setup UI
      this.setupFilters();
      this.setupSorting();
      this.setupViewToggle();
      this.setupMobileFilters();

      // Initial render
      this.applyFilters();
      this.renderLaptops();
    } catch (error) {
      console.error('Failed to initialize Explorer:', error);
      this.showError('Failed to load laptop data. Please refresh the page.');
    }
  }

  async loadLaptops() {
    const response = await fetch('/data/laptops.json');
    if (!response.ok) {
      throw new Error('Failed to fetch laptops');
    }
    this.laptops = await response.json();
    this.filteredLaptops = [...this.laptops];
    console.log(`Loaded ${this.laptops.length} laptops`);
  }

  setupFilters() {
    const filtersContent = document.getElementById('filtersContent');

    // Extract unique brands
    const brands = [...new Set(this.laptops.map(l => l.brand))].sort();

    // Extract unique categories
    const allCategories = this.laptops.flatMap(l => l.category || []);
    const categories = [...new Set(allCategories)].sort();

    // Price range
    const prices = this.laptops.map(l => l.price_MYR).filter(p => p > 0);
    const minPrice = Math.floor(Math.min(...prices) / 100) * 100;
    const maxPrice = Math.ceil(Math.max(...prices) / 100) * 100;

    filtersContent.innerHTML = `
      <!-- Price Filter -->
      <div class="filter-group">
        <h4 class="filter-group-title">Price Range</h4>
        <div class="price-range">
          <input type="number" id="priceMin" value="${minPrice}" min="${minPrice}" max="${maxPrice}" placeholder="Min" class="price-input">
          <span>—</span>
          <input type="number" id="priceMax" value="${maxPrice}" min="${minPrice}" max="${maxPrice}" placeholder="Max" class="price-input">
        </div>
        <div class="price-display">
          RM${minPrice.toLocaleString()} - RM${maxPrice.toLocaleString()}
        </div>
      </div>

      <!-- Brand Filter -->
      <div class="filter-group">
        <h4 class="filter-group-title">Brand</h4>
        <div class="filter-options">
          ${brands.map(brand => `
            <label class="filter-checkbox">
              <input type="checkbox" value="${brand}" data-filter="brand">
              <span>${brand}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Category Filter -->
      <div class="filter-group">
        <h4 class="filter-group-title">Category</h4>
        <div class="filter-options">
          ${categories.map(cat => `
            <label class="filter-checkbox">
              <input type="checkbox" value="${cat}" data-filter="category">
              <span>${cat}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // Setup event listeners
    document.getElementById('clearFilters').addEventListener('click', () => {
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      document.getElementById('priceMin').value = minPrice;
      document.getElementById('priceMax').value = maxPrice;
      this.filters = { brands: [], categories: [], priceMin: minPrice, priceMax: maxPrice };
      this.applyFilters();
      this.renderLaptops();
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        this.updateFilters();
        this.applyFilters();
        this.renderLaptops();
      });
    });

    document.getElementById('priceMin').addEventListener('change', () => {
      this.updateFilters();
      this.applyFilters();
      this.renderLaptops();
    });

    document.getElementById('priceMax').addEventListener('change', () => {
      this.updateFilters();
      this.applyFilters();
      this.renderLaptops();
    });
  }

  updateFilters() {
    // Update brands
    const brandCheckboxes = document.querySelectorAll('input[data-filter="brand"]:checked');
    this.filters.brands = Array.from(brandCheckboxes).map(cb => cb.value);

    // Update categories
    const categoryCheckboxes = document.querySelectorAll('input[data-filter="category"]:checked');
    this.filters.categories = Array.from(categoryCheckboxes).map(cb => cb.value);

    // Update price
    this.filters.priceMin = parseInt(document.getElementById('priceMin').value) || 0;
    this.filters.priceMax = parseInt(document.getElementById('priceMax').value) || 999999;
  }

  applyFilters() {
    this.filteredLaptops = this.laptops.filter(laptop => {
      // Brand filter
      if (this.filters.brands.length > 0 && !this.filters.brands.includes(laptop.brand)) {
        return false;
      }

      // Category filter
      if (this.filters.categories.length > 0) {
        const hasMatchingCategory = laptop.category?.some(cat =>
          this.filters.categories.includes(cat)
        );
        if (!hasMatchingCategory) return false;
      }

      // Price filter
      const price = laptop.price_MYR || 0;
      if (price < this.filters.priceMin || price > this.filters.priceMax) {
        return false;
      }

      return true;
    });

    // Apply sorting
    this.sortLaptops();
  }

  sortLaptops() {
    switch (this.currentSort) {
      case 'price-asc':
        this.filteredLaptops.sort((a, b) => (a.price_MYR || 0) - (b.price_MYR || 0));
        break;
      case 'price-desc':
        this.filteredLaptops.sort((a, b) => (b.price_MYR || 0) - (a.price_MYR || 0));
        break;
      case 'rating':
        this.filteredLaptops.sort((a, b) => (b.score_composite || 0) - (a.score_composite || 0));
        break;
      case 'newest':
        this.filteredLaptops.sort((a, b) =>
          new Date(b.release_date || 0) - new Date(a.release_date || 0)
        );
        break;
      case 'rank':
      default:
        this.filteredLaptops.sort((a, b) => (b.score_composite || 0) - (a.score_composite || 0));
        break;
    }
  }

  setupSorting() {
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.applyFilters();
      this.renderLaptops();
    });
  }

  setupViewToggle() {
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    const grid = document.getElementById('laptopsGrid');

    gridBtn.addEventListener('click', () => {
      this.currentView = 'grid';
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
      grid.classList.remove('list-view');
      grid.classList.add('grid-view');
    });

    listBtn.addEventListener('click', () => {
      this.currentView = 'list';
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      grid.classList.add('list-view');
      grid.classList.remove('grid-view');
    });
  }

  setupMobileFilters() {
    const btn = document.getElementById('mobileFiltersBtn');
    const sidebar = document.getElementById('filtersSidebar');
    const overlay = document.getElementById('filtersOverlay');

    btn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('open');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  renderLaptops() {
    const grid = document.getElementById('laptopsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const emptyState = document.getElementById('emptyState');

    // Update count
    resultsCount.innerHTML = `Showing <strong>${this.filteredLaptops.length}</strong> laptops`;

    // Show empty state if no results
    if (this.filteredLaptops.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Render laptop cards
    grid.innerHTML = this.filteredLaptops.map(laptop => this.renderLaptopCard(laptop)).join('');
  }

  renderLaptopCard(laptop) {
    const price = laptop.price_MYR ? `RM${laptop.price_MYR.toLocaleString()}` : 'Price N/A';
    const score = laptop.score_composite ? Math.round(laptop.score_composite) : 'N/A';
    const categories = laptop.category?.join(', ') || 'General';
    const imageUrl = laptop.image_urls?.thumb || '/assets/laptop-placeholder.png';

    return `
      <div class="laptop-card" data-id="${laptop.id}">
        <div class="laptop-card-image">
          <img src="${imageUrl}" alt="${laptop.model}" onerror="this.src='/assets/laptop-placeholder.png'">
          <div class="laptop-card-badge">${score}/100</div>
        </div>
        <div class="laptop-card-content">
          <div class="laptop-card-brand">${laptop.brand}</div>
          <h3 class="laptop-card-title">${laptop.model}</h3>
          <div class="laptop-card-specs">
            <span>💻 ${laptop.cpu?.gen || 'N/A'}</span>
            <span>🎮 ${laptop.gpu?.chip || 'Integrated'}</span>
            <span>💾 ${laptop.ram?.gb}GB RAM</span>
          </div>
          <div class="laptop-card-categories">${categories}</div>
          <div class="laptop-card-footer">
            <div class="laptop-card-price">${price}</div>
            <button class="laptop-card-btn">View Details</button>
          </div>
        </div>
      </div>
    `;
  }

  showError(message) {
    const grid = document.getElementById('laptopsGrid');
    grid.innerHTML = `
      <div class="error-message">
        <span>⚠️</span>
        <p>${message}</p>
      </div>
    `;
  }
}
