/**
 * Versus Tool - Side-by-Side Laptop Comparison
 * AI Bradaa - Compare 2 laptops with radar charts
 *
 * ARCHITECTURE: Hybrid Enhancement Pattern
 * - HTML provides static structure (selectors, containers)
 * - JavaScript enhances with dynamic content (radar chart, tables, modals)
 * - Progressive enhancement approach (no innerHTML replacement)
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Versus {
  constructor() {
    this.selectedLaptops = [null, null]; // 2 laptops max
    this.laptopDatabase = [];
    this.comparisonMetrics = [
      { key: 'performance', label: 'Performance', weight: 1 },
      { key: 'portability', label: 'Portability', weight: 1 },
      { key: 'battery', label: 'Battery Life', weight: 1 },
      { key: 'display', label: 'Display Quality', weight: 1 },
      { key: 'value', label: 'Value', weight: 1 },
      { key: 'build', label: 'Build Quality', weight: 1 }
    ];

    // DOM references (existing elements)
    this.selector1 = null;
    this.selector2 = null;
    this.comparisonView = null;
    this.radarChart = null;
    this.specsTable = null;
    this.prosConsGrid = null;
    this.modal = null;
    this.currentSelectorIndex = null;
  }

  async init() {
    // Get existing DOM elements
    this.selector1 = document.getElementById('selector1');
    this.selector2 = document.getElementById('selector2');
    this.comparisonView = document.getElementById('comparisonView');
    this.radarChart = document.getElementById('radarChart');
    this.specsTable = document.getElementById('specsTable');
    this.prosConsGrid = document.getElementById('prosConsGrid');

    // Validation
    if (!this.selector1 || !this.selector2 || !this.comparisonView) {
      console.error('Required elements not found! versus.mjs needs #selector1, #selector2, #comparisonView');
      return;
    }

    // Load laptop database
    await this.loadLaptopDatabase();

    // Create search modal (not in static HTML)
    this.createSearchModal();

    // Attach event listeners
    this.attachEventListeners();

    // Hide comparison view initially
    this.comparisonView.style.display = 'none';

    // Load from cache if available
    await this.loadFromCache();
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
      if (!response.ok) throw new Error('Failed to fetch laptop database');

      const data = await response.json();

      // Transform data from new format to expected format
      this.laptopDatabase = this.transformLaptopData(data);

      // Cache for 1 hour
      await storage.setCache('laptops_db', this.laptopDatabase, 3600000);
    } catch (error) {
      console.error('Failed to load laptop database:', error);
      this.showNotification('Failed to load laptop database. Using demo data.', 'error');
      this.laptopDatabase = this.getDemoData();
    }
  }

  /**
   * Transform laptop data from new JSON format to expected format
   * @param {Object} data - Raw laptop database with catalog metadata
   * @returns {Array} Transformed laptop array
   */
  transformLaptopData(data) {
    const laptops = data.laptops || data;

    return laptops.map(laptop => ({
      id: laptop.id,
      brand: laptop.brandName || laptop.brand,
      model: laptop.model || laptop.fullName,
      price_myr: laptop.price,
      cpu: {
        gen: laptop.specs?.cpu?.model || 'N/A',
        cores: laptop.specs?.cpu?.cores || 0
      },
      ram: {
        gb: laptop.specs?.ram || 0
      },
      gpu: {
        chip: laptop.specs?.gpu?.model || 'Integrated',
        vram: laptop.specs?.gpu?.vram || 0
      },
      storage: {
        gb: laptop.specs?.storage || 0
      },
      display: {
        size: laptop.specs?.display?.size || 0,
        res: laptop.specs?.display?.resolution || '',
        refresh: laptop.specs?.display?.refreshRate || 60,
        nits: laptop.specs?.display?.brightness || 0,
        gamut: laptop.specs?.display?.colorGamut || ''
      },
      battery_wh: laptop.specs?.battery || 0,
      weight_kg: laptop.specs?.weight || 0,
      npu_tops: laptop.specs?.npu?.tops || 0,
      category: [laptop.segment, laptop.tier].filter(Boolean),
      image: laptop.image || `/assets/laptops/${laptop.id}.png`,
      rating: laptop.rating || 0,
      rank: laptop.rank || 999,
      ports: Object.entries(laptop.specs?.ports || {}).map(([type, count]) => type),
      wireless: [laptop.specs?.connectivity?.wifi, laptop.specs?.connectivity?.bluetooth].filter(Boolean),
      release_date: laptop.releaseDate,
      popularity: laptop.popularity || 0,
      affiliate_url: laptop.affiliateUrl || `/out/${laptop.id}`
    }));
  }

  createSearchModal() {
    // Create modal for laptop selection
    const modalHTML = `
      <div class="versus-modal" id="laptopSearchModal" style="display: none;">
        <div class="versus-modal-backdrop"></div>
        <div class="versus-modal-content">
          <div class="versus-modal-header">
            <h3>Select a Laptop</h3>
            <button class="versus-modal-close" id="modalCloseBtn">&times;</button>
          </div>

          <div class="versus-modal-search">
            <input
              type="text"
              class="versus-search-input"
              id="modalSearchInput"
              placeholder="Search by brand, model, specs..."
              autocomplete="off"
            />
          </div>

          <div class="versus-modal-filters">
            <button class="versus-filter-chip active" data-category="all">All</button>
            <button class="versus-filter-chip" data-category="gaming">Gaming</button>
            <button class="versus-filter-chip" data-category="business">Business</button>
            <button class="versus-filter-chip" data-category="creative">Creative</button>
            <button class="versus-filter-chip" data-category="budget">Budget</button>
          </div>

          <div class="versus-modal-results" id="modalSearchResults">
            <div class="versus-results-loading">Loading laptops...</div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('laptopSearchModal');
  }

  attachEventListeners() {
    // Selector 1 click - open modal
    this.selector1.addEventListener('click', () => {
      this.currentSelectorIndex = 0;
      this.openSearchModal();
    });

    // Selector 2 click - open modal
    this.selector2.addEventListener('click', () => {
      this.currentSelectorIndex = 1;
      this.openSearchModal();
    });

    // Modal close
    const closeBtn = document.getElementById('modalCloseBtn');
    const backdrop = this.modal.querySelector('.versus-modal-backdrop');

    closeBtn.addEventListener('click', () => this.closeSearchModal());
    backdrop.addEventListener('click', () => this.closeSearchModal());

    // Modal search input
    const searchInput = document.getElementById('modalSearchInput');
    searchInput.addEventListener('input', (e) => {
      this.handleModalSearch(e.target.value);
    });

    // Modal category filters
    const filterChips = this.modal.querySelectorAll('.versus-filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        filterChips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.handleModalSearch(searchInput.value, e.target.dataset.category);
      });
    });

    // Comparison actions buttons
    const buttons = document.querySelectorAll('.comparison-actions .btn');
    buttons.forEach((btn, index) => {
      if (index === 0) btn.addEventListener('click', () => this.saveComparison());
      if (index === 1) btn.addEventListener('click', () => this.showExportMenu());
      if (index === 2) btn.addEventListener('click', () => this.setupPriceAlert());
      if (index === 3) btn.addEventListener('click', () => this.resetComparison());
    });
  }

  /**
   * Show export format menu
   */
  showExportMenu() {
    const menu = document.createElement('div');
    menu.className = 'export-menu';
    menu.innerHTML = `
      <div class="export-menu-backdrop"></div>
      <div class="export-menu-content">
        <h4>Export Comparison</h4>
        <button class="export-option" data-format="png">
          <span class="export-icon">📸</span>
          <div class="export-info">
            <strong>PNG Image</strong>
            <small>High-quality screenshot</small>
          </div>
        </button>
        <button class="export-option" data-format="pdf">
          <span class="export-icon">📄</span>
          <div class="export-info">
            <strong>PDF Document</strong>
            <small>Professional format</small>
          </div>
        </button>
        <button class="export-option" data-format="md">
          <span class="export-icon">📝</span>
          <div class="export-info">
            <strong>Markdown</strong>
            <small>Plain text format</small>
          </div>
        </button>
        <button class="export-option" data-format="share">
          <span class="export-icon">🔗</span>
          <div class="export-info">
            <strong>Share Link</strong>
            <small>Generate shareable URL</small>
          </div>
        </button>
      </div>
    `;

    menu.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    document.body.appendChild(menu);
    setTimeout(() => menu.classList.add('active'), 10);

    const close = () => {
      menu.classList.remove('active');
      setTimeout(() => menu.remove(), 300);
    };

    menu.querySelector('.export-menu-backdrop').addEventListener('click', close);

    menu.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('click', async () => {
        const format = option.dataset.format;
        close();

        switch (format) {
          case 'png':
            await this.exportAsPNG();
            break;
          case 'pdf':
            await this.exportAsPDF();
            break;
          case 'md':
            this.exportAsMarkdown();
            break;
          case 'share':
            this.shareComparison();
            break;
        }
      });
    });
  }

  openSearchModal() {
    this.modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scroll

    // Focus search input
    setTimeout(() => {
      document.getElementById('modalSearchInput').focus();
    }, 100);

    // Render all laptops initially
    this.renderModalResults(this.laptopDatabase);
  }

  closeSearchModal() {
    this.modal.style.display = 'none';
    document.body.style.overflow = '';

    // Clear search
    document.getElementById('modalSearchInput').value = '';
  }

  handleModalSearch(query, category = 'all') {
    let filtered = this.laptopDatabase;

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(laptop =>
        laptop.category?.includes(category)
      );
    }

    // Filter by search query
    if (query && query.length >= 2) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(laptop => {
        const searchStr = `${laptop.brand} ${laptop.model} ${laptop.cpu?.gen || ''} ${laptop.category?.join(' ') || ''}`.toLowerCase();
        return searchStr.includes(searchLower);
      });
    }

    this.renderModalResults(filtered);
  }

  renderModalResults(laptops) {
    const resultsContainer = document.getElementById('modalSearchResults');

    if (laptops.length === 0) {
      resultsContainer.innerHTML = '<div class="versus-no-results">No laptops found</div>';
      return;
    }

    resultsContainer.innerHTML = laptops.slice(0, 20).map(laptop => `
      <div class="versus-result-card" data-id="${laptop.id}">
        <div class="versus-result-image">
          <img src="${laptop.image || '/assets/default-laptop.png'}" alt="${laptop.brand} ${laptop.model}" loading="lazy">
        </div>
        <div class="versus-result-info">
          <h4 class="versus-result-brand">${laptop.brand}</h4>
          <p class="versus-result-model">${laptop.model}</p>
          <div class="versus-result-specs">
            <span>${laptop.cpu?.gen || 'N/A'}</span>
            <span>•</span>
            <span>${laptop.ram?.gb || 0}GB RAM</span>
            <span>•</span>
            <span>${laptop.gpu?.chip || 'Integrated'}</span>
          </div>
          <p class="versus-result-price">RM${this.formatPrice(laptop.price_myr)}</p>
        </div>
        <button class="versus-result-select" data-id="${laptop.id}">Select</button>
      </div>
    `).join('');

    // Attach click handlers to select buttons
    resultsContainer.querySelectorAll('.versus-result-select').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const laptopId = e.target.dataset.id;
        this.selectLaptop(laptopId);
      });
    });

    // Also allow clicking entire card
    resultsContainer.querySelectorAll('.versus-result-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('versus-result-select')) {
          const laptopId = card.dataset.id;
          this.selectLaptop(laptopId);
        }
      });
    });
  }

  selectLaptop(laptopId) {
    const laptop = this.laptopDatabase.find(l => l.id === laptopId);
    if (!laptop) return;

    // Set selected laptop
    this.selectedLaptops[this.currentSelectorIndex] = laptop;

    // Update selector display
    this.updateSelector(this.currentSelectorIndex, laptop);

    // Close modal
    this.closeSearchModal();

    // Save to cache
    this.saveToCache();

    // If both laptops selected, show comparison
    if (this.selectedLaptops[0] && this.selectedLaptops[1]) {
      this.renderComparison();
    }
  }

  updateSelector(index, laptop) {
    const selector = index === 0 ? this.selector1 : this.selector2;

    if (!laptop) {
      // Reset to placeholder
      selector.innerHTML = `
        <div class="selector-placeholder">
          <div class="selector-icon">💻</div>
          <div class="selector-label">Select Laptop ${index + 1}</div>
          <div class="selector-hint">Click to choose</div>
        </div>
      `;
      return;
    }

    // Show selected laptop
    selector.innerHTML = `
      <div class="selector-selected">
        <button class="selector-remove" title="Remove">&times;</button>
        <div class="selector-image">
          <img src="${laptop.image || '/assets/default-laptop.png'}" alt="${laptop.brand} ${laptop.model}">
        </div>
        <div class="selector-info">
          <h4 class="selector-brand">${laptop.brand}</h4>
          <p class="selector-model">${laptop.model}</p>
          <p class="selector-price">RM${this.formatPrice(laptop.price_myr)}</p>
        </div>
        <div class="selector-change-btn">Change</div>
      </div>
    `;

    // Attach remove button handler
    const removeBtn = selector.querySelector('.selector-remove');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedLaptops[index] = null;
      this.updateSelector(index, null);
      this.comparisonView.style.display = 'none';
      this.saveToCache();
    });
  }

  renderComparison() {
    // Show comparison view
    this.comparisonView.style.display = 'block';

    // Scroll to comparison view
    this.comparisonView.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Render all comparison components
    this.renderRadarChart();
    this.renderSpecsTable();
    this.renderProsConsGrid();
  }

  renderRadarChart() {
    if (!this.radarChart) return;

    const ctx = this.radarChart.getContext('2d');
    const canvas = this.radarChart;

    // Set canvas size
    const size = Math.min(canvas.parentElement.clientWidth, 500);
    canvas.width = size;
    canvas.height = size;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scores for each laptop
    const scores1 = this.calculateMetricScores(this.selectedLaptops[0]);
    const scores2 = this.calculateMetricScores(this.selectedLaptops[1]);

    // Draw radar grid
    this.drawRadarGrid(ctx, centerX, centerY, radius);

    // Draw polygons
    const color1 = '#00F0FF'; // Cyan
    const color2 = '#D83F87'; // Pink

    // Draw filled polygons
    this.drawRadarPolygon(ctx, centerX, centerY, radius, scores1, color1, 0.2);
    this.drawRadarPolygon(ctx, centerX, centerY, radius, scores2, color2, 0.2);

    // Draw outlined polygons
    this.drawRadarPolygon(ctx, centerX, centerY, radius, scores1, color1, 1, true);
    this.drawRadarPolygon(ctx, centerX, centerY, radius, scores2, color2, 1, true);

    // Draw legend
    this.drawRadarLegend(ctx, [color1, color2], canvas.width);
  }

  drawRadarGrid(ctx, centerX, centerY, radius) {
    const metrics = this.comparisonMetrics;
    const angleStep = (Math.PI * 2) / metrics.length;

    // Draw concentric circles (5 levels)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw spokes and labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillStyle = '#A8B2CC';
    ctx.font = 'bold 12px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    metrics.forEach((metric, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Spoke line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Label positioning (outside the circle)
      const labelDistance = radius + 30;
      const labelX = centerX + Math.cos(angle) * labelDistance;
      const labelY = centerY + Math.sin(angle) * labelDistance;

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
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Convert hex to rgba
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }
  }

  drawRadarLegend(ctx, colors, canvasWidth) {
    ctx.font = '14px Inter, system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    this.selectedLaptops.forEach((laptop, i) => {
      if (!laptop) return;

      const y = 20 + i * 30;

      // Color box
      ctx.fillStyle = colors[i];
      ctx.fillRect(20, y - 8, 20, 16);

      // Label
      ctx.fillStyle = '#E6EDF3';
      ctx.fillText(`${laptop.brand} ${laptop.model}`, 50, y);
    });
  }

  calculateMetricScores(laptop) {
    if (!laptop) return [0, 0, 0, 0, 0, 0];

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

  renderSpecsTable() {
    if (!this.specsTable) return;

    const laptop1 = this.selectedLaptops[0];
    const laptop2 = this.selectedLaptops[1];

    const specs = [
      { label: 'Processor', key: 'cpu.gen' },
      { label: 'Cores', key: 'cpu.cores' },
      { label: 'GPU', key: 'gpu.chip' },
      { label: 'VRAM', key: 'gpu.vram', unit: 'GB' },
      { label: 'RAM', key: 'ram.gb', unit: 'GB' },
      { label: 'Storage', key: 'storage.gb', unit: 'GB' },
      { label: 'Display Size', key: 'display.size', unit: '"' },
      { label: 'Resolution', key: 'display.res' },
      { label: 'Refresh Rate', key: 'display.refresh', unit: 'Hz' },
      { label: 'Battery', key: 'battery_wh', unit: 'Wh' },
      { label: 'Weight', key: 'weight_kg', unit: 'kg' },
      { label: 'Price', key: 'price_myr', formatter: (v) => `RM${this.formatPrice(v)}` }
    ];

    this.specsTable.innerHTML = `
      <h3>Detailed Specifications</h3>
      <table class="versus-table">
        <thead>
          <tr>
            <th>Specification</th>
            <th>${laptop1.brand} ${laptop1.model}</th>
            <th>${laptop2.brand} ${laptop2.model}</th>
          </tr>
        </thead>
        <tbody>
          ${specs.map(spec => {
            const value1 = this.getNestedValue(laptop1, spec.key);
            const value2 = this.getNestedValue(laptop2, spec.key);

            const formatted1 = spec.formatter ? spec.formatter(value1) : value1;
            const formatted2 = spec.formatter ? spec.formatter(value2) : value2;

            const display1 = formatted1 ? `${formatted1}${spec.unit || ''}` : 'N/A';
            const display2 = formatted2 ? `${formatted2}${spec.unit || ''}` : 'N/A';

            // Highlight winner (for numeric values)
            let class1 = '';
            let class2 = '';
            if (typeof value1 === 'number' && typeof value2 === 'number') {
              // Lower is better for weight and price
              const lowerIsBetter = ['weight_kg', 'price_myr'].some(k => spec.key.includes(k));
              if (lowerIsBetter) {
                if (value1 < value2) class1 = 'winner';
                else if (value2 < value1) class2 = 'winner';
              } else {
                if (value1 > value2) class1 = 'winner';
                else if (value2 > value1) class2 = 'winner';
              }
            }

            return `
              <tr>
                <td class="spec-label">${spec.label}</td>
                <td class="${class1}">${display1}</td>
                <td class="${class2}">${display2}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  renderProsConsGrid() {
    if (!this.prosConsGrid) return;

    const laptop1 = this.selectedLaptops[0];
    const laptop2 = this.selectedLaptops[1];

    const analysis1 = this.analyzeProsConsLaptop(laptop1, laptop2);
    const analysis2 = this.analyzeProsConsLaptop(laptop2, laptop1);

    this.prosConsGrid.innerHTML = `
      <h3>Pros & Cons Analysis</h3>
      <div class="versus-pros-cons-container">
        <div class="versus-pros-cons-card">
          <h4>${laptop1.brand} ${laptop1.model}</h4>
          <div class="versus-pros">
            <h5>✅ Pros</h5>
            <ul>
              ${analysis1.pros.map(pro => `<li>${pro}</li>`).join('')}
            </ul>
          </div>
          <div class="versus-cons">
            <h5>❌ Cons</h5>
            <ul>
              ${analysis1.cons.map(con => `<li>${con}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="versus-pros-cons-card">
          <h4>${laptop2.brand} ${laptop2.model}</h4>
          <div class="versus-pros">
            <h5>✅ Pros</h5>
            <ul>
              ${analysis2.pros.map(pro => `<li>${pro}</li>`).join('')}
            </ul>
          </div>
          <div class="versus-cons">
            <h5>❌ Cons</h5>
            <ul>
              ${analysis2.cons.map(con => `<li>${con}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  analyzeProsConsLaptop(laptop, competitor) {
    const pros = [];
    const cons = [];

    // Price comparison
    if (laptop.price_myr < competitor.price_myr) {
      pros.push(`More affordable (RM${this.formatPrice(laptop.price_myr)} vs RM${this.formatPrice(competitor.price_myr)})`);
    } else if (laptop.price_myr > competitor.price_myr * 1.2) {
      cons.push(`Significantly more expensive (RM${this.formatPrice(laptop.price_myr)} vs RM${this.formatPrice(competitor.price_myr)})`);
    }

    // Performance
    if ((laptop.cpu?.cores || 0) > (competitor.cpu?.cores || 0)) {
      pros.push(`More CPU cores (${laptop.cpu.cores} vs ${competitor.cpu.cores})`);
    }
    if ((laptop.ram?.gb || 0) > (competitor.ram?.gb || 0)) {
      pros.push(`More RAM (${laptop.ram.gb}GB vs ${competitor.ram.gb}GB)`);
    }
    if (laptop.gpu?.vram && !competitor.gpu?.vram) {
      pros.push(`Dedicated GPU (${laptop.gpu.chip})`);
    }

    // Display
    if ((laptop.display?.refresh || 60) > (competitor.display?.refresh || 60)) {
      pros.push(`Higher refresh rate (${laptop.display.refresh}Hz vs ${competitor.display.refresh}Hz)`);
    }
    if ((laptop.display?.nits || 0) > (competitor.display?.nits || 0)) {
      pros.push(`Brighter display (${laptop.display.nits} nits vs ${competitor.display.nits} nits)`);
    }

    // Portability
    if ((laptop.weight_kg || 999) < (competitor.weight_kg || 999)) {
      pros.push(`Lighter and more portable (${laptop.weight_kg}kg vs ${competitor.weight_kg}kg)`);
    } else if ((laptop.weight_kg || 0) > (competitor.weight_kg || 0) * 1.2) {
      cons.push(`Heavier (${laptop.weight_kg}kg vs ${competitor.weight_kg}kg)`);
    }

    // Battery
    if ((laptop.battery_wh || 0) > (competitor.battery_wh || 0)) {
      pros.push(`Larger battery capacity (${laptop.battery_wh}Wh vs ${competitor.battery_wh}Wh)`);
    }

    // Storage
    if ((laptop.storage?.gb || 0) > (competitor.storage?.gb || 0)) {
      pros.push(`More storage (${laptop.storage.gb}GB vs ${competitor.storage.gb}GB)`);
    }

    // AI capabilities
    if (laptop.npu_tops > 20 && competitor.npu_tops < 20) {
      pros.push(`AI-ready with NPU (${laptop.npu_tops} TOPS)`);
    }

    // If no pros/cons found, add generic ones
    if (pros.length === 0) {
      pros.push('Solid overall specifications');
      pros.push('Reliable brand reputation');
    }
    if (cons.length === 0) {
      cons.push('No major drawbacks compared to competitor');
    }

    return { pros, cons };
  }

  async saveComparison() {
    if (!this.selectedLaptops[0] || !this.selectedLaptops[1]) return;

    try {
      await storage.addHistory({
        type: 'versus',
        timestamp: Date.now(),
        laptops: this.selectedLaptops.map(l => ({
          id: l.id,
          brand: l.brand,
          model: l.model,
          price: l.price_myr
        }))
      });
      this.showNotification('Comparison saved to history', 'success');
    } catch (error) {
      console.error('Failed to save comparison:', error);
      this.showNotification('Failed to save comparison', 'error');
    }
  }

  /**
   * Export comparison as PNG screenshot
   * Uses html2canvas library if available
   */
  async exportAsPNG() {
    if (!this.comparisonView || !this.selectedLaptops[0] || !this.selectedLaptops[1]) return;

    try {
      this.showNotification('Generating screenshot...', 'info');

      // Check if html2canvas is available
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas not loaded');
      }

      const canvas = await html2canvas(this.comparisonView, {
        backgroundColor: '#0D1117',
        scale: 2,
        logging: false
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `versus-${this.selectedLaptops[0].id}-vs-${this.selectedLaptops[1].id}.png`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Screenshot downloaded', 'success');
      });
    } catch (error) {
      console.error('Failed to export PNG:', error);
      this.exportAsMarkdown(); // Fallback
    }
  }

  /**
   * Export comparison as Markdown
   */
  exportAsMarkdown() {
    if (!this.selectedLaptops[0] || !this.selectedLaptops[1]) return;

    const laptop1 = this.selectedLaptops[0];
    const laptop2 = this.selectedLaptops[1];

    const markdown = `# AI Bradaa Laptop Comparison

## ${laptop1.brand} ${laptop1.model} vs ${laptop2.brand} ${laptop2.model}

Generated: ${new Date().toLocaleDateString('en-MY', { dateStyle: 'full' })}

---

## Specifications Comparison

| Specification | ${laptop1.brand} ${laptop1.model} | ${laptop2.brand} ${laptop2.model} |
|--------------|------------------|------------------|
| **Processor** | ${laptop1.cpu?.gen || 'N/A'} | ${laptop2.cpu?.gen || 'N/A'} |
| **Cores** | ${laptop1.cpu?.cores || 'N/A'} | ${laptop2.cpu?.cores || 'N/A'} |
| **GPU** | ${laptop1.gpu?.chip || 'Integrated'} | ${laptop2.gpu?.chip || 'Integrated'} |
| **VRAM** | ${laptop1.gpu?.vram || 0}GB | ${laptop2.gpu?.vram || 0}GB |
| **RAM** | ${laptop1.ram?.gb || 0}GB | ${laptop2.ram?.gb || 0}GB |
| **Storage** | ${laptop1.storage?.gb || 0}GB | ${laptop2.storage?.gb || 0}GB |
| **Display** | ${laptop1.display?.size || 0}" ${laptop1.display?.res || ''} @ ${laptop1.display?.refresh || 60}Hz | ${laptop2.display?.size || 0}" ${laptop2.display?.res || ''} @ ${laptop2.display?.refresh || 60}Hz |
| **Battery** | ${laptop1.battery_wh || 'N/A'}Wh | ${laptop2.battery_wh || 'N/A'}Wh |
| **Weight** | ${laptop1.weight_kg || 'N/A'}kg | ${laptop2.weight_kg || 'N/A'}kg |
| **Price** | RM${this.formatPrice(laptop1.price_myr)} | RM${this.formatPrice(laptop2.price_myr)} |

---

## Performance Scores

| Metric | ${laptop1.brand} | ${laptop2.brand} |
|--------|----------|----------|
| Performance | ${this.calculatePerformanceScore(laptop1)}/100 | ${this.calculatePerformanceScore(laptop2)}/100 |
| Portability | ${this.calculatePortabilityScore(laptop1)}/100 | ${this.calculatePortabilityScore(laptop2)}/100 |
| Battery Life | ${this.calculateBatteryScore(laptop1)}/100 | ${this.calculateBatteryScore(laptop2)}/100 |
| Display Quality | ${this.calculateDisplayScore(laptop1)}/100 | ${this.calculateDisplayScore(laptop2)}/100 |
| Value | ${this.calculateValueScore(laptop1)}/100 | ${this.calculateValueScore(laptop2)}/100 |
| Build Quality | ${this.calculateBuildScore(laptop1)}/100 | ${this.calculateBuildScore(laptop2)}/100 |

---

*Generated by AI Bradaa - Your AI-Powered Laptop Advisor*
*Visit: https://aibradaa.com*
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `versus-comparison-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('Markdown exported successfully', 'success');
  }

  /**
   * Export comparison as PDF
   * Uses jsPDF library if available
   */
  async exportAsPDF() {
    if (!this.selectedLaptops[0] || !this.selectedLaptops[1]) return;

    try {
      this.showNotification('Generating PDF...', 'info');

      // Check if jsPDF is available
      if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        throw new Error('jsPDF not loaded');
      }

      const { jsPDF } = window.jspdf || jspdf;
      const doc = new jsPDF();

      const laptop1 = this.selectedLaptops[0];
      const laptop2 = this.selectedLaptops[1];

      // Title
      doc.setFontSize(20);
      doc.text('AI Bradaa Laptop Comparison', 105, 20, { align: 'center' });

      doc.setFontSize(16);
      doc.text(`${laptop1.brand} ${laptop1.model}`, 50, 35, { align: 'center' });
      doc.text('vs', 105, 35, { align: 'center' });
      doc.text(`${laptop2.brand} ${laptop2.model}`, 160, 35, { align: 'center' });

      // Specifications table
      doc.setFontSize(12);
      let yPos = 50;

      const specs = [
        ['Processor', laptop1.cpu?.gen || 'N/A', laptop2.cpu?.gen || 'N/A'],
        ['GPU', laptop1.gpu?.chip || 'Integrated', laptop2.gpu?.chip || 'Integrated'],
        ['RAM', `${laptop1.ram?.gb || 0}GB`, `${laptop2.ram?.gb || 0}GB`],
        ['Storage', `${laptop1.storage?.gb || 0}GB`, `${laptop2.storage?.gb || 0}GB`],
        ['Display', `${laptop1.display?.size}"`, `${laptop2.display?.size}"`],
        ['Battery', `${laptop1.battery_wh}Wh`, `${laptop2.battery_wh}Wh`],
        ['Weight', `${laptop1.weight_kg}kg`, `${laptop2.weight_kg}kg`],
        ['Price', `RM${this.formatPrice(laptop1.price_myr)}`, `RM${this.formatPrice(laptop2.price_myr)}`]
      ];

      specs.forEach(([spec, val1, val2]) => {
        doc.text(spec, 20, yPos);
        doc.text(val1, 80, yPos);
        doc.text(val2, 140, yPos);
        yPos += 10;
      });

      // Footer
      doc.setFontSize(10);
      doc.text('Generated by AI Bradaa - aibradaa.com', 105, 280, { align: 'center' });

      doc.save(`versus-comparison-${Date.now()}.pdf`);
      this.showNotification('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      this.exportAsMarkdown(); // Fallback
    }
  }

  /**
   * Get AI insights for comparison using Gemini API
   * @returns {Promise<Object>} AI-generated insights
   */
  async getAIInsights() {
    if (!this.selectedLaptops[0] || !this.selectedLaptops[1]) return null;

    try {
      const laptop1 = this.selectedLaptops[0];
      const laptop2 = this.selectedLaptops[1];

      // Call Gemini API through backend
      const response = await apiClient.post('/ai/compare', {
        laptop1: {
          brand: laptop1.brand,
          model: laptop1.model,
          price: laptop1.price_myr,
          cpu: laptop1.cpu?.gen,
          gpu: laptop1.gpu?.chip,
          ram: laptop1.ram?.gb,
          category: laptop1.category
        },
        laptop2: {
          brand: laptop2.brand,
          model: laptop2.model,
          price: laptop2.price_myr,
          cpu: laptop2.cpu?.gen,
          gpu: laptop2.gpu?.chip,
          ram: laptop2.ram?.gb,
          category: laptop2.category
        }
      });

      return response.data.insights;
    } catch (error) {
      console.error('Failed to get AI insights:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * Fallback insights when API is unavailable
   */
  getFallbackInsights() {
    const laptop1 = this.selectedLaptops[0];
    const laptop2 = this.selectedLaptops[1];

    const perf1 = this.calculatePerformanceScore(laptop1);
    const perf2 = this.calculatePerformanceScore(laptop2);
    const value1 = this.calculateValueScore(laptop1);
    const value2 = this.calculateValueScore(laptop2);

    const winner = perf1 > perf2 ? laptop1 : laptop2;
    const bestValue = value1 > value2 ? laptop1 : laptop2;

    return {
      summary: `The ${winner.brand} ${winner.model} offers superior performance, while the ${bestValue.brand} ${bestValue.model} provides better value for money.`,
      verdict: perf1 > perf2 ? laptop1.id : laptop2.id,
      recommendation: `Choose ${winner.brand} for performance-intensive tasks, or ${bestValue.brand} for budget-conscious buyers.`
    };
  }

  /**
   * Setup price tracking alert
   */
  async setupPriceAlert() {
    if (!this.selectedLaptops[0] || !this.selectedLaptops[1]) return;

    const modal = document.createElement('div');
    modal.className = 'price-alert-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="alert-setup">
          <h3>Setup Price Drop Alerts</h3>
          <p>Get notified when prices drop for these laptops</p>

          <div class="alert-options">
            <label class="alert-checkbox">
              <input type="checkbox" id="alert-laptop1" checked>
              <span>${this.selectedLaptops[0].brand} ${this.selectedLaptops[0].model}</span>
              <span class="current-price">Current: RM${this.formatPrice(this.selectedLaptops[0].price_myr)}</span>
            </label>

            <label class="alert-checkbox">
              <input type="checkbox" id="alert-laptop2" checked>
              <span>${this.selectedLaptops[1].brand} ${this.selectedLaptops[1].model}</span>
              <span class="current-price">Current: RM${this.formatPrice(this.selectedLaptops[1].price_myr)}</span>
            </label>
          </div>

          <div class="alert-threshold">
            <label>Notify me when price drops by:</label>
            <select id="threshold-select">
              <option value="5">5% or more</option>
              <option value="10" selected>10% or more</option>
              <option value="15">15% or more</option>
              <option value="20">20% or more</option>
            </select>
          </div>

          <div class="alert-email">
            <label>Email address (optional):</label>
            <input type="email" id="alert-email" placeholder="your@email.com">
          </div>

          <div class="alert-actions">
            <button class="btn-primary" id="save-alert">Setup Alerts</button>
            <button class="btn-secondary" id="cancel-alert">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const close = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.modal-backdrop').addEventListener('click', close);
    modal.querySelector('#cancel-alert').addEventListener('click', close);

    modal.querySelector('#save-alert').addEventListener('click', async () => {
      const laptop1Checked = modal.querySelector('#alert-laptop1').checked;
      const laptop2Checked = modal.querySelector('#alert-laptop2').checked;
      const threshold = parseInt(modal.querySelector('#threshold-select').value);
      const email = modal.querySelector('#alert-email').value;

      const alerts = [];
      if (laptop1Checked) alerts.push(this.selectedLaptops[0].id);
      if (laptop2Checked) alerts.push(this.selectedLaptops[1].id);

      try {
        await storage.setCache('price_alerts', {
          laptops: alerts,
          threshold,
          email,
          createdAt: Date.now()
        }, 2592000000); // 30 days

        this.showNotification(`Price alerts set for ${alerts.length} laptop(s)`, 'success');
        close();
      } catch (error) {
        console.error('Failed to setup alerts:', error);
        this.showNotification('Failed to setup alerts', 'error');
      }
    });
  }

  shareComparison() {
    if (!this.selectedLaptops[0] || !this.selectedLaptops[1]) return;

    const laptop1 = this.selectedLaptops[0];
    const laptop2 = this.selectedLaptops[1];

    const shareText = `AI Bradaa Comparison:\n${laptop1.brand} ${laptop1.model} vs ${laptop2.brand} ${laptop2.model}`;
    const shareUrl = `${window.location.origin}/versus?ids=${laptop1.id},${laptop2.id}`;

    if (navigator.share) {
      navigator.share({
        title: 'AI Bradaa Laptop Comparison',
        text: shareText,
        url: shareUrl
      }).catch(err => console.log('Share failed:', err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
        this.showNotification('Share link copied to clipboard', 'success');
      });
    }
  }

  resetComparison() {
    this.selectedLaptops = [null, null];
    this.updateSelector(0, null);
    this.updateSelector(1, null);
    this.comparisonView.style.display = 'none';
    this.saveToCache();
  }

  async saveToCache() {
    if (this.selectedLaptops[0] || this.selectedLaptops[1]) {
      await storage.setCache('versus_selection', this.selectedLaptops, 86400000); // 24 hours
    } else {
      await storage.clearCache('versus_selection');
    }
  }

  async loadFromCache() {
    const cached = await storage.getCache('versus_selection');
    if (cached && Array.isArray(cached)) {
      this.selectedLaptops = cached;
      this.updateSelector(0, cached[0]);
      this.updateSelector(1, cached[1]);

      if (cached[0] && cached[1]) {
        this.renderComparison();
      }
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  formatPrice(price) {
    if (!price) return '0';
    return price.toLocaleString('en-MY');
  }

  showNotification(message, type = 'info') {
    // Simple notification (could be enhanced with a toast component)
    const notification = document.createElement('div');
    notification.className = `versus-notification versus-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#D83F87' : '#00F0FF'};
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

  getDemoData() {
    // Fallback demo data if fetch fails
    return [
      {
        id: 'demo-1',
        brand: 'Apple',
        model: 'MacBook Air M3',
        price_myr: 5299,
        cpu: { gen: 'M3', cores: 8 },
        ram: { gb: 16 },
        gpu: { chip: 'M3 GPU', vram: 0 },
        storage: { gb: 512 },
        display: { size: 13.6, res: '2560x1664', refresh: 60, nits: 500 },
        battery_wh: 52,
        weight_kg: 1.24,
        category: ['ultrabook', 'creative']
      },
      {
        id: 'demo-2',
        brand: 'Lenovo',
        model: 'Legion 5 Pro',
        price_myr: 4999,
        cpu: { gen: 'AMD Ryzen 7 7735H', cores: 8 },
        ram: { gb: 16 },
        gpu: { chip: 'RTX 4060', vram: 8 },
        storage: { gb: 512 },
        display: { size: 16, res: '2560x1600', refresh: 165, nits: 500 },
        battery_wh: 80,
        weight_kg: 2.5,
        category: ['gaming']
      }
    ];
  }
}

// Export for module usage
export default Versus;
