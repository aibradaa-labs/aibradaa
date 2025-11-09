# Laptop Database Documentation

**Complete guide to AI Bradaa's laptop database system**

---

## Overview

AI Bradaa uses a JSON-based laptop database containing 90 Malaysian laptops across 6 segments and 4 price tiers. The database powers all recommendations, comparisons, and search features.

### Quick Facts

- **Total Laptops:** 90
- **Segments:** Gaming, Ultrabook, Business, Creative, Student, Workstation
- **Tiers:** Budget, Midrange, Premium, Flagship
- **Brands:** 13 Malaysian market brands
- **Currency:** MYR (Malaysian Ringgit)
- **Location:** `/data/laptops.json`

---

## Database Structure

### Catalog Metadata

```json
{
  "catalog": {
    "version": "1.0.0",
    "lastUpdated": "2025-11-07T11:47:49.489Z",
    "totalLaptops": 90,
    "currency": "MYR",
    "market": "Malaysia",
    "segments": ["gaming", "ultrabook", "business", "creative", "student", "workstation"],
    "brands": ["asus", "acer", "msi", "gigabyte", "apple", "dell", "hp", "lenovo", "microsoft", "huawei", "xiaomi", "lg", "samsung"]
  }
}
```

### Laptop Schema

Each laptop entry contains:

```javascript
{
  // Identification
  "id": "string",              // Unique identifier (e.g., "asus-rog-001")
  "brand": "string",           // Brand key (lowercase)
  "brandName": "string",       // Display brand name
  "series": "string",          // Product series
  "model": "string",           // Model name
  "fullName": "string",        // Full display name
  "sku": "string",             // SKU code

  // Classification
  "segment": "string",         // gaming|ultrabook|business|creative|student|workstation
  "tier": "string",            // budget|midrange|premium|flagship
  "rank": number,              // Ranking (1-90)
  "rating": number,            // User rating (1-5)

  // Pricing (MYR)
  "price": number,             // Current price
  "originalPrice": number,     // Original price
  "discount": number,          // Discount percentage

  // Specifications
  "specs": {
    "cpu": { ... },            // Processor details
    "gpu": { ... },            // Graphics details
    "ram": number,             // RAM in GB
    "ramType": "string",       // DDR4/DDR5/Unified
    "storage": number,         // Storage in GB
    "storageType": "string",   // NVMe SSD/etc
    "display": { ... },        // Display specs
    "battery": number,         // Battery in Wh
    "batteryLife": number,     // Hours
    "weight": number,          // Weight in kg
    "thickness": number,       // Thickness in mm
    "ports": { ... },          // Port configuration
    "connectivity": { ... },   // Wifi/Bluetooth
    "keyboard": { ... },       // Keyboard details
    "webcam": "string",        // Webcam resolution
    "audio": "string"          // Audio system
  },

  // Content
  "description": "string",     // Short description
  "images": {
    "main": "string",          // Main image path
    "gallery": []              // Gallery images
  },
  "pros": [],                  // Advantages (array)
  "cons": [],                  // Disadvantages (array)
  "useCases": [],             // Use cases (array)
  "tags": [],                 // Tags (array)

  // Availability
  "availability": {
    "inStock": boolean,
    "stockCount": number,
    "sources": [              // Retailer sources
      {
        "platform": "string",
        "url": "string",
        "price": number,
        "inStock": boolean,
        "seller": "string",
        "rating": number,
        "lastChecked": "ISO date"
      }
    ]
  },

  // Metadata
  "warranty": "string",
  "releaseDate": "YYYY-MM-DD",
  "updatedAt": "ISO date",
  "metadata": {
    "views": number,
    "comparisons": number,
    "favorites": number,
    "clicks": number
  }
}
```

---

## Data Access API

The database is accessed through `/netlify/functions/utils/laptopDb.mjs`.

### Core Functions

#### `loadLaptopDatabase(forceReload = false)`

Load the laptop database from JSON file with caching.

