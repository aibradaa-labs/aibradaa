# ARCHITECTURE.md - AI Bradaa System Architecture

**Last Updated:** 2025-11-11 14:30 MYT (Asia/Kuala_Lumpur)
**Version:** 2.0.0
**Status:** Source of Truth
**Platform:** Netlify Serverless + Neon PostgreSQL

---

## 🎯 Document Purpose

This document provides **file-by-file documentation** of the AI Bradaa codebase architecture. It serves as the definitive reference for understanding:
- Where specific functionality lives
- How systems interact
- What each file/directory does
- Future expansion paths

**Companion Documents:**
- `ULTIMATE_CONSOLIDATED_AUDIT_REPORT.md` - Detailed audit & quality metrics
- `AGENT.md` - Contributor workflow guide
- `README.md` - Project overview
- `CHANGELOG.md` - Development history

---

## 📊 Architecture Overview

### **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    NETLIFY PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌──────────────────────┐     │
│  │  Static Assets  │         │  Serverless Functions│     │
│  │  (dist/public/) │         │  (netlify/functions/)│     │
│  │                 │         │                      │     │
│  │  • Landing Page │◄────────┤  • 46 API Endpoints  │     │
│  │  • PWA App      │         │  • Gemini AI         │     │
│  │  • Service Worker        │  • Auth/JWT          │     │
│  └─────────────────┘         │  • Rate Limiting     │     │
│                              └──────────────────────┘     │
│                                       │                    │
└───────────────────────────────────────┼────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              ┌─────▼─────┐      ┌─────▼─────┐     ┌──────▼──────┐
              │   NEON    │      │  GOOGLE   │     │  SENDGRID   │
              │ PostgreSQL│      │  GEMINI   │     │    Email    │
              │  Database │      │    AI     │     │   Service   │
              └───────────┘      └───────────┘     └─────────────┘
```

### **Technology Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vanilla JS + PWA | Zero-dependency, fast, offline-first |
| **Backend** | Netlify Functions (Node.js) | Serverless API endpoints |
| **Database** | Neon PostgreSQL | Serverless, encrypted data storage |
| **AI Engine** | Google Gemini 2.5 | Flash, Pro, Pro-Exp models |
| **CDN/Hosting** | Netlify + Cloudflare | Global edge network |
| **Email** | SendGrid | Transactional emails |
| **Payments** | Stripe | MYR subscription processing |
| **Auth** | JWT + OAuth2 | Google, Facebook, GitHub |
| **Monitoring** | OpenTelemetry | SLO tracking, performance |

---

## 📁 Root Directory Structure

```
aibradaa/
├── .github/              # CI/CD workflows, issue templates
├── .env.example          # Environment variables template (150+ vars)
├── netlify.toml          # Netlify deployment config
├── package.json          # Node.js dependencies (Netlify-optimized)
│
├── 📄 SOURCE OF TRUTH DOCUMENTS (5 files)
│   ├── ULTIMATE_CONSOLIDATED_AUDIT_REPORT.md  # Master audit report
│   ├── ARCHITECTURE.md                        # This file
│   ├── AGENT.md                              # Contributor guide
│   ├── README.md                             # Project overview
│   └── CHANGELOG.md                          # Development history
│
├── 🌐 FRONTEND (Static Assets)
│   ├── public/           # Landing page & static assets
│   └── app/              # PWA application components
│
├── ⚡ BACKEND (Serverless)
│   ├── netlify/functions/  # 46 Netlify Functions (API endpoints)
│   ├── shared/             # Shared utilities across frontend/backend
│   └── api/                # ⚠️ DEPRECATED (Express API - DO NOT USE)
│
├── 🤖 AI SYSTEMS
│   ├── ai_pod/           # AI personas, pipelines, governance
│   └── syeddy-debugger/  # Error tracking & diagnostics
│
├── 💾 DATA & DATABASE
│   ├── data/             # Laptop dataset (Lenovo, Asus, Dell, etc.)
│   ├── database/         # PostgreSQL schema & migrations
│   └── configs/          # YAML configurations
│
├── 🧪 TESTING & QA
│   └── tests/            # Smoke, integration, unit, eval suites
│
├── 🛠️ TOOLS & BUILD
│   ├── tools/            # Build scripts, ETL pipelines
│   ├── scripts/          # Utility scripts
│   └── ops/              # Operations, runbooks, monitoring
│
└── 📦 SPECIAL DIRECTORIES
    ├── archive/          # Historical docs & deprecated code
    ├── abo-84-beta/      # ABO-84 AI coding assistant beta
    ├── internal/         # Internal references (One Piece catchphrases)
    └── project/governance/  # 84-mentor governance documents
