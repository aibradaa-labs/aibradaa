# Multi-Category Expansion Strategy
## From Laptops → Cameras → Smartphones → Gadgets

**Document Version:** 1.0
**Created:** 2025-11-11 14:45 MYT (Asia/Kuala_Lumpur)
**Status:** Strategic Planning Document
**Phase:** 11+ (Post-Launch Expansion)

---

## 🎯 Executive Summary

AI Bradaa began as a **Malaysia-first laptop intelligence platform**. This document outlines the strategic expansion to become a **comprehensive tech product recommendation ecosystem** spanning:

1. **Laptops** (Current) - Fully operational
2. **Cameras & DSLR** (Phase 12, Q1 2026) - Foundation ready
3. **Smartphones** (Phase 13, Q2 2026) - Planned
4. **Gadgets** (Phase 14, Q3 2026) - Smartwatches, earbuds, tablets

**Key Principle:** Each category is **totally different** in terms of:
- **Specifications** (CPU/GPU vs sensor/lens vs chipset/display)
- **Use Cases** (productivity vs photography vs communication vs lifestyle)
- **User Personas** (office workers vs photographers vs mobile enthusiasts)

**Architecture Goal:** Future-proof, category-agnostic systems that scale gracefully without code duplication.

---

## 📊 Category Comparison Matrix

| Aspect | Laptops | Cameras/DSLR | Smartphones | Gadgets |
|--------|---------|--------------|-------------|---------|
| **Primary Use Case** | Productivity, gaming, content creation | Photography, videography | Communication, mobile computing | Lifestyle, fitness, audio |
| **Key Specs** | CPU, GPU, RAM, Storage | Sensor size, megapixels, lens mount, ISO | Chipset, display, camera array, battery | Battery life, sensors, connectivity |
| **Price Range (MYR)** | 1,500 - 15,000 | 1,000 - 20,000+ | 500 - 6,000 | 200 - 3,000 |
| **Purchase Cycle** | 3-5 years | 5-10 years | 1-3 years | 1-3 years |
| **Expertise Level** | Beginner to Pro | Hobbyist to Professional | Mass market | Mass market |
| **Decision Complexity** | High (10+ factors) | Very High (15+ factors) | Medium (7+ factors) | Low to Medium (5+ factors) |
| **Affilate Revenue** | 3-5% commission | 2-4% commission | 2-3% commission | 5-8% commission |

---

## 🏗️ Architecture Strategy

### **1. Database Design: Generic Product Model**

#### **Current (Laptop-Specific)**
```json
{
  "id": "lenovo-legion-5-pro-2024",
  "brand": "Lenovo",
  "model": "Legion 5 Pro",
  "cpu": { "brand": "AMD", "model": "Ryzen 7 7840HS", "cores": 8, "threads": 16 },
  "gpu": { "brand": "NVIDIA", "model": "RTX 4060", "vram": 8 },
  "ram": { "size": 16, "type": "DDR5", "speed": 5600 },
  "price": { "myr": 5299, "usd": 1200 }
}
```

#### **Future (Category-Agnostic)**
```json
{
  "id": "lenovo-legion-5-pro-2024",
  "category": "laptop",
  "brand": "Lenovo",
  "model": "Legion 5 Pro",
  "specs": {
    "cpu": { "brand": "AMD", "model": "Ryzen 7 7840HS", "cores": 8 },
    "gpu": { "brand": "NVIDIA", "model": "RTX 4060", "vram": 8 },
    "ram": { "size": 16, "type": "DDR5" }
  },
  "price": { "myr": 5299, "usd": 1200 },
  "use_cases": ["gaming", "content_creation"],
  "metadata": { "release_date": "2024-03", "weight_kg": 2.5 }
}
```

**Key Change:** `specs` is a flexible JSONB object that adapts to each category.

---

### **2. PostgreSQL Schema: Unified Products Table**

#### **Migration: 005-add-universal-products-table.sql**