```javascript
import { loadLaptopDatabase } from './utils/laptopDb.mjs';

const db = loadLaptopDatabase(); // Uses cache if available
const db = loadLaptopDatabase(true); // Force reload
```

**Returns:** Database object with `catalog` and `laptops`

**Cache:** 1 hour TTL (Time To Live)

---

#### `getAllLaptops()`

Get all 90 laptops.

```javascript
import { getAllLaptops } from './utils/laptopDb.mjs';

const laptops = getAllLaptops();
// Returns: Array of 90 laptop objects
```

---

#### `getLaptopById(id)`

Get a single laptop by ID.

```javascript
import { getLaptopById } from './utils/laptopDb.mjs';

const laptop = getLaptopById('asus-rog-001');
// Returns: Laptop object or undefined
```

---

#### `getLaptopsByBrand(brandKey)`

Get all laptops from a specific brand.

```javascript
import { getLaptopsByBrand } from './utils/laptopDb.mjs';

const asusLaptops = getLaptopsByBrand('asus');
// Returns: Array of ASUS laptops
```

---

#### `getLaptopsBySegment(segment)`

Get all laptops in a segment.

```javascript
import { getLaptopsBySegment } from './utils/laptopDb.mjs';

const gamingLaptops = getLaptopsBySegment('gaming');
// Returns: Array of gaming laptops
```

**Segments:** `gaming`, `ultrabook`, `business`, `creative`, `student`, `workstation`

---

#### `getLaptopsByTier(tier)`

Get all laptops in a price tier.

```javascript
import { getLaptopsByTier } from './utils/laptopDb.mjs';

const budgetLaptops = getLaptopsByTier('budget');
// Returns: Array of budget laptops
```

**Tiers:** `budget`, `midrange`, `premium`, `flagship`

---

#### `getLaptopsInPriceRange(minPrice, maxPrice)`

Get laptops within a price range (MYR).

```javascript
import { getLaptopsInPriceRange } from './utils/laptopDb.mjs';

const laptops = getLaptopsInPriceRange(3000, 5000);
// Returns: Laptops priced between MYR 3000-5000
```

---

#### `searchLaptops(query)`

Full-text search across laptops.

```javascript
import { searchLaptops } from './utils/laptopDb.mjs';

const results = searchLaptops('macbook');
// Searches: brand, model, description, tags, specs

const results = searchLaptops('rtx 4060');
// Finds: All laptops with RTX 4060 GPU
```

**Searchable fields:** brand, model, description, tags, use cases, CPU, GPU

---

#### `filterLaptops(filters)`

Advanced filtering with multiple criteria.

```javascript
import { filterLaptops } from './utils/laptopDb.mjs';

const laptops = filterLaptops({
  segment: 'gaming',
  tier: 'midrange',
  minPrice: 4000,
  maxPrice: 7000,
  minRam: 16,
  minRefreshRate: 120,
  hasDiscreteGpu: true,
  inStockOnly: true,
  minRating: 4.5
});
```

**Available Filters:**

| Filter | Type | Description |
|--------|------|-------------|
| `segment` | string | gaming, ultrabook, etc. |
| `tier` | string | budget, midrange, premium, flagship |
| `brand` | string/array | Brand key(s) |
| `minPrice` | number | Minimum price (MYR) |
| `maxPrice` | number | Maximum price (MYR) |
| `minRam` | number | Minimum RAM (GB) |
| `minStorage` | number | Minimum storage (GB) |
| `displaySize` | number | Display size (inches) |
| `minRefreshRate` | number | Minimum refresh rate (Hz) |
| `maxWeight` | number | Maximum weight (kg) |
| `hasDiscreteGpu` | boolean | Has dedicated GPU |
| `useCase` | string | gaming, productivity, etc. |
| `tags` | string/array | Tag filter |
| `inStockOnly` | boolean | In stock only |
| `minRating` | number | Minimum rating (1-5) |

---

#### `getSmartRecommendations(preferences, limit = 3)`