```

---

## 🌐 FRONTEND ARCHITECTURE

### **public/** - Landing Page & Static Assets

**Purpose:** Main landing page, marketing content, PWA manifest

#### **Root Files**
- **`public/index.html`** (99,940 bytes) - Main landing page
  - Hero section with tier pricing (Free/Pro/Ultimate)
  - AI Bradaa Intelligence showcase
  - Responsive design, mobile-first
  - Links to PWA app

- **`public/app.html`** (70,522 bytes) - PWA Application Shell
  - Single Page Application (SPA) entry point
  - Service worker registration
  - IndexedDB initialization
  - Routes: /matchmaker, /versus, /explorer, /command, /intel, /appendices, /camera-tech

- **`public/manifest.json`** - PWA Manifest
  - App name, icons, theme colors
  - Offline capability configuration
  - Install prompts

- **`public/service-worker.js`** - PWA Service Worker
  - Offline caching strategy
  - Background sync for data updates
  - Push notification handlers

- **`public/404.html`** - Custom 404 error page

#### **Directory Breakdown**

##### **`public/styles/`** - CSS Stylesheets
- `public/styles/main.css` - Global styles, CSS variables
- `public/styles/responsive.css` - Mobile breakpoints
- `public/styles/components.css` - Reusable UI components
- `public/styles/pwa.css` - PWA-specific styles

##### **`public/scripts/`** - JavaScript Modules
- **`landing-enhanced.js`** (12KB) - Landing page interactivity
  - AI Bradaa Intelligence module animation
  - Tier comparison tooltips
  - Smooth scrolling, lazy loading
  - **UPDATED:** Replaced 12 mentor names with "AI Bradaa" branding

- **`pwa-init.js`** - PWA initialization
  - Service worker registration
  - Install prompt handling
  - Update notifications

##### **`public/js/`** - Core JavaScript Libraries
- `public/js/app.js` - Main app logic
- `public/js/router.js` - Client-side routing
- `public/js/db.js` - IndexedDB wrapper
- `public/js/api.js` - API client (calls Netlify Functions)
- `public/js/auth.js` - Authentication logic (JWT)
- `public/js/tier.js` - Tier system (Free/Pro/Ultimate)

##### **`public/components/`** - Reusable UI Components
- `header.html` - Navigation bar
- `footer.html` - Footer with links
- `tier-card.html` - Pricing tier cards
- `laptop-card.html` - Laptop recommendation card
- `catchphrase-widget.html` - One Piece catchphrase display

##### **`public/icons/`** - PWA Icons
- Icon sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Formats: PNG, WebP
- Maskable icons for Android adaptive icons

##### **`public/assets/`** - Images & Media
- `public/assets/images/` - Marketing images, screenshots
- `public/assets/logos/` - AI Bradaa logos (light/dark mode)
- `public/assets/icons/` - UI icons (SVG)

##### **`public/pwa/`** - PWA Specific Files
- Offline pages
- App screenshots for install prompt
- Splash screens

##### **`public/downloads/`** - Downloadable Resources
- ABO-84 desktop builds (.exe, .dmg, .AppImage)
- User guides (PDF)
- Sample data exports

---

### **app/** - PWA Application Components

**Purpose:** Modular components for the PWA application (loaded by app.html)

```
app/
├── shared/               # Shared utilities for app modules
│   ├── api-client.mjs    # API calls to Netlify Functions
│   ├── db-manager.mjs    # IndexedDB CRUD operations
│   ├── state.mjs         # Global app state management
│   └── utils.mjs         # Common utilities
│
├── matchmaker/           # AI Matchmaker Module
│   ├── index.html        # Matchmaker UI
│   ├── matchmaker.js     # Quiz logic, recommendations
│   └── styles.css        # Matchmaker-specific styles
│
├── versus/               # Head-to-Head Comparison
│   ├── index.html        # Comparison UI (2 laptop cards)
│   ├── versus.js         # Comparison logic, diff highlighting
│   └── styles.css
│
├── explorer/             # Laptop Database Explorer
│   ├── index.html        # Table view, filters, search
│   ├── explorer.js       # Table rendering, filters
│   └── styles.css
│
├── command/              # Command Module (AI Chat)
│   ├── index.html        # Chat interface
│   ├── command.js        # Chat logic, Gemini API calls
│   └── styles.css
│
├── intel/                # Intel Module (Deep Analysis)
│   ├── index.html        # Intel dashboard
│   ├── intel.js          # Deep research, trend analysis
│   └── styles.css
│
├── appendices/           # Documentation & Guides
│   ├── index.html        # Appendix catalog
│   ├── appendices.js     # Dynamic content loading
│   └── styles.css
│
└── camera_tech/          # 📷 NEW: Camera & DSLR Module
    ├── index.html        # Camera catalog, filters
    ├── camera.js         # Camera recommendations
    └── styles.css