```sql
-- ============================================================
-- UNIVERSAL PRODUCTS TABLE (Multi-Category Support)
-- ============================================================

CREATE TABLE products (
  -- Core Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,  -- 'laptop', 'camera', 'smartphone', 'gadget'
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  sku TEXT UNIQUE,  -- Manufacturer SKU (if available)

  -- Specs (Category-Specific, Flexible Schema)
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Pricing
  price_myr DECIMAL(10, 2),
  price_usd DECIMAL(10, 2),
  price_last_updated TIMESTAMPTZ,
  price_history JSONB DEFAULT '[]'::jsonb,  -- [{date, myr, usd}]

  -- Availability
  in_stock BOOLEAN DEFAULT TRUE,
  stock_level INT,  -- Inventory count (if available)

  -- Marketing
  description TEXT,
  highlights TEXT[],  -- Key selling points
  use_cases TEXT[],  -- ['gaming', 'photography', 'productivity']
  target_audience TEXT[],  -- ['professionals', 'students', 'gamers']

  -- Media
  images JSONB DEFAULT '[]'::jsonb,  -- [{url, alt, type: 'main'|'gallery'}]
  videos JSONB DEFAULT '[]'::jsonb,  -- [{url, platform: 'youtube', duration}]

  -- Affiliate Links
  affiliates JSONB DEFAULT '{}'::jsonb,  -- {lazada: {url, price}, shopee: {url, price}}

  -- Reviews & Ratings
  rating_avg DECIMAL(3, 2),  -- 0.00 - 5.00
  rating_count INT DEFAULT 0,
  reviews_summary JSONB,  -- Aggregated sentiment, pros/cons

  -- SEO
  slug TEXT UNIQUE,  -- URL-friendly identifier
  meta_title TEXT,
  meta_description TEXT,

  -- Metadata
  release_date DATE,
  discontinued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_in_stock ON products(in_stock) WHERE in_stock = TRUE;
CREATE INDEX idx_products_price ON products(price_myr);
CREATE INDEX idx_products_rating ON products(rating_avg);

-- GIN index for JSONB specs (flexible querying)
CREATE INDEX idx_products_specs ON products USING GIN (specs);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING GIN (
  to_tsvector('english',
    coalesce(brand, '') || ' ' ||
    coalesce(model, '') || ' ' ||
    coalesce(description, '')
  )
);

-- ============================================================
-- CATEGORY-SPECIFIC VIEWS (For Backwards Compatibility)
-- ============================================================

-- Laptops View (maintains existing structure)
CREATE VIEW laptops AS
SELECT
  id,
  brand,
  model,
  specs,
  price_myr,
  price_usd,
  in_stock,
  rating_avg,
  affiliates,
  created_at
FROM products
WHERE category = 'laptop';

-- Cameras View
CREATE VIEW cameras AS
SELECT
  id,
  brand,
  model,
  specs,
  price_myr,
  price_usd,
  in_stock,
  rating_avg,
  affiliates,
  created_at
FROM products
WHERE category = 'camera';

-- Smartphones View
CREATE VIEW smartphones AS
SELECT
  id,
  brand,
  model,
  specs,
  price_myr,
  price_usd,
  in_stock,
  rating_avg,
  affiliates,
  created_at
FROM products
WHERE category = 'smartphone';

-- Gadgets View
CREATE VIEW gadgets AS
SELECT
  id,
  brand,
  model,
  specs,
  price_myr,
  price_usd,
  in_stock,
  rating_avg,
  affiliates,
  created_at
FROM products
WHERE category = 'gadget';

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: Get products by category with filters
CREATE OR REPLACE FUNCTION get_products(
  p_category TEXT,
  p_brands TEXT[] DEFAULT NULL,
  p_price_min DECIMAL DEFAULT NULL,
  p_price_max DECIMAL DEFAULT NULL,
  p_use_cases TEXT[] DEFAULT NULL,
  p_in_stock_only BOOLEAN DEFAULT FALSE,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
) RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE
    category = p_category
    AND (p_brands IS NULL OR brand = ANY(p_brands))
    AND (p_price_min IS NULL OR price_myr >= p_price_min)
    AND (p_price_max IS NULL OR price_myr <= p_price_max)
    AND (p_use_cases IS NULL OR use_cases && p_use_cases)
    AND (NOT p_in_stock_only OR in_stock = TRUE)
  ORDER BY rating_avg DESC NULLS LAST, price_myr ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function: Full-text search across all categories
CREATE OR REPLACE FUNCTION search_products(
  p_query TEXT,
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20
) RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE
    (p_category IS NULL OR category = p_category)
    AND to_tsvector('english',
      coalesce(brand, '') || ' ' ||
      coalesce(model, '') || ' ' ||
      coalesce(description, '')
    ) @@ plainto_tsquery('english', p_query)
  ORDER BY
    ts_rank(
      to_tsvector('english', brand || ' ' || model || ' ' || description),
      plainto_tsquery('english', p_query)
    ) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

### **3. Data Migration Strategy**

#### **Phase 1: Backfill Existing Laptops**

```sql
-- Migrate existing laptops to universal products table
INSERT INTO products (
  category,
  brand,
  model,
  sku,
  specs,
  price_myr,
  price_usd,
  use_cases,
  affiliates,
  slug,
  created_at
)
SELECT
  'laptop' AS category,
  brand,
  model,
  sku,
  jsonb_build_object(
    'cpu', cpu,
    'gpu', gpu,
    'ram', ram,
    'storage', storage,
    'display', display,
    'ports', ports
  ) AS specs,
  price_myr,
  price_usd,
  use_cases,
  affiliates,
  LOWER(brand || '-' || model) AS slug,
  created_at