Get AI-powered smart recommendations.

```javascript
import { getSmartRecommendations } from './utils/laptopDb.mjs';

const recommendations = getSmartRecommendations({
  budget: 6000,
  usage: ['gaming', 'content-creation'],
  preferences: {
    portability: true,
    performance: true,
    batteryLife: false,
    display: true
  }
}, 3);
```

**Parameters:**
- `budget` (number): Maximum budget in MYR
- `usage` (array): Use cases
- `preferences` (object): User preferences
  - `portability`: Prioritize weight < 2kg
  - `performance`: Prioritize RAM ≥ 16GB, discrete GPU
  - `batteryLife`: Prioritize battery life ≥ 10hrs
  - `display`: Prioritize refresh rate ≥ 120Hz or OLED

**Returns:** Array of recommended laptops with scoring

---

#### `findSimilarLaptops(laptopId, limit = 5)`

Find similar laptops based on specs and price.

```javascript
import { findSimilarLaptops } from './utils/laptopDb.mjs';

const similar = findSimilarLaptops('asus-rog-001', 3);
// Returns: 3 similar laptops
```

**Similarity factors:**
- Same brand (+20 points)
- Same segment (+30 points)
- Similar price ±20% (+25 points)
- Same RAM (+10 points)
- Same storage (+5 points)
- Similar display size ±1" (+10 points)

---

#### `findBetterAlternatives(laptopId, limit = 5)`

Find better-rated laptops at similar or lower price.

```javascript
import { findBetterAlternatives } from './utils/laptopDb.mjs';

const alternatives = findBetterAlternatives('asus-rog-001', 3);
// Returns: Better alternatives with reasons
```

**Each alternative includes:**
```javascript
{
  ...laptopData,
  "reason": "Better rating, More RAM, Higher refresh rate"
}
```

---

#### `compareLaptops(laptopIds)`

Compare multiple laptops side-by-side.

```javascript
import { compareLaptops } from './utils/laptopDb.mjs';

const comparison = compareLaptops([
  'asus-rog-001',
  'msi-raider-002',
  'apple-macbook-pro-003'
]);
```

**Returns:**
```javascript
{
  "laptops": [ /* Full laptop objects */ ],
  "comparison": {
    "priceRange": { "min": 5799, "max": 9499, "diff": 3700 },
    "bestRating": { /* Laptop with highest rating */ },
    "bestValue": { /* Best rating/price ratio */ },
    "lightest": { /* Lightest laptop */ },
    "longestBattery": { /* Best battery life */ }
  }
}
```

---

#### `identifyLaptopFromAnalysis(analysis)`

Identify laptop from camera image analysis.

```javascript
import { identifyLaptopFromAnalysis } from './utils/laptopDb.mjs';

const identified = identifyLaptopFromAnalysis({
  brand: 'Apple',
  model: 'MacBook Pro 14',
  confidence: 'high'
});
// Returns: Matching laptop or null
```

---

#### `getDatabaseStats()`

Get database statistics.

```javascript
import { getDatabaseStats } from './utils/laptopDb.mjs';

const stats = getDatabaseStats();
```

**Returns:**
```javascript
{
  "total": 90,
  "bySegment": { "gaming": 28, "ultrabook": 21, ... },
  "byTier": { "budget": 19, "midrange": 32, ... },
  "byBrand": { "ASUS": 6, "MSI": 12, ... },
  "priceRange": { "min": 1999, "max": 17599, "avg": 6562 },
  "inStock": 77,
  "avgRating": "4.52",
  "lastUpdated": "2025-11-07T11:47:49.489Z"
}
```

---

## REST API Endpoints

The database is exposed via `/netlify/functions/data.mjs`.

### GET `/api/data/stats`

Get database statistics.

```bash
curl https://aibradaa.netlify.app/api/data/stats
```

**Response:**
```json
{
  "total": 90,
  "bySegment": { ... },
  "priceRange": { ... }
}
```

---

