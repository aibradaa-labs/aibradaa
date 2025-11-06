/**
 * Comparison Table Component
 * Side-by-side laptop comparison with highlighting
 */

import { formatCurrency } from '../utils/helpers.js';

export class ComparisonTable {
  /**
   * Create comparison table for multiple laptops
   * @param {Array} laptops - Array of laptop objects (2-4 laptops)
   * @param {Object} options - Display options
   */
  static create(laptops, options = {}) {
    const {
      highlightBest = true,
      showAllSpecs = false,
      onRemove = null
    } = options;

    if (!laptops || laptops.length < 2) {
      return this.createEmptyState();
    }

    if (laptops.length > 4) {
      laptops = laptops.slice(0, 4); // Max 4 laptops
    }

    const container = document.createElement('div');
    container.className = 'comparison-table bg-white rounded-lg shadow-lg overflow-hidden';

    // Build comparison data structure
    const comparisonData = this.buildComparisonData(laptops, showAllSpecs);

    // Create table
    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- Header with laptop images -->
          <thead>
            <tr class="border-b">
              <th class="p-4 text-left bg-gray-50 sticky left-0 z-10 w-48">
                <span class="text-sm font-semibold text-gray-700">Specifications</span>
              </th>
              ${laptops.map((laptop, index) => `
                <th class="p-4 text-center bg-gray-50 relative min-w-64">
                  ${onRemove ? `
                    <button class="remove-laptop-btn absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600" data-index="${index}">
                      ✕
                    </button>
                  ` : ''}
                  <img src="${laptop.image || '/images/placeholder-laptop.jpg'}" alt="${laptop.model}" class="w-32 h-32 object-cover mx-auto rounded-lg mb-3">
                  <div class="text-left">
                    <p class="text-xs text-gray-500 font-medium">${laptop.brand}</p>
                    <p class="text-sm font-bold text-gray-900 mb-2">${laptop.model}</p>
                    <p class="text-lg font-bold text-indigo-600">${formatCurrency(laptop.price_MYR)}</p>
                    ${laptop.score_composite ? `
                      <div class="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        ⭐ ${laptop.score_composite}/100
                      </div>
                    ` : ''}
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>

          <!-- Comparison rows -->
          <tbody>
            ${comparisonData.map(row => this.renderComparisonRow(row, laptops, highlightBest)).join('')}
          </tbody>
        </table>
      </div>

      <!-- AI Insights Section -->
      <div class="border-t p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
          🤖 AI Insights
        </h3>
        <div id="ai-insights" class="space-y-2 text-sm text-gray-700">
          ${this.generateInsights(laptops)}
        </div>
      </div>
    `;

    // Attach event listeners
    if (onRemove) {
      container.querySelectorAll('.remove-laptop-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          onRemove(index);
        });
      });
    }