```

**Note on camera_tech:** This is the foundation for multi-category expansion (Phase 11 requirement). Future additions: smartphones, gadgets.

---

## ⚡ BACKEND ARCHITECTURE (Netlify Functions)

### **netlify/functions/** - Serverless API Endpoints

**Purpose:** Backend API powered by Netlify Functions (Node.js serverless)

**Total Functions:** 46 endpoints
**Bundler:** esbuild (configured in netlify.toml)
**Runtime:** Node.js 18+

#### **Core API Endpoints**

##### **`health.mjs`** - Health Check
- **Path:** `/.netlify/functions/health`
- **Methods:** GET
- **Purpose:** System health, readiness, liveness checks
- **Routes:**
  - `/health` - Basic health check
  - `/health/detailed` - Memory, uptime, services
  - `/health/ready` - Readiness probe (for load balancers)
  - `/health/live` - Liveness probe
  - `/health/metrics` - Performance metrics
  - `/health/version` - Build version info

##### **`chat.mjs`** - AI Chat Interface
- **Path:** `/.netlify/functions/chat`
- **Methods:** POST
- **Purpose:** Main AI chat endpoint (Command Module)
- **Features:**
  - Gemini 2.5 Flash/Pro integration
  - Conversation history management
  - Rate limiting (tier-based)
  - Token quota tracking
  - TOON format optimization

##### **`command.mjs`** - Command Module Backend
- **Path:** `/.netlify/functions/command`
- **Methods:** POST
- **Purpose:** Advanced AI commands (Command Module)
- **Features:**
  - Multi-turn conversations
  - Context injection from laptopDb
  - Hallucination detection
  - Citation tracking

##### **`versus.mjs`** - Head-to-Head Comparison
- **Path:** `/.netlify/functions/versus`
- **Methods:** POST
- **Purpose:** Generate AI-powered comparisons
- **Input:** 2 laptop IDs
- **Output:** Detailed comparison report with winner

##### **`intel.mjs`** - Intel Module Backend
- **Path:** `/.netlify/functions/intel`
- **Methods:** POST
- **Purpose:** Deep research, trend analysis
- **Features:**
  - Market trend analysis
  - Price forecasting
  - Competitor analysis
  - SEO-optimized reports

##### **`camera.mjs`** - 📷 NEW: Camera Module Backend
- **Path:** `/.netlify/functions/camera`
- **Methods:** GET, POST
- **Purpose:** Camera/DSLR recommendations
- **Features:**
  - Camera database queries
  - AI-powered camera matching
  - Equipment bundle suggestions
  - Photography use case analysis

#### **Data & Search Functions**

##### **`data.mjs`** - Laptop Database API
- **Path:** `/.netlify/functions/data`
- **Methods:** GET, POST
- **Purpose:** CRUD operations for laptop data
- **Features:**
  - Pagination, filtering, sorting
  - Full-text search
  - Brand filtering (Lenovo, Asus, Dell, HP, Acer, MSI)

##### **`rag-search.mjs`** - RAG Search Engine
- **Path:** `/.netlify/functions/rag-search`
- **Methods:** POST
- **Purpose:** Retrieval-Augmented Generation search
- **Features:**
  - Semantic search over laptop database
  - Vector embeddings (Gemini Embedding API)
  - Reranking for accuracy

##### **`explorer-search.mjs`** - Explorer Module Search
- **Path:** `/.netlify/functions/explorer-search`
- **Methods:** GET
- **Purpose:** Fast keyword search for Explorer module
- **Features:**
  - Autocomplete suggestions
  - Fuzzy matching
  - Category filters

#### **AI & ML Functions**

##### **`matchmaker-recommend.mjs`** - Matchmaker Recommendations
- **Path:** `/.netlify/functions/matchmaker-recommend`
- **Methods:** POST
- **Purpose:** Generate personalized laptop recommendations
- **Input:** User quiz answers (budget, usage, preferences)
- **Output:** Top 5 matches with confidence scores

##### **`deep-research.mjs`** - Deep Research Engine
- **Path:** `/.netlify/functions/deep-research`
- **Methods:** POST
- **Purpose:** Multi-stage research pipeline
- **Features:**
  - Web scraping (price aggregators)
  - Sentiment analysis (reviews)
  - Competitive intelligence
  - Report generation

##### **`vision-analysis.mjs`** - Image Analysis
- **Path:** `/.netlify/functions/vision-analysis`
- **Methods:** POST
- **Purpose:** Gemini Vision API for image analysis
- **Use Cases:**
  - Upload laptop photo → identify model
  - Screenshot → extract specs
  - Compare visual aesthetics

##### **`paraphrase-engine.mjs`** - Catchphrase Paraphrasing
- **Path:** `/.netlify/functions/paraphrase-engine`
- **Methods:** POST
- **Purpose:** Paraphrase One Piece catchphrases (v4.1)
- **Features:**
  - 70% rephrase threshold (was 80% in v4.0)
  - "Yo" daily greeting
  - "Nakama" + user nickname
  - Sentiment preservation

##### **`gemini-live.mjs`** - Gemini Live API
- **Path:** `/.netlify/functions/gemini-live`
- **Methods:** POST
- **Purpose:** Real-time streaming responses
- **Features:**
  - Server-Sent Events (SSE)
  - Token-by-token streaming
  - Abort support

#### **Authentication & Authorization**

##### **`auth.mjs`** - Authentication
- **Path:** `/.netlify/functions/auth`
- **Methods:** POST
- **Purpose:** User login, registration, token refresh
- **Features:**
  - JWT token generation (RS256)
  - OAuth2 integrations (Google, Facebook, GitHub)
  - Password hashing (bcrypt)
  - 2FA support (TOTP)

##### **`users.mjs`** - User Management
- **Path:** `/.netlify/functions/users`
- **Methods:** GET, POST, PUT, DELETE
- **Purpose:** User CRUD operations
- **Features:**
  - Profile management
  - Tier assignment (Free/Pro/Ultimate)
  - Quota tracking

#### **Payment & Subscriptions**

##### **`stripe-webhook.mjs`** - Stripe Webhook Handler
- **Path:** `/.netlify/functions/stripe-webhook`
- **Methods:** POST
- **Purpose:** Handle Stripe payment events
- **Events:**
  - `checkout.session.completed` → Upgrade user tier
  - `customer.subscription.updated` → Update subscription
  - `customer.subscription.deleted` → Downgrade to Free tier
  - `invoice.payment_failed` → Suspend account

#### **ABO-84 Beta Functions**

##### **`abo84-downloads.mjs`** - ABO-84 Download Manager
- **Path:** `/.netlify/functions/abo84-downloads`
- **Methods:** GET
- **Purpose:** Manage ABO-84 desktop app downloads
- **Access:** Ultimate tier only
- **Platforms:** Windows (.exe), macOS (.dmg), Linux (.AppImage)

##### **`abo84-download-track.mjs`** - Download Tracking
- **Path:** `/.netlify/functions/abo84-download-track`
- **Methods:** POST
- **Purpose:** Track download analytics
- **Data:** User ID, platform, version, timestamp

#### **Catchphrase System**

##### **`catchphrases.mjs`** - Catchphrase CRUD
- **Path:** `/.netlify/functions/catchphrases`
- **Methods:** GET, POST, PUT, DELETE
- **Purpose:** Manage One Piece catchphrase database

##### **`catchphrase-get.mjs`** - Get Daily Catchphrase
- **Path:** `/.netlify/functions/catchphrase-get`
- **Methods:** GET
- **Purpose:** Fetch catchphrase for dashboard
- **Logic:** Rotate daily, personalize with user nickname

##### **`catchphrase-paraphrase.mjs`** - Paraphrase Catchphrase
- **Path:** `/.netlify/functions/catchphrase-paraphrase`
- **Methods:** POST
- **Purpose:** Generate paraphrased version (Gemini AI)

##### **`cron-catchphrase-fetch.mjs`** - Scheduled Fetch
- **Path:** `/.netlify/functions/cron-catchphrase-fetch`
- **Methods:** (Cron trigger)
- **Schedule:** Daily at 3:00 AM MYT
- **Purpose:** Auto-fetch new catchphrases from source

##### **`admin-catchphrases.mjs`** - Admin Panel
- **Path:** `/.netlify/functions/admin-catchphrases`
- **Methods:** GET, POST, PUT, DELETE
- **Purpose:** Admin-only catchphrase management
- **Access:** Ultimate tier + admin role

#### **Utilities & Middleware**

##### **`netlify/functions/utils/`** - Shared Utilities

- **`response.mjs`** - Standard response formatters
  - `successResponse(data, statusCode)` - JSON success
  - `errorResponse(message, statusCode, details)` - JSON error
  - `handleOptions()` - CORS preflight
  - CORS headers, security headers

- **`auth.mjs`** - Auth utilities
  - `verifyJWT(token)` - Verify JWT token
  - `extractUser(event)` - Get user from Authorization header
  - `requireAuth(handler)` - Auth middleware wrapper

- **`rateLimiter.mjs`** - Rate limiting
  - Tier-based limits (Free: 50/day, Pro: 800/day, Ultimate: 5000/day)
  - IP-based throttling
  - Exponential backoff

- **`quota.mjs`** - Quota management
  - Token counting (Gemini API)
  - Cost ceiling enforcement
  - Rollover tracking

- **`gemini.mjs`** - Gemini API client
  - Model selection (Flash/Pro/Pro-Exp)
  - Streaming support
  - Error handling, retries

- **`laptopDb.mjs`** - Laptop database utilities
  - Query builders
  - Caching layer (Redis/Memory)
  - Data validation

- **`cache.mjs`** - Caching utilities
  - In-memory cache (development)
  - Redis cache (production, future)
  - TTL management

- **`otel.mjs`** - OpenTelemetry instrumentation
  - Trace spans
  - Metrics (latency, errors)
  - SLO tracking

- **`error-tracker.mjs`** - Error tracking
  - Error logging
  - Sentry integration (future)
  - Structured error formatting

- **`semantic-router.mjs`** - Intent classification
  - Route user queries to correct module
  - Confidence scoring

- **`toon.mjs`** - TOON format utilities
  - Token-optimized object notation
  - Compression/decompression

- **`retry.mjs`** - Retry logic
  - Exponential backoff
  - Max retries: 3
  - Jitter for distributed systems

- **`feature-gates.mjs`** - Feature flags
  - Enable/disable features by tier
  - A/B testing support

- **`abo84-access.mjs`** - ABO-84 access control
  - Check beta signup limit (20 users)
  - Pro dashboard vs Ultimate full access

##### **`netlify/functions/middleware/`** - Middleware

- **`tier-check.mjs`** - Tier validation middleware
  - Check user tier before endpoint execution
  - Return 403 if insufficient tier

#### **Other Functions**

##### **`affiliates.mjs`** - Affiliate Link Management
- **Path:** `/.netlify/functions/affiliates`
- **Purpose:** Manage affiliate links for laptops

##### **`affiliates-out.mjs`** - Affiliate Click Tracking
- **Path:** `/.netlify/functions/affiliates-out`
- **Purpose:** Track affiliate click-throughs, redirect to vendor

##### **`appendices-catalog.mjs`** - Appendix Catalog
- **Path:** `/.netlify/functions/appendices-catalog`
- **Purpose:** Fetch appendix list (guides, tutorials)

##### **`deck.mjs`** - Presentation Deck Generator
- **Path:** `/.netlify/functions/deck`
- **Purpose:** Generate marketing decks (PDF)

##### **`mentor-consultation.mjs`** - 84-Mentor Consultation
- **Path:** `/.netlify/functions/mentor-consultation`
- **Purpose:** Internal governance decision engine
- **Note:** Not exposed in public UI (internal only)

##### **`recommendations.mjs`** - Generic Recommendations
- **Path:** `/.netlify/functions/recommendations`
- **Purpose:** Multi-purpose recommendation engine

##### **`tts-generate.mjs`** - Text-to-Speech
- **Path:** `/.netlify/functions/tts-generate`
- **Purpose:** Generate audio narrations (Gemini TTS)
- **Access:** Pro tier (10 min/day), Ultimate tier (unlimited)

---

## 🤖 AI SYSTEMS

### **ai_pod/** - AI Intelligence Core

**Purpose:** Centralized AI logic, personas, pipelines, governance

```
ai_pod/
├── personas/             # AI Personas (12 mentor modules)
│   ├── command/          # Command Module persona
│   ├── versus/           # Versus Module persona
│   ├── intel/            # Intel Module persona
│   ├── offers/           # Offers Module persona (future)
│   └── ...
│
├── pipelines/            # AI Processing Pipelines
│   ├── rag-pipeline.mjs  # RAG search pipeline
│   ├── eval-pipeline.mjs # Evaluation pipeline
│   └── research-pipeline.mjs # Deep research pipeline
│
├── governance/           # 84-Mentor Governance
│   └── 84/               # 84-mentor council configs
│       ├── eval_suites/  # Evaluation suites
│       └── policies/     # Governance policies
│
├── services/             # AI Service Integrations
│   ├── gemini.mjs        # Google Gemini API
│   ├── embedding.mjs     # Text embedding service
│   └── vision.mjs        # Vision API service
│
├── adapters/             # External API Adapters
│   ├── price-scraper.mjs # Price aggregator scraper
│   └── review-scraper.mjs # Review aggregator scraper
│
└── prototypes/           # Experimental Features
    ├── voice-assistant/  # Voice interface (future)
    └── ar-preview/       # AR laptop preview (future)
