/**
 * Versus Module
 * 2-way and 3-way laptop comparison with radar chart
 */

import { apiClient } from '../shared/utils/api.mjs';
import { formatPrice } from '../shared/utils/formatters.mjs';

export class Versus {
  constructor() {
    this.selectedLaptops = [];
    this.maxSelections = 2; // 2-way for free, 3-way for Pro
    this.comparisonData = null;
  }

  /**
   * Set max selections based on user tier
   */
  setTier(tier) {
    this.maxSelections = tier === 'free' ? 2 : 3;
  }

  /**
   * Add laptop to comparison
   */
  addLaptop(laptop) {
    if (this.selectedLaptops.length >= this.maxSelections) {
      throw new Error(`Maximum ${this.maxSelections} laptops allowed for your tier`);
    }

    // Check if already added
    if (this.selectedLaptops.find(l => l.id === laptop.id)) {
      throw new Error('Laptop already in comparison');
    }

    this.selectedLaptops.push(laptop);
    return this.selectedLaptops;
  }

  /**
   * Remove laptop from comparison
   */
  removeLaptop(laptopId) {
    this.selectedLaptops = this.selectedLaptops.filter(l => l.id !== laptopId);
    return this.selectedLaptops;
  }

  /**
   * Clear all selections
   */
  clear() {
    this.selectedLaptops = [];
    this.comparisonData = null;
  }

  /**
   * Get current selections
   */
  getSelections() {
    return this.selectedLaptops;
  }

  /**
   * Check if ready to compare
   */
  isReady() {
    return this.selectedLaptops.length >= 2;
  }

  /**
   * Generate comparison data
   */
  async compare() {
    if (!this.isReady()) {
      throw new Error('Need at least 2 laptops to compare');
    }

    try {
      // Call API for AI-powered insights
      const response = await apiClient.post('/api/versus/compare', {
        laptopIds: this.selectedLaptops.map(l => l.id),
      });

      this.comparisonData = {
        laptops: this.selectedLaptops,
        specs: this.buildSpecComparison(),
        radar: this.buildRadarData(),
        insights: response.data?.insights || [],
        winner: this.determineWinner(),
      };

      return this.comparisonData;
    } catch (error) {
      console.error('Comparison failed:', error);

      // Fallback to local comparison
      this.comparisonData = {
        laptops: this.selectedLaptops,
        specs: this.buildSpecComparison(),
        radar: this.buildRadarData(),
        insights: [],
        winner: this.determineWinner(),
      };

      return this.comparisonData;
    }
  }

  /**
   * Build spec-by-spec comparison table
   */
  buildSpecComparison() {
    const categories = [
      {
        name: 'Processor',
        specs: ['cpu', 'cores', 'threads', 'baseFrequency', 'boostFrequency'],
      },
      {
        name: 'Graphics',
        specs: ['gpu', 'vram', 'gpuType'],
      },
      {
        name: 'Memory & Storage',
        specs: ['ram', 'ramType', 'storage', 'storageType'],
      },
      {
        name: 'Display',
        specs: ['displaySize', 'resolution', 'refreshRate', 'brightness', 'colorGamut'],
      },
      {
        name: 'Battery & Portability',
        specs: ['batteryCapacity', 'batteryLife', 'weight', 'dimensions'],
      },
      {
        name: 'Connectivity',
        specs: ['usb', 'thunderbolt', 'hdmi', 'wifi', 'bluetooth'],
      },
      {
        name: 'Price & Value',
        specs: ['price', 'valueScore', 'availability'],
      },
    ];

    return categories.map(category => ({
      name: category.name,
      rows: category.specs.map(spec => ({
        spec,
        label: this.getSpecLabel(spec),
        values: this.selectedLaptops.map(laptop => this.getSpecValue(laptop, spec)),
        winner: this.findWinnerForSpec(spec),
      })),
    }));
  }

  /**
   * Build radar chart data
   */
  buildRadarData() {
    const dimensions = [
      { id: 'ai', label: 'AI/ML', weight: 1.0 },
      { id: 'gaming', label: 'Gaming', weight: 1.0 },
      { id: 'creative', label: 'Creative', weight: 1.0 },
      { id: 'value', label: 'Value', weight: 1.0 },
      { id: 'portability', label: 'Portability', weight: 1.0 },
      { id: 'battery', label: 'Battery', weight: 1.0 },
    ];

    return {
      dimensions,
      datasets: this.selectedLaptops.map(laptop => ({
        label: laptop.model,
        data: dimensions.map(dim => this.calculateDimensionScore(laptop, dim.id)),
        color: this.getLaptopColor(laptop),
      })),
    };
  }

  /**
   * Calculate score for a dimension (0-100)
   */
  calculateDimensionScore(laptop, dimension) {
    const specs = laptop.specs || {};

    switch (dimension) {
      case 'ai':
        return this.calculateAIScore(specs);
      case 'gaming':
        return this.calculateGamingScore(specs);
      case 'creative':
        return this.calculateCreativeScore(specs);
      case 'value':
        return laptop.valueScore || 50;
      case 'portability':
        return this.calculatePortabilityScore(specs);
      case 'battery':
        return this.calculateBatteryScore(specs);
      default:
        return 50;
    }
  }