    return container;
  }

  /**
   * Build comparison data structure
   */
  static buildComparisonData(laptops, showAllSpecs) {
    const commonSpecs = [
      { key: 'price_MYR', label: 'Price', type: 'currency', category: 'pricing' },
      { key: 'score_composite', label: 'Overall Score', type: 'score', category: 'rating' },
      { key: 'cpu.gen', label: 'Processor', type: 'text', category: 'performance' },
      { key: 'cpu.cores', label: 'CPU Cores', type: 'number', suffix: ' cores', category: 'performance' },
      { key: 'ram.gb', label: 'RAM', type: 'number', suffix: 'GB', category: 'performance' },
      { key: 'storage.gb', label: 'Storage', type: 'number', suffix: 'GB', category: 'storage' },
      { key: 'storage.type', label: 'Storage Type', type: 'text', category: 'storage' },
      { key: 'display.size', label: 'Display Size', type: 'text', category: 'display' },
      { key: 'display.resolution', label: 'Resolution', type: 'text', category: 'display' },
      { key: 'display.refresh_rate', label: 'Refresh Rate', type: 'number', suffix: 'Hz', category: 'display' },
      { key: 'gpu.model', label: 'Graphics', type: 'text', category: 'performance' },
      { key: 'battery.wh', label: 'Battery', type: 'number', suffix: 'Wh', category: 'battery' },
      { key: 'weight.kg', label: 'Weight', type: 'number', suffix: 'kg', category: 'physical' },
      { key: 'warranty_years', label: 'Warranty', type: 'number', suffix: ' years', category: 'other' }
    ];

    // Filter out specs that are missing in all laptops
    return commonSpecs.filter(spec => {
      return laptops.some(laptop => this.getNestedValue(laptop, spec.key) != null);
    });
  }

  /**
   * Render a comparison row
   */
  static renderComparisonRow(spec, laptops, highlightBest) {
    const values = laptops.map(laptop => this.getNestedValue(laptop, spec.key));
    const bestIndex = highlightBest ? this.findBestValueIndex(values, spec.type) : -1;

    return `
      <tr class="border-b hover:bg-gray-50 transition-colors">
        <td class="p-4 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
          ${spec.label}
        </td>
        ${laptops.map((laptop, index) => {
          const value = values[index];
          const isBest = index === bestIndex;
          const formattedValue = this.formatValue(value, spec.type, spec.suffix);

          return `
            <td class="p-4 text-center ${isBest ? 'bg-green-50 font-bold text-green-700' : 'text-gray-900'}">
              ${isBest ? '🏆 ' : ''}
              ${formattedValue}
            </td>
          `;
        }).join('')}
      </tr>
    `;
  }

  /**
   * Get nested object value by key path
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Format value based on type
   */
  static formatValue(value, type, suffix = '') {
    if (value == null) return '<span class="text-gray-400">N/A</span>';

    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'score':
        return `${value}/100`;
      case 'number':
        return `${value}${suffix}`;
      default:
        return value;
    }
  }

  /**
   * Find index of best value
   */
  static findBestValueIndex(values, type) {
    const validValues = values.map((v, i) => ({ value: v, index: i })).filter(v => v.value != null);

    if (validValues.length === 0) return -1;

    switch (type) {
      case 'currency': // Lower is better for price
        return validValues.reduce((best, current) =>
          current.value < best.value ? current : best
        ).index;

      case 'score':
      case 'number': // Higher is better
        return validValues.reduce((best, current) =>
          current.value > best.value ? current : best
        ).index;

      default:
        return -1; // Don't highlight text fields
    }
  }

  /**
   * Generate AI insights
   */
  static generateInsights(laptops) {
    const insights = [];

    // Price comparison
    const prices = laptops.map(l => l.price_MYR).filter(p => p != null);
    if (prices.length > 1) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const cheapestIndex = laptops.findIndex(l => l.price_MYR === minPrice);

      insights.push(`💰 <strong>Price range:</strong> ${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}. The ${laptops[cheapestIndex].brand} ${laptops[cheapestIndex].model} offers the most budget-friendly option.`);
    }

    // Performance comparison
    const scores = laptops.map(l => l.score_composite).filter(s => s != null);
    if (scores.length > 1) {
      const maxScore = Math.max(...scores);
      const bestIndex = laptops.findIndex(l => l.score_composite === maxScore);

      insights.push(`⭐ <strong>Best overall:</strong> ${laptops[bestIndex].brand} ${laptops[bestIndex].model} with a score of ${maxScore}/100.`);
    }

    // RAM comparison
    const ramValues = laptops.map(l => l.ram?.gb).filter(r => r != null);
    if (ramValues.length > 1 && new Set(ramValues).size > 1) {
      const maxRam = Math.max(...ramValues);
      insights.push(`💾 <strong>Memory:</strong> RAM ranges from ${Math.min(...ramValues)}GB to ${maxRam}GB. Higher RAM is better for multitasking.`);
    }

    // Storage comparison
    const storageValues = laptops.map(l => l.storage?.gb).filter(s => s != null);
    if (storageValues.length > 1 && new Set(storageValues).size > 1) {
      const maxStorage = Math.max(...storageValues);
      insights.push(`💿 <strong>Storage:</strong> Options range from ${Math.min(...storageValues)}GB to ${maxStorage}GB. Consider your storage needs carefully.`);
    }

    // Weight comparison
    const weights = laptops.map(l => l.weight?.kg).filter(w => w != null);
    if (weights.length > 1) {
      const minWeight = Math.min(...weights);
      const lightestIndex = laptops.findIndex(l => l.weight?.kg === minWeight);

      if (minWeight < 1.5) {
        insights.push(`🎒 <strong>Portability:</strong> ${laptops[lightestIndex].brand} ${laptops[lightestIndex].model} is the lightest at ${minWeight}kg - great for travel!`);
      }
    }

    return insights.length > 0
      ? insights.map(i => `<p>• ${i}</p>`).join('')
      : '<p>Select more laptops to see detailed comparison insights.</p>';
  }

  /**
   * Create empty state
   */
  static createEmptyState() {
    const container = document.createElement('div');
    container.className = 'bg-white rounded-lg shadow-lg p-12 text-center';

    container.innerHTML = `
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-2xl font-bold text-gray-900 mb-2">No Laptops to Compare</h3>
      <p class="text-gray-600 mb-6">Select at least 2 laptops to start comparing specs side-by-side.</p>
      <a href="/sections/explorer.html" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
        Browse Laptops
      </a>
    `;

    return container;
  }
}

export default ComparisonTable;
