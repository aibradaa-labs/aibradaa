# Database Schema Specification
## Neon PostgreSQL - AI Bradaa Production Database

**Version:** 2.0.0
**Database:** Neon PostgreSQL (Serverless)
**Last Updated:** 2025-11-11 15:15 MYT (Asia/Kuala_Lumpur)
**Status:** Production Specification
**Timezone:** All timestamps in UTC, application timezone Asia/Kuala_Lumpur

---

## 📋 Executive Summary

This document defines the complete database schema for AI Bradaa, hosted on **Neon PostgreSQL** (serverless, auto-scaling). The schema supports:

- Multi-tier user system (Free, Pro, Ultimate)
- Token quota tracking and cost ceiling enforcement
- Multi-category product catalog (laptops, cameras, smartphones, gadgets)
- AI conversation history with TOON format compression
- One Piece catchphrase system v4.1
- ABO-84 Beta access control
- Stripe subscription management
- PDPA compliance (data retention, audit logs)

---

## 🗄️ Database Overview

### **Connection Details**

```bash
# Production (Neon)
DATABASE_URL="postgresql://user:password@ep-twilight-wave-123456.us-east-2.aws.neon.tech/aibradaa?sslmode=require"

# Development (Local PostgreSQL)
DATABASE_URL="postgresql://localhost:5432/aibradaa_dev"
```

### **Schema Metadata**

| Attribute | Value |
|-----------|-------|
| **Encoding** | UTF-8 |
| **Collation** | en_US.UTF-8 |
| **Timezone** | UTC (app converts to Asia/Kuala_Lumpur) |
| **Max Connections** | 100 (Neon auto-scaling) |
| **SSL Mode** | Required (TLS 1.3) |
| **Encryption at Rest** | AES-256 (Neon managed) |
| **Backups** | Daily (Neon automatic, 7-day retention) |

---

## 📊 Schema Diagram (ERD)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   users     │◄────────│  subscriptions   │         │  conversations  │
│             │ 1     * │                  │         │                 │
│  - id (PK)  │         │  - id (PK)       │    ┌───►│  - id (PK)      │
│  - email    │         │  - user_id (FK)  │    │    │  - user_id (FK) │
│  - tier     │         │  - stripe_sub_id │    │    │  - messages     │
│  - abo84    │         │  - status        │    │    │  - module       │
└─────────────┘         └──────────────────┘    │    └─────────────────┘
       │                                         │
       │ 1                                       │
       │                                         │
       │                                         │ *
       ▼ *                                       │
┌─────────────┐                           ┌─────────────┐
│   quotas    │                           │  sessions   │
│             │                           │             │
│  - id (PK)  │                           │  - id (PK)  │
│  - user_id  │                           │  - user_id  │
│  - period   │                           │  - token    │
│  - tokens   │                           │  - expires  │
└─────────────┘                           └─────────────┘


┌──────────────────┐         ┌─────────────────┐
│   products       │         │  catchphrases   │
│                  │         │                 │
│  - id (PK)       │         │  - id (PK)      │
│  - category      │         │  - character    │
│  - brand         │         │  - original     │
│  - model         │         │  - paraphrased  │
│  - specs (JSONB) │         │  - sentiment    │
│  - price_myr     │         └─────────────────┘
└──────────────────┘