FROM laptops_legacy;  -- Existing laptops table
```

#### **Phase 2: Gradual Rollout**

1. **Week 1-2:** Run migration, keep both `laptops_legacy` and `products` tables
2. **Week 3-4:** Update API endpoints to read from `products` (laptops view)
3. **Week 5-6:** Verify data integrity, performance benchmarks
4. **Week 7:** Drop `laptops_legacy` table

---

### **4. API Endpoint Strategy**

#### **Current (Laptop-Specific)**

```
/.netlify/functions/data.mjs        → Get laptops
/.netlify/functions/matchmaker-recommend.mjs → Laptop recommendations
/.netlify/functions/versus.mjs      → Compare 2 laptops
```

#### **Future (Category-Agnostic)**

```
/.netlify/functions/products.mjs    → Get products (category filter)
/.netlify/functions/recommend.mjs   → Generic recommendations (category filter)
/.netlify/functions/compare.mjs     → Compare 2+ products (same category)
/.netlify/functions/search.mjs      → Full-text search across categories
```

**Backwards Compatibility:**
Keep existing endpoints as **wrappers** around new generic endpoints:

```javascript
// netlify/functions/data.mjs (legacy wrapper)
import { getProducts } from './products.mjs';

export async function handler(event, context) {
  // Redirect to generic products endpoint with category='laptop'
  return await getProducts({ ...event, category: 'laptop' }, context);
}
```

---

### **5. Frontend Module Strategy**

#### **Current Structure**
```
app/
├── matchmaker/   (Laptop-specific)
├── versus/       (Laptop-specific)
├── explorer/     (Laptop-specific)
├── command/      (Laptop-specific)
├── intel/        (Laptop-specific)
└── appendices/   (Generic)
```

#### **Refactored Structure (Multi-Category)**

```
app/
├── shared/                # Shared utilities (existing)
│   ├── components/        # NEW: Reusable UI components
│   │   ├── product-card.mjs        # Generic product card
│   │   ├── comparison-table.mjs    # Generic comparison UI
│   │   ├── filter-panel.mjs        # Category-agnostic filters
│   │   ├── search-bar.mjs          # Universal search
│   │   └── tier-banner.mjs         # Upgrade prompts
│   │
│   ├── utils/
│   │   ├── api-client.mjs          # API wrapper (existing)
│   │   ├── category-config.mjs     # NEW: Category configurations
│   │   └── spec-formatter.mjs      # NEW: Format specs by category
│   │
│   └── state.mjs                   # Global state (existing)
│
├── laptops/               # Laptop category
│   ├── matchmaker/
│   ├── versus/
│   ├── explorer/
│   ├── command/
│   └── intel/
│
├── cameras/               # Camera category (NEW)
│   ├── matchmaker/        # Camera matchmaker (different quiz)
│   ├── versus/            # Compare 2 cameras
│   ├── explorer/          # Browse camera database
│   ├── command/           # AI chat for camera advice
│   └── intel/             # Camera market trends
│
├── smartphones/           # Smartphone category (FUTURE)
│   ├── matchmaker/
│   ├── versus/
│   ├── explorer/
│   └── command/
│
├── gadgets/               # Gadgets category (FUTURE)
│   ├── matchmaker/
│   ├── explorer/
│   └── command/
│
└── cross-category/        # Cross-category features (FUTURE)
    ├── bundles/           # Product bundles (laptop + mouse + bag)
    └── compare-categories/ # Compare laptop vs tablet specs
