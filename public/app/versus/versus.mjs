/**
 * Versus Tool - Side-by-Side Laptop Comparison
 * AI Bradaa - Compare up to 3 laptops with radar charts
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Versus {
  constructor() {
    this.selectedLaptops = [];
    this.maxSelections = 3;
    this.laptopDatabase = [];
    this.comparisonMetrics = [
      { key: 'performance', label: 'Performance', weight: 1 },
      { key: 'portability', label: 'Portability', weight: 1 },
      { key: 'battery', label: 'Battery Life', weight: 1 },
      { key: 'display', label: 'Display Quality', weight: 1 },
      { key: 'value', label: 'Value', weight: 1 },
      { key: 'build', label: 'Build Quality', weight: 1 }
    ];
  }

  async init() {
    await this.loadLaptopDatabase();
    this.render();
    this.attachEventListeners();
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
      this.laptopDatabase = await response.json();

      // Cache for 1 hour
      await storage.setCache('laptops_db', this.laptopDatabase, 3600000);
    } catch (error) {
      console.error('Failed to load laptop database:', error);
      this.showError('Failed to load laptop database');
    }
  }

  render() {
    const container = document.getElementById('versusContainer') || document.body;

    container.innerHTML = `
      <div class="versus-wrapper">

        <!-- Header -->
        <div class="versus-header">
          <h1>⚔️ Versus Mode</h1>
          <p>Compare up to 3 laptops side-by-side</p>
        </div>

        <!-- Selection Area -->
        <div class="versus-selection">
          <div class="selection-grid">
            ${[0, 1, 2].map(index => this.renderSelectionSlot(index)).join('')}
          </div>
        </div>

        <!-- Search/Browse -->
        <div class="versus-search">
          <input type="text"
                 id="laptopSearch"
                 class="search-input"
                 placeholder="Search laptops by brand, model, or specs...">
          <div class="search-results" id="searchResults"></div>
        </div>

        <!-- Comparison View (Hidden until 2+ selected) -->
        <div class="versus-comparison" id="comparisonView" style="display: none;">
          <div class="comparison-header">
            <h2>Comparison Results</h2>
            <button class="btn btn-secondary" id="resetBtn">Reset Comparison</button>
          </div>

          <!-- Radar Chart -->
          <div class="radar-container">
            <canvas id="radarChart" width="600" height="600"></canvas>
          </div>

          <!-- Detailed Comparison Table -->
          <div class="comparison-table" id="comparisonTable"></div>

          <!-- AI Advisor (Pro Feature) -->
          <div class="ai-advisor" id="aiAdvisor">
            <div class="advisor-header">
              <h3>🤖 AI Bradaa's Recommendation</h3>
              <span class="pro-badge">PRO</span>
            </div>
            <div class="advisor-content" id="advisorContent">
              <p class="loading-text">Analyzing comparison...</p>
            </div>
          </div>
        </div>

      </div>
    `;

    this.updateSelectionSlots();
  }

  renderSelectionSlot(index) {
    const laptop = this.selectedLaptops[index];

    if (!laptop) {
      return `
        <div class="selection-slot empty" data-index="${index}">
          <div class="slot-icon">+</div>
          <div class="slot-label">Add Laptop ${index + 1}</div>
        </div>
      `;
    }

    return `
      <div class="selection-slot filled" data-index="${index}">
        <button class="slot-remove" data-index="${index}" aria-label="Remove">&times;</button>
        <div class="slot-image">
          <img src="${laptop.image || '/assets/default-laptop.png'}" alt="${laptop.brand} ${laptop.model}">
        </div>
        <div class="slot-info">
          <h4>${laptop.brand}</h4>
          <p>${laptop.model}</p>
          <p class="slot-price">RM${this.formatPrice(laptop.price_myr)}</p>
        </div>
      </div>
    `;
  }

  updateSelectionSlots() {
    const grid = document.querySelector('.selection-grid');
    if (grid) {
      grid.innerHTML = [0, 1, 2].map(index => this.renderSelectionSlot(index)).join('');
      this.attachSlotListeners();
    }

    // Show/hide comparison view
    if (this.selectedLaptops.length >= 2) {
      document.getElementById('comparisonView').style.display = 'block';
      this.renderComparison();
    } else {
      document.getElementById('comparisonView').style.display = 'none';
    }
  }

  attachEventListeners() {
    // Search input
    const searchInput = document.getElementById('laptopSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.selectedLaptops = [];
        this.updateSelectionSlots();
      });
    }

    this.attachSlotListeners();
  }

  attachSlotListeners() {
    // Remove buttons
    document.querySelectorAll('.slot-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.selectedLaptops.splice(index, 1);
        this.updateSelectionSlots();
      });
    });

    // Empty slots - trigger search focus
    document.querySelectorAll('.selection-slot.empty').forEach(slot => {
      slot.addEventListener('click', () => {
        document.getElementById('laptopSearch').focus();
      });
    });
  }

  handleSearch(query) {
    const resultsContainer = document.getElementById('searchResults');

    if (!query || query.length < 2) {
      resultsContainer.innerHTML = '';
      resultsContainer.style.display = 'none';
      return;
    }

    const results = this.laptopDatabase.filter(laptop => {
      const searchStr = `${laptop.brand} ${laptop.model} ${laptop.cpu?.gen || ''} ${laptop.category?.join(' ') || ''}`.toLowerCase();
      return searchStr.includes(query.toLowerCase());
    }).slice(0, 10); // Limit to 10 results

    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No laptops found</div>';
      resultsContainer.style.display = 'block';
      return;
    }

    resultsContainer.innerHTML = results.map(laptop => `
      <div class="search-result-item" data-id="${laptop.id}">
        <div class="result-image-small">
          <img src="${laptop.image || '/assets/default-laptop.png'}" alt="${laptop.brand} ${laptop.model}">
        </div>
        <div class="result-info-small">
          <h5>${laptop.brand} ${laptop.model}</h5>
          <p class="result-specs-small">${laptop.cpu?.gen || 'N/A'} • ${laptop.ram?.gb || 0}GB RAM</p>
          <p class="result-price-small">RM${this.formatPrice(laptop.price_myr)}</p>
        </div>
        <button class="btn btn-small add-to-compare" data-id="${laptop.id}">
          ${this.selectedLaptops.find(l => l.id === laptop.id) ? 'Remove' : 'Add'}
        </button>
      </div>
    `).join('');

    resultsContainer.style.display = 'block';

    // Attach click handlers
    resultsContainer.querySelectorAll('.add-to-compare').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const laptopId = e.target.dataset.id;
        this.toggleLaptop(laptopId);
      });
    });
  }

  toggleLaptop(laptopId) {
    const laptop = this.laptopDatabase.find(l => l.id === laptopId);
    if (!laptop) return;

    const existingIndex = this.selectedLaptops.findIndex(l => l.id === laptopId);

    if (existingIndex > -1) {
      // Remove
      this.selectedLaptops.splice(existingIndex, 1);
    } else {
      // Add (max 3)
      if (this.selectedLaptops.length < this.maxSelections) {
        this.selectedLaptops.push(laptop);
      } else {
        alert('Maximum 3 laptops for comparison');
        return;
      }
    }

    this.updateSelectionSlots();
    this.handleSearch(document.getElementById('laptopSearch').value); // Refresh search results
  }

  renderComparison() {
    this.renderRadarChart();
    this.renderComparisonTable();
    this.getAIRecommendation();
  }

  renderRadarChart() {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scores for each laptop
    const laptopScores = this.selectedLaptops.map(laptop =>
      this.calculateMetricScores(laptop)
    );

    // Draw radar grid
    this.drawRadarGrid(ctx, centerX, centerY, radius);

    // Draw each laptop's polygon
    const colors = ['#00F0FF', '#D83F87', '#FFD700'];
    laptopScores.forEach((scores, index) => {
      this.drawRadarPolygon(ctx, centerX, centerY, radius, scores, colors[index], 0.3);
      this.drawRadarPolygon(ctx, centerX, centerY, radius, scores, colors[index], 1, true); // outline
    });

    // Draw legend
    this.drawRadarLegend(ctx, colors);
  }

  drawRadarGrid(ctx, centerX, centerY, radius) {
    const metrics = this.comparisonMetrics;
    const angleStep = (Math.PI * 2) / metrics.length;

    // Draw concentric circles
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw spokes and labels
    ctx.strokeStyle = '#30363d';
    ctx.fillStyle = '#A8B2CC';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';

    metrics.forEach((metric, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Spoke
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Label
      const labelX = centerX + Math.cos(angle) * (radius + 30);
      const labelY = centerY + Math.sin(angle) * (radius + 30);
      ctx.fillText(metric.label, labelX, labelY);
    });
  }

  drawRadarPolygon(ctx, centerX, centerY, radius, scores, color, alpha, outline = false) {
    const angleStep = (Math.PI * 2) / scores.length;

    ctx.beginPath();
    scores.forEach((score, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const distance = (score / 100) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();

    if (outline) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.fill();
    }
  }

  drawRadarLegend(ctx, colors) {
    ctx.font = '14px Inter';
    ctx.textAlign = 'left';

    this.selectedLaptops.forEach((laptop, i) => {
      const y = 30 + i * 25;

      // Color box
      ctx.fillStyle = colors[i];
      ctx.fillRect(20, y - 10, 15, 15);

      // Label
      ctx.fillStyle = '#E6EDF3';
      ctx.fillText(`${laptop.brand} ${laptop.model}`, 45, y + 2);
    });
  }

  calculateMetricScores(laptop) {
    return this.comparisonMetrics.map(metric => {
      switch (metric.key) {
        case 'performance':
          return this.calculatePerformanceScore(laptop);
        case 'portability':
          return this.calculatePortabilityScore(laptop);
        case 'battery':
          return this.calculateBatteryScore(laptop);
        case 'display':
          return this.calculateDisplayScore(laptop);
        case 'value':
          return this.calculateValueScore(laptop);
        case 'build':
          return this.calculateBuildScore(laptop);
        default:
          return 50;
      }
    });
  }

  calculatePerformanceScore(laptop) {
    let score = 0;
    score += (laptop.cpu?.cores || 0) * 5;
    score += laptop.gpu?.vram ? 20 : 0;
    score += (laptop.ram?.gb || 0) * 2;
    score += laptop.npu_tops > 20 ? 15 : 0;
    return Math.min(score, 100);
  }

  calculatePortabilityScore(laptop) {
    const weight = laptop.weight_kg || 2.5;
    const score = 100 - ((weight - 1) * 30);
    return Math.max(0, Math.min(score, 100));
  }

  calculateBatteryScore(laptop) {
    const batteryWh = laptop.battery_wh || 50;
    const score = (batteryWh / 100) * 100;
    return Math.min(score, 100);
  }

  calculateDisplayScore(laptop) {
    let score = 50;
    score += laptop.display?.nits > 400 ? 15 : 0;
    score += laptop.display?.refresh >= 120 ? 20 : 0;
    score += laptop.display?.gamut ? 15 : 0;
    return Math.min(score, 100);
  }

  calculateValueScore(laptop) {
    const price = laptop.price_myr || 5000;
    const perfScore = this.calculatePerformanceScore(laptop);
    const value = (perfScore / price) * 50000;
    return Math.min(value, 100);
  }

  calculateBuildScore(laptop) {
    let score = 60;
    score += laptop.brand === 'Apple' || laptop.brand === 'Lenovo' ? 20 : 0;
    score += laptop.ports?.length > 3 ? 10 : 0;
    score += laptop.wireless?.includes('6E') ? 10 : 0;
    return Math.min(score, 100);
  }

  renderComparisonTable() {
    const table = document.getElementById('comparisonTable');
    if (!table) return;

    const specs = [
      { label: 'Processor', key: 'cpu.gen' },
      { label: 'Cores', key: 'cpu.cores' },
      { label: 'GPU', key: 'gpu.chip' },
      { label: 'VRAM', key: 'gpu.vram', unit: 'GB' },
      { label: 'RAM', key: 'ram.gb', unit: 'GB' },
      { label: 'Storage', key: 'storage.gb', unit: 'GB' },
      { label: 'Display', key: 'display.size', unit: '"' },
      { label: 'Resolution', key: 'display.res' },
      { label: 'Refresh Rate', key: 'display.refresh', unit: 'Hz' },
      { label: 'Battery', key: 'battery_wh', unit: 'Wh' },
      { label: 'Weight', key: 'weight_kg', unit: 'kg' },
      { label: 'Price', key: 'price_myr', formatter: (v) => `RM${this.formatPrice(v)}` }
    ];

    table.innerHTML = `
      <table class="comparison-table-grid">
        <thead>
          <tr>
            <th>Spec</th>
            ${this.selectedLaptops.map(laptop => `
              <th>${laptop.brand} ${laptop.model}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${specs.map(spec => `
            <tr>
              <td class="spec-label">${spec.label}</td>
              ${this.selectedLaptops.map(laptop => {
                const value = this.getNestedValue(laptop, spec.key);
                const formatted = spec.formatter ? spec.formatter(value) : value;
                const display = formatted ? `${formatted}${spec.unit || ''}` : 'N/A';
                return `<td>${display}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  async getAIRecommendation() {
    const advisorContent = document.getElementById('advisorContent');
    if (!advisorContent) return;

    try {
      const response = await apiClient.compareDevices(this.selectedLaptops.map(l => l.id));

      advisorContent.innerHTML = `
        <div class="advisor-recommendation">
          <p>${response.data.recommendation}</p>
          <div class="advisor-winner">
            <strong>Winner:</strong> ${response.data.winner}
          </div>
          <div class="advisor-reasoning">
            <p><em>${response.data.reasoning}</em></p>
          </div>
        </div>
      `;

      // Save to history
      await storage.addHistory({
        type: 'versus',
        laptops: this.selectedLaptops.map(l => ({ id: l.id, brand: l.brand, model: l.model })),
        recommendation: response.data
      });

    } catch (error) {
      advisorContent.innerHTML = `
        <div class="advisor-error">
          <p>⚠️ AI analysis unavailable. ${error.message}</p>
          <p class="hint">Upgrade to Pro for AI-powered recommendations</p>
        </div>
      `;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  formatPrice(price) {
    if (!price) return '0';
    return price.toLocaleString('en-MY');
  }

  showError(message) {
    const container = document.getElementById('versusContainer') || document.body;
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

// Auto-initialize if container exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const versus = new Versus();
    versus.init();
  });
} else {
  const versus = new Versus();
  versus.init();
}
