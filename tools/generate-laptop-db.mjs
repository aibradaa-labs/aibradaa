/**
 * Laptop Database Generator
 * Generates 90 realistic Malaysian laptop entries for AI Bradaa
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Malaysian retailers for availability
const RETAILERS = {
  shopee: { platform: 'shopee', seller: 'Official Store', rating: 4.7 },
  lazada: { platform: 'lazada', seller: 'Malaysia', rating: 4.6 },
  direct: { platform: 'direct', seller: 'Malaysia', rating: 4.9 }
};

// Laptop segments and configurations
const SEGMENTS = {
  gaming: {
    tiers: ['budget', 'midrange', 'premium', 'flagship'],
    count: 25
  },
  ultrabook: {
    tiers: ['budget', 'midrange', 'premium'],
    count: 20
  },
  business: {
    tiers: ['midrange', 'premium'],
    count: 15
  },
  creative: {
    tiers: ['midrange', 'premium', 'flagship'],
    count: 15
  },
  student: {
    tiers: ['budget', 'midrange'],
    count: 10
  },
  workstation: {
    tiers: ['premium', 'flagship'],
    count: 5
  }
};

// Brand configurations for Malaysian market
const BRANDS = {
  // Gaming brands
  asus: { name: 'ASUS', series: ['ROG', 'TUF', 'VivoBook'], segments: ['gaming', 'ultrabook', 'student'] },
  acer: { name: 'Acer', series: ['Nitro', 'Predator', 'Swift', 'Aspire'], segments: ['gaming', 'ultrabook', 'student'] },
  msi: { name: 'MSI', series: ['Raider', 'Stealth', 'Cyborg', 'Katana'], segments: ['gaming', 'creative'] },
  gigabyte: { name: 'Gigabyte', series: ['AORUS', 'AERO'], segments: ['gaming', 'creative'] },

  // Premium brands
  apple: { name: 'Apple', series: ['MacBook Pro', 'MacBook Air'], segments: ['ultrabook', 'creative', 'business'] },
  dell: { name: 'Dell', series: ['XPS', 'Inspiron', 'Precision'], segments: ['ultrabook', 'creative', 'workstation'] },
  hp: { name: 'HP', series: ['Spectre', 'Envy', 'Pavilion', 'ZBook'], segments: ['ultrabook', 'creative', 'workstation'] },

  // Business brands
  lenovo: { name: 'Lenovo', series: ['ThinkPad', 'ThinkBook', 'IdeaPad', 'Legion'], segments: ['business', 'ultrabook', 'gaming'] },
  microsoft: { name: 'Microsoft', series: ['Surface Laptop', 'Surface Pro'], segments: ['business', 'ultrabook'] },

  // Budget brands
  huawei: { name: 'Huawei', series: ['MateBook'], segments: ['student', 'ultrabook'] },
  xiaomi: { name: 'Xiaomi', series: ['RedmiBook', 'Mi Notebook'], segments: ['student', 'ultrabook'] },
  lg: { name: 'LG', series: ['Gram'], segments: ['ultrabook', 'business'] },
  samsung: { name: 'Samsung', series: ['Galaxy Book'], segments: ['ultrabook', 'business'] }
};

// CPU configurations
const CPUS = {
  budget: [
    { brand: 'Intel', model: 'Core i3-1215U', gen: 12, cores: 6, threads: 8, baseClock: 1.2, boostClock: 4.4, tdp: 15 },
    { brand: 'Intel', model: 'Core i5-1235U', gen: 12, cores: 10, threads: 12, baseClock: 1.3, boostClock: 4.4, tdp: 15 },
    { brand: 'AMD', model: 'Ryzen 5 5625U', gen: 5, cores: 6, threads: 12, baseClock: 2.3, boostClock: 4.3, tdp: 15 },
    { brand: 'AMD', model: 'Ryzen 3 7320U', gen: 7, cores: 4, threads: 8, baseClock: 2.4, boostClock: 4.1, tdp: 15 }
  ],
  midrange: [
    { brand: 'Intel', model: 'Core i5-12500H', gen: 12, cores: 12, threads: 16, baseClock: 2.5, boostClock: 4.5, tdp: 45 },
    { brand: 'Intel', model: 'Core i7-12700H', gen: 12, cores: 14, threads: 20, baseClock: 2.3, boostClock: 4.7, tdp: 45 },
    { brand: 'AMD', model: 'Ryzen 5 7535HS', gen: 7, cores: 6, threads: 12, baseClock: 3.3, boostClock: 4.5, tdp: 35 },
    { brand: 'AMD', model: 'Ryzen 7 7735HS', gen: 7, cores: 8, threads: 16, baseClock: 3.2, boostClock: 4.7, tdp: 35 }
  ],
  premium: [
    { brand: 'Intel', model: 'Core i7-13700H', gen: 13, cores: 14, threads: 20, baseClock: 2.4, boostClock: 5.0, tdp: 45 },
    { brand: 'Intel', model: 'Core i9-13900H', gen: 13, cores: 14, threads: 20, baseClock: 2.6, boostClock: 5.4, tdp: 45 },
    { brand: 'AMD', model: 'Ryzen 7 7840HS', gen: 7, cores: 8, threads: 16, baseClock: 3.8, boostClock: 5.1, tdp: 35 },
    { brand: 'AMD', model: 'Ryzen 9 7940HS', gen: 7, cores: 8, threads: 16, baseClock: 4.0, boostClock: 5.2, tdp: 35 },
    { brand: 'Apple', model: 'M3', gen: 3, cores: 8, performanceCores: 4, efficiencyCores: 4, neuralEngine: '16-core' }
  ],
  flagship: [
    { brand: 'Intel', model: 'Core i9-13980HX', gen: 13, cores: 24, threads: 32, baseClock: 2.2, boostClock: 5.6, tdp: 55 },
    { brand: 'AMD', model: 'Ryzen 9 7945HX', gen: 7, cores: 16, threads: 32, baseClock: 2.5, boostClock: 5.4, tdp: 55 },
    { brand: 'Apple', model: 'M3 Max', gen: 3, cores: 16, performanceCores: 12, efficiencyCores: 4, neuralEngine: '16-core' }
  ]
};

// GPU configurations
const GPUS = {
  integrated: [
    { brand: 'Intel', model: 'Iris Xe', integrated: true },
    { brand: 'Intel', model: 'UHD Graphics', integrated: true },
    { brand: 'AMD', model: 'Radeon 680M', integrated: true },
    { brand: 'Apple', model: 'M3 (10-core GPU)', vram: 'shared', integrated: true }
  ],
  budget: [
    { brand: 'NVIDIA', model: 'GeForce GTX 1650', vram: 4, type: 'Laptop', tdp: 50 },
    { brand: 'NVIDIA', model: 'GeForce RTX 3050', vram: 4, type: 'Laptop', tdp: 75 },
    { brand: 'AMD', model: 'Radeon RX 6500M', vram: 4, type: 'Laptop', tdp: 50 }
  ],
  midrange: [
    { brand: 'NVIDIA', model: 'GeForce RTX 4050', vram: 6, type: 'Laptop', tdp: 115 },
    { brand: 'NVIDIA', model: 'GeForce RTX 4060', vram: 8, type: 'Laptop', tdp: 140 },
    { brand: 'AMD', model: 'Radeon RX 7600M', vram: 8, type: 'Laptop', tdp: 100 }
  ],
  premium: [
    { brand: 'NVIDIA', model: 'GeForce RTX 4070', vram: 8, type: 'Laptop', tdp: 140 },
    { brand: 'NVIDIA', model: 'GeForce RTX 4080', vram: 12, type: 'Laptop', tdp: 175 },
    { brand: 'AMD', model: 'Radeon RX 7700M', vram: 12, type: 'Laptop', tdp: 120 }
  ],
  flagship: [
    { brand: 'NVIDIA', model: 'GeForce RTX 4090', vram: 16, type: 'Laptop', tdp: 175 },
    { brand: 'NVIDIA', model: 'GeForce RTX 4080', vram: 12, type: 'Laptop', tdp: 175 }
  ]
};

// Price ranges by tier (MYR)
const PRICE_RANGES = {
  budget: { min: 2000, max: 3500 },
  midrange: { min: 3500, max: 6000 },
  premium: { min: 6000, max: 10000 },
  flagship: { min: 10000, max: 18000 }
};

// Helper functions
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(tier) {
  const range = PRICE_RANGES[tier];
  const price = randomInt(range.min, range.max);
  // Round to nearest 99
  return Math.round(price / 100) * 100 - 1;
}

function generateLaptopId(brand, series, index) {
  const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
  const seriesSlug = series.toLowerCase().replace(/\s+/g, '-');
  return `${brandSlug}-${seriesSlug}-${String(index).padStart(3, '0')}`;
}

/**
 * Generate laptop data
 */
