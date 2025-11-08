/**
 * Versus App Logic
 * Handles laptop comparison interface
 */

import { ApiClient } from '../utils/apiClient.js';
import { getDB } from '../utils/db.js';
import { Toast, Loader } from '../components/ui.js';
import { ComparisonTable } from '../components/comparison-table.js';
import { getAnalytics } from '../utils/analytics.js';

export class VersusApp {
  constructor() {
    this.api = new ApiClient();
    this.analytics = getAnalytics();
    this.selectedLaptops = [];
    this.maxSelection = 4;

    this.init();
  }

  /**
   * Initialize app
   */
  async init() {
    await this.loadSavedComparison();
    this.setupSelectors();
    this.attachEventListeners();

    // Track page view
    if (this.analytics) {
      this.analytics.pageView('/sections/versus.html');
    }
  }

  /**
   * Load saved comparison from localStorage
   */
  async loadSavedComparison() {
    try {
      const saved = localStorage.getItem('versus_comparison');
      if (saved) {
        const laptopIds = JSON.parse(saved);
        const db = await getDB();

        for (const id of laptopIds) {
          const laptop = await db.getLaptop(id);
          if (laptop) {
            this.selectedLaptops.push(laptop);
          }
        }

        if (this.selectedLaptops.length > 0) {
          this.renderComparison();
        }
      }
    } catch (error) {
      console.error('Failed to load saved comparison:', error);
    }
  }

  /**
   * Setup laptop selectors
   */
  setupSelectors() {
    const selectors = document.querySelectorAll('.laptop-selector');

    selectors.forEach((selector, index) => {
      this.populateSelector(selector, index);
    });
  }

  /**
   * Populate selector dropdown with laptops
   */
  async populateSelector(selector, index) {
    const db = await getDB();
    const laptops = await db.getAllLaptops();

    // Clear existing options except placeholder
    selector.innerHTML = '<option value="">Select a laptop...</option>';

    // Group by brand
    const grouped = laptops.reduce((acc, laptop) => {
      if (!acc[laptop.brand]) {
        acc[laptop.brand] = [];
      }
      acc[laptop.brand].push(laptop);
      return acc;
    }, {});

    // Add options grouped by brand
    Object.keys(grouped).sort().forEach(brand => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = brand;

      grouped[brand]
        .sort((a, b) => a.model.localeCompare(b.model))
        .forEach(laptop => {
          const option = document.createElement('option');
          option.value = laptop.id;
          option.textContent = `${laptop.model} (RM ${laptop.price_MYR.toLocaleString()})`;

          // Disable if already selected
          if (this.selectedLaptops.find(l => l.id === laptop.id)) {
            option.disabled = true;
          }

          optgroup.appendChild(option);
        });

      selector.appendChild(optgroup);
    });

    // Set current selection
    if (this.selectedLaptops[index]) {
      selector.value = this.selectedLaptops[index].id;
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Selector changes
    document.querySelectorAll('.laptop-selector').forEach((selector, index) => {
      selector.addEventListener('change', (e) => {
        this.handleSelectorChange(e.target.value, index);
      });
    });

    // Compare button
    document.getElementById('compare-btn')?.addEventListener('click', () => {
      this.compare();
    });

    // Clear button
    document.getElementById('clear-btn')?.addEventListener('click', () => {
      this.clear();
    });

    // Listen for laptop-compare events from other parts of the app
    window.addEventListener('laptop-compare', (e) => {
      this.addLaptop(e.detail);
    });
  }

  /**
   * Handle selector change
   */
  async handleSelectorChange(laptopId, index) {
    if (!laptopId) {
      // Remove selection
      this.selectedLaptops.splice(index, 1);
      this.updateUI();
      return;
    }

    const db = await getDB();
    const laptop = await db.getLaptop(laptopId);

    if (!laptop) return;

    // Update or add to selected laptops
    if (index < this.selectedLaptops.length) {
      this.selectedLaptops[index] = laptop;
    } else {
      this.selectedLaptops.push(laptop);
    }

    this.updateUI();
  }