```

#### **Personas** - AI Module Personalities

Each persona defines:
- **System prompt** (personality, tone, expertise)
- **Context injection** (laptop data, user history)
- **Response format** (markdown, JSON, TOON)
- **Safety guidelines** (no hallucination, no bias)

**Example: `ai_pod/personas/command/system-prompt.md`**
```
You are the AI Bradaa Command Module, a Malaysia-first AI assistant specializing
in laptop recommendations. You are friendly, concise, and data-driven. You ALWAYS
cite laptop models from the database and NEVER hallucinate specs.
```

#### **Governance** - 84-Mentor Council

**Purpose:** Internal quality gates and decision-making framework

**Key Files:**
- `ai_pod/governance/84/eval_suites/README.md` - Evaluation methodology
- `ai_pod/governance/84/eval_suites/command-eval.yaml` - Command Module eval suite
- `ai_pod/governance/84/eval_suites/versus-eval.yaml` - Versus Module eval suite
- `ai_pod/governance/84/policies/hallucination-policy.md` - <8% threshold

**Note:** 84-mentor references are internal only. Public-facing UI uses "AI Bradaa Intelligence" branding.

---

### **syeddy-debugger/** - Error Tracking & Diagnostics

**Purpose:** Centralized error tracking, signal monitoring

```
syeddy-debugger/
├── signals/              # Error signal definitions
│   ├── frontend.json     # Frontend error taxonomy
│   └── backend.json      # Backend error taxonomy
│
├── handlers/             # Error handlers
│   ├── global-handler.mjs # Catch-all error handler
│   └── log-formatter.mjs  # Structured logging
│
└── dashboards/           # Error dashboards (future)
    └── ops-dashboard.html # Ops team dashboard