```

---

### **6. Category Configuration System**

#### **configs/categories.yaml**

```yaml
categories:
  laptop:
    display_name: "Laptops"
    icon: "💻"
    description: "Productivity, gaming, and content creation powerhouses"
    enabled: true

    spec_schema:
      - name: "cpu"
        display_name: "Processor"
        type: "object"
        required: true
        fields:
          - { name: "brand", type: "string" }
          - { name: "model", type: "string" }
          - { name: "cores", type: "number" }

      - name: "gpu"
        display_name: "Graphics Card"
        type: "object"
        required: true

      - name: "ram"
        display_name: "Memory (RAM)"
        type: "object"
        required: true

      - name: "storage"
        display_name: "Storage"
        type: "object"
        required: true

    filters:
      - { name: "brand", type: "multi-select", options: ["Lenovo", "Asus", "Dell", "HP", "Acer", "MSI"] }
      - { name: "price", type: "range", min: 1000, max: 20000, step: 500 }
      - { name: "use_case", type: "multi-select", options: ["gaming", "productivity", "content_creation"] }

    use_cases:
      - gaming
      - productivity
      - content_creation
      - student
      - business

    ai_persona:
      system_prompt_path: "ai_pod/personas/laptop/system-prompt.md"
      model: "gemini-2.5-flash-latest"
      temperature: 0.7

  camera:
    display_name: "Cameras & DSLR"
    icon: "📷"
    description: "Professional photography and videography equipment"
    enabled: true

    spec_schema:
      - name: "sensor"
        display_name: "Image Sensor"
        type: "object"
        required: true
        fields:
          - { name: "type", type: "string", enum: ["Full Frame", "APS-C", "Micro Four Thirds", "1-inch"] }
          - { name: "megapixels", type: "number" }
          - { name: "iso_range", type: "string" }

      - name: "lens"
        display_name: "Lens System"
        type: "object"
        fields:
          - { name: "mount", type: "string" }
          - { name: "kit_lens", type: "string" }

      - name: "video"
        display_name: "Video Capabilities"
        type: "object"
        fields:
          - { name: "max_resolution", type: "string", enum: ["4K 60fps", "4K 30fps", "1080p 60fps"] }
          - { name: "codec", type: "string" }

      - name: "autofocus"
        display_name: "Autofocus System"
        type: "object"
        fields:
          - { name: "points", type: "number" }
          - { name: "type", type: "string", enum: ["Phase Detection", "Contrast Detection", "Hybrid"] }

      - name: "viewfinder"
        display_name: "Viewfinder"
        type: "object"
        fields:
          - { name: "type", type: "string", enum: ["Optical", "Electronic", "None"] }
          - { name: "resolution", type: "string" }

    filters:
      - { name: "brand", type: "multi-select", options: ["Canon", "Nikon", "Sony", "Fujifilm", "Panasonic", "Olympus"] }
      - { name: "price", type: "range", min: 1000, max: 50000, step: 1000 }
      - { name: "sensor_type", type: "multi-select", options: ["Full Frame", "APS-C", "Micro Four Thirds"] }
      - { name: "use_case", type: "multi-select", options: ["portrait", "landscape", "sports", "wildlife", "video"] }

    use_cases:
      - portrait
      - landscape
      - sports
      - wildlife
      - wedding
      - video
      - vlogging
      - studio

    ai_persona:
      system_prompt_path: "ai_pod/personas/camera/system-prompt.md"
      model: "gemini-2.5-pro-latest"  # More complex domain, use Pro
      temperature: 0.6

  smartphone:
    display_name: "Smartphones"
    icon: "📱"
    description: "Mobile communication and computing devices"
    enabled: false  # Not launched yet

    spec_schema:
      - name: "chipset"
        display_name: "Processor"
        type: "object"
        required: true

      - name: "display"
        display_name: "Display"
        type: "object"
        required: true
        fields:
          - { name: "size", type: "number", unit: "inches" }
          - { name: "resolution", type: "string" }
          - { name: "refresh_rate", type: "number", unit: "Hz" }
          - { name: "type", type: "string", enum: ["OLED", "AMOLED", "LCD"] }

      - name: "camera"
        display_name: "Camera System"
        type: "object"
        fields:
          - { name: "main_mp", type: "number" }
          - { name: "ultrawide_mp", type: "number" }
          - { name: "telephoto_mp", type: "number" }

      - name: "battery"
        display_name: "Battery"
        type: "object"
        fields:
          - { name: "capacity", type: "number", unit: "mAh" }
          - { name: "fast_charging", type: "string" }

    use_cases:
      - flagship
      - mid_range
      - budget
      - gaming
      - photography
      - business

    ai_persona:
      system_prompt_path: "ai_pod/personas/smartphone/system-prompt.md"
      model: "gemini-2.5-flash-latest"
      temperature: 0.7

  gadget:
    display_name: "Gadgets & Wearables"
    icon: "⌚"
    description: "Smartwatches, earbuds, tablets, and lifestyle tech"
    enabled: false  # Not launched yet

    subcategories:
      - smartwatch
      - earbuds
      - tablet
      - fitness_tracker
      - smart_speaker

    # Dynamic spec schema based on subcategory
    spec_schema: "dynamic"  # Load from subcategory-specific config

    use_cases:
      - fitness
      - productivity
      - entertainment
      - health_monitoring