  calculateAIScore(specs) {
    let score = 0;
    if (specs.ram >= 32) score += 30;
    else if (specs.ram >= 16) score += 20;
    if (specs.gpu?.includes('RTX')) score += 40;
    if (specs.cores >= 8) score += 20;
    if (specs.storage >= 512) score += 10;
    return Math.min(100, score);
  }

  calculateGamingScore(specs) {
    let score = 0;
    if (specs.gpu?.includes('RTX 4090')) score += 50;
    else if (specs.gpu?.includes('RTX 4080')) score += 45;
    else if (specs.gpu?.includes('RTX 4070')) score += 40;
    else if (specs.gpu?.includes('RTX 4060')) score += 30;
    if (specs.refreshRate >= 144) score += 30;
    if (specs.ram >= 16) score += 20;
    return Math.min(100, score);
  }

  calculateCreativeScore(specs) {
    let score = 0;
    if (specs.ram >= 32) score += 30;
    if (specs.gpu?.includes('RTX')) score += 30;
    if (specs.colorGamut >= 90) score += 20;
    if (specs.resolution?.includes('4K')) score += 20;
    return Math.min(100, score);
  }

  calculatePortabilityScore(specs) {
    let score = 100;
    if (specs.weight > 2.5) score -= 40;
    else if (specs.weight > 2.0) score -= 30;
    else if (specs.weight > 1.5) score -= 20;
    else if (specs.weight > 1.0) score -= 10;
    return Math.max(0, score);
  }

  calculateBatteryScore(specs) {
    const batteryLife = specs.batteryLife || 0;
    return Math.min(100, (batteryLife / 15) * 100);
  }

  /**
   * Determine overall winner
   */
  determineWinner() {
    // Simple scoring based on radar chart averages
    const scores = this.selectedLaptops.map(laptop => {
      const radarData = this.buildRadarData();
      const dataset = radarData.datasets.find(d => d.label === laptop.model);
      const avg = dataset.data.reduce((sum, val) => sum + val, 0) / dataset.data.length;
      return { laptop, score: avg };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0].laptop;
  }

  /**
   * Helper: Get spec label
   */
  getSpecLabel(spec) {
    const labels = {
      cpu: 'Processor',
      cores: 'Cores',
      threads: 'Threads',
      gpu: 'Graphics',
      ram: 'RAM',
      storage: 'Storage',
      displaySize: 'Display Size',
      resolution: 'Resolution',
      refreshRate: 'Refresh Rate',
      batteryLife: 'Battery Life',
      weight: 'Weight',
      price: 'Price',
      valueScore: 'Value Score',
    };
    return labels[spec] || spec;
  }

  /**
   * Helper: Get spec value from laptop
   */
  getSpecValue(laptop, spec) {
    if (spec === 'price') return formatPrice(laptop.price);
    return laptop.specs?.[spec] || laptop[spec] || 'N/A';
  }

  /**
   * Helper: Find winner for specific spec
   */
  findWinnerForSpec(spec) {
    // Logic to determine which laptop "wins" this spec
    // Returns index of winning laptop or null for tie
    return 0; // Simplified
  }

  /**
   * Helper: Get color for laptop dataset
   */
  getLaptopColor(laptop) {
    const colors = ['#D83F87', '#00F0FF', '#FFB800'];
    const index = this.selectedLaptops.indexOf(laptop);
    return colors[index] || '#FFFFFF';
  }

  /**
   * Export comparison as markdown
   */
  exportMarkdown() {
    if (!this.comparisonData) {
      throw new Error('No comparison data to export');
    }

    let md = '# Laptop Comparison\n\n';
    md += `**Generated:** ${new Date().toISOString()}\n\n`;

    // Laptops being compared
    md += '## Laptops\n\n';
    this.selectedLaptops.forEach((laptop, i) => {
      md += `${i + 1}. **${laptop.brand} ${laptop.model}** - ${formatPrice(laptop.price)}\n`;
    });
    md += '\n';

    // Spec comparison
    md += '## Specifications\n\n';
    this.comparisonData.specs.forEach(category => {
      md += `### ${category.name}\n\n`;
      md += '| Spec | ' + this.selectedLaptops.map(l => l.model).join(' | ') + ' |\n';
      md += '|------|' + this.selectedLaptops.map(() => '-----').join('|') + '|\n';
      category.rows.forEach(row => {
        md += `| ${row.label} | ${row.values.join(' | ')} |\n`;
      });
      md += '\n';
    });

    // Winner
    if (this.comparisonData.winner) {
      md += `## Winner\n\n**${this.comparisonData.winner.brand} ${this.comparisonData.winner.model}**\n\n`;
    }

    md += '\n---\n\n_Powered by AI Bradaa • www.aibradaa.com_\n';

    return md;
  }
}

export default Versus;