```

---

## 💾 DATA & DATABASE

### **data/** - Laptop Dataset

**Purpose:** Laptop specifications database (JSON files)

**Structure:**
```
data/
├── laptops.json          # Master laptop database (1000+ laptops)
├── brands/               # Brand-specific data
│   ├── lenovo.json
│   ├── asus.json
│   ├── dell.json
│   ├── hp.json
│   ├── acer.json
│   └── msi.json
│
└── enrichment/           # Enriched data (reviews, prices)
    ├── reviews.json      # Aggregated user reviews
    └── prices.json       # Price history (time series)
```

**Schema:** Each laptop entry contains:
- `id` (string, unique)
- `brand` (string)
- `model` (string)
- `cpu` (object: brand, model, cores, threads, baseClock, boostClock)
- `gpu` (object: brand, model, vram)
- `ram` (object: size, type, speed)
- `storage` (object: type, size)
- `display` (object: size, resolution, refreshRate, panel)
- `price` (object: myr, usd, priceDate)
- `weight` (number, kg)
- `battery` (object: capacity, lifeHours)
- `ports` (array: USB-C, USB-A, HDMI, etc.)
- `features` (array: strings)
- `useCases` (array: gaming, productivity, content creation, etc.)
- `affiliateLinks` (object: lazada, shopee, official)

---

### **database/** - PostgreSQL Schema & Migrations

**Purpose:** Neon PostgreSQL database schema, migrations, repositories

```
database/
├── schema/               # SQL schema definitions
│   ├── users.sql         # Users table
│   ├── subscriptions.sql # Subscriptions table
│   ├── quotas.sql        # Token quotas table
│   ├── sessions.sql      # User sessions table
│   ├── conversations.sql # Chat conversation history
│   ├── catchphrases.sql  # One Piece catchphrases
│   ├── analytics.sql     # Usage analytics
│   └── cameras.sql       # 📷 NEW: Camera database (future)
│
├── migrations/           # Database migrations
│   ├── 001-initial-schema.sql
│   ├── 002-add-tier-system.sql
│   ├── 003-add-abo84-beta.sql
│   ├── 004-add-catchphrase-v4.1.sql
│   └── 005-add-camera-tables.sql  # 📷 Future migration
│
├── repositories/         # Data access layer
│   ├── user-repo.mjs     # User CRUD operations
│   ├── subscription-repo.mjs # Subscription management
│   ├── quota-repo.mjs    # Quota tracking
│   └── conversation-repo.mjs # Chat history
│
└── migrate.mjs           # Migration runner
```

#### **Key Tables**

##### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- null for OAuth users
  tier TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'ultimate'
  nickname TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,

  -- OAuth providers
  google_id TEXT UNIQUE,
  facebook_id TEXT UNIQUE,
  github_id TEXT UNIQUE,

  -- 2FA
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT FALSE,

  -- ABO-84 Beta
  abo84_beta_access BOOLEAN DEFAULT FALSE,
  abo84_signup_date TIMESTAMPTZ,

  -- Metadata
  timezone TEXT DEFAULT 'Asia/Kuala_Lumpur',
  language TEXT DEFAULT 'en',
  preferences JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_abo84 ON users(abo84_beta_access) WHERE abo84_beta_access = TRUE;
```

##### **subscriptions**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,  -- 'pro', 'ultimate'
  status TEXT NOT NULL,  -- 'active', 'cancelled', 'past_due'
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
```

##### **quotas**
```sql
CREATE TABLE quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,  -- 'YYYY-MM' (monthly)

  -- Token usage
  tokens_used BIGINT DEFAULT 0,
  tokens_limit BIGINT NOT NULL,

  -- Request usage
  requests_used INT DEFAULT 0,
  requests_limit INT NOT NULL,

  -- Cost tracking (MYR)
  cost_myr DECIMAL(10, 2) DEFAULT 0.00,
  cost_ceiling_myr DECIMAL(10, 2) NOT NULL,

  -- TTS usage (Pro tier only)
  tts_minutes_used INT DEFAULT 0,
  tts_minutes_limit INT DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, period)
);

CREATE INDEX idx_quotas_user_period ON quotas(user_id, period);
```

##### **conversations**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,  -- 'command', 'versus', 'intel'
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_module ON conversations(module);
```

##### **catchphrases**
```sql
CREATE TABLE catchphrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character TEXT NOT NULL,
  original_text TEXT NOT NULL,
  paraphrased_text TEXT,
  sentiment TEXT,  -- 'motivational', 'humorous', 'epic', etc.
  paraphrase_count INT DEFAULT 0,
  last_paraphrased_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catchphrases_character ON catchphrases(character);
CREATE INDEX idx_catchphrases_active ON catchphrases(active) WHERE active = TRUE;
```

---

### **configs/** - YAML Configurations

**Purpose:** Environment-agnostic configurations

