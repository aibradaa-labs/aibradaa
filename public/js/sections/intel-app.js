/**
 * Intel App Logic
 * News aggregation, price drop alerts, real-time monitoring (Pro+)
 * Backend: /api/intel/feed, /api/intel/price-drops
 */

export class IntelApp {
  constructor() {
    this.currentCategory = 'all';
    this.feedItems = [];
    this.priceDrops = [];
    this.refreshInterval = null;
    this.init();
  }

  /**
   * Initialize app
   */
  async init() {
    console.log('[Intel] Initializing...');
    this.attachEventListeners();
    await this.loadFeed();
    await this.loadPriceDrops();

    // Auto-refresh feed every 5 minutes (Pro+ feature)
    if (this.isProPlus()) {
      this.startAutoRefresh();
    }
  }

  /**
   * Check if user has Pro+ tier
   */
  isProPlus() {
    // Get tier from global auth state or local storage
    const tier = window.authManager?.user?.tier || localStorage.getItem('userTier') || 'free';
    return ['pro', 'ultimate', 'enterprise'].includes(tier);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Category tabs
    document.querySelectorAll('.intel-category-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.handleCategoryChange(e.target.dataset.category);
      });
    });

    // Manual refresh button
    document.getElementById('intel-refresh-btn')?.addEventListener('click', () => {
      this.handleManualRefresh();
    });

    // Price drop filters
    document.getElementById('price-drop-min-discount')?.addEventListener('change', (e) => {
      this.loadPriceDrops(e.target.value);
    });

    // Enable/disable price alerts (Pro+ only)
    document.getElementById('enable-price-alerts')?.addEventListener('change', (e) => {
      this.togglePriceAlerts(e.target.checked);
    });
  }

  /**
   * Handle category change
   */
  async handleCategoryChange(category) {
    this.currentCategory = category;

    // Update active tab
    document.querySelectorAll('.intel-category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    await this.loadFeed();
  }

  /**
   * Load feed from API
   */
  async loadFeed() {
    const loadingEl = document.getElementById('intel-feed-loading');
    const feedContainer = document.getElementById('intel-feed-container');

    if (!feedContainer) return;

    // Show loading
    if (loadingEl) loadingEl.style.display = 'block';

    try {
      const category = this.currentCategory === 'all' ? '' : `&category=${this.currentCategory}`;
      const response = await fetch(`/.netlify/functions/intel/feed?limit=20${category}`);
      const data = await response.json();

      if (data.success) {
        this.feedItems = data.data.items;
        this.renderFeed();

        // Show AI insights if available (Pro+ feature)
        if (data.data.aiInsights) {
          this.renderAIInsights(data.data.aiInsights);
        }
      } else {
        throw new Error(data.error || 'Failed to load feed');
      }

    } catch (error) {
      console.error('[Intel] Feed load error:', error);
      this.showError('Failed to load Intel feed. Please try again.');
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  /**
   * Render feed items
   */
  renderFeed() {
    const container = document.getElementById('intel-feed-container');
    if (!container) return;

    if (this.feedItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📰</div>
          <h3>No intel items found</h3>
          <p>Check back later for updates</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.feedItems.map(item => `
      <div class="intel-feed-item" data-id="${item.id}">
        <div class="feed-item-header">
          <span class="feed-category ${item.category}">${this.getCategoryLabel(item.category)}</span>
          <span class="feed-source">${item.source}</span>
        </div>
        <h3 class="feed-title">
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">
            ${item.title}
          </a>
        </h3>
        <p class="feed-description">${item.description}</p>
        <div class="feed-meta">
          <span class="feed-time">${this.formatTime(item.timestamp)}</span>
          <span class="feed-views">👁️ ${item.metadata.views}</span>
          <span class="feed-upvotes">👍 ${item.metadata.upvotes}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Get category label with icon
   */
  getCategoryLabel(category) {
    const labels = {
      'news': '📰 News',
      'price-drop': '💰 Price Drop',
      'new-release': '🆕 New Release',
      'deal': '🔥 Deal'
    };
    return labels[category] || category;
  }

  /**
   * Format timestamp to relative time
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
  }

  /**
   * Render AI insights (Pro+ feature)
   */
  renderAIInsights(insights) {
    const container = document.getElementById('intel-ai-insights');
    if (!container) return;

    container.innerHTML = `
      <div class="ai-insights-card">
        <div class="insights-header">
          <span class="insights-icon">🤖</span>
          <h3>AI Bradaa's Intel Analysis</h3>
          <span class="pro-badge">PRO</span>
        </div>
        <div class="insights-content">
          ${insights}
        </div>
      </div>
    `;

    container.style.display = 'block';
  }

  /**
   * Load price drops
   */
  async loadPriceDrops(minDiscount = 10) {
    const container = document.getElementById('price-drops-container');
    if (!container) return;

    // Show loading
    container.innerHTML = '<div class="loading-spinner">Loading price drops...</div>';

    try {
      const response = await fetch(
        `/.netlify/functions/intel/price-drops?minDiscount=${minDiscount}&days=7`
      );
      const data = await response.json();

      if (data.success) {
        this.priceDrops = data.data.priceDrops;
        this.renderPriceDrops();
      } else {
        throw new Error(data.error || 'Failed to load price drops');
      }

    } catch (error) {
      console.error('[Intel] Price drops load error:', error);
      container.innerHTML = '<p class="error-message">Failed to load price drops</p>';
    }
  }

  /**
   * Render price drops
   */
  renderPriceDrops() {
    const container = document.getElementById('price-drops-container');
    if (!container) return;

    if (this.priceDrops.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <h3>No price drops found</h3>
          <p>Check back later for deals</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.priceDrops.map(drop => `
      <div class="price-drop-card">
        <div class="drop-header">
          <h4>${drop.name}</h4>
          <span class="drop-percentage">-${drop.percentage.toFixed(1)}%</span>
        </div>
        <div class="drop-prices">
          <span class="old-price">RM ${drop.oldPrice.toLocaleString()}</span>
          <span class="arrow">→</span>
          <span class="new-price">RM ${drop.newPrice.toLocaleString()}</span>
        </div>
        <div class="drop-meta">
          <span class="drop-source">📍 ${drop.source}</span>
          <span class="drop-savings">Save RM ${drop.discount.toLocaleString()}</span>
        </div>
        <button class="btn-primary btn-small" onclick="window.open('https://example.com/deal/${drop.id}', '_blank')">
          View Deal
        </button>
      </div>
    `).join('');
  }

  /**
   * Handle manual refresh
   */
  async handleManualRefresh() {
    const btn = document.getElementById('intel-refresh-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Refreshing...';
    }

    await Promise.all([
      this.loadFeed(),
      this.loadPriceDrops()
    ]);

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Refresh';
    }

    this.showSuccess('Intel feed refreshed!');
  }

  /**
   * Start auto-refresh (Pro+ feature)
   */
  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      console.log('[Intel] Auto-refreshing feed...');
      this.loadFeed();
      this.loadPriceDrops();
    }, 5 * 60 * 1000);

    console.log('[Intel] Auto-refresh enabled (Pro+ feature)');
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Toggle price alerts (Pro+ feature)
   */
  async togglePriceAlerts(enabled) {
    if (!this.isProPlus()) {
      this.showError('Price alerts are a Pro+ feature. Upgrade to enable!');
      document.getElementById('enable-price-alerts').checked = false;
      return;
    }

    try {
      // In production, this would save preference to backend
      localStorage.setItem('priceAlertsEnabled', enabled.toString());

      if (enabled) {
        this.showSuccess('Price alerts enabled! You\'ll be notified of new drops.');
      } else {
        this.showSuccess('Price alerts disabled.');
      }

    } catch (error) {
      console.error('[Intel] Price alerts toggle error:', error);
      this.showError('Failed to update price alerts preference');
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // Use global toast system if available
    if (window.Toast && window.Toast.show) {
      window.Toast.show({ message, type: 'success' });
    } else {
      alert(message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Use global toast system if available
    if (window.Toast && window.Toast.show) {
      window.Toast.show({ message, type: 'error' });
    } else {
      alert(message);
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.stopAutoRefresh();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.intelApp = new IntelApp();
  });
} else {
  window.intelApp = new IntelApp();
}