function generateLaptop(index, segment, tier, brandKey) {
  const brand = BRANDS[brandKey];
  const series = randomFrom(brand.series);
  const cpu = randomFrom(CPUS[tier]);

  // Select GPU based on segment
  let gpu;
  if (segment === 'gaming' || segment === 'creative') {
    if (tier === 'budget') gpu = randomFrom(GPUS.budget);
    else if (tier === 'midrange') gpu = randomFrom(GPUS.midrange);
    else if (tier === 'premium') gpu = randomFrom(GPUS.premium);
    else gpu = randomFrom(GPUS.flagship);
  } else if (segment === 'workstation') {
    gpu = randomFrom([...GPUS.premium, ...GPUS.flagship]);
  } else {
    gpu = randomFrom(GPUS.integrated);
  }

  const price = randomPrice(tier);
  const discount = randomInt(0, 20);
  const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : price;

  // RAM based on tier
  const ramOptions = {
    budget: [8, 16],
    midrange: [16, 32],
    premium: [32, 64],
    flagship: [64, 128]
  };
  const ram = randomFrom(ramOptions[tier]);

  // Storage based on tier
  const storageOptions = {
    budget: [256, 512],
    midrange: [512, 1024],
    premium: [1024, 2048],
    flagship: [2048, 4096]
  };
  const storage = randomFrom(storageOptions[tier]);

  // Display specs based on segment
  const displaySize = segment === 'student' || segment === 'ultrabook'
    ? randomFrom([13.3, 14, 15.6])
    : segment === 'gaming'
    ? randomFrom([15.6, 16, 17.3])
    : randomFrom([14, 15.6, 16]);

  const refreshRate = (segment === 'gaming' && tier !== 'budget')
    ? randomFrom([120, 144, 165, 240, 300])
    : randomFrom([60, 90, 120]);

  const resolution = displaySize >= 16
    ? randomFrom(['2560x1600', '3456x2160', '3840x2400'])
    : randomFrom(['1920x1080', '2560x1600', '2880x1800']);

  const modelName = `${series} ${cpu.model.split(' ')[1]} ${tier.toUpperCase()}`;
  const sku = `${brandKey.toUpperCase()}-${randomInt(1000, 9999)}`;

  return {
    id: generateLaptopId(brandKey, series, index),
    brand: brandKey,
    brandName: brand.name,
    series,
    model: modelName,
    fullName: `${brand.name} ${modelName}`,
    sku,
    segment,
    tier,
    rank: index,
    rating: (4.0 + Math.random() * 1.0).toFixed(1) * 1,
    price,
    originalPrice,
    discount,
    specs: {
      cpu,
      gpu,
      ram,
      ramType: tier === 'budget' ? 'DDR4' : (brandKey === 'apple' ? 'Unified Memory' : 'DDR5'),
      ramSpeed: tier === 'budget' ? 3200 : 4800,
      ramSlots: brandKey === 'apple' ? undefined : 2,
      ramMax: brandKey === 'apple' ? undefined : ram * 2,
      ramUpgradable: brandKey !== 'apple',
      storage,
      storageType: 'NVMe SSD',
      storageSlots: brandKey === 'apple' ? undefined : 2,
      storageUpgradable: brandKey !== 'apple',
      display: {
        size: displaySize,
        resolution,
        refreshRate,
        panelType: tier === 'premium' || tier === 'flagship' ? randomFrom(['OLED', 'IPS', 'Mini-LED']) : 'IPS',
        brightness: tier === 'budget' ? randomInt(250, 350) : randomInt(400, 600),
        colorGamut: tier === 'budget' ? '72% NTSC' : '100% DCI-P3',
        features: tier === 'budget' ? ['Anti-glare'] : randomFrom([
          ['Dolby Vision', 'HDR400'],
          ['G-Sync', 'Adaptive Sync'],
          ['True Tone', 'P3 Wide Color']
        ])
      },
      battery: tier === 'budget' ? randomInt(45, 60) : randomInt(60, 100),
      batteryLife: segment === 'ultrabook' ? randomInt(12, 18) : randomInt(5, 10),
      weight: segment === 'ultrabook' ? (1.0 + Math.random() * 0.5).toFixed(2) * 1 : (2.0 + Math.random() * 0.8).toFixed(2) * 1,
      thickness: segment === 'ultrabook' ? randomInt(12, 18) : randomInt(18, 26),
      ports: generatePorts(segment, tier, brandKey),
      connectivity: {
        wifi: tier === 'budget' ? 'Wi-Fi 6' : 'Wi-Fi 6E',
        bluetooth: tier === 'budget' ? '5.1' : '5.3',
        ethernet: segment === 'gaming' || segment === 'workstation' ? '2.5G Ethernet' : undefined
      },
      keyboard: {
        type: segment === 'gaming' ? 'RGB backlit' : (tier === 'budget' ? 'White backlit' : 'Backlit keyboard'),
        numpad: displaySize >= 15.6,
        touchId: brandKey === 'apple'
      },
      webcam: tier === 'budget' ? '720p HD' : '1080p FHD',
      audio: tier === 'budget'
        ? '2x 2W speakers'
        : (segment === 'gaming' ? '4x 4W speakers, Dolby Atmos' : '4-speaker system, Dolby Atmos')
    },
    description: generateDescription(segment, tier, brand.name, modelName),
    images: {
      main: `/assets/laptops/${generateLaptopId(brandKey, series, index)}-main.jpg`,
      gallery: [
        `/assets/laptops/${generateLaptopId(brandKey, series, index)}-1.jpg`,
        `/assets/laptops/${generateLaptopId(brandKey, series, index)}-2.jpg`,
        `/assets/laptops/${generateLaptopId(brandKey, series, index)}-3.jpg`
      ]
    },
    pros: generatePros(segment, tier),
    cons: generateCons(segment, tier),
    useCases: generateUseCases(segment),
    tags: generateTags(segment, tier, cpu, gpu),
    availability: generateAvailability(price, brandKey),
    warranty: tier === 'budget' ? '1 year warranty' : (tier === 'premium' || tier === 'flagship' ? '3 years warranty' : '2 years warranty'),
    releaseDate: generateReleaseDate(),
    updatedAt: new Date().toISOString(),
    metadata: {
      views: randomInt(100, 10000),
      comparisons: randomInt(50, 2000),
      favorites: randomInt(10, 500),
      clicks: randomInt(100, 3000)
    }
  };
}