```

---

### **7. AI Persona Strategy (Category-Specific)**

Each category needs its own AI persona with domain expertise:

#### **Laptop Persona** (Existing)
```
Role: Tech advisor, productivity expert
Tone: Friendly, data-driven, concise
Expertise: CPUs, GPUs, RAM, use case matching
Example: "For your budget of RM5000 and gaming needs, the Lenovo Legion 5 Pro with
          RTX 4060 GPU offers excellent 1080p performance..."
```

#### **Camera Persona** (NEW)
```
Role: Photography mentor, equipment specialist
Tone: Professional but approachable, educational
Expertise: Sensors, lenses, photography techniques, use case matching
Example: "For portrait photography, a full-frame sensor like the Canon EOS R6 Mark II
          with its 20MP sensor and excellent low-light performance (ISO 51200) will give
          you beautiful bokeh and skin tones. Pair it with an 85mm f/1.8 lens..."
```

#### **Smartphone Persona** (FUTURE)
```
Role: Mobile tech guide, lifestyle advisor
Tone: Trendy, accessible, practical
Expertise: Chipsets, displays, cameras, battery life
Example: "The iPhone 15 Pro with A17 Pro chip is perfect for mobile photography enthusiasts.
          Its 48MP main camera with ProRAW support lets you capture stunning detail..."
```

#### **Gadget Persona** (FUTURE)
```
Role: Lifestyle tech curator, wellness coach
Tone: Enthusiastic, health-conscious, trend-aware
Expertise: Fitness tracking, audio quality, smart home integration
Example: "The Apple Watch Series 9 tracks your heart rate variability and sleep stages
          with medical-grade accuracy. Perfect for your marathon training goals..."
```

---

### **8. Data Sources & ETL Pipelines**

#### **Laptop Data Sources** (Existing)
- Official manufacturer specs (Lenovo, Asus, Dell, HP, Acer, MSI websites)
- E-commerce APIs (Lazada, Shopee)
- Review aggregators (Notebook Check, LaptopMag)

#### **Camera Data Sources** (NEW - Phase 12)
- Manufacturer specs (Canon, Nikon, Sony, Fujifilm, Panasonic)
- Photography review sites (DPReview, Imaging Resource, Camera Labs)
- E-commerce APIs (Lazada, Shopee, official stores)
- Used camera markets (KEH, MPB Malaysia)

#### **ETL Pipeline Template**

```javascript
// tools/etl/universal-ingest.mjs
import { loadCategoryConfig } from '../configs/categories.yaml';

