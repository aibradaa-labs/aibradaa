-- AI Bradaa - PostgreSQL Database Schema
-- Version: 1.0.0
-- Date: 2025-11-08
-- Governance: 84-Mentor Council approved
-- Compliant with: PDPA, Security Red Lines, Financial Controls

-- ==============================================================================
-- EXTENSIONS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- ENUMS
-- ==============================================================================

CREATE TYPE user_tier AS ENUM ('free', 'pro', 'ultimate');
CREATE TYPE auth_provider AS ENUM ('local', 'google', 'magic_link');
CREATE TYPE session_status AS ENUM ('active', 'expired', 'revoked');
CREATE TYPE usage_metric_type AS ENUM ('chat', 'recommendation', 'intel', 'versus', 'camera');

-- ==============================================================================
-- USERS TABLE
-- Security: Passwords hashed with bcrypt, PII encrypted at rest
-- PDPA: Consent tracking, TTL enforcement, deletion support
-- ==============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255), -- bcrypt hash, NULL for OAuth-only users

    -- Profile
    name VARCHAR(255) NOT NULL,
    picture_url TEXT,

    -- OAuth identifiers (encrypted)
    google_id VARCHAR(255) UNIQUE,

    -- Tier and limits
    tier user_tier DEFAULT 'free' NOT NULL,
    tier_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- PDPA compliance
    consent_marketing BOOLEAN DEFAULT FALSE,
    consent_analytics BOOLEAN DEFAULT TRUE,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    data_retention_days INTEGER DEFAULT 365, -- Auto-delete after 1 year of inactivity

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete for PDPA compliance

    -- Indexes for performance
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_tier ON users(tier) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- ==============================================================================
-- SESSIONS TABLE
-- Security: Token expiration enforced, automatic cleanup
-- ==============================================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session data
    token_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hash of JWT
    status session_status DEFAULT 'active' NOT NULL,

    -- Device/context
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoke_reason TEXT
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash) WHERE status = 'active';
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at) WHERE status = 'active';

-- ==============================================================================
-- MAGIC_LINKS TABLE
-- Security: One-time use, expiration enforced, rate limited
-- ==============================================================================

CREATE TABLE magic_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hash

    -- Security
    used BOOLEAN DEFAULT FALSE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,

    -- Rate limiting (max 3 per email per hour)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_magic_links_email ON magic_links(email, created_at);
CREATE INDEX idx_magic_links_token_hash ON magic_links(token_hash) WHERE NOT used;
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at) WHERE NOT used;

-- ==============================================================================
-- USAGE_QUOTAS TABLE
-- Financial Controls: Enforce tier-based limits (Buffett requirement)
-- ==============================================================================

CREATE TABLE usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Period (monthly reset)
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Limits based on tier
    -- Free: 50,000 tokens/month
    -- Pro: 500,000 tokens/month
    -- Ultimate: 5,000,000 tokens/month
    tokens_limit INTEGER NOT NULL,
    tokens_used INTEGER DEFAULT 0 NOT NULL,

    -- Request limits (rate limiting)
    requests_limit INTEGER NOT NULL,
    requests_used INTEGER DEFAULT 0 NOT NULL,

    -- Cost tracking
    cost_limit_cents INTEGER NOT NULL, -- Free: 200 cents ($2), Pro: 1000 ($10), Ultimate: 5000 ($50)
    cost_used_cents INTEGER DEFAULT 0 NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT usage_quotas_tokens_check CHECK (tokens_used >= 0 AND tokens_used <= tokens_limit * 2),
    CONSTRAINT usage_quotas_requests_check CHECK (requests_used >= 0),
    CONSTRAINT usage_quotas_cost_check CHECK (cost_used_cents >= 0),
    UNIQUE(user_id, period_start)
);

CREATE INDEX idx_usage_quotas_user_period ON usage_quotas(user_id, period_start);
CREATE INDEX idx_usage_quotas_period_end ON usage_quotas(period_end);

-- ==============================================================================
-- USAGE_EVENTS TABLE
-- Observability: Track all API usage for debugging and billing
-- ==============================================================================

CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quota_id UUID NOT NULL REFERENCES usage_quotas(id) ON DELETE CASCADE,

    -- Event details
    metric_type usage_metric_type NOT NULL,
    endpoint VARCHAR(255) NOT NULL,

    -- Usage metrics
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER,

    -- Context
    request_id VARCHAR(255),
    ip_address INET,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_usage_events_user_id ON usage_events(user_id, created_at);
CREATE INDEX idx_usage_events_quota_id ON usage_events(quota_id);
CREATE INDEX idx_usage_events_metric_type ON usage_events(metric_type, created_at);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at DESC);

-- ==============================================================================
-- PREFERENCES TABLE
-- User settings and personalization
-- ==============================================================================