### GET `/api/data/laptop/:id`

Get single laptop details.

```bash
curl https://aibradaa.netlify.app/api/data/laptop/asus-rog-001
```

**Response:** Full laptop object

---

### GET `/api/data/search?q=macbook`

Search laptops.

```bash
# Text search
curl "https://aibradaa.netlify.app/api/data/search?q=rtx+4060"

# Filter by segment
curl "https://aibradaa.netlify.app/api/data?segment=gaming&tier=midrange"

# Price range
curl "https://aibradaa.netlify.app/api/data?minPrice=4000&maxPrice=7000"

# Complex filter
curl "https://aibradaa.netlify.app/api/data?segment=gaming&minRam=16&minRefreshRate=144&inStockOnly=true"
```

**Query Parameters:**

| Parameter | Type | Example |
|-----------|------|---------|
| `q` | string | `rtx 4060` |
| `segment` | string | `gaming` |
| `tier` | string | `midrange` |
| `brand` | string | `asus` |
| `minPrice` | number | `4000` |
| `maxPrice` | number | `7000` |
| `minRam` | number | `16` |
| `minStorage` | number | `512` |
| `minRefreshRate` | number | `120` |
| `maxWeight` | number | `2.0` |
| `hasDiscreteGpu` | boolean | `true` |
| `useCase` | string | `gaming` |
| `inStockOnly` | boolean | `true` |
| `minRating` | number | `4.5` |
| `limit` | number | `20` (default) |
| `offset` | number | `0` (default) |

**Response:**
```json
{
  "results": [ /* Array of laptops */ ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### POST `/api/data/refresh` (Admin Only)

Refresh database cache.

```bash
curl -X POST https://aibradaa.netlify.app/api/data/refresh \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Database cache refreshed",
  "timestamp": "2025-11-07T12:00:00.000Z",
  "catalog": { ... }
}
```

---

## Database Generation

### Regenerating the Database

To regenerate the laptop database:

```bash
node tools/generate-laptop-db.mjs
```

**Output:**
```
🚀 Generating laptop database...
✅ Generated 90 laptops
📊 Segments: gaming, ultrabook, business, creative, student, workstation
🏢 Brands: 13 brands
💾 Saved to: /data/laptops.json

📈 Statistics:
By Segment: { gaming: 28, ultrabook: 21, business: 16, creative: 15, student: 10 }
By Tier: { budget: 19, midrange: 32, premium: 27, flagship: 12 }
By Brand: { ASUS: 6, Gigabyte: 9, Lenovo: 11, MSI: 12, ... }
Price Range: MYR 1999 - MYR 17599 (avg: MYR 6562)
```

### Generator Configuration

Edit `/tools/generate-laptop-db.mjs` to customize:

**Segments:**
```javascript
const SEGMENTS = {
  gaming: { tiers: ['budget', 'midrange', 'premium', 'flagship'], count: 25 },
  ultrabook: { tiers: ['budget', 'midrange', 'premium'], count: 20 },
  // ... more segments
};
```

**Brands:**
```javascript
const BRANDS = {
  asus: { name: 'ASUS', series: ['ROG', 'TUF', 'VivoBook'], segments: ['gaming', 'ultrabook'] },
  // ... more brands
};
```

**Price Ranges (MYR):**
```javascript
const PRICE_RANGES = {
  budget: { min: 2000, max: 3500 },
  midrange: { min: 3500, max: 6000 },
  premium: { min: 6000, max: 10000 },
  flagship: { min: 10000, max: 18000 }
};
```

---

## Integration Examples

### Example 1: Recommendations Function

```javascript
import { getSmartRecommendations } from './utils/laptopDb.mjs';

async function handler(event) {
  const { budget, usage, preferences } = JSON.parse(event.body);

  const recommendations = getSmartRecommendations({
    budget,
    usage: Array.isArray(usage) ? usage : [usage],
    preferences
  }, 3);

  return {
    statusCode: 200,
    body: JSON.stringify({ recommendations })
  };
}
```

### Example 2: Camera Identification

```javascript
import {
  identifyLaptopFromAnalysis,
  findSimilarLaptops,
  findBetterAlternatives
} from './utils/laptopDb.mjs';

