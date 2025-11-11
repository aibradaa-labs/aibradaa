/**
 * AI POD - CENTRALIZED CONFIGURATION
 * Single source of truth for all AI-related functionality
 *
 * This file centralizes configuration for:
 * - Gemini AI integration
 * - Auto-fetch systems (catchphrases, laptops, intel, etc.)
 * - 84-Mentor governance
 * - TOON format optimization
 * - Multi-category expansion support
 *
 * @module ai_pod/config
 */

// ============================================================================
// GEMINI AI CONFIGURATION
// ============================================================================

export const GEMINI_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  fallbackModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,

  // Safety settings
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ],

  // Rate limiting
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerDay: 1500,
    backoffMultiplier: 2,
    maxRetries: 3,
  },
};

// ============================================================================
// AUTO-FETCH CONFIGURATION (MULTI-CATEGORY)
// ============================================================================

export const AUTO_FETCH_CONFIG = {
  // Laptop database auto-fetch
  laptops: {
    enabled: true,
    schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM MYT
    featuredCount: 100, // Top 100 featured laptops (shortlisted)
    rotationStrategy: 'featured-catalog', // NEVER delete - grow database over time
    minScore: 7.5, // Minimum composite score for featured list
    neverDelete: true, // CRITICAL: Database grows over time, never remove laptops
    catalogStrategy: {
      featured: 'data/laptops.json', // Top 100 featured (shortlisted for main recommendations)
      extended: 'data/laptops-extended.json', // All other laptops (still accessible by AI Bradaa)
      fullCatalog: 'data/laptops-full.json', // Complete catalog (featured + extended)
    },
    sources: [
      {
        name: 'Lazada Malaysia',
        url: 'https://www.lazada.com.my/shop-laptops/',
        priority: 1,
        selectors: { /* scraping config */ },
      },
      {
        name: 'Shopee Malaysia',
        url: 'https://shopee.com.my/Laptops-cat.11043248',
        priority: 2,
        selectors: { /* scraping config */ },
      },
    ],
    enrichment: {
      geminiSpecs: true, // Use Gemini to enrich specs
      priceTracking: true,
      reviewSentiment: true,
    },
    filters: {
      minLaunchDate: '2024-01-01', // Not older than 1 year for featured list
      compatibilityYears: 4, // Must be compatible for 4+ years
      excludeBrands: [], // No exclusions
      minRating: 4.0,
    },
  },

  // Catchphrases auto-fetch (existing)
  catchphrases: {
    enabled: true,
    schedule: '0 3 * * *', // Daily at 3 AM MYT
    maxPerRun: 100,
    sources: [
      { name: 'One Piece API', url: 'https://api.api-onepiece.com/v2/characters/en' },
      { name: 'AnimeChan', url: 'https://animechan.xyz/api/quotes/anime?title=one%20piece' },
    ],
    paraphrasing: {
      geminiEnabled: true,
      manglishConversion: true,
      toneVariations: ['serious', 'playful', 'motivational'],
    },
  },

  // Intel/News auto-fetch
  intel: {
    enabled: true,
    schedule: '0 */6 * * *', // Every 6 hours
    maxEntries: 50,
    sources: [
      { name: 'TechCrunch', url: 'https://techcrunch.com/category/laptops/' },
      { name: 'The Verge', url: 'https://www.theverge.com/laptops' },
      { name: 'Lowyat.NET', url: 'https://www.lowyat.net/category/notebooks/' },
    ],
    categories: ['launches', 'reviews', 'deals', 'tech-news'],
  },

  // Future expansion: Cameras
  cameras: {
    enabled: false, // Not yet implemented
    schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM MYT
    maxEntries: 100,
    rotationStrategy: 'score-based',
    filters: {
      minLaunchDate: '2024-01-01',
      compatibilityYears: 4,
    },
  },

  // Future expansion: Smartphones
  smartphones: {
    enabled: false,
    schedule: '0 2 * * 0',
    maxEntries: 100,
    rotationStrategy: 'score-based',
  },

  // Future expansion: Gadgets
  gadgets: {
    enabled: false,
    schedule: '0 2 * * 0',
    maxEntries: 100,
    rotationStrategy: 'score-based',
  },
};

// ============================================================================
// BENCHMARKING & SCORING SYSTEM
// ============================================================================

