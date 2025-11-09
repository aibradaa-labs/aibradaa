/**
 * Intel Feed - Aggregated Tech News & Price Drops
 * AI Bradaa - Live fetch from trusted sources (Pro Feature)
 *
 * ARCHITECTURE: Hybrid Enhancement Pattern
 * - HTML provides static structure (header, tabs, sections, filters)
 * - JavaScript enhances with dynamic content (news items, price drops, alerts)
 * - Progressive enhancement approach (no innerHTML replacement)
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Intel {
  constructor() {
    this.feedItems = [];
    this.priceDrops = [];
    this.newsItems = [];
    this.alerts = [];
    this.currentTab = 'price-drops';
    this.filters = {
      type: 'all',
      dateRange: '7',
      discountMin: '10'
    };
    this.userTier = 'free';

    // DOM references (existing elements)
    this.tabs = [];
    this.sections = {};
    this.priceDropsGrid = null;
    this.newsList = null;
    this.refreshBtn = null;
    this.daysFilter = null;
    this.discountFilter = null;
  }

  async init() {
    // Get existing DOM elements
    this.tabs = document.querySelectorAll('.intel-tab');
    this.sections = {
      'price-drops': document.getElementById('priceDropsSection'),
      'alerts': document.getElementById('alertsSection'),
      'news': document.getElementById('newsSection'),
      'trends': document.getElementById('trendsSection')
    };
    this.priceDropsGrid = document.getElementById('priceDropsGrid');
    this.newsList = document.getElementById('newsList');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.daysFilter = document.getElementById('daysFilter');
    this.discountFilter = document.getElementById('discountFilter');

    // Validation
    if (!this.tabs.length || !this.priceDropsGrid) {
      console.error('Required elements not found! intel.mjs needs .intel-tab and #priceDropsGrid');
      return;
    }

    // Load user tier
    await this.loadUserTier();

    // Check tier and show upgrade prompt if needed
    if (this.userTier === 'free') {
      this.showUpgradePrompt();
      return; // Don't load content for free users
    }

    // Load feed data
    await this.loadFeed();

    // Attach event listeners
    this.attachEventListeners();

    // Render current tab content
    this.renderCurrentTab();
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

  async loadFeed() {
    try {
      // Try cache first
      const cacheKey = `intel_feed_${this.filters.dateRange}`;
      const cached = await storage.getCache(cacheKey);

      if (cached) {
        this.priceDrops = cached.priceDrops || [];
        this.newsItems = cached.newsItems || [];
        return;
      }

      // Fetch from API
      const response = await apiClient.getIntel(this.filters);
      this.priceDrops = response.data.price_drops || [];
      this.newsItems = response.data.news || [];

      // Cache for 30 minutes
      await storage.setCache(cacheKey, {
        priceDrops: this.priceDrops,
        newsItems: this.newsItems
      }, 1800000);

    } catch (error) {
      console.error('Failed to load intel feed:', error);
      this.showNotification('Failed to load feed. Using demo data.', 'error');
      this.loadDemoData();
    }
  }

  loadDemoData() {
    // Demo price drops
    this.priceDrops = [
      {
        id: 'demo-drop-1',
        laptopId: 'demo-1',
        brand: 'Lenovo',
        model: 'Legion 5 Pro',
        oldPrice: 5999,
        newPrice: 4999,
        discount: 17,
        source: 'Shopee',
        url: '#',
        image: '/assets/default-laptop.png',
        timestamp: Date.now() - 7200000 // 2 hours ago
      },
      {
        id: 'demo-drop-2',
        laptopId: 'demo-2',
        brand: 'ASUS',
        model: 'ROG Zephyrus G14',
        oldPrice: 6999,
        newPrice: 5699,
        discount: 19,
        source: 'Lazada',
        url: '#',
        image: '/assets/default-laptop.png',
        timestamp: Date.now() - 14400000 // 4 hours ago
      }
    ];

    // Demo news items
    this.newsItems = [
      {
        id: 'demo-news-1',
        title: 'AMD Launches New Ryzen 8000 Series for Laptops',
        excerpt: 'AMD announces next-gen mobile processors with improved AI capabilities and battery life.',
        source: 'TechRadar',
        url: '#',
        image: '/assets/default-laptop.png',
        timestamp: Date.now() - 3600000, // 1 hour ago
        type: 'news'
      },
      {
        id: 'demo-news-2',
        title: 'MacBook Pro M4 Review: The Ultimate Creative Powerhouse',
        excerpt: 'Apple\'s latest M4 chip delivers unprecedented performance for video editing and 3D rendering.',
        source: 'The Verge',
        url: '#',
        image: '/assets/default-laptop.png',
        timestamp: Date.now() - 7200000, // 2 hours ago
        type: 'review'
      }
    ];
  }

  attachEventListeners() {
    // Tab switching
    this.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // Refresh button
    this.refreshBtn?.addEventListener('click', async () => {
      await this.refreshFeed();
    });

    // Days filter
    this.daysFilter?.addEventListener('change', async (e) => {
      this.filters.dateRange = e.target.value;
      await this.refreshFeed();
    });

    // Discount filter
    this.discountFilter?.addEventListener('change', async (e) => {
      this.filters.discountMin = e.target.value;
      this.renderPriceDrops(); // Just re-render, don't refetch
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update active tab
    this.tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Show/hide sections
    Object.keys(this.sections).forEach(sectionName => {
      const section = this.sections[sectionName];
      if (section) {
        if (sectionName === tabName) {
          section.classList.add('active');
          section.style.display = 'block';
        } else {
          section.classList.remove('active');
          section.style.display = 'none';
        }
      }
    });

    // Render current tab content
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    switch (this.currentTab) {
      case 'price-drops':
        this.renderPriceDrops();
        break;
      case 'news':
        this.renderNews();
        break;
      case 'alerts':
        // Already rendered in HTML (empty state)
        break;
      case 'trends':
        // Already rendered in HTML (coming soon)
        break;
    }
  }

  renderPriceDrops() {
    if (!this.priceDropsGrid) return;

    // Filter by minimum discount
    const filtered = this.priceDrops.filter(drop =>
      drop.discount >= parseInt(this.filters.discountMin)
    );

    if (filtered.length === 0) {
      this.priceDropsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <p>No price drops found</p>
          <button class="refresh-btn" onclick="this.closest('.empty-state').parentElement.previousElementSibling.querySelector('#refreshBtn').click()">
            Refresh
          </button>
        </div>
      `;
      return;
    }

    this.priceDropsGrid.innerHTML = filtered.map(drop => `
      <div class="price-drop-card" data-id="${drop.id}">
        <div class="drop-image">
          <img src="${drop.image || '/assets/default-laptop.png'}"
               alt="${drop.brand} ${drop.model}"
               loading="lazy">
          <div class="drop-badge">${drop.discount}% OFF</div>
        </div>
        <div class="drop-info">
          <h4 class="drop-brand">${drop.brand}</h4>
          <p class="drop-model">${drop.model}</p>
          <div class="drop-source">
            <span class="source-label">From:</span>
            <span class="source-name">${drop.source}</span>
          </div>
        </div>
        <div class="drop-pricing">
          <div class="old-price">
            <span class="price-label">Was:</span>
            <span class="price-value">RM${this.formatPrice(drop.oldPrice)}</span>
          </div>
          <div class="new-price">
            <span class="price-label">Now:</span>
            <span class="price-value">RM${this.formatPrice(drop.newPrice)}</span>
          </div>
          <div class="savings">
            Save RM${this.formatPrice(drop.oldPrice - drop.newPrice)}
          </div>
        </div>
        <div class="drop-time">${this.formatTime(drop.timestamp)}</div>
        <div class="drop-actions">
          <a href="${drop.url}" target="_blank" class="btn-deal">View Deal</a>
          <button class="btn-alert" data-id="${drop.laptopId}">
            Set Alert
          </button>
        </div>
      </div>
    `).join('');

    // Attach alert button listeners
    this.priceDropsGrid.querySelectorAll('.btn-alert').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const laptopId = e.target.dataset.id;
        this.createAlert(laptopId);
      });
    });
  }

  renderNews() {
    if (!this.newsList) return;

    if (this.newsItems.length === 0) {
      this.newsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📰</div>
          <p>No news items found</p>
        </div>
      `;
      return;
    }

    this.newsList.innerHTML = this.newsItems.map(news => `
      <div class="news-item" data-id="${news.id}">
        <div class="news-image">
          <img src="${news.image || '/assets/default-laptop.png'}"
               alt="${news.title}"
               loading="lazy">
          <div class="news-type-badge">${this.getNewsTypeBadge(news.type)}</div>
        </div>
        <div class="news-content">
          <h3 class="news-title">
            <a href="${news.url}" target="_blank" rel="noopener">${news.title}</a>
          </h3>
          <p class="news-excerpt">${news.excerpt}</p>
          <div class="news-meta">
            <span class="news-source">${news.source}</span>
            <span class="news-separator">•</span>
            <span class="news-time">${this.formatTime(news.timestamp)}</span>
          </div>
        </div>
        <div class="news-actions">
          <button class="news-action-btn" data-id="${news.id}" data-action="save">
            🔖 Save
          </button>
          <button class="news-action-btn" data-id="${news.id}" data-action="share">
            🔗 Share
          </button>
        </div>
      </div>
    `).join('');

    // Attach action button listeners
    this.newsList.querySelectorAll('.news-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newsId = e.target.dataset.id;
        const action = e.target.dataset.action;
        this.handleNewsAction(newsId, action);
      });
    });
  }

  getNewsTypeBadge(type) {
    const badges = {
      news: '📰 News',
      review: '⭐ Review',
      announcement: '📢 Announcement',
      benchmark: '📊 Benchmark'
    };
    return badges[type] || '📄 Article';
  }

  async refreshFeed() {
    // Clear cache
    const cacheKey = `intel_feed_${this.filters.dateRange}`;
    await storage.clearCache(cacheKey);

    // Show loading state
    this.showNotification('Refreshing feed...', 'info');

    // Reload feed
    await this.loadFeed();

    // Re-render current tab
    this.renderCurrentTab();

    this.showNotification('Feed refreshed', 'success');
  }

  async createAlert(laptopId) {
    try {
      await storage.addHistory({
        type: 'price_alert',
        laptopId,
        timestamp: Date.now()
      });

      this.showNotification('Price alert created! You\'ll be notified of future drops.', 'success');
    } catch (error) {
      console.error('Failed to create alert:', error);
      this.showNotification('Failed to create alert', 'error');
    }
  }

  async handleNewsAction(newsId, action) {
    const news = this.newsItems.find(n => n.id === newsId);
    if (!news) return;

    switch (action) {
      case 'save':
        await storage.addHistory({
          type: 'intel_saved',
          item: news,
          timestamp: Date.now()
        });
        this.showNotification('Saved to history', 'success');
        break;

      case 'share':
        if (navigator.share) {
          try {
            await navigator.share({
              title: news.title,
              text: news.excerpt,
              url: news.url
            });
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Share failed:', err);
            }
          }
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(news.url);
          this.showNotification('Link copied to clipboard', 'success');
        }
        break;
    }
  }

  showUpgradePrompt() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'intel-upgrade-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="upgrade-content">
          <div class="upgrade-icon">📊</div>
          <h2>Intel Feed (Pro Feature)</h2>
          <p class="upgrade-subtitle">
            Stay ahead with aggregated laptop news, reviews, and real-time price drop alerts
          </p>

          <div class="upgrade-features">
            <div class="feature-item">
              <span class="feature-icon">📰</span>
              <div>
                <h4>Tech News</h4>
                <p>Latest releases and industry trends</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">⭐</span>
              <div>
                <h4>Expert Reviews</h4>
                <p>From NotebookCheck, AnandTech, LTT</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔥</span>
              <div>
                <h4>Price Drop Alerts</h4>
                <p>Real-time tracking of deals</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔔</span>
              <div>
                <h4>Custom Alerts</h4>
                <p>Notifications for specific models</p>
              </div>
            </div>
          </div>

          <div class="pricing-options">
            <div class="pricing-card">
              <h3>Pro</h3>
              <div class="price">
                <span class="currency">RM</span>
                <span class="amount">30</span>
                <span class="period">/month</span>
              </div>
              <ul>
                <li>Intel Feed access</li>
                <li>50 AI queries/month</li>
                <li>All tools unlocked</li>
              </ul>
              <a href="/pricing#pro" class="btn-primary">Choose Pro</a>
            </div>

            <div class="pricing-card recommended">
              <div class="recommended-badge">Best Value</div>
              <h3>Ultimate</h3>
              <div class="price">
                <span class="currency">RM</span>
                <span class="amount">80</span>
                <span class="period">/month</span>
              </div>
              <ul>
                <li>Priority news alerts</li>
                <li>Unlimited AI queries</li>
                <li>Advanced analytics</li>
              </ul>
              <a href="/pricing#ultimate" class="btn-primary">Choose Ultimate</a>
            </div>
          </div>

          <div class="free-alternatives">
            <p><strong>Free alternatives:</strong></p>
            <a href="/matchmaker" class="alt-link">🎯 Matchmaker</a>
            <a href="/explorer" class="alt-link">🔍 Explorer</a>
            <a href="/versus" class="alt-link">⚔️ Versus</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add active class for animation
    setTimeout(() => modal.classList.add('active'), 10);

    // Close handlers
    const close = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.modal-backdrop').addEventListener('click', close);

    return modal;
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString('en-MY', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatPrice(price) {
    if (!price) return '0';
    return price.toLocaleString('en-MY');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `intel-notification intel-notification-${type}`;
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
export default Intel;