function generatePorts(segment, tier, brand) {
  if (brand === 'apple') {
    return {
      'usb-c': tier === 'budget' ? 2 : 3,
      'thunderbolt': tier === 'budget' ? 2 : 3,
      'magsafe': 1,
      'audio': 1
    };
  }

  const ports = {
    'usb-a': segment === 'ultrabook' ? randomInt(1, 2) : randomInt(2, 3),
    'usb-c': randomInt(1, 2),
    'hdmi': 1,
    'audio': 1
  };

  if (tier !== 'budget') {
    ports.thunderbolt = randomInt(1, 2);
  }

  if (segment === 'gaming' || segment === 'workstation') {
    ports.ethernet = 1;
  }

  if (segment === 'creative' || segment === 'workstation') {
    ports.sdCard = 1;
  }

  return ports;
}

function generateDescription(segment, tier, brand, model) {
  const templates = {
    gaming: `Powerful gaming laptop with ${tier} performance. Perfect for ${tier === 'budget' ? 'casual gaming' : 'AAA gaming'} and content creation.`,
    ultrabook: `Ultra-portable ${tier} laptop designed for professionals on the go. Excellent battery life and premium build quality.`,
    business: `Enterprise-grade laptop with comprehensive security features. Built for ${tier === 'premium' ? 'executives' : 'professionals'}.`,
    creative: `Professional creator laptop with powerful GPU and stunning display. Ideal for ${tier === 'flagship' ? 'professional' : 'aspiring'} creators.`,
    student: `Affordable laptop perfect for students. Great for productivity, online learning, and everyday tasks.`,
    workstation: `High-performance workstation laptop for demanding professional workflows. Built for CAD, 3D rendering, and data science.`
  };
  return templates[segment];
}