**Files:**
- `configs/tiers.yaml` - Tier system configuration (Free/Pro/Ultimate)
- `configs/models.yaml` - Gemini model configurations (Flash/Pro/Pro-Exp)
- `configs/slo.yaml` - Service Level Objectives
- `configs/feature-flags.yaml` - Feature flags
- `configs/rate-limits.yaml` - Rate limiting rules
- `configs/env.example` - Environment variable template (superseded by root `.env.example`)

---

## 🧪 TESTING & QA

### **tests/** - Test Suites

**Purpose:** Comprehensive testing (smoke, integration, unit, evals)

```
tests/
├── smoke/                # Smoke tests (quick health checks)
│   └── boot.test.mjs     # App boots, API responds
│
├── integration/          # Integration tests
│   ├── api-integration.test.mjs  # API endpoint tests
│   ├── auth-flow.test.mjs        # Login/register flow
│   └── payment-flow.test.mjs     # Stripe integration
│
├── unit/                 # Unit tests
│   ├── utils.test.mjs
│   ├── quota.test.mjs
│   └── tier.test.mjs
│
├── data/                 # Data validation tests
│   └── schema.test.mjs   # Validate laptops.json schema
│
├── ux/                   # UX/Accessibility tests
│   └── a11y.test.mjs     # Axe-core accessibility audit
│
├── evals/                # AI quality evaluation
│   └── runner.mjs        # Eval suite runner (Andrew Ng methodology)
│
└── eval-runner.mjs       # Main eval runner (used by CI)
```

#### **Evaluation Suites** (AI Quality Gates)

**Purpose:** Prevent AI quality regressions (hallucination, toxicity, etc.)

**Methodology:** Based on Andrew Ng's eval suite design (84-mentor governance)

**Key Metrics:**
- **Accuracy:** ≥95% of baseline
- **Faithfulness:** ≥92% (citations match ground truth)
- **Citation Rate:** ≥90% of responses cite laptop models
- **Toxicity:** ≤0.5%
- **Slice Parity:** Δ ≤5% (no bias across user demographics)
- **P95 Latency:** Per-surface SLO (Command: 2s, Versus: 3s, Intel: 5s)

**CI Integration:** `.github/workflows/eval-suite.yml` runs on every PR

---

## 🛠️ TOOLS & BUILD

### **tools/** - Build Scripts & Utilities

```
tools/
├── build-netlify.mjs     # ✅ NEW: Netlify-optimized build script
├── build.mjs             # ⚠️ DEPRECATED: Old Express build (DO NOT USE)
│
├── etl/                  # Extract-Transform-Load pipelines
│   ├── laptops-ingest.mjs  # Ingest laptop data from sources
│   ├── price-update.mjs    # Update prices from aggregators
│   └── review-scraper.mjs  # Scrape reviews from e-commerce
│
└── dev-static/           # Development static server
    └── server.mjs        # Simple HTTP server for testing
```

#### **build-netlify.mjs** - Production Build Script

**Purpose:** Build optimized assets for Netlify deployment

**What it does:**
1. Cleans `dist/` directory
2. Copies `public/` → `dist/public/`
3. Copies `app/` → `dist/app/` (if exists)
4. Copies `ai_pod/`, `data/`, `configs/`, `shared/`
5. Copies `package.json`, `.env.example`
6. Optimizes CSS (removes comments, minifies)
7. Creates `build-info.json` (version, timestamp, commit)
8. Generates `manifest.json` (file list, sizes)

**Output:**
- `dist/public/` - Static assets (served by Netlify)
- `dist/app/` - PWA components
- 174 files, ~2.54 MB

**Build time:** ~200ms

**Note:** Netlify Functions (`netlify/functions/`) are auto-deployed separately, NOT copied to `dist/`.

---

### **scripts/** - Utility Scripts

```
scripts/
├── deploy.sh             # Deploy to Netlify (git push → auto-deploy)
├── db-seed.sh            # Seed database with sample data
├── backup.sh             # Backup database to S3 (future)
└── health-check.sh       # Ping health endpoints
```

---

### **ops/** - Operations & Monitoring

```
ops/
├── runbooks/             # Operational runbooks
│   ├── incident-response.md  # Incident response playbook
│   ├── rollback.md          # Rollback procedure
│   └── scaling.md           # Scaling guide
│
├── score-history.json    # Composite score history (CI artifact)
│
└── dashboards/           # Grafana dashboards (future)
    └── slo-dashboard.json
```

---

## 🔐 SECURITY & COMPLIANCE

### **Security Architecture**

#### **Authentication Flow**

```
1. User visits /login
2. Selects OAuth (Google/Facebook/GitHub) OR email/password
3. OAuth: Redirect → Provider → Callback → JWT issued
4. Email/Password: bcrypt verify → JWT issued
5. JWT stored in localStorage (httpOnly cookie future)
6. Every API call: Authorization: Bearer <JWT>
7. Function verifies JWT → Extract user → Check tier → Execute
```

#### **Authorization Layers**

1. **Tier-based access**
   - Free: Matchmaker, Explorer (50 requests/month)
   - Pro: All modules (800 requests/month, TTS 10 min/day)
   - Ultimate: ABO-84 Beta, unlimited TTS

2. **Rate limiting**
   - IP-based throttling (100 requests/15 min per IP)
   - User-based quotas (tier-specific)

3. **Cost ceiling enforcement**
   - Free: RM8/month max
   - Pro: RM40/month max
   - Ultimate: RM200/month max
   - Auto-suspend if exceeded

#### **Data Protection**

- **Encryption at rest:** AES-256 (Neon PostgreSQL)
- **Encryption in transit:** TLS 1.3
- **Password hashing:** bcrypt (cost factor 12)
- **JWT signing:** RS256 (2048-bit keys)
- **Secrets management:** Netlify environment variables

#### **PDPA Compliance** (Malaysia Personal Data Protection Act)

- **Consent:** Explicit opt-in for data collection
- **Access:** Users can export their data (JSON)
- **Deletion:** Users can delete their account (GDPR-style)
- **Retention:** Conversations deleted after 90 days (configurable)
- **Audit trail:** All data access logged