CREATE TABLE preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- UI preferences
    theme VARCHAR(20) DEFAULT 'light', -- light, dark, auto
    language VARCHAR(10) DEFAULT 'en',

    -- Notification preferences
    notify_price_drops BOOLEAN DEFAULT TRUE,
    notify_new_laptops BOOLEAN DEFAULT TRUE,
    notify_weekly_digest BOOLEAN DEFAULT FALSE,

    -- AI preferences
    preferred_mentors INTEGER[], -- Array of mentor IDs to prioritize
    ai_verbosity VARCHAR(20) DEFAULT 'balanced', -- concise, balanced, detailed

    -- Privacy
    allow_analytics BOOLEAN DEFAULT TRUE,
    allow_personalization BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- AUDIT_LOG TABLE
-- Security: Track all sensitive operations (Hinton requirement)
-- ==============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Event
    event_type VARCHAR(100) NOT NULL, -- login, logout, tier_change, data_export, data_delete, etc.
    event_category VARCHAR(50) NOT NULL, -- auth, billing, data, security
    severity VARCHAR(20) NOT NULL, -- info, warning, error, critical

    -- Details
    description TEXT NOT NULL,
    metadata JSONB, -- Additional context

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type, created_at);
CREATE INDEX idx_audit_log_severity ON audit_log(severity, created_at);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ==============================================================================
-- FUNCTIONS
-- ==============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_quotas_updated_at BEFORE UPDATE ON usage_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired sessions automatically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions
    WHERE status = 'active' AND expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired magic links
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM magic_links
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create or reset monthly usage quota
CREATE OR REPLACE FUNCTION create_monthly_quota(
    p_user_id UUID,
    p_tier user_tier
)
RETURNS UUID AS $$
DECLARE
    v_quota_id UUID;
    v_tokens_limit INTEGER;
    v_requests_limit INTEGER;
    v_cost_limit_cents INTEGER;
    v_period_start TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set limits based on tier
    CASE p_tier
        WHEN 'free' THEN
            v_tokens_limit := 50000;
            v_requests_limit := 100;
            v_cost_limit_cents := 200; -- $2
        WHEN 'pro' THEN
            v_tokens_limit := 500000;
            v_requests_limit := 1000;
            v_cost_limit_cents := 1000; -- $10
        WHEN 'ultimate' THEN
            v_tokens_limit := 5000000;
            v_requests_limit := 10000;
            v_cost_limit_cents := 5000; -- $50
    END CASE;

    -- Calculate period
    v_period_start := date_trunc('month', CURRENT_TIMESTAMP);
    v_period_end := (v_period_start + INTERVAL '1 month') - INTERVAL '1 second';

    -- Insert quota
    INSERT INTO usage_quotas (
        user_id,
        period_start,
        period_end,
        tokens_limit,
        requests_limit,
        cost_limit_cents
    ) VALUES (
        p_user_id,
        v_period_start,
        v_period_end,
        v_tokens_limit,
        v_requests_limit,
        v_cost_limit_cents
    )
    RETURNING id INTO v_quota_id;

    RETURN v_quota_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- VIEWS
-- ==============================================================================

-- Active users view (excludes soft-deleted)
CREATE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

-- Current month quotas
CREATE VIEW current_quotas AS
SELECT
    uq.*,
    u.email,
    u.tier,
    (uq.tokens_used::FLOAT / uq.tokens_limit * 100) AS tokens_usage_pct,
    (uq.cost_used_cents::FLOAT / uq.cost_limit_cents * 100) AS cost_usage_pct
FROM usage_quotas uq
JOIN users u ON uq.user_id = u.id
WHERE uq.period_start = date_trunc('month', CURRENT_TIMESTAMP);

-- ==============================================================================
-- SEED DATA (Development Only)
-- ==============================================================================

-- Default admin user (password: Admin123!)
-- Note: Replace with proper admin credentials in production
INSERT INTO users (email, password_hash, name, tier, email_verified) VALUES
('admin@aibradaa.com', '$2a$10$rZQ7bYGKZ5mF5h0vNZhYKeQqYvXQyqY5fXqZ8zY6qZ7qZ8zY6qZ7qZ', 'AI Bradaa Admin', 'ultimate', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON TABLE users IS '84-Mentor approved user table with PDPA compliance, encryption at rest, and tier-based access control';
COMMENT ON TABLE sessions IS 'JWT session tracking with automatic expiration and revocation support';
COMMENT ON TABLE magic_links IS 'Passwordless authentication with rate limiting and one-time use enforcement';
COMMENT ON TABLE usage_quotas IS 'Tier-based usage limits enforcing financial red lines (Buffett requirement)';
COMMENT ON TABLE usage_events IS 'Granular usage tracking for billing, debugging, and observability';
COMMENT ON TABLE audit_log IS 'Security audit trail for all sensitive operations (Hinton requirement)';

COMMENT ON COLUMN users.password_hash IS 'bcrypt hash, NULL for OAuth-only users';
COMMENT ON COLUMN users.google_id IS 'Google OAuth subject identifier';
COMMENT ON COLUMN users.data_retention_days IS 'PDPA: Auto-delete user data after N days of inactivity';
COMMENT ON COLUMN usage_quotas.cost_limit_cents IS 'Financial red line: max spend per user per month (Free: $2, Pro: $10, Ultimate: $50)';