function generatePros(segment, tier) {
  const commonPros = {
    budget: ['Great value for money', 'Good for everyday tasks', 'Lightweight', 'Affordable'],
    midrange: ['Solid performance', 'Good build quality', 'Balanced features', 'Good value'],
    premium: ['Excellent performance', 'Premium build quality', 'Long battery life', 'Great display'],
    flagship: ['Top-tier performance', 'Best-in-class features', 'Premium materials', 'Cutting-edge technology']
  };

  const segmentPros = {
    gaming: ['Powerful GPU', 'High refresh rate', 'Good cooling'],
    ultrabook: ['Ultra-portable', 'Long battery life', 'Silent operation'],
    business: ['Enterprise security', 'Durable build', 'Professional support'],
    creative: ['Color-accurate display', 'Powerful GPU', 'Expandable storage'],
    student: ['Affordable', 'Portable', 'All-day battery'],
    workstation: ['Workstation GPU', 'ECC memory support', 'ISV certification']
  };

  return [
    ...randomFrom([commonPros[tier]]).slice(0, 3),
    ...randomFrom([segmentPros[segment]]).slice(0, 2)
  ].slice(0, 5);
}

function generateCons(segment, tier) {
  const commonCons = {
    budget: ['Basic build quality', 'Limited upgradeability', 'Average battery life', '720p webcam'],
    midrange: ['Some compromises', 'Not the latest tech', 'Average speakers'],
    premium: ['Expensive', 'May be overkill for casual use', 'Heavy'],
    flagship: ['Very expensive', 'Heavy', 'Loud fans under load', 'Overkill for most users']
  };

  return randomFrom([commonCons[tier]]).slice(0, randomInt(3, 4));
}