  /**
   * Add laptop to comparison
   */
  async addLaptop(laptop) {
    // Check if already selected
    if (this.selectedLaptops.find(l => l.id === laptop.id)) {
      Toast.show({
        message: 'This laptop is already in comparison',
        type: 'info'
      });
      return;
    }

    // Check max selection
    if (this.selectedLaptops.length >= this.maxSelection) {
      Toast.show({
        message: `Maximum ${this.maxSelection} laptops can be compared`,
        type: 'warning'
      });
      return;
    }

    this.selectedLaptops.push(laptop);
    this.updateUI();

    Toast.show({
      message: 'Added to comparison',
      type: 'success'
    });
  }

  /**
   * Update UI after changes
   */
  updateUI() {
    // Update all selectors to disable already selected laptops
    const selectors = document.querySelectorAll('.laptop-selector');
    selectors.forEach((selector, index) => {
      this.populateSelector(selector, index);
    });

    // Enable/disable compare button
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
      compareBtn.disabled = this.selectedLaptops.length < 2;
    }

    // Save to localStorage
    this.saveComparison();
  }

  /**
   * Perform comparison
   */
  async compare() {
    if (this.selectedLaptops.length < 2) {
      Toast.show({
        message: 'Select at least 2 laptops to compare',
        type: 'warning'
      });
      return;
    }

    const loader = Loader.show({ text: 'Comparing laptops...' });

    try {
      // Track comparison
      if (this.analytics) {
        this.analytics.comparison(this.selectedLaptops.map(l => l.id));
      }

      // Get AI insights from recommendations/compare endpoint
      const data = await this.api.post('/recommendations/compare', {
        laptopIds: this.selectedLaptops.map(l => l.id)
      });

      // Render comparison
      this.renderComparison(data.insights);

    } catch (error) {
      console.error('Comparison failed:', error);

      // Render without AI insights
      this.renderComparison();

      if (this.analytics) {
        this.analytics.error(error, { context: 'versus_comparison' });
      }
    } finally {
      Loader.hide();
    }
  }

  /**
   * Render comparison table
   */
  renderComparison(aiInsights = null) {
    const resultsContainer = document.getElementById('comparison-results');

    if (!resultsContainer) return;

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Create comparison table
    const table = ComparisonTable.create(this.selectedLaptops, {
      highlightBest: true,
      showAllSpecs: false,
      onRemove: (index) => {
        this.removeLaptop(index);
      }
    });

    resultsContainer.appendChild(table);

    // Add AI insights if available
    if (aiInsights) {
      const insightsContainer = document.getElementById('ai-insights');
      if (insightsContainer) {
        insightsContainer.innerHTML = aiInsights.map(insight =>
          `<p>• ${insight}</p>`
        ).join('');
      }
    }

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Remove laptop from comparison
   */
  removeLaptop(index) {
    this.selectedLaptops.splice(index, 1);
    this.updateUI();

    if (this.selectedLaptops.length < 2) {
      // Hide results if less than 2 laptops
      const resultsContainer = document.getElementById('comparison-results');
      if (resultsContainer) {
        resultsContainer.innerHTML = '';
      }
    } else {
      // Re-render comparison
      this.renderComparison();
    }

    Toast.show({
      message: 'Removed from comparison',
      type: 'info'
    });
  }

  /**
   * Clear all selections
   */
  clear() {
    this.selectedLaptops = [];
    this.updateUI();

    // Clear results
    const resultsContainer = document.getElementById('comparison-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }

    // Reset selectors
    document.querySelectorAll('.laptop-selector').forEach(selector => {
      selector.value = '';
    });

    Toast.show({
      message: 'Comparison cleared',
      type: 'info'
    });
  }

  /**
   * Save comparison to localStorage
   */
  saveComparison() {
    const laptopIds = this.selectedLaptops.map(l => l.id);
    localStorage.setItem('versus_comparison', JSON.stringify(laptopIds));
  }

  /**
   * Export comparison as image or PDF
   */
  async exportComparison(format = 'image') {
    const table = document.querySelector('.comparison-table');

    if (!table) {
      Toast.show({
        message: 'No comparison to export',
        type: 'warning'
      });
      return;
    }

    Toast.show({
      message: `Export as ${format} coming soon!`,
      type: 'info'
    });

    // TODO: Implement export functionality
    // - Use html2canvas for image export
    // - Use jsPDF for PDF export
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new VersusApp();
  });
} else {
  new VersusApp();
}