async function ingestProducts(category, source) {
  const config = loadCategoryConfig(category);

  // 1. Fetch raw data from source
  const rawData = await fetchFromSource(source, config.spec_schema);

  // 2. Transform to universal schema
  const products = rawData.map(item => transformToProduct(item, category, config));

  // 3. Validate against schema
  const validated = products.filter(p => validateProduct(p, config.spec_schema));

  // 4. Enrich with pricing data
  const enriched = await enrichWithPricing(validated, config.affiliates);

  // 5. Insert to database
  await insertProducts(enriched);

  console.log(`✅ Ingested ${enriched.length} ${category} products`);
}
```

---

### **9. UI/UX Considerations**

#### **Category Switcher (Global Navigation)**

```html
<!-- Navigation Bar -->
<nav class="category-nav">
  <a href="/laptops" class="category-tab active">
    💻 Laptops
  </a>
  <a href="/cameras" class="category-tab">
    📷 Cameras
  </a>
  <a href="/smartphones" class="category-tab disabled" title="Coming Q2 2026">
    📱 Smartphones
    <span class="badge">Soon</span>
  </a>
  <a href="/gadgets" class="category-tab disabled" title="Coming Q3 2026">
    ⌚ Gadgets
    <span class="badge">Soon</span>
  </a>
</nav>
```

#### **Category-Specific Matchmaker Quiz**

**Laptop Quiz:**
1. What's your primary use? (Gaming, Productivity, Content Creation)
2. Budget? (RM 1000-20000)
3. Preferred brand? (Lenovo, Asus, Dell, HP, Acer, MSI, No preference)
4. Portability vs Performance? (Slider)

**Camera Quiz (Different!):**
1. Photography experience? (Beginner, Hobbyist, Professional)
2. Primary subject? (Portrait, Landscape, Sports, Wildlife, Video)
3. Budget? (Body only or with kit lens?)
4. Existing lenses? (Brand compatibility)
5. Size preference? (Full-frame power vs APS-C portability)

---

### **10. Pricing & Affiliate Strategy**

#### **Commission Rates by Category**

| Category | Lazada | Shopee | Official Store | Direct Affiliate |
|----------|--------|--------|----------------|------------------|
| Laptops | 3-5% | 3-5% | 2-3% | 5-7% |
| Cameras | 2-4% | 2-4% | 3-5% | 4-6% |
| Smartphones | 2-3% | 2-3% | 2-3% | 3-5% |
| Gadgets | 5-8% | 5-8% | 4-6% | 6-10% |

**Strategy:**
- Gadgets have highest commission rates (earbuds, smartwatches are impulse buys)
- Cameras are long-term decisions, lower conversion but higher AOV (Average Order Value)
- Focus on mid-tier products (RM 2000-8000) for best conversion × commission balance

---

### **11. Rollout Timeline**

#### **Phase 12: Cameras & DSLR (Q1 2026)**

**Milestone 1: Data Preparation (Jan 2026)**
- [ ] Ingest 500+ camera models (Canon, Nikon, Sony, Fujifilm, Panasonic, Olympus)
- [ ] Define camera-specific spec schema
- [ ] Create camera persona (ai_pod/personas/camera/)
- [ ] Camera eval suite (precision on sensor specs, lens compatibility)

**Milestone 2: Backend (Feb 2026)**
- [ ] Deploy `products` table migration
- [ ] Update API endpoints (category filter)
- [ ] Camera-specific recommendation logic
- [ ] Lens compatibility checker

**Milestone 3: Frontend (Feb-Mar 2026)**
- [ ] Camera matchmaker quiz
- [ ] Camera explorer (filter by sensor type, budget, use case)
- [ ] Camera versus (side-by-side comparison)
- [ ] Camera command (AI chat with photography expertise)

**Milestone 4: Launch (Mar 2026)**
- [ ] Beta launch to Ultimate tier users
- [ ] Gather feedback, iterate
- [ ] Public launch
- [ ] SEO optimization (camera landing pages)

#### **Phase 13: Smartphones (Q2 2026)**

**Milestone 1: Data Preparation (Apr 2026)**
- [ ] Ingest 300+ smartphone models (Apple, Samsung, Xiaomi, Oppo, Vivo, OnePlus, Google)
- [ ] Smartphone spec schema
- [ ] Smartphone persona

**Milestone 2-4:** Repeat camera rollout process

#### **Phase 14: Gadgets (Q3 2026)**

**Milestone 1: Subcategory Definition**
- [ ] Smartwatches (Apple Watch, Galaxy Watch, Garmin, Fitbit)
- [ ] Earbuds (AirPods, Galaxy Buds, Sony WF series)
- [ ] Tablets (iPad, Galaxy Tab, Surface)
- [ ] Fitness trackers (Fitbit, Garmin, Xiaomi Band)
- [ ] Smart speakers (HomePod, Nest, Echo)

**Milestone 2-4:** Repeat rollout process

---

### **12. Success Metrics (Per Category)**

| Metric | Laptops (Current) | Cameras (Target) | Smartphones (Target) | Gadgets (Target) |
|--------|------------------|------------------|---------------------|------------------|
| **Products in DB** | 1000+ | 500+ | 300+ | 800+ |
| **Monthly Active Users** | 5000 | 2000 | 3000 | 4000 |
| **Matchmaker Conversion** | 8% | 5% | 10% | 12% |
| **Avg. Order Value (MYR)** | 5000 | 8000 | 3000 | 800 |
| **Affiliate Revenue (MYR/mo)** | 15000 | 8000 | 9000 | 12000 |
| **AI Quality (Faithfulness)** | ≥92% | ≥95% | ≥92% | ≥90% |

---

### **13. Risks & Mitigations**

#### **Risk 1: Data Quality Variance**
- **Issue:** Camera specs are more complex and inconsistent across manufacturers
- **Mitigation:**
  - Manual review of top 100 models
  - Community contribution system (user-submitted corrections)
  - Confidence scores on spec accuracy

#### **Risk 2: Domain Expertise Gap**
- **Issue:** AI hallucination risk higher in specialized domains (camera gear)
- **Mitigation:**
  - Use Gemini 2.5 Pro (smarter model) for camera persona
  - Higher hallucination detection threshold (97% confidence)
  - Photography expert review of AI responses (monthly audit)

#### **Risk 3: User Confusion (Too Many Categories)**
- **Issue:** Users overwhelmed by choice
- **Mitigation:**
  - Gradual rollout (one category per quarter)
  - Clear category switcher in navigation
  - "Not sure? Take our quiz" → Route to correct category

#### **Risk 4: SEO Cannibalization**
- **Issue:** Multiple categories competing for same keywords
- **Mitigation:**
  - Category-specific URL structure (/laptops/, /cameras/)
  - Distinct meta descriptions and titles
  - Separate sitemaps per category

---

### **14. Future Innovations (Post-Phase 14)**

#### **Cross-Category Recommendations**
```
User: "I'm a content creator, budget RM 15000"
AI: "I recommend:
  - Laptop: Lenovo Legion 5 Pro (RM 5999) for editing
  - Camera: Sony A6400 + kit lens (RM 4500) for B-roll
  - Gadget: AirPods Pro (RM 1199) for audio monitoring
  Total: RM 11,698 (under budget! ✅)"
