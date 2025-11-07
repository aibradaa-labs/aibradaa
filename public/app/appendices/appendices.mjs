// Appendices Module - Top 100 Catalog
export class Appendices {
  constructor() {
    this.laptops = [];
    this.filteredLaptops = [];
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.currentFilter = 'all';
    this.searchQuery = '';
  }

  async init() {
    try {
      await this.loadLaptops();
      this.setupSearch();
      this.setupFilters();
      this.renderCatalog();
      this.renderPagination();
    } catch (error) {
      console.error('Failed to initialize Appendices:', error);
      this.showError('Failed to load laptop catalog');
    }
  }

  async loadLaptops() {
    const response = await fetch('/data/laptops.json');
    if (!response.ok) {
      throw new Error('Failed to fetch laptops');
    }
    this.laptops = await response.json();
    this.filteredLaptops = [...this.laptops];
    console.log(`Loaded ${this.laptops.length} laptops for catalog`);
  }

  setupSearch() {
    const searchInput = document.getElementById('catalogSearch');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.applyFilters();
      this.currentPage = 1;
      this.renderCatalog();
      this.renderPagination();
    });
  }

  setupFilters() {
    const filterChips = document.querySelectorAll('.quick-filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        // Update active state
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        // Apply filter
        this.currentFilter = chip.dataset.filter;
        this.applyFilters();
        this.currentPage = 1;
        this.renderCatalog();
        this.renderPagination();
      });
    });
  }

  applyFilters() {
    this.filteredLaptops = this.laptops.filter(laptop => {
      // Search filter
      if (this.searchQuery) {
        const searchText = `${laptop.brand} ${laptop.model} ${laptop.cpu?.gen || ''} ${laptop.gpu?.chip || ''}`.toLowerCase();
        if (!searchText.includes(this.searchQuery)) {
          return false;
        }
      }

      // Category filter
      if (this.currentFilter !== 'all') {
        const hasCategory = laptop.category?.some(cat =>
          cat.toLowerCase() === this.currentFilter.toLowerCase()
        );
        if (!hasCategory) return false;
      }

      return true;
    });
  }

  renderCatalog() {
    const catalogList = document.getElementById('catalogList');
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageItems = this.filteredLaptops.slice(start, end);

    if (pageItems.length === 0) {
      catalogList.innerHTML = `
        <div class="empty-catalog">
          <div class="empty-icon">🔍</div>
          <h3>No laptops found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      `;
      return;
    }

    catalogList.innerHTML = pageItems.map((laptop, index) => this.renderCatalogRow(laptop, start + index + 1)).join('');
  }

  renderCatalogRow(laptop, rank) {
    const price = laptop.price_MYR ? `RM${laptop.price_MYR.toLocaleString()}` : 'N/A';
    const score = laptop.score_composite ? Math.round(laptop.score_composite) : 'N/A';
    const categories = laptop.category?.join(', ') || 'General';

    return `
      <div class="catalog-row">
        <div class="catalog-rank">#${rank}</div>
        <div class="catalog-main">
          <div class="catalog-laptop-info">
            <div class="catalog-brand">${laptop.brand}</div>
            <div class="catalog-model">${laptop.model}</div>
            <div class="catalog-categories">${categories}</div>
          </div>
          <div class="catalog-specs">
            <span title="Processor">💻 ${laptop.cpu?.gen || 'N/A'}</span>
            <span title="Graphics">🎮 ${laptop.gpu?.chip || 'Integrated'}</span>
            <span title="RAM">💾 ${laptop.ram?.gb}GB</span>
            <span title="Storage">📁 ${laptop.storage?.gb}GB</span>
          </div>
        </div>
        <div class="catalog-score">
          <div class="score-badge">${score}</div>
          <div class="score-label">Score</div>
        </div>
        <div class="catalog-price">
          <div class="price-value">${price}</div>
          <a href="#" class="view-offers-btn" data-id="${laptop.id}">View Offers</a>
        </div>
      </div>
    `;
  }

  renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(this.filteredLaptops.length / this.itemsPerPage);

    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'flex';

    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (this.currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', totalPages);
      }
    }

    pagination.innerHTML = `
      <button class="page-btn" id="prevBtn" ${this.currentPage === 1 ? 'disabled' : ''}>←</button>
      ${pages.map(page => {
        if (page === '...') {
          return `<span class="page-dots">...</span>`;
        }
        return `<button class="page-btn ${page === this.currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`;
      }).join('')}
      <button class="page-btn" id="nextBtn" ${this.currentPage === totalPages ? 'disabled' : ''}>→</button>
    `;

    // Setup pagination event listeners
    document.getElementById('prevBtn').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderCatalog();
        this.renderPagination();
      }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderCatalog();
        this.renderPagination();
      }
    });

    document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page);
        this.renderCatalog();
        this.renderPagination();
      });
    });
  }

  showError(message) {
    const catalogList = document.getElementById('catalogList');
    catalogList.innerHTML = `
      <div class="error-message">
        <span>⚠️</span>
        <p>${message}</p>
      </div>
    `;
  }
}