#### **Security Headers** (netlify.toml)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
```

---

## 🚀 DEPLOYMENT PROCESS

### **Netlify Deployment Flow**

```
1. Developer: git push origin <branch>
2. GitHub: Webhook → Netlify
3. Netlify: Trigger build
   a. npm ci (install dependencies)
   b. npm run build (run tools/build-netlify.mjs)
   c. Deploy dist/public/ to CDN
   d. Deploy netlify/functions/ to serverless infrastructure
4. Netlify: Run GitHub workflows
   a. .github/workflows/ci.yml (tests, linting)
   b. .github/workflows/composite-score.yml (quality gate)
   c. .github/workflows/eval-suite.yml (AI quality gate)
5. If all workflows pass: Deployment live
6. If any workflow fails: Deployment blocked
```

### **Environment Variables** (Netlify Dashboard)

**Critical Secrets:**
- `GEMINI_API_KEY` - Google Gemini API key
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - JWT signing key (RS256 private key)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `SENDGRID_API_KEY` - SendGrid API key
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Email SMTP config

See `.env.example` for full list (150+ variables).

### **Rollback Procedure**

```bash
# 1. Find previous good deployment
netlify deploys:list

# 2. Rollback to previous deployment
netlify rollback <deploy-id>

# 3. Verify health
curl https://aibradaa.com/.netlify/functions/health
```

---

## 📦 SPECIAL DIRECTORIES

### **archive/** - Historical Documents

**Purpose:** Archive deprecated code, old docs (for reference only)

```
archive/
├── audit_reports_2025_11_09/      # Phase 1-10 audit reports
├── documentation_2025-11-09/      # Old documentation
└── obsolete_code_2025-11-08/      # Deprecated code (Express API)
```

**Note:** Content in `archive/` is NOT used in production. Kept for historical reference.

---

### **abo-84-beta/** - ABO-84 AI Coding Assistant

**Purpose:** Desktop app for AI-powered coding (Ultimate tier only)

```
abo-84-beta/
├── demo/                 # Demo videos, screenshots
├── builds/               # Platform-specific builds
│   ├── windows/          # .exe installer
│   ├── macos/            # .dmg installer
│   └── linux/            # .AppImage
│
├── src/                  # Electron source code (separate repo)
└── README.md             # ABO-84 documentation
```

**Beta Signup Limit:** 20 users (tracked in database)
**Access:**
- Pro tier: Dashboard preview only
- Ultimate tier: Full access (download + use)

---

### **internal/** - Internal References

**Purpose:** Internal reference materials (not exposed in public UI)

```
internal/
├── one-piece-reference/  # One Piece catchphrase source material
│   ├── characters/       # Character bios
│   └── quotes/           # Original Japanese + English translations
│
└── brand-assets/         # AI Bradaa brand assets
    ├── logos/            # Logo variations
    └── style-guide.md    # Brand style guide
```

---

### **project/governance/** - Governance Documents

**Purpose:** 84-mentor governance policies, eval suites

```
project/governance/
└── 84/
    ├── eval_suites/      # Evaluation suite configurations
    │   ├── README.md     # Eval methodology
    │   ├── command-eval.yaml
    │   ├── versus-eval.yaml
    │   └── intel-eval.yaml
    │
    └── policies/         # Governance policies
        ├── hallucination-policy.md  # <8% threshold
        ├── cost-policy.md          # Cost ceiling enforcement
        └── tier-policy.md          # Tier access rules
```

**Note:** 84-mentor governance is **internal only**. Public UI shows "AI Bradaa Intelligence" branding.

---

## 🔮 FUTURE EXPANSION ARCHITECTURE

### **Multi-Category Expansion** (Phase 11 Requirement)

**Vision:** Expand from laptops → cameras → smartphones → gadgets

#### **Expansion Roadmap**

```
Phase 1 (Current): Laptops
  └── Fully operational

Phase 2 (Q1 2026): Cameras & DSLR
  ├── Camera database (data/cameras.json)
  ├── Camera module (app/camera_tech/, public/camera-tech/)
  ├── Camera function (netlify/functions/camera.mjs) ✅ READY
  ├── Camera persona (ai_pod/personas/camera/)
  └── Camera eval suite (ai_pod/governance/84/eval_suites/camera-eval.yaml)

Phase 3 (Q2 2026): Smartphones
  ├── Smartphone database (data/smartphones.json)
  ├── Smartphone module (app/smartphones/, public/smartphones/)
  ├── Smartphone function (netlify/functions/smartphone.mjs)
  └── Cross-category comparisons (laptop vs smartphone specs)

Phase 4 (Q3 2026): Gadgets (Smartwatches, Earbuds, Tablets)
  └── Unified recommendation engine (cross-category bundles)
```

#### **Architecture Changes for Multi-Category**

**1. Database Schema Abstraction**

```sql
-- Generic products table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,  -- 'laptop', 'camera', 'smartphone', 'gadget'
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  specs JSONB NOT NULL,  -- Category-specific specs
  price_myr DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
