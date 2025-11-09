/**
 * Camera Tech - Laptop Webcam Specs & Ratings
 * AI Bradaa - For creators who care about video quality
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class CameraTech {
  constructor() {
    this.laptopDatabase = [];
    this.sortBy = 'rating';
    this.filterMinResolution = '720p';
    this.showOnlyWithSamples = false;
  }

  async init() {
    await this.loadLaptopDatabase();
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
      this.showError('Failed to load camera data');
    }
  }

  getFilteredData() {
    let filtered = this.laptopDatabase.filter(laptop => {
      // Only laptops with camera data
      if (!laptop.webcam) return false;

      // Resolution filter
      const resolutionOrder = { '720p': 1, '1080p': 2, '2k': 3, '4k': 4 };
      const laptopRes = resolutionOrder[laptop.webcam.resolution] || 0;
      const minRes = resolutionOrder[this.filterMinResolution] || 0;

      if (laptopRes < minRes) return false;

      // Sample filter
      if (this.showOnlyWithSamples && !laptop.webcam.sample_images) {
        return false;
      }

      return true;
    });

    // Sort
    switch (this.sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.webcam?.rating || 0) - (a.webcam?.rating || 0));
        break;
      case 'resolution':
        const resOrder = { '720p': 1, '1080p': 2, '2k': 3, '4k': 4 };
        filtered.sort((a, b) =>
          (resOrder[b.webcam?.resolution] || 0) - (resOrder[a.webcam?.resolution] || 0)
        );
        break;
      case 'price_asc':
        filtered.sort((a, b) => (a.price_myr || 0) - (b.price_myr || 0));
        break;
      case 'brand':
        filtered.sort((a, b) => a.brand.localeCompare(b.brand));
        break;
    }

    return filtered;
  }

  render() {
    const container = document.getElementById('cameraTechContainer') || document.body;
    const data = this.getFilteredData();

    container.innerHTML = `
      <div class="camera-tech-wrapper">

        <!-- Header -->
        <div class="camera-tech-header">
          <h1>📸 Camera Tech</h1>
          <p>Laptop webcam specs and ratings for creators</p>
          <div class="header-badge">Micro-Feature</div>
        </div>

        <!-- Info Banner -->
        <div class="info-banner">
          <div class="info-icon">ℹ️</div>
          <div class="info-content">
            <h4>Why Webcam Quality Matters</h4>
            <p>For content creators, remote workers, and streamers, webcam quality can make or break your video calls and recordings. We rate webcams on resolution, low-light performance, and color accuracy.</p>
          </div>
        </div>

        <!-- Filters & Sort -->
        <div class="camera-filters">
          <div class="filter-group">
            <label>Minimum Resolution:</label>
            <select id="resolutionFilter" class="filter-dropdown">
              <option value="720p" ${this.filterMinResolution === '720p' ? 'selected' : ''}>720p (HD)</option>
              <option value="1080p" ${this.filterMinResolution === '1080p' ? 'selected' : ''}>1080p (Full HD)</option>
              <option value="2k" ${this.filterMinResolution === '2k' ? 'selected' : ''}>2K</option>
              <option value="4k" ${this.filterMinResolution === '4k' ? 'selected' : ''}>4K (Ultra HD)</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="checkbox-filter">
              <input type="checkbox"
                     id="samplesFilter"
                     ${this.showOnlyWithSamples ? 'checked' : ''}>
              <span>Show only with sample images</span>
            </label>
          </div>

          <div class="filter-group">
            <label>Sort by:</label>
            <select id="sortSelect" class="filter-dropdown">
              <option value="rating" ${this.sortBy === 'rating' ? 'selected' : ''}>Best Rating</option>
              <option value="resolution" ${this.sortBy === 'resolution' ? 'selected' : ''}>Highest Resolution</option>
              <option value="price_asc" ${this.sortBy === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="brand" ${this.sortBy === 'brand' ? 'selected' : ''}>Brand (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- Results Count -->
        <div class="results-count">
          <span>${data.length} laptop${data.length !== 1 ? 's' : ''} found</span>
        </div>

        <!-- Camera Grid -->
        <div class="camera-grid">
          ${data.length > 0 ? data.map(laptop => this.renderCameraCard(laptop)).join('') : this.renderNoResults()}
        </div>

        <!-- Rating Legend -->
        <div class="rating-legend">
          <h4>Rating Guide</h4>
          <div class="legend-items">
            <div class="legend-item">
              <span class="star-rating">★★★★★</span>
              <span>Excellent (4.5-5.0) - Professional quality</span>
            </div>
            <div class="legend-item">
              <span class="star-rating">★★★★☆</span>
              <span>Very Good (3.5-4.4) - Great for video calls</span>
            </div>
            <div class="legend-item">
              <span class="star-rating">★★★☆☆</span>
              <span>Good (2.5-3.4) - Acceptable quality</span>
            </div>
            <div class="legend-item">
              <span class="star-rating">★★☆☆☆</span>
              <span>Fair (1.5-2.4) - Basic functionality</span>
            </div>
            <div class="legend-item">
              <span class="star-rating">★☆☆☆☆</span>
              <span>Poor (0-1.4) - Avoid if possible</span>
            </div>
          </div>
        </div>

      </div>
    `;

    this.attachEventListeners();
  }

  renderCameraCard(laptop) {
    const webcam = laptop.webcam;
    const rating = webcam.rating || 0;
    const stars = this.renderStars(rating);

    return `
      <div class="camera-card" data-id="${laptop.id}">
        <div class="camera-card-header">
          <h3>${laptop.brand} ${laptop.model}</h3>
          <div class="camera-rating">
            <span class="star-display">${stars}</span>
            <span class="rating-number">${rating.toFixed(1)}/5.0</span>
          </div>
        </div>

        <div class="camera-specs">
          <div class="spec-item">
            <span class="spec-label">Resolution:</span>
            <span class="spec-value resolution-${webcam.resolution}">${webcam.resolution.toUpperCase()}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Sensor:</span>
            <span class="spec-value">${webcam.sensor || 'N/A'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">IR Camera:</span>
            <span class="spec-value">${webcam.ir_camera ? 'Yes (Windows Hello)' : 'No'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Low-Light:</span>
            <span class="spec-value rating-${this.getLowLightClass(webcam.low_light_score)}">
              ${webcam.low_light_score || 'N/A'}/10
            </span>
          </div>
        </div>

        ${webcam.sample_images ? this.renderSampleGallery(webcam.sample_images) : ''}

        ${webcam.dxomark_score ? `
          <div class="dxomark-score">
            <span class="dxomark-label">DxOMark Score:</span>
            <span class="dxomark-value">${webcam.dxomark_score}</span>
          </div>
        ` : ''}

        <div class="camera-card-footer">
          <div class="laptop-price">RM${this.formatPrice(laptop.price_myr)}</div>
          <button class="btn btn-primary btn-small view-laptop-btn"
                  data-id="${laptop.id}">
            View Laptop
          </button>
        </div>
      </div>
    `;
  }

  renderSampleGallery(images) {
    return `
      <div class="sample-gallery">
        <h5>Sample Images:</h5>
        <div class="gallery-grid">
          ${images.slice(0, 3).map(img => `
            <img src="${img}" alt="Sample" class="sample-image" loading="lazy">
          `).join('')}
        </div>
      </div>
    `;
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) +
           (hasHalfStar ? '½' : '') +
           '☆'.repeat(emptyStars);
  }

  getLowLightClass(score) {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'fair';
    return 'poor';
  }

  renderNoResults() {
    return `
      <div class="no-results">
        <div class="no-results-icon">📭</div>
        <h3>No laptops found</h3>
        <p>Try adjusting your filters</p>
      </div>
    `;
  }

  attachEventListeners() {
    // Resolution filter
    const resolutionFilter = document.getElementById('resolutionFilter');
    if (resolutionFilter) {
      resolutionFilter.addEventListener('change', (e) => {
        this.filterMinResolution = e.target.value;
        this.render();
      });
    }

    // Samples filter
    const samplesFilter = document.getElementById('samplesFilter');
    if (samplesFilter) {
      samplesFilter.addEventListener('change', (e) => {
        this.showOnlyWithSamples = e.target.checked;
        this.render();
      });
    }

    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    // View laptop buttons
    document.querySelectorAll('.view-laptop-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const laptopId = e.target.dataset.id;
        this.viewLaptop(laptopId);
      });
    });

    // Sample images (lightbox)
    document.querySelectorAll('.sample-image').forEach(img => {
      img.addEventListener('click', (e) => {
        this.showLightbox(e.target.src);
      });
    });
  }

  viewLaptop(laptopId) {
    const laptop = this.laptopDatabase.find(l => l.id === laptopId);
    if (!laptop) return;

    // Send message to parent to show laptop details
    window.parent.postMessage({
      type: 'showLaptopModal',
      laptop
    }, '*');
  }

  showLightbox(imageSrc) {
    // Create lightbox overlay
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close">&times;</button>
        <img src="${imageSrc}" alt="Sample">
      </div>
    `;

    document.body.appendChild(lightbox);

    // Close on click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        lightbox.remove();
      }
    });
  }

  formatPrice(price) {
    if (!price) return '0';
    return price.toLocaleString('en-MY');
  }

  showError(message) {
    const container = document.getElementById('cameraTechContainer') || document.body;
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
    const cameraTech = new CameraTech();
    cameraTech.init();
  });
} else {
  const cameraTech = new CameraTech();
  cameraTech.init();
}