async function processImage(analysisResult) {
  // Identify laptop
  const identified = identifyLaptopFromAnalysis(analysisResult);

  if (!identified) {
    return { message: 'Laptop not found in database' };
  }

  // Find similar and better alternatives
  const similar = findSimilarLaptops(identified.id, 3);
  const alternatives = findBetterAlternatives(identified.id, 3);

  return { identified, similar, alternatives };
}
```

### Example 3: Advanced Search

```javascript
import { filterLaptops } from './utils/laptopDb.mjs';

function searchGamingLaptops() {
  return filterLaptops({
    segment: 'gaming',
    minPrice: 5000,
    maxPrice: 10000,
    minRam: 16,
    minRefreshRate: 144,
    hasDiscreteGpu: true,
    inStockOnly: true,
    minRating: 4.5
  });
}
```

---

## Performance

### Caching Strategy

- **TTL:** 1 hour
- **Size:** ~500KB (90 laptops)
- **Load Time:** <10ms (cached), ~50ms (fresh load)

### Optimization Tips

1. **Use filters before AI:** Filter database first, then use AI for insights
2. **Cache results:** Cache recommendation results per user
3. **Pagination:** Use `limit` and `offset` for large result sets
4. **Batch operations:** Group multiple queries when possible

---

## Data Quality

### Validation

All laptops are validated for:
- ✅ Complete schema compliance
- ✅ Valid price ranges
- ✅ Realistic specifications
- ✅ Malaysian market availability
- ✅ Proper brand/model naming

### Data Freshness

| Field | Update Frequency |
|-------|------------------|
| Prices | Weekly (planned) |
| Stock availability | Daily (planned) |
| Specifications | On new releases |
| Reviews/ratings | Monthly (planned) |

---

## Troubleshooting

### Database Not Loading

```bash
# Check file exists
ls -lh data/laptops.json

# Validate JSON
node -e "JSON.parse(require('fs').readFileSync('data/laptops.json', 'utf-8'))"

# Regenerate database
node tools/generate-laptop-db.mjs
```

### Cache Issues

```javascript
// Force reload cache
import { loadLaptopDatabase } from './utils/laptopDb.mjs';
const db = loadLaptopDatabase(true);
```

### Empty Results

```javascript
// Check if filters are too restrictive
const all = getAllLaptops();
console.log('Total laptops:', all.length);

const filtered = filterLaptops({ minPrice: 20000 }); // May be empty
console.log('Filtered:', filtered.length);
```

---

## Roadmap

### Phase 2 (Q2 2025)

- [ ] Real-time price scraping from Shopee/Lazada
- [ ] Automated daily stock checks
- [ ] User reviews integration
- [ ] Price history tracking
- [ ] Image CDN for laptop photos

### Phase 3 (Q3 2025)

- [ ] Expand to 200+ laptops
- [ ] Partner API integrations
- [ ] Affiliate tracking
- [ ] Advanced analytics (views, clicks, conversions)

---

## Contributing

### Adding New Laptops

1. Edit `/tools/generate-laptop-db.mjs`
2. Add to appropriate segment/tier
3. Run generator: `node tools/generate-laptop-db.mjs`
4. Verify output
5. Commit changes

### Schema Changes

If modifying laptop schema:
1. Update generator (`generate-laptop-db.mjs`)
2. Update access API (`laptopDb.mjs`)
3. Update documentation (this file)
4. Regenerate database
5. Update integration tests

---

## Support

- **Issues:** File at GitHub repository
- **Questions:** Contact dev team
- **Database errors:** Check logs in Netlify Functions

---

**Last Updated:** 2025-11-07
**Version:** 1.0.0
**Database Size:** 90 laptops
**Status:** Production Ready ✅