┌──────────────────┐         ┌─────────────────┐
│   analytics      │         │  audit_logs     │
│                  │         │                 │
│  - id (PK)       │         │  - id (PK)      │
│  - user_id (FK)  │         │  - user_id (FK) │
│  - event_type    │         │  - action       │
│  - metadata      │         │  - ip_address   │
│  - timestamp     │         │  - timestamp    │
└──────────────────┘         └─────────────────┘
```

---

## 📝 Table Specifications

### **1. users** - User Accounts

**Purpose:** Central user identity and tier management

```sql
CREATE TABLE users (
  -- Primary Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash TEXT,  -- NULL for OAuth users

  -- Profile
  nickname TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Tier System
  tier TEXT NOT NULL DEFAULT 'free',
    CHECK (tier IN ('free', 'pro', 'ultimate')),

  -- OAuth Providers
  google_id TEXT UNIQUE,
  google_email TEXT,
  facebook_id TEXT UNIQUE,
  github_id TEXT UNIQUE,

  -- 2FA (Two-Factor Authentication)
  totp_secret TEXT,  -- Base32-encoded TOTP secret
  totp_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[],  -- Array of backup codes (hashed)

  -- ABO-84 Beta Access
  abo84_beta_access BOOLEAN DEFAULT FALSE,
  abo84_signup_date TIMESTAMPTZ,
  abo84_activation_code TEXT UNIQUE,

  -- Preferences
  timezone TEXT DEFAULT 'Asia/Kuala_Lumpur',
  language TEXT DEFAULT 'en',
    CHECK (language IN ('en', 'ms')),  -- English, Malay
  theme TEXT DEFAULT 'auto',
    CHECK (theme IN ('light', 'dark', 'auto')),
  preferences JSONB DEFAULT '{}'::jsonb,
    -- Example: {"email_notifications": true, "catchphrase_daily": true}

  -- Account Status
  status TEXT DEFAULT 'active',
    CHECK (status IN ('active', 'suspended', 'deleted')),
  suspension_reason TEXT,
  suspended_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,

  -- PDPA Compliance
  data_retention_days INT DEFAULT 90,  -- Delete conversations after N days
  marketing_consent BOOLEAN DEFAULT FALSE,
  marketing_consent_date TIMESTAMPTZ,

  -- Referral System (Future)
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),

  -- Metadata
  signup_source TEXT,  -- 'organic', 'google_ad', 'facebook_ad', 'referral'
  utm_source TEXT,
  utm_campaign TEXT
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_status ON users(status) WHERE status = 'active';
CREATE INDEX idx_users_abo84 ON users(abo84_beta_access) WHERE abo84_beta_access = TRUE;
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Trigger: Update updated_at on every row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### **2. subscriptions** - Stripe Subscription Management

**Purpose:** Track Pro/Ultimate tier subscriptions

```sql
CREATE TABLE subscriptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tier & Status
  tier TEXT NOT NULL,
    CHECK (tier IN ('pro', 'ultimate')),
  status TEXT NOT NULL,
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),

  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,  -- Stripe Price ID (e.g., price_123ABC)
  stripe_product_id TEXT NOT NULL,

  -- Billing Period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Pricing
  amount_myr DECIMAL(10, 2) NOT NULL,
    -- Pro: 30.00, Ultimate: 80.00
  currency TEXT DEFAULT 'MYR',
  billing_cycle TEXT DEFAULT 'monthly',
    CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- Payment Method
  payment_method TEXT,  -- 'card', 'fpx', 'grabpay', etc.
  last4 TEXT,  -- Last 4 digits of card
  card_brand TEXT,  -- 'visa', 'mastercard', 'amex'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Trigger: Update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### **3. quotas** - Token Usage & Cost Tracking

**Purpose:** Enforce tier-based quotas and cost ceilings

```sql
CREATE TABLE quotas (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Period (Monthly)
  period TEXT NOT NULL,  -- Format: 'YYYY-MM' (e.g., '2025-11')
    CHECK (period ~ '^\d{4}-\d{2}$'),

  -- Token Usage (Gemini API)
  tokens_used BIGINT DEFAULT 0,
  tokens_limit BIGINT NOT NULL,
    -- Free: 30000, Pro: 400000, Ultimate: 3000000

  -- Request Usage
  requests_used INT DEFAULT 0,
  requests_limit INT NOT NULL,
    -- Free: 50, Pro: 800, Ultimate: 5000

  -- Cost Tracking (MYR)
  cost_myr DECIMAL(10, 2) DEFAULT 0.00,
  cost_ceiling_myr DECIMAL(10, 2) NOT NULL,
    -- Free: 8.00, Pro: 40.00, Ultimate: 200.00

  -- TTS Usage (Pro & Ultimate only)
  tts_minutes_used INT DEFAULT 0,
  tts_minutes_limit INT DEFAULT 0,
    -- Free: 0, Pro: 10, Ultimate: unlimited (9999)

  -- Vision API Usage (Future)
  vision_requests_used INT DEFAULT 0,
  vision_requests_limit INT DEFAULT 0,

  -- Quota Status
  quota_exceeded BOOLEAN DEFAULT FALSE,
  exceeded_at TIMESTAMPTZ,
  notified BOOLEAN DEFAULT FALSE,  -- Email sent about quota?

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique Constraint: One quota per user per period
  UNIQUE(user_id, period)
);