function generateUseCases(segment) {
  const useCases = {
    gaming: ['gaming', 'streaming', 'content-creation'],
    ultrabook: ['business', 'productivity', 'travel'],
    business: ['business', 'productivity', 'remote-work'],
    creative: ['video-editing', 'photo-editing', '3d-rendering', 'content-creation'],
    student: ['student', 'online-learning', 'productivity'],
    workstation: ['cad', '3d-modeling', 'data-science', 'engineering']
  };
  return useCases[segment];
}

function generateTags(segment, tier, cpu, gpu) {
  const tags = [segment, tier];

  if (cpu.brand === 'Intel') tags.push(`intel-gen${cpu.gen}`);
  else if (cpu.brand === 'AMD') tags.push(`ryzen-${cpu.gen}`);
  else if (cpu.brand === 'Apple') tags.push('apple-silicon');

  if (gpu.brand === 'NVIDIA' && gpu.model) {
    tags.push(gpu.model.toLowerCase().replace(/\s+/g, '-'));
  }

  return tags;
}

function generateAvailability(price, brand) {
  const inStock = Math.random() > 0.15; // 85% in stock
  const stockCount = inStock ? randomInt(3, 50) : 0;

  const sources = [];

  // Add brand official store
  const platformKey = randomFrom(['shopee', 'lazada']);
  const retailer = RETAILERS[platformKey];
  sources.push({
    platform: retailer.platform,
    url: `https://${retailer.platform}.com.my/product/${brand}-laptop-${randomInt(10000, 99999)}`,
    price: price,
    inStock: inStock,
    seller: `${BRANDS[brand].name} ${retailer.seller}`,
    rating: retailer.rating,
    lastChecked: new Date().toISOString()
  });

  // Add alternative source
  if (Math.random() > 0.3) {
    const altPlatform = platformKey === 'shopee' ? 'lazada' : 'shopee';
    const altRetailer = RETAILERS[altPlatform];
    sources.push({
      platform: altRetailer.platform,
      url: `https://${altRetailer.platform}.com.my/product/${brand}-${randomInt(10000, 99999)}`,
      price: Math.round(price * (1 + (Math.random() * 0.1 - 0.05))), // ±5% price variance
      inStock: inStock && Math.random() > 0.2,
      seller: `${BRANDS[brand].name} Authorized`,
      rating: altRetailer.rating,
      lastChecked: new Date().toISOString()
    });
  }

  return {
    inStock,
    stockCount,
    sources
  };
}