export const SCORING_CONFIG = {
  // Laptop scoring weights
  laptops: {
    weights: {
      performance: 0.25,      // CPU/GPU benchmarks
      value: 0.20,            // Price-to-performance ratio
      buildQuality: 0.15,     // Materials, durability
      displayQuality: 0.12,   // Resolution, color accuracy, refresh rate
      batteryLife: 0.10,      // Hours of real-world usage
      portability: 0.08,      // Weight, thickness
      upgradeability: 0.05,   // RAM/storage expansion
      futureProof: 0.05,      // Tech compatibility (Wi-Fi 6E, TB4, etc.)
    },

    // Performance benchmarks
    benchmarks: {
      cpuSingleCore: { weight: 0.4, source: 'Geekbench 6' },
      cpuMultiCore: { weight: 0.3, source: 'Geekbench 6' },
      gpuCompute: { weight: 0.3, source: '3DMark Time Spy' },
    },

    // Value calculation
    valueFormula: '(performanceScore / price) * 10000',

    // Future-proofing criteria
    futureProofChecks: [
      { feature: 'WiFi 6E or WiFi 7', points: 1.0 },
      { feature: 'Thunderbolt 4', points: 0.8 },
      { feature: 'DDR5 RAM', points: 0.7 },
      { feature: 'PCIe 4.0 SSD', points: 0.6 },
      { feature: 'USB 4.0', points: 0.5 },
    ],
  },
};

// ============================================================================
// 84-MENTOR GOVERNANCE
// ============================================================================

export const MENTOR_CONFIG = {
  enabled: true,
  compositeScoreThreshold: 99, // Minimum for production deployment

  // Decision routing
  routing: {
    strategyDecisions: ['Buffett', 'Munger', 'Taleb', 'Thiel'],
    technicalDecisions: ['Sutskever', 'Hinton', 'Ng', 'LeCun'],
    productDecisions: ['Bezos', 'Cagan', 'Jobs', 'Ive'],
    safetyDecisions: ['Hinton', 'Anthropic', 'OpenAI Safety'],
  },

  // Auto-consultation thresholds
  autoConsult: {
    majorFeature: true,      // Consult mentors for major features
    breakingChange: true,    // Consult for breaking changes
    securityIssue: true,     // Always consult for security
    costOverage: true,       // Consult if cost > threshold
  },
};

// ============================================================================
// TOON FORMAT OPTIMIZATION
// ============================================================================

export const TOON_CONFIG = {
  enabled: true,
  tokenSavingsTarget: 0.40, // 40% token reduction vs JSON

  // Compression rules
  compression: {
    abbreviations: true,
    symbolEncoding: true,
    hierarchicalNesting: true,
  },

  // Usage contexts
  contexts: {
    mentorExchange: true,    // Use TOON for mentor communications
    llmResponses: true,       // Use TOON for LLM outputs
    dataStorage: false,       // Don't use TOON for permanent storage
  },
};

// ============================================================================
// DATABASE ROTATION CONFIGURATION
// ============================================================================

export const ROTATION_CONFIG = {
  laptops: {
    featuredCount: 100, // Top 100 featured in main catalog
    strategy: 'featured-catalog', // Featured + Extended (NEVER delete)
    neverDelete: true, // CRITICAL: Database grows over time

    // Featured list criteria (top 100 shortlisted)
    featuredCriteria: {
      minScoreThreshold: 7.5,
      ageBonus: 0.1, // Bonus for newer laptops
      popularityBonus: 0.05, // Bonus for highly viewed/compared
    },

    // Extended catalog (moved from featured, but still accessible)
    extendedCatalog: {
      enabled: true,
      destination: 'data/laptops-extended.json',
      keepForever: true, // NEVER delete from extended catalog
      aiAccessible: true, // AI Bradaa can still query based on relevance
    },

    // Full catalog (featured + extended combined)
    fullCatalog: {
      enabled: true,
      destination: 'data/laptops-full.json',
      rebuildOnRotation: true, // Rebuild full catalog after each rotation
    },

    // Legacy archive (for historical tracking only)
    archive: {
      enabled: true,
      destination: 'data/archive.json',
      trackMovements: true, // Track when laptops move from featured to extended
      retentionDays: null, // Keep forever
    },
  },
};

// ============================================================================
// EXPORT ALL CONFIGS
// ============================================================================

export default {
  gemini: GEMINI_CONFIG,
  autoFetch: AUTO_FETCH_CONFIG,
  scoring: SCORING_CONFIG,
  mentors: MENTOR_CONFIG,
  toon: TOON_CONFIG,
  rotation: ROTATION_CONFIG,
};