-- Indexes
CREATE INDEX idx_quotas_user_period ON quotas(user_id, period);
CREATE INDEX idx_quotas_exceeded ON quotas(quota_exceeded) WHERE quota_exceeded = TRUE;
CREATE INDEX idx_quotas_period ON quotas(period DESC);

-- Function: Get or create quota for user+period
CREATE OR REPLACE FUNCTION get_or_create_quota(
  p_user_id UUID,
  p_period TEXT,
  p_tier TEXT
) RETURNS quotas AS $$
DECLARE
  v_quota quotas;
  v_tokens_limit BIGINT;
  v_requests_limit INT;
  v_cost_ceiling DECIMAL(10, 2);
  v_tts_limit INT;
BEGIN
  -- Set limits based on tier
  CASE p_tier
    WHEN 'free' THEN
      v_tokens_limit := 30000;
      v_requests_limit := 50;
      v_cost_ceiling := 8.00;
      v_tts_limit := 0;
    WHEN 'pro' THEN
      v_tokens_limit := 400000;
      v_requests_limit := 800;
      v_cost_ceiling := 40.00;
      v_tts_limit := 10;
    WHEN 'ultimate' THEN
      v_tokens_limit := 3000000;
      v_requests_limit := 5000;
      v_cost_ceiling := 200.00;
      v_tts_limit := 9999;
  END CASE;

  -- Get existing quota or create new
  INSERT INTO quotas (
    user_id,
    period,
    tokens_limit,
    requests_limit,
    cost_ceiling_myr,
    tts_minutes_limit
  ) VALUES (
    p_user_id,
    p_period,
    v_tokens_limit,
    v_requests_limit,
    v_cost_ceiling,
    v_tts_limit
  )
  ON CONFLICT (user_id, period) DO UPDATE SET
    tokens_limit = EXCLUDED.tokens_limit,
    requests_limit = EXCLUDED.requests_limit,
    cost_ceiling_myr = EXCLUDED.cost_ceiling_myr,
    tts_minutes_limit = EXCLUDED.tts_minutes_limit
  RETURNING * INTO v_quota;

  RETURN v_quota;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at
CREATE TRIGGER update_quotas_updated_at
  BEFORE UPDATE ON quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### **4. conversations** - AI Chat History

**Purpose:** Store multi-turn conversations with AI modules

```sql
CREATE TABLE conversations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Module
  module TEXT NOT NULL,
    CHECK (module IN ('command', 'versus', 'intel', 'matchmaker', 'camera')),

  -- Conversation Metadata
  title TEXT,  -- Auto-generated or user-provided
  summary TEXT,  -- AI-generated summary after 10+ messages

  -- Messages (JSONB Array)
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Format: [
    --   {"role": "user", "content": "...", "timestamp": "2025-11-11T12:00:00Z"},
    --   {"role": "assistant", "content": "...", "model": "gemini-2.5-flash", "tokens": 150}
    -- ]

  -- Message Stats
  message_count INT DEFAULT 0,
  total_tokens INT DEFAULT 0,

  -- Conversation State
  status TEXT DEFAULT 'active',
    CHECK (status IN ('active', 'archived', 'deleted')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,

  -- PDPA Compliance (Auto-delete old conversations)
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_module ON conversations(module);
CREATE INDEX idx_conversations_status ON conversations(status) WHERE status = 'active';
CREATE INDEX idx_conversations_expires ON conversations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_conversations_user_module ON conversations(user_id, module);

-- Trigger: Update updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-delete expired conversations (run daily via cron)
CREATE OR REPLACE FUNCTION delete_expired_conversations()
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM conversations
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

### **5. sessions** - User Sessions (JWT)

**Purpose:** Track active JWT tokens for revocation

```sql
CREATE TABLE sessions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- JWT Token
  token_hash TEXT UNIQUE NOT NULL,  -- SHA-256 hash of JWT token
  refresh_token_hash TEXT UNIQUE,   -- For refresh token flow (future)

  -- Session Metadata
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,  -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,

  -- Geo Location (Optional)
  country_code TEXT,  -- ISO 3166-1 alpha-2 (e.g., 'MY')
  city TEXT,

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,

  -- Revocation
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_revoked ON sessions(revoked) WHERE revoked = FALSE;