```

#### **Used/Refurbished Market**
- Partner with certified refurbishers
- Price history charts (new vs used)
- Warranty verification

#### **AR Try-On (Gadgets)**
- Virtual try-on for smartwatches (wrist size visualization)
- Earbud fit predictor (based on ear shape photo)

#### **AI-Generated Content**
- Auto-generate comparison articles (SEO)
- Product review summaries (synthesize 100+ reviews)
- Video scripts for YouTube channel

---

## 🎯 Conclusion

This expansion strategy transforms AI Bradaa from a **laptop-only platform** to a **comprehensive tech product ecosystem**. The architecture is designed for:

1. **Scalability:** Generic product model handles infinite categories
2. **Maintainability:** No code duplication, category configs drive behavior
3. **User Experience:** Each category feels native, not bolted-on
4. **Business Growth:** Diversified revenue streams, broader audience

**Next Steps:**
1. Finalize camera data ingestion (500+ models)
2. Deploy universal `products` table (database/migrations/005-*.sql)
3. Build camera matchmaker UI (Q1 2026)

---

**Document Owner:** AI Bradaa Product Team
**Last Reviewed:** 2025-11-11
**Next Review:** 2026-01-01 (Post-Camera Launch)

**Related Documents:**
- `ARCHITECTURE.md` - Technical architecture
- `CHANGELOG.md` - Development history
- `.env.example` - Environment configuration
- `configs/categories.yaml` - Category configurations (to be created)