function generateReleaseDate() {
  const year = randomFrom([2023, 2024, 2025]);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Main generation function
 */
function generateDatabase() {
  const laptops = [];
  let index = 1;

  for (const [segment, config] of Object.entries(SEGMENTS)) {
    const { tiers, count } = config;
    const laptopsPerTier = Math.ceil(count / tiers.length);

    for (const tier of tiers) {
      for (let i = 0; i < laptopsPerTier && laptops.length < 90; i++) {
        // Select brand that supports this segment
        const eligibleBrands = Object.entries(BRANDS)
          .filter(([_, brand]) => brand.segments.includes(segment))
          .map(([key]) => key);

        if (eligibleBrands.length === 0) continue;

        const brandKey = randomFrom(eligibleBrands);
        const laptop = generateLaptop(index++, segment, tier, brandKey);
        laptops.push(laptop);
      }
    }
  }

  // Sort by rank
  laptops.sort((a, b) => a.rank - b.rank);

  return {
    catalog: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalLaptops: laptops.length,
      currency: 'MYR',
      market: 'Malaysia',
      segments: Object.keys(SEGMENTS),
      brands: Object.keys(BRANDS),
      notes: 'Generated laptop database for AI Bradaa - Malaysian market'
    },
    laptops
  };
}

/**
 * Save database to file
 */
function saveDatabase() {
  console.log('🚀 Generating laptop database...');

  const database = generateDatabase();
  const outputPath = join(__dirname, '..', 'data', 'laptops.json');

  writeFileSync(outputPath, JSON.stringify(database, null, 2), 'utf-8');

  console.log(`✅ Generated ${database.catalog.totalLaptops} laptops`);
  console.log(`📊 Segments: ${database.catalog.segments.join(', ')}`);
  console.log(`🏢 Brands: ${database.catalog.brands.length} brands`);
  console.log(`💾 Saved to: ${outputPath}`);

  // Generate summary statistics
  const stats = {
    bySegment: {},
    byTier: {},
    byBrand: {},
    priceRange: {
      min: Math.min(...database.laptops.map(l => l.price)),
      max: Math.max(...database.laptops.map(l => l.price)),
      avg: Math.round(database.laptops.reduce((sum, l) => sum + l.price, 0) / database.laptops.length)
    }
  };

  database.laptops.forEach(laptop => {
    stats.bySegment[laptop.segment] = (stats.bySegment[laptop.segment] || 0) + 1;
    stats.byTier[laptop.tier] = (stats.byTier[laptop.tier] || 0) + 1;
    stats.byBrand[laptop.brandName] = (stats.byBrand[laptop.brandName] || 0) + 1;
  });

  console.log('\n📈 Statistics:');
  console.log('By Segment:', stats.bySegment);
  console.log('By Tier:', stats.byTier);
  console.log('By Brand:', stats.byBrand);
  console.log('Price Range:', `MYR ${stats.priceRange.min} - MYR ${stats.priceRange.max} (avg: MYR ${stats.priceRange.avg})`);
}

// Run generator
saveDatabase();
