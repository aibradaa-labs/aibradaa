/**
 * Appendices - Full Top 100 Laptop Catalog
 * AI Bradaa - Complete catalog with best offers & affiliate tracking
 *
 * ARCHITECTURE: Hybrid Enhancement Pattern
 * - HTML provides static structure (header, search, filters, catalog grid, pagination)
 * - JavaScript enhances with dynamic content (laptop cards, filtering, pagination)
 * - Progressive enhancement approach (no innerHTML replacement)
 *
 * THIS IS THE FINAL MODULE (6/6) - COMPLETING THE PWA SUITE!
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Appendices {
  constructor() {
    this.laptopDatabase = [];
    this.filteredLaptops = [];
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.searchQuery = '';
    this.currentFilter = 'all';
    this.userTier = 'free';

    // DOM references (existing elements)
    this.catalogList = null;
    this.catalogSearch = null;
    this.searchBtn = null;
    this.filterChips = [];
    this.pagination = null;
    this.prevBtn = null;
    this.nextBtn = null;
  }

  async init() {
    // Get existing DOM elements
    this.catalogList = document.getElementById('catalogList');
    this.catalogSearch = document.getElementById('catalogSearch');
    this.searchBtn = document.querySelector('.search-btn');
    this.filterChips = document.querySelectorAll('.quick-filter-chip');
    this.pagination = document.getElementById('pagination');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');

    // Validation
    if (!this.catalogList || !this.catalogSearch) {
      console.error('Required elements not found! appendices.mjs needs #catalogList and #catalogSearch');
      return;
    }

    // Load user tier and database
    await this.loadUserTier();
    await this.loadLaptopDatabase();

    // Apply filters and render
    this.applyFilters();
    this.renderCatalog();

    // Attach event listeners
    this.attachEventListeners();

    // Show tier limit notification
    if (this.userTier === 'free' && this.laptopDatabase.length > 35) {
      this.showTierLimitNotification();
    }
  }

  async loadUserTier() {
    try {
      const token = await storage.getToken();
      if (!token) {
        this.userTier = 'free';
        return;
      }

      const response = await apiClient.getUserProfile();
      this.userTier = response.data.user.tier || 'free';
    } catch (error) {
      console.warn('Failed to load user tier, defaulting to free');
      this.userTier = 'free';
    }
  }

  async loadLaptopDatabase() {
    try {
      // Try cache first
      const cached = await storage.getCache('laptops_db');
      if (cached) {
        this.laptopDatabase = this.userTier === 'free'
          ? cached.slice(0, 35)
          : cached;
        return;
      }

      // Fetch from server
      const response = await fetch('/data/laptops.json');
      if (!response.ok) throw new Error('Failed to fetch laptop database');

      const fullData = await response.json();

      // Free tier: Top 35, Pro/Ultimate: All 100
      this.laptopDatabase = this.userTier === 'free'
        ? fullData.slice(0, 35)
        : fullData;

      // Cache full dataset
      await storage.setCache('laptops_db', fullData, 3600000);

    } catch (error) {
      console.error('Failed to load laptop database:', error);
      this.showNotification('Failed to load catalog. Using demo data.', 'error');
      this.loadDemoData();
    }
  }

  loadDemoData() {
    this.laptopDatabase = [
      {
        id: 'demo-1',
        brand: 'Apple',
        model: 'MacBook Air M3',
        price_myr: 5299,
        cpu: { gen: 'M3', cores: 8 },
        ram: { gb: 16 },
        gpu: { chip: 'M3 GPU', vram: 0 },
        storage: { gb: 512 },
        display: { size: 13.6, res: '2560x1664' },
        image: '/assets/default-laptop.png',
        category: ['ultrabook', 'creative'],
        affiliate_url: '#'
      },
      {
        id: 'demo-2',
        brand: 'Lenovo',
        model: 'Legion 5 Pro',
        price_myr: 4999,
        cpu: { gen: 'AMD Ryzen 7', cores: 8 },
        ram: { gb: 16 },
        gpu: { chip: 'RTX 4060', vram: 8 },
        storage: { gb: 512 },
        display: { size: 16, res: '2560x1600' },
        image: '/assets/default-laptop.png',
        category: ['gaming'],
        affiliate_url: '#'
      }
    ];
  }

  attachEventListeners() {
    // Search input
    this.catalogSearch?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.currentPage = 1;
      this.applyFilters();
      this.renderCatalog();
    });

    // Search button
    this.searchBtn?.addEventListener('click', () => {
      this.applyFilters();
      this.renderCatalog();
    });

    // Search on Enter key
    this.catalogSearch?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.applyFilters();
        this.renderCatalog();
      }
    });

    // Filter chips
    this.filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        if (filter) {
          this.currentFilter = filter;
          this.currentPage = 1;

          // Update active state
          this.filterChips.forEach(c => c.classList.remove('active'));
          e.target.classList.add('active');

          this.applyFilters();
          this.renderCatalog();
        }
      });
    });

    // Pagination buttons
    this.prevBtn?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderCatalog();
        this.scrollToTop();
      }
    });

    this.nextBtn?.addEventListener('click', () => {
      const totalPages = this.getTotalPages();
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderCatalog();
        this.scrollToTop();
      }
    });
  }

  applyFilters() {
    let filtered = [...this.laptopDatabase];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(laptop => {
        const searchStr = `${laptop.brand} ${laptop.model} ${laptop.cpu?.gen || ''}`.toLowerCase();
        return searchStr.includes(query);
      });
    }

    // Category filter
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(laptop =>
        laptop.category?.includes(this.currentFilter)
      );
    }

    this.filteredLaptops = filtered;
  }

  getPaginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredLaptops.slice(start, end);
  }

  getTotalPages() {
    return Math.ceil(this.filteredLaptops.length / this.itemsPerPage);
  }

  renderCatalog() {
    if (!this.catalogList) return;

    const data = this.getPaginatedData();

    if (data.length === 0) {
      this.catalogList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>No laptops found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      `;
      this.renderPagination();
      return;
    }

    this.catalogList.innerHTML = data.map((laptop, index) =>
      this.renderLaptopCard(laptop, index)
    ).join('');

    // Attach card listeners
    this.attachCardListeners();

    // Update pagination
    this.renderPagination();
  }

  renderLaptopCard(laptop, index) {
    const rank = (this.currentPage - 1) * this.itemsPerPage + index + 1;

    return `
      <div class="catalog-card" data-id="${laptop.id}">
        ${rank <= 10 ? `<div class="catalog-rank">Top ${rank}</div>` : ''}

        <div class="catalog-card-image">
          <img src="${laptop.image || '/assets/default-laptop.png'}"
               alt="${laptop.brand} ${laptop.model}"
               loading="lazy">
        </div>

        <div class="catalog-card-content">
          <h3 class="catalog-brand">${laptop.brand}</h3>
          <p class="catalog-model">${laptop.model}</p>

          <div class="catalog-specs">
            <div class="spec-row">
              <span class="spec-label">CPU:</span>
              <span class="spec-value">${this.truncate(laptop.cpu?.gen || 'N/A', 20)}</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">RAM:</span>
              <span class="spec-value">${laptop.ram?.gb || 0}GB</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Storage:</span>
              <span class="spec-value">${laptop.storage?.gb || 0}GB SSD</span>
            </div>
            ${laptop.gpu?.vram ? `
              <div class="spec-row">
                <span class="spec-label">GPU:</span>
                <span class="spec-value">${this.truncate(laptop.gpu.chip, 20)}</span>
              </div>
            ` : ''}
          </div>

          <div class="catalog-card-footer">
            <div class="catalog-price">
              <span class="price-label">Best Price:</span>
              <span class="price-value">RM${this.formatPrice(laptop.price_myr)}</span>
            </div>
            <button class="btn-offer" data-id="${laptop.id}">
              View Offer →
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderPagination() {
    if (!this.pagination) return;

    const totalPages = this.getTotalPages();

    if (totalPages <= 1) {
      this.pagination.style.display = 'none';
      return;
    }

    this.pagination.style.display = 'flex';

    // Update prev/next buttons
    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentPage === 1;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentPage === totalPages;
    }

    // Get page buttons (existing buttons 1-5)
    const pageButtons = this.pagination.querySelectorAll('.page-btn:not(#prevBtn):not(#nextBtn)');

    // Calculate visible page range
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Update page buttons
    pageButtons.forEach((btn, index) => {
      if (index < pages.length) {
        const pageNum = pages[index];
        btn.textContent = pageNum;
        btn.dataset.page = pageNum;
        btn.style.display = 'block';

        if (pageNum === this.currentPage) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }

        // Remove old listeners and add new
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
          this.currentPage = pageNum;
          this.renderCatalog();
          this.scrollToTop();
        });
      } else {
        btn.style.display = 'none';
      }
    });
  }

  attachCardListeners() {
    // View offer buttons
    document.querySelectorAll('.btn-offer').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const laptopId = e.target.dataset.id;
        await this.viewOffer(laptopId);
      });
    });

    // Card click - also opens offer
    document.querySelectorAll('.catalog-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('btn-offer')) {
          const laptopId = card.dataset.id;
          await this.viewOffer(laptopId);
        }
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
      timestamp: Date.now(),
      laptop: {
        brand: laptop.brand,
        model: laptop.model,
        price: laptop.price_myr
      }
    });

    // Show modal with offer details
    this.showOfferModal(laptop);
  }

  showOfferModal(laptop) {
    const modal = document.createElement('div');
    modal.className = 'offer-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="offer-modal-body">
          <div class="offer-image">
            <img src="${laptop.image || '/assets/default-laptop.png'}"
                 alt="${laptop.brand} ${laptop.model}">
          </div>
          <div class="offer-info">
            <h2 class="offer-title">${laptop.brand} ${laptop.model}</h2>
            <div class="offer-price">
              <span class="price-label">Best Price:</span>
              <span class="price-value">RM${this.formatPrice(laptop.price_myr)}</span>
            </div>

            <div class="offer-specs">
              <h3>Specifications</h3>
              <div class="spec-list">
                <div class="spec-item">
                  <span>Processor:</span>
                  <span>${laptop.cpu?.gen || 'N/A'}</span>
                </div>
                <div class="spec-item">
                  <span>RAM:</span>
                  <span>${laptop.ram?.gb || 0}GB</span>
                </div>
                <div class="spec-item">
                  <span>Storage:</span>
                  <span>${laptop.storage?.gb || 0}GB SSD</span>
                </div>
                ${laptop.gpu?.chip ? `
                  <div class="spec-item">
                    <span>GPU:</span>
                    <span>${laptop.gpu.chip}</span>
                  </div>
                ` : ''}
                ${laptop.display?.size ? `
                  <div class="spec-item">
                    <span>Display:</span>
                    <span>${laptop.display.size}" ${laptop.display.res || ''}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="offer-actions">
              <a href="${laptop.affiliate_url || `/out/${laptop.id}`}"
                 target="_blank"
                 rel="noopener,noreferrer"
                 class="btn-primary offer-cta">
                View Best Offer →
              </a>
              <p class="affiliate-note">
                <small>Clicking this link supports AI Bradaa through affiliate commissions</small>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);

    // Close handlers
    const close = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.modal-backdrop').addEventListener('click', close);
  }

  showTierLimitNotification() {
    setTimeout(() => {
      const notification = document.createElement('div');
      notification.className = 'tier-limit-banner';
      notification.innerHTML = `
        <div class="banner-content">
          <div class="banner-icon">🔓</div>
          <div class="banner-text">
            <strong>Viewing Top 35 Laptops</strong>
            <p>Upgrade to Pro to unlock all 100 laptops with exclusive deals</p>
          </div>
          <a href="/pricing#pro" class="banner-btn">Upgrade Now</a>
        </div>
      `;

      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #D83F87, #00F0FF);
        color: #fff;
        padding: 20px 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 240, 255, 0.3);
        z-index: 1000;
        max-width: 600px;
        width: 90%;
        animation: slideInUp 0.3s ease;
      `;

      document.body.appendChild(notification);

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 10000);
    }, 2000); // Show after 2 seconds
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

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `appendices-notification appendices-notification-${type}`;
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
}

// Export for module usage
export default Appendices;
