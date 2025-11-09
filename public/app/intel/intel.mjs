/**
 * Intel Feed - Aggregated Tech News & Price Drops
 * AI Bradaa - Live fetch from trusted sources (Pro Feature)
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Intel {
  constructor() {
    this.feedItems = [];
    this.filters = {
      type: 'all', // 'all', 'news', 'reviews', 'price_drops'
      sources: [],
      dateRange: '7days'
    };
    this.userTier = 'free';
  }

  async init() {
    await this.loadUserTier();
    if (this.userTier === 'free') {
      this.renderUpgradePrompt();
    } else {
      await this.loadFeed();
      this.render();
      this.attachEventListeners();
    }
  }

  async loadUserTier() {
    try {
      const response = await apiClient.getUserProfile();
      this.userTier = response.data.user.tier || 'free';
    } catch (error) {
      this.userTier = 'free';
    }
  }

  async loadFeed() {
    try {
      // Try cache first
      const cacheKey = `intel_feed_${this.filters.type}_${this.filters.dateRange}`;
      const cached = await storage.getCache(cacheKey);

      if (cached) {
        this.feedItems = cached;
        return;
      }

      // Fetch from API
      const response = await apiClient.getIntel(this.filters);
      this.feedItems = response.data.feed || [];

      // Cache for 30 minutes
      await storage.setCache(cacheKey, this.feedItems, 1800000);

    } catch (error) {
      console.error('Failed to load intel feed:', error);
      this.showError('Failed to load feed');
    }
  }

  render() {
    const container = document.getElementById('intelContainer') || document.body;

    container.innerHTML = `
      <div class="intel-wrapper">

        <!-- Header -->
        <div class="intel-header">
          <h1>📊 Intel Feed</h1>
          <p>Latest laptop news, reviews, and price drops</p>
          <div class="header-actions">
            <button class="btn btn-secondary btn-small" id="refreshFeedBtn">
              🔄 Refresh
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="intel-filters">
          <div class="filter-tabs">
            <button class="filter-tab ${this.filters.type === 'all' ? 'active' : ''}"
                    data-type="all">
              All
            </button>
            <button class="filter-tab ${this.filters.type === 'news' ? 'active' : ''}"
                    data-type="news">
              📰 News
            </button>
            <button class="filter-tab ${this.filters.type === 'reviews' ? 'active' : ''}"
                    data-type="reviews">
              ⭐ Reviews
            </button>
            <button class="filter-tab ${this.filters.type === 'price_drops' ? 'active' : ''}"
                    data-type="price_drops">
              🔥 Price Drops
            </button>
          </div>

          <div class="filter-dropdown-group">
            <select id="dateRangeFilter" class="filter-dropdown">
              <option value="24hours" ${this.filters.dateRange === '24hours' ? 'selected' : ''}>Last 24 hours</option>
              <option value="7days" ${this.filters.dateRange === '7days' ? 'selected' : ''}>Last 7 days</option>
              <option value="30days" ${this.filters.dateRange === '30days' ? 'selected' : ''}>Last 30 days</option>
            </select>
          </div>
        </div>

        <!-- Feed -->
        <div class="intel-feed" id="intelFeed">
          ${this.renderFeed()}
        </div>

      </div>
    `;

    this.attachEventListeners();
  }

  renderUpgradePrompt() {
    const container = document.getElementById('intelContainer') || document.body;

    container.innerHTML = `
      <div class="upgrade-prompt">
        <div class="upgrade-icon">📊</div>
        <h2>Intel Feed</h2>
        <p class="upgrade-subtitle">
          Stay ahead with aggregated laptop news, reviews, and price drops from trusted sources
        </p>

        <div class="upgrade-features">
          <div class="feature-item">
            <span class="feature-icon">📰</span>
            <div>
              <h4>Tech News</h4>
              <p>Latest releases, announcements, and industry trends</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⭐</span>
            <div>
              <h4>Expert Reviews</h4>
              <p>From NotebookCheck, AnandTech, LTT, and more</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔥</span>
            <div>
              <h4>Price Drop Alerts</h4>
              <p>Real-time tracking of deals and discounts</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔔</span>
            <div>
              <h4>Custom Alerts</h4>
              <p>Get notified for specific brands or models</p>
            </div>
          </div>
        </div>

        <div class="upgrade-cta">
          <a href="/pricing.html#pro" class="btn btn-primary btn-large">
            Upgrade to Pro - RM30/month
          </a>
          <p class="upgrade-note">Get Intel Feed + AI Bradaa Command + more</p>
        </div>
      </div>
    `;
  }

  renderFeed() {
    if (this.feedItems.length === 0) {
      return this.renderEmptyState();
    }

    return this.feedItems.map(item => this.renderFeedItem(item)).join('');
  }

  renderFeedItem(item) {
    const typeIcons = {
      news: '📰',
      review: '⭐',
      price_drop: '🔥',
      benchmark: '📊',
      announcement: '📢'
    };

    const icon = typeIcons[item.type] || '📄';

    return `
      <div class="feed-item ${item.type}" data-id="${item.id}">
        <div class="feed-icon">${icon}</div>
        <div class="feed-content">
          <div class="feed-header">
            <h3 class="feed-title">
              <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
            </h3>
            <div class="feed-meta">
              <span class="feed-source">${item.source}</span>
              <span class="feed-time">${this.formatTime(item.published_at)}</span>
            </div>
          </div>
          <p class="feed-excerpt">${item.excerpt}</p>
          ${item.image ? `
            <div class="feed-image">
              <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
          ` : ''}
          ${item.type === 'price_drop' ? this.renderPriceDropDetails(item) : ''}
          ${item.tags && item.tags.length > 0 ? `
            <div class="feed-tags">
              ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="feed-actions">
          <button class="feed-action-btn" data-id="${item.id}" data-action="save">
            🔖 Save
          </button>
          <button class="feed-action-btn" data-id="${item.id}" data-action="share">
            🔗 Share
          </button>
        </div>
      </div>
    `;
  }

  renderPriceDropDetails(item) {
    return `
      <div class="price-drop-details">
        <div class="price-comparison">
          <div class="old-price">
            <span class="label">Was:</span>
            <span class="value">RM${this.formatPrice(item.old_price)}</span>
          </div>
          <div class="arrow">→</div>
          <div class="new-price">
            <span class="label">Now:</span>
            <span class="value">RM${this.formatPrice(item.new_price)}</span>
          </div>
          <div class="savings">
            <span class="label">Save:</span>
            <span class="value savings-highlight">RM${this.formatPrice(item.old_price - item.new_price)}</span>
            <span class="percentage">(${this.calculateSavingsPercentage(item.old_price, item.new_price)}%)</span>
          </div>
        </div>
        <a href="${item.deal_url}" class="btn btn-primary btn-small" target="_blank">
          View Deal
        </a>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No items in feed</h3>
        <p>Check back later for the latest news and updates</p>
        <button class="btn btn-primary" id="refreshFeedBtn">Refresh Now</button>
      </div>
    `;
  }

  attachEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', async (e) => {
        this.filters.type = e.target.dataset.type;
        await this.loadFeed();
        this.render();
      });
    });

    // Date range filter
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
      dateRangeFilter.addEventListener('change', async (e) => {
        this.filters.dateRange = e.target.value;
        await this.loadFeed();
        this.render();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshFeedBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        // Clear cache and reload
        const cacheKey = `intel_feed_${this.filters.type}_${this.filters.dateRange}`;
        await storage.clearCache(cacheKey);
        await this.loadFeed();
        this.render();
      });
    }

    // Feed actions
    document.querySelectorAll('.feed-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.id;
        const action = e.target.dataset.action;
        this.handleFeedAction(itemId, action);
      });
    });
  }

  async handleFeedAction(itemId, action) {
    const item = this.feedItems.find(i => i.id === itemId);
    if (!item) return;

    switch (action) {
      case 'save':
        await this.saveItem(item);
        break;
      case 'share':
        this.shareItem(item);
        break;
    }
  }

  async saveItem(item) {
    try {
      await storage.addHistory({
        type: 'intel_saved',
        item
      });
      alert('Saved to your history!');
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  }

  shareItem(item) {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.excerpt,
        url: item.url
      }).catch(err => console.log('Share failed:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(item.url);
      alert('Link copied to clipboard!');
    }
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

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

  calculateSavingsPercentage(oldPrice, newPrice) {
    if (!oldPrice || !newPrice) return 0;
    return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  }

  showError(message) {
    const container = document.getElementById('intelContainer') || document.body;
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
    const intel = new Intel();
    intel.init();
  });
} else {
  const intel = new Intel();
  intel.init();
}