-- Function: Revoke all sessions for a user (e.g., on password change)
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_revoked_count INT;
BEGIN
  UPDATE sessions
  SET revoked = TRUE,
      revoked_at = NOW(),
      revocation_reason = 'password_changed'
  WHERE user_id = p_user_id
    AND revoked = FALSE;

  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  RETURN v_revoked_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Delete expired sessions (run daily via cron)
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

### **6. products** - Universal Product Catalog

**Purpose:** Multi-category product database (laptops, cameras, smartphones, gadgets)

```sql
CREATE TABLE products (
  -- Primary Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category
  category TEXT NOT NULL,
    CHECK (category IN ('laptop', 'camera', 'smartphone', 'gadget')),

  -- Brand & Model
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  sku TEXT UNIQUE,  -- Manufacturer SKU

  -- Specs (Category-Specific, Flexible JSONB Schema)
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Example for laptop:
    -- {
    --   "cpu": {"brand": "AMD", "model": "Ryzen 7 7840HS", "cores": 8},
    --   "gpu": {"brand": "NVIDIA", "model": "RTX 4060", "vram": 8},
    --   "ram": {"size": 16, "type": "DDR5"},
    --   "storage": {"type": "SSD", "size": 512}
    -- }

  -- Pricing
  price_myr DECIMAL(10, 2),
  price_usd DECIMAL(10, 2),
  price_last_updated TIMESTAMPTZ,
  price_history JSONB DEFAULT '[]'::jsonb,
    -- [{" date": "2025-11-01", "myr": 5299, "usd": 1200}]

  -- Availability
  in_stock BOOLEAN DEFAULT TRUE,
  stock_level INT,

  -- Marketing
  description TEXT,
  highlights TEXT[],  -- Key selling points
  use_cases TEXT[],   -- ['gaming', 'productivity', 'photography']
  target_audience TEXT[],  -- ['professionals', 'students', 'gamers']

  -- Media
  images JSONB DEFAULT '[]'::jsonb,
    -- [{"url": "https://...", "alt": "...", "type": "main"|"gallery"}]
  videos JSONB DEFAULT '[]'::jsonb,

  -- Affiliate Links
  affiliates JSONB DEFAULT '{}'::jsonb,
    -- {"lazada": {"url": "https://...", "price": 5299}, "shopee": {...}}

  -- Reviews & Ratings
  rating_avg DECIMAL(3, 2),  -- 0.00 - 5.00
  rating_count INT DEFAULT 0,
  reviews_summary JSONB,  -- Aggregated sentiment, pros/cons

  -- SEO
  slug TEXT UNIQUE,  -- URL-friendly: lenovo-legion-5-pro-2024
  meta_title TEXT,
  meta_description TEXT,

  -- Metadata
  release_date DATE,
  discontinued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_in_stock ON products(in_stock) WHERE in_stock = TRUE;
CREATE INDEX idx_products_price ON products(price_myr);
CREATE INDEX idx_products_rating ON products(rating_avg DESC NULLS LAST);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- GIN index for JSONB specs (enables flexible querying)
CREATE INDEX idx_products_specs ON products USING GIN (specs);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING GIN (
  to_tsvector('english',
    coalesce(brand, '') || ' ' ||
    coalesce(model, '') || ' ' ||
    coalesce(description, '')
  )
);

-- Trigger: Update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### **7. catchphrases** - One Piece Catchphrase System v4.1

**Purpose:** Store and manage One Piece character catchphrases

```sql
CREATE TABLE catchphrases (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Character
  character TEXT NOT NULL,
    CHECK (character IN (
      'Luffy', 'Zoro', 'Nami', 'Usopp', 'Sanji',
      'Chopper', 'Robin', 'Franky', 'Brook', 'Jinbe'
    )),

  -- Catchphrase Text
  original_text TEXT NOT NULL,
  paraphrased_text TEXT,

  -- Metadata
  arc TEXT,  -- 'East Blue', 'Alabasta', 'Wano', etc.
  episode_number INT,
  manga_chapter INT,

  -- Sentiment & Tone
  sentiment TEXT,
    CHECK (sentiment IN (
      'motivational', 'humorous', 'epic', 'emotional',
      'inspiring', 'defiant', 'protective', 'friendly'
    )),
  tone TEXT,  -- 'serious', 'playful', 'dramatic'

  -- Paraphrase Tracking (v4.1)
  paraphrase_count INT DEFAULT 0,
  last_paraphrased_at TIMESTAMPTZ,
  paraphrase_threshold DECIMAL(3, 2) DEFAULT 0.70,
    -- v4.1: 70% rephrase (was 80% in v4.0)

  -- Daily Rotation
  last_shown_at TIMESTAMPTZ,
  show_count INT DEFAULT 0,

  -- Active Status
  active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_catchphrases_character ON catchphrases(character);
CREATE INDEX idx_catchphrases_active ON catchphrases(active) WHERE active = TRUE;
CREATE INDEX idx_catchphrases_sentiment ON catchphrases(sentiment);
CREATE INDEX idx_catchphrases_last_shown ON catchphrases(last_shown_at NULLS FIRST);

-- Trigger: Update updated_at
CREATE TRIGGER update_catchphrases_updated_at
  BEFORE UPDATE ON catchphrases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Get daily catchphrase (rotates, personalizes with nickname)
CREATE OR REPLACE FUNCTION get_daily_catchphrase(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  character TEXT,
  original_text TEXT,
  paraphrased_text TEXT,
  personalized_text TEXT
) AS $$
DECLARE
  v_nickname TEXT;
  v_catchphrase catchphrases%ROWTYPE;
BEGIN
  -- Get user nickname
  SELECT nickname INTO v_nickname
  FROM users
  WHERE id = p_user_id;

  -- Get least recently shown catchphrase
  SELECT * INTO v_catchphrase
  FROM catchphrases
  WHERE active = TRUE
  ORDER BY last_shown_at NULLS FIRST, RANDOM()
  LIMIT 1;

  -- Update last_shown_at
  UPDATE catchphrases
  SET last_shown_at = NOW(),
      show_count = show_count + 1
  WHERE id = v_catchphrase.id;

  -- Personalize text (replace "{nakama}" with nickname)
  RETURN QUERY SELECT
    v_catchphrase.id,
    v_catchphrase.character,
    v_catchphrase.original_text,
    v_catchphrase.paraphrased_text,
    REPLACE(
      COALESCE(v_catchphrase.paraphrased_text, v_catchphrase.original_text),
      '{nakama}',
      COALESCE(v_nickname, 'nakama')  -- Default to "nakama" if no nickname
    ) AS personalized_text;
END;
$$ LANGUAGE plpgsql;
```

---

### **8. analytics** - Usage Analytics

**Purpose:** Track user behavior, feature usage, conversion funnels

```sql
CREATE TABLE analytics (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference (nullable for anonymous events)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event
  event_type TEXT NOT NULL,
    -- 'page_view', 'matchmaker_started', 'matchmaker_completed',
    -- 'versus_compare', 'chat_message', 'tier_upgraded', etc.
  event_category TEXT,
    -- 'engagement', 'conversion', 'error', 'performance'

  -- Event Data (Flexible JSONB)
  metadata JSONB DEFAULT '{}'::jsonb,
    -- Example: {
    --   "page": "/matchmaker",
    --   "referrer": "https://google.com",
    --   "duration_ms": 15000,
    --   "converted": true
    -- }

  -- Session Tracking
  session_id UUID,
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_user ON analytics(user_id);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp DESC);
CREATE INDEX idx_analytics_session ON analytics(session_id);

-- GIN index for JSONB metadata (flexible querying)
CREATE INDEX idx_analytics_metadata ON analytics USING GIN (metadata);

-- Partition by month (for performance with large datasets)
-- (Requires PostgreSQL 10+ partitioning, Neon supports this)
-- Future enhancement: Partition analytics table by month
```

---

### **9. audit_logs** - PDPA Compliance Audit Trail

**Purpose:** Log all data access and modifications for PDPA compliance

```sql
CREATE TABLE audit_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Action
  action TEXT NOT NULL,
    CHECK (action IN (
      'user_created', 'user_updated', 'user_deleted',
      'data_exported', 'data_deleted', 'tier_upgraded',
      'password_changed', '2fa_enabled', 'session_revoked',
      'conversation_viewed', 'conversation_deleted'
    )),

  -- Target Resource
  resource_type TEXT,  -- 'user', 'conversation', 'subscription'
  resource_id UUID,

  -- Context
  ip_address INET,
  user_agent TEXT,
  method TEXT,  -- 'GET', 'POST', 'PUT', 'DELETE'
  endpoint TEXT,  -- '/api/users/123'

  -- Changes (Before/After for updates)
  changes JSONB,
    -- Example: {"before": {"tier": "free"}, "after": {"tier": "pro"}}

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Retention policy: Keep audit logs for 2 years (PDPA requirement)
-- Future: Partition by month, archive after 2 years to cold storage
```

---

## 🔄 Database Migrations

### **Migration Files** (database/migrations/)

```sql
-- 001-initial-schema.sql
-- Creates: users, sessions tables

-- 002-add-tier-system.sql
-- Creates: subscriptions, quotas tables

-- 003-add-product-catalog.sql
-- Creates: products table, search indexes

-- 004-add-catchphrases.sql
-- Creates: catchphrases table, daily rotation function

-- 005-add-conversations.sql
-- Creates: conversations table, auto-delete function

-- 006-add-analytics.sql
-- Creates: analytics, audit_logs tables

-- 007-add-multi-category-support.sql
-- Updates: products table with category checks, new indexes
```

### **Migration Runner** (database/migrate.mjs)

```bash
# Apply migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Reset database (DANGER: Deletes all data)
npm run db:reset
```

---

## 🛡️ Security & Compliance

### **Encryption**

- **At Rest:** AES-256 (Neon managed)
- **In Transit:** TLS 1.3 (SSL required)
- **Password Hashing:** bcrypt (cost factor 12)
- **JWT Tokens:** RS256 (2048-bit keys), token_hash stored (not raw token)
- **TOTP Secrets:** Base32-encoded, stored in users.totp_secret

### **PDPA Compliance**

1. **Right to Access:** Users can export all their data (JSON)
2. **Right to Deletion:** Users can delete their account (`users.status = 'deleted'`)
3. **Data Retention:** Conversations auto-delete after 90 days (configurable per user)
4. **Audit Trail:** All data access logged in `audit_logs` table (2-year retention)
5. **Consent:** Marketing consent tracked (`users.marketing_consent`)

### **Row-Level Security (RLS)** (Future Enhancement)

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY users_self_access ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::UUID);

-- Policy: Admins can see all users
CREATE POLICY users_admin_access ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = current_setting('app.current_user_id')::UUID
        AND tier = 'ultimate'
        AND preferences->>'admin' = 'true'
    )
  );
```

---

## 📈 Performance Optimization

### **Indexing Strategy**

- **Primary Keys:** All UUIDs with B-tree indexes (default)
- **Foreign Keys:** Indexed for JOIN performance
- **JSONB Columns:** GIN indexes for flexible queries (`specs`, `metadata`)
- **Full-Text Search:** GIN indexes with `to_tsvector()` on products
- **Partial Indexes:** `WHERE active = TRUE` reduces index size
- **Composite Indexes:** `(user_id, period)` for quota lookups

### **Query Optimization**

```sql
-- BAD: Sequential scan on large table
SELECT * FROM conversations WHERE user_id = '123...';

-- GOOD: Uses idx_conversations_user index
SELECT * FROM conversations WHERE user_id = '123...' LIMIT 50;

-- EXPLAIN ANALYZE to check query plan
EXPLAIN ANALYZE SELECT * FROM conversations WHERE user_id = '123...' LIMIT 50;
```

### **Connection Pooling**

```javascript
// Neon serverless driver (auto-pooling)
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Queries are automatically pooled
const users = await sql`SELECT * FROM users WHERE email = ${email}`;
```

---

## 🧪 Testing Strategy

### **Unit Tests** (tests/unit/database.test.mjs)

```javascript
import { sql } from '../database/client.mjs';

describe('Quota System', () => {
  test('Creates quota with correct limits for Free tier', async () => {
    const result = await sql`
      SELECT * FROM get_or_create_quota(
        'user-uuid-here',
        '2025-11',
        'free'
      )
    `;

    expect(result[0].tokens_limit).toBe(30000);
    expect(result[0].requests_limit).toBe(50);
    expect(result[0].cost_ceiling_myr).toBe(8.00);
  });
});
```

### **Integration Tests** (tests/integration/database.test.mjs)

```javascript
test('User signup flow creates user + quota + session', async () => {
  // 1. Create user
  const user = await createUser({ email: 'test@example.com', tier: 'free' });

  // 2. Verify quota created automatically
  const quota = await getQuota(user.id, '2025-11');
  expect(quota.tokens_limit).toBe(30000);

  // 3. Verify session created on login
  const session = await createSession(user.id, 'jwt-token-hash');
  expect(session.user_id).toBe(user.id);
});
```

---

## 📚 Appendix

### **A. Tier Comparison**

| Feature | Free | Pro | Ultimate |
|---------|------|-----|----------|
| **Monthly Token Limit** | 30,000 | 400,000 | 3,000,000 |
| **Monthly Requests** | 50 | 800 | 5,000 |
| **Cost Ceiling (MYR)** | 8 | 40 | 200 |
| **TTS Minutes/Day** | 0 | 10 | Unlimited |
| **ABO-84 Beta Access** | ❌ | Dashboard Only | ✅ Full Access |
| **Conversation History** | 7 days | 30 days | 90 days |

### **B. Sample Queries**

```sql
-- Get user with tier and quota info
SELECT
  u.id,
  u.email,
  u.tier,
  u.abo84_beta_access,
  q.tokens_used,
  q.tokens_limit,
  q.cost_myr
FROM users u
LEFT JOIN quotas q ON q.user_id = u.id AND q.period = TO_CHAR(NOW(), 'YYYY-MM')
WHERE u.email = 'user@example.com';

-- Find all products in a category, sorted by rating
SELECT
  id,
  brand,
  model,
  price_myr,
  rating_avg,
  in_stock
FROM products
WHERE category = 'laptop'
  AND in_stock = TRUE
  AND price_myr BETWEEN 2000 AND 8000
ORDER BY rating_avg DESC NULLS LAST, price_myr ASC
LIMIT 10;

-- Get user's conversation count by module
SELECT
  module,
  COUNT(*) AS conversation_count,
  SUM(message_count) AS total_messages
FROM conversations
WHERE user_id = 'user-uuid-here'
  AND status = 'active'
GROUP BY module
ORDER BY conversation_count DESC;
```

---

**Document Status:** ✅ Production Specification
**Next Review:** 2026-01-01 (Post-Phase 12 Launch)
**Owner:** AI Bradaa Database Team

**Related Documents:**
- `ARCHITECTURE.md` - System architecture
- `MULTI_CATEGORY_EXPANSION_STRATEGY.md` - Product expansion
- `.env.example` - Environment variables
- `database/migrations/` - Migration SQL files
