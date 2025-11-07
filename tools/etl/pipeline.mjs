#!/usr/bin/env node

/**
 * AI Bradaa - ETL Pipeline
 *
 * Main ETL orchestrator for laptop data ingestion
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

console.log(`
╔═══════════════════════════════════════════════════════════╗
║            📊 AI Bradaa ETL Pipeline                      ║
╚═══════════════════════════════════════════════════════════╝
`);

class ETLPipeline {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      fetched: 0,
      transformed: 0,
      loaded: 0,
      quarantined: 0,
      errors: []
    };
  }

  async run() {
    try {
      console.log('🚀 Starting ETL pipeline...\n');

      // 1. Fetch
      console.log('📥 PHASE 1: FETCH');
      await this.fetch();

      // 2. Transform
      console.log('\n🔄 PHASE 2: TRANSFORM');
      await this.transform();

      // 3. Validate
      console.log('\n✅ PHASE 3: VALIDATE');
      await this.validate();

      // 4. Load
      console.log('\n💾 PHASE 4: LOAD');
      await this.load();

      // 5. Report
      console.log('\n📊 PHASE 5: REPORT');
      await this.generateReport();

      this.printSummary();
    } catch (error) {
      console.error('❌ ETL Pipeline failed:', error);
      process.exit(1);
    }
  }

  async fetch() {
    console.log('  → Fetching from Shopee...');
    const shopeeData = await this.fetchShopee();
    this.stats.fetched += shopeeData.length;

    console.log('  → Fetching from Lazada...');
    const lazadaData = await this.fetchLazada();
    this.stats.fetched += lazadaData.length;

    console.log('  → Fetching from OEM sites...');
    const oemData = await this.fetchOEM();
    this.stats.fetched += oemData.length;

    console.log(`  ✓ Fetched ${this.stats.fetched} items`);

    // Store raw data
    this.rawData = [...shopeeData, ...lazadaData, ...oemData];
  }

  async fetchShopee() {
    // Placeholder: In production, this would scrape/call Shopee API
    console.log('    • Shopee: Placeholder (0 items)');
    return [];
  }

  async fetchLazada() {
    // Placeholder: In production, this would scrape/call Lazada API
    console.log('    • Lazada: Placeholder (0 items)');
    return [];
  }

  async fetchOEM() {
    // Placeholder: In production, this would scrape OEM sites
    console.log('    • OEM: Placeholder (0 items)');
    return [];
  }

  async transform() {
    console.log('  → Normalizing data format...');
    this.transformedData = this.rawData.map(item => this.normalizeItem(item));

    console.log('  → Enriching with metadata...');
    this.transformedData = this.transformedData.map(item => this.enrichItem(item));

    console.log('  → Deduplicating...');
    this.transformedData = this.deduplicate(this.transformedData);

    this.stats.transformed = this.transformedData.length;
    console.log(`  ✓ Transformed ${this.stats.transformed} items`);
  }

  normalizeItem(item) {
    // Normalize different source formats to standard schema
    return {
      id: item.id || `temp-${Date.now()}-${Math.random()}`,
      brand: item.brand?.toLowerCase(),
      model: item.model || item.name,
      price: parseFloat(item.price) || 0,
      specs: {
        cpu: item.cpu || item.processor,
        gpu: item.gpu || item.graphics,
        ram: parseInt(item.ram) || 8,
        storage: parseInt(item.storage) || 256
      },
      source: item.source,
      lastUpdated: new Date().toISOString()
    };
  }

  enrichItem(item) {
    // Add computed fields, scores, etc.
    return {
      ...item,
      segment: this.detectSegment(item),
      score: this.calculateScore(item)
    };
  }

  detectSegment(item) {
    // Simple segment detection logic
    if (item.specs.gpu && item.specs.gpu.includes('RTX')) {
      return 'gaming';
    }
    if (item.brand === 'apple') {
      return 'ultrabook';
    }
    if (item.price < 3000) {
      return 'budget';
    }
    return 'business';
  }

  calculateScore(item) {
    // Simple scoring logic
    let score = 50;
    if (item.specs.ram >= 16) score += 15;
    if (item.specs.storage >= 512) score += 10;
    if (item.specs.gpu) score += 20;
    return Math.min(score, 100);
  }

  deduplicate(items) {
    const seen = new Set();
    return items.filter(item => {
      const key = `${item.brand}-${item.model}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async validate() {
    console.log('  → Validating against schema...');

    this.validData = [];
    this.quarantinedData = [];

    for (const item of this.transformedData) {
      if (this.isValid(item)) {
        this.validData.push(item);
      } else {
        this.quarantinedData.push({
          ...item,
          quarantineReason: this.getValidationErrors(item),
          quarantinedAt: new Date().toISOString()
        });
        this.stats.quarantined++;
      }
    }

    console.log(`  ✓ Valid: ${this.validData.length}, Quarantined: ${this.quarantinedData.length}`);
  }

  isValid(item) {
    return (
      item.brand &&
      item.model &&
      item.price > 0 &&
      item.specs.cpu &&
      item.specs.ram > 0 &&
      item.specs.storage > 0
    );
  }

  getValidationErrors(item) {
    const errors = [];
    if (!item.brand) errors.push('missing-brand');
    if (!item.model) errors.push('missing-model');
    if (!item.price || item.price <= 0) errors.push('invalid-price');
    if (!item.specs.cpu) errors.push('missing-cpu');
    if (!item.specs.ram || item.specs.ram <= 0) errors.push('invalid-ram');
    if (!item.specs.storage || item.specs.storage <= 0) errors.push('invalid-storage');
    return errors;
  }

  async load() {
    console.log('  → Loading to data/laptops.json...');

    // Load existing data
    const laptopsPath = join(ROOT, 'data', 'laptops.json');
    let existingData = { catalog: {}, laptops: [] };

    try {
      const content = await fs.readFile(laptopsPath, 'utf-8');
      existingData = JSON.parse(content);
    } catch (error) {
      console.log('    • No existing data, creating new file');
    }

    // Merge new data (simple append for now, in production would handle updates)
    const mergedLaptops = [...existingData.laptops, ...this.validData];

    // Update catalog metadata
    const updatedData = {
      catalog: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalLaptops: mergedLaptops.length,
        currency: 'MYR',
        notes: `ETL run on ${new Date().toISOString()}`
      },
      laptops: mergedLaptops
    };

    await fs.writeFile(laptopsPath, JSON.stringify(updatedData, null, 2));
    this.stats.loaded = this.validData.length;

    // Save quarantined items
    if (this.quarantinedData.length > 0) {
      console.log('  → Saving quarantined items...');
      const quarantinePath = join(ROOT, 'data', 'quarantine.json');

      let quarantineData = { quarantine: {}, entries: [] };
      try {
        const content = await fs.readFile(quarantinePath, 'utf-8');
        quarantineData = JSON.parse(content);
      } catch (error) {
        // File doesn't exist or is invalid
      }

      quarantineData.entries = [
        ...quarantineData.entries,
        ...this.quarantinedData.map((item, index) => ({
          id: `quarantine-${Date.now()}-${index}`,
          laptopId: item.id,
          brand: item.brand,
          model: item.model,
          quarantineDate: item.quarantinedAt,
          reason: item.quarantineReason.join(', '),
          details: { ...item },
          status: 'pending-review'
        }))
      ];

      quarantineData.quarantine = {
        description: 'Failed data quality checks',
        lastUpdated: new Date().toISOString(),
        totalQuarantined: quarantineData.entries.length
      };

      await fs.writeFile(quarantinePath, JSON.stringify(quarantineData, null, 2));
    }

    console.log(`  ✓ Loaded ${this.stats.loaded} items`);
  }

  async generateReport() {
    const report = {
      id: `report-${new Date().toISOString().split('T')[0]}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      pipeline: {
        status: this.stats.errors.length > 0 ? 'partial' : 'success',
        duration: `${Math.round((Date.now() - this.stats.startTime) / 1000)}s`,
        stages: {
          fetch: {
            status: 'success',
            itemsFetched: this.stats.fetched
          },
          transform: {
            status: 'success',
            itemsTransformed: this.stats.transformed
          },
          validate: {
            status: 'success',
            itemsValidated: this.stats.transformed,
            itemsPassed: this.validData.length,
            itemsFailed: this.stats.quarantined
          },
          load: {
            status: 'success',
            itemsLoaded: this.stats.loaded
          }
        }
      },
      summary: {
        totalFetched: this.stats.fetched,
        totalTransformed: this.stats.transformed,
        totalLoaded: this.stats.loaded,
        totalQuarantined: this.stats.quarantined
      }
    };

    const reportsPath = join(ROOT, 'data', 'reports.json');

    let reportsData = { reports: {}, latest: {}, history: [] };
    try {
      const content = await fs.readFile(reportsPath, 'utf-8');
      reportsData = JSON.parse(content);
    } catch (error) {
      // File doesn't exist
    }

    reportsData.latest = report;
    reportsData.history = [report, ...reportsData.history.slice(0, 9)]; // Keep last 10

    await fs.writeFile(reportsPath, JSON.stringify(reportsData, null, 2));

    console.log('  ✓ Report saved to data/reports.json');
  }

  printSummary() {
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000);

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  ✅ ETL Pipeline Complete                 ║
╚═══════════════════════════════════════════════════════════╝

  📊 Summary:
  ─────────────────────────────────────────────────────────
  • Fetched:      ${this.stats.fetched} items
  • Transformed:  ${this.stats.transformed} items
  • Loaded:       ${this.stats.loaded} items
  • Quarantined:  ${this.stats.quarantined} items
  • Duration:     ${duration}s

  📁 Output Files:
  ─────────────────────────────────────────────────────────
  • data/laptops.json
  • data/quarantine.json
  • data/reports.json

  ${this.stats.errors.length > 0 ? `
  ⚠️  Errors: ${this.stats.errors.length}
  ${this.stats.errors.map(e => `  • ${e}`).join('\n')}
  ` : ''}
`);
  }
}

// Run pipeline
const pipeline = new ETLPipeline();
pipeline.run();