```

**2. Unified API Endpoints**

- `/.netlify/functions/products` - Generic product search (category filter)
- `/.netlify/functions/recommend` - Cross-category recommendations

**3. Frontend Modularity**

Each category gets its own PWA module:
- `app/laptops/` (current: `app/matchmaker/`, `app/versus/`, etc.)
- `app/cameras/` (new: `app/camera_tech/` → rename to `app/cameras/`)
- `app/smartphones/` (future)
- `app/gadgets/` (future)

Shared components in `app/shared/`:
- `product-card.mjs` - Generic product card
- `comparison-view.mjs` - Generic comparison UI
- `filter-panel.mjs` - Generic filter sidebar

---

### **n8n Workflow Automation** (Evaluation Pending)

**Potential Use Cases:**

1. **Automated Price Updates**
   - Trigger: Daily cron (3 AM MYT)
   - Workflow: Scrape Lazada/Shopee → Update `data/prices.json` → Commit to repo

2. **Review Aggregation**
   - Trigger: Weekly cron
   - Workflow: Scrape e-commerce reviews → Sentiment analysis (Gemini) → Update `data/reviews.json`

3. **Catchphrase Auto-Fetch**
   - Trigger: Daily cron (currently handled by `cron-catchphrase-fetch.mjs`)
   - Workflow: Fetch new One Piece quotes → Paraphrase (Gemini) → Insert to database

4. **User Onboarding Email Sequences**
   - Trigger: New user signup
   - Workflow: Send welcome email (SendGrid) → Wait 3 days → Send Pro upgrade offer

5. **Ops Alerts**
   - Trigger: Composite score drops below 99
   - Workflow: Send Slack notification to ops team

**Decision Criteria:**
- **Pros:** Visual workflow builder, no-code, extensive integrations
- **Cons:** Additional cost (€20-€50/month), adds complexity, vendor lock-in
- **Alternative:** Continue using Netlify scheduled functions (current approach)

**Recommendation (Phase 11 Analysis):**
- **Not needed yet.** Current scheduled functions (`cron-catchphrase-fetch.mjs`) handle automation.
- **Revisit** when workflows become complex (5+ steps, multiple integrations).
- **If implemented:** Self-host n8n on Cloudflare Workers to avoid vendor lock-in.

---

## 📚 APPENDICES

### **A. File Naming Conventions**

- **Frontend:** kebab-case (`landing-enhanced.js`, `tier-card.html`)
- **Backend:** kebab-case with `.mjs` extension (`chat.mjs`, `rate-limiter.mjs`)
- **Configs:** kebab-case YAML (`tiers.yaml`, `slo.yaml`)
- **Docs:** UPPERCASE Markdown (`README.md`, `CHANGELOG.md`, `ARCHITECTURE.md`)
- **Data:** kebab-case JSON (`laptops.json`, `prices.json`)

### **B. Code Organization Principles**

1. **Separation of Concerns**
   - Frontend (`public/`, `app/`) - UI only, no business logic
   - Backend (`netlify/functions/`) - API endpoints, business logic
   - Shared (`shared/`) - Utilities used by both frontend/backend
   - AI (`ai_pod/`) - AI-specific logic (personas, pipelines)

2. **No Duplication**
   - Shared utilities in `shared/utils/`
   - Netlify function utilities in `netlify/functions/utils/`
   - Never copy-paste code between files

3. **Modularity**
   - Each PWA module is self-contained (`app/matchmaker/`, `app/versus/`, etc.)
   - Each Netlify function is stateless and independent
   - No tight coupling between modules

4. **Future-Proof**
   - Generic abstractions (`products` table, not `laptops` table)
   - Category-agnostic utilities (`product-card.mjs`, not `laptop-card.mjs`)
   - Feature flags for gradual rollouts

### **C. Deprecated Code (DO NOT USE)**

**DEPRECATED: `/api/` directory**
- **Reason:** Old Express API server (pre-Netlify migration)
- **Status:** Kept in repo for reference, NOT deployed
- **Action:** Use `netlify/functions/` instead

**DEPRECATED: `tools/build.mjs`**
- **Reason:** Copies `api/` directory to `dist/`
- **Status:** Replaced by `tools/build-netlify.mjs`
- **Action:** Use `npm run build` (runs `build-netlify.mjs`)

### **D. Key Performance Indicators (KPIs)**

**Quality Metrics:**
- **Composite Score:** ≥99/100 (enforced by CI)
- **Test Coverage:** ≥70%
- **Hallucination Rate:** <8%
- **P95 Latency:** Per-surface SLO

**Business Metrics:**
- **Free Tier Conversion:** Target 5% → Pro
- **Pro → Ultimate Upgrade:** Target 10%
- **ABO-84 Beta Signups:** 20/20 (full)
- **Monthly Active Users (MAU):** Target 1000 by Q2 2026

**SLO Targets:**
- **Uptime:** 99.9% (Netlify SLA)
- **API Availability:** 99.5%
- **Command Module P95:** <2s
- **Versus Module P95:** <3s
- **Intel Module P95:** <5s

### **E. External Dependencies**

**Critical Services:**
- **Netlify:** Hosting, Functions, CDN
- **Neon:** PostgreSQL database
- **Google Gemini:** AI inference
- **SendGrid:** Email delivery
- **Stripe:** Payment processing
- **Cloudflare:** DNS, DDoS protection

**Fallback Strategy:**
- Database: Backup to S3 daily (future)
- AI: Fallback to rule-based recommendations if Gemini unavailable
- Email: Fallback to SMTP (configured in .env.example)

---

## 🎓 Learning Resources

**For New Contributors:**
1. Read `AGENT.md` - Contributor workflow
2. Read `README.md` - Project overview
3. Read this file (`ARCHITECTURE.md`) - Architecture deep dive
4. Review `CHANGELOG.md` - See what's been built (Phases 1-11)
5. Explore `ULTIMATE_CONSOLIDATED_AUDIT_REPORT.md` - Quality audit

**For AI Agents:**
- Use this document as reference for "Where does X live?"
- Check `AGENT.md` for "How do I do Y?"
- Consult `ULTIMATE_CONSOLIDATED_AUDIT_REPORT.md` for quality standards

---

## 📞 Support & Contribution

**Questions?**
- Check this document first
- Review `AGENT.md` for workflow guidance
- Search `CHANGELOG.md` for historical context

**Found a bug?**
- Check `syeddy-debugger/` error signals
- Review `ops/runbooks/incident-response.md`
- Open GitHub issue (if external contributor)

**Want to contribute?**
- Follow `AGENT.md` contribution workflow
- Ensure composite score ≥99 (CI enforced)
- All PRs require eval suite passing

---

**END OF ARCHITECTURE.md**

*This document is the definitive source of truth for AI Bradaa architecture. Last updated: 2025-11-11 14:30 MYT.*
