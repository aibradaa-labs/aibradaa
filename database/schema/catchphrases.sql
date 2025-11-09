/**
 * One Piece Catchphrase System v4.0 - Database Schema
 * 84-Mentor Approved: INTERNAL ONLY (Legal Safety - No Public One Piece References)
 *
 * CRITICAL: All One Piece references are INTERNAL ONLY
 * Cannot afford $2K-4K IP review - keep One Piece content server-side
 *
 * Features:
 * - 1000+ catchphrase capacity
 * - Paraphrasing via Gemini 2.5 Pro
 * - Never-repeat tracking (last 50 per user)
 * - Manglish injection (1-2 words per 100)
 * - Auto-fetch daily at 3:00 AM MYT
 */

-- ============================================================================
-- Table 1: one_piece_catchphrases (1000+ capacity)
-- ============================================================================
CREATE TABLE IF NOT EXISTS one_piece_catchphrases (
  id SERIAL PRIMARY KEY,
  episode_number INT NOT NULL,
  original_text TEXT NOT NULL,
  character VARCHAR(100),
  context TEXT,
  tone VARCHAR(50), -- friendly, determined, excited, motivational, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster episode lookup
CREATE INDEX IF NOT EXISTS idx_catchphrases_episode ON one_piece_catchphrases(episode_number);
CREATE INDEX IF NOT EXISTS idx_catchphrases_tone ON one_piece_catchphrases(tone);

-- ============================================================================
-- Table 2: paraphrased_catchphrases
-- ============================================================================
CREATE TABLE IF NOT EXISTS paraphrased_catchphrases (
  id SERIAL PRIMARY KEY,
  original_id INT REFERENCES one_piece_catchphrases(id) ON DELETE CASCADE,
  paraphrased_text TEXT NOT NULL,
  manglish_words TEXT[], -- Array of Manglish words used (e.g., ['lah', 'leh', 'can'])
  gemini_confidence DECIMAL(3,2), -- 0.00-1.00 (minimum 0.75 required)
  approved BOOLEAN DEFAULT false,
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for approved catchphrases
CREATE INDEX IF NOT EXISTS idx_paraphrase_approved ON paraphrased_catchphrases(approved);
CREATE INDEX IF NOT EXISTS idx_paraphrase_original ON paraphrased_catchphrases(original_id);

-- ============================================================================
-- Table 3: catchphrase_usage_log (never-repeat tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catchphrase_usage_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  paraphrase_id INT REFERENCES paraphrased_catchphrases(id) ON DELETE CASCADE,
  used_at TIMESTAMP DEFAULT NOW(),
  context VARCHAR(200) -- e.g., 'greeting', 'response', 'motivation'
);

-- Index for fast user lookup (last 50 per user)
CREATE INDEX IF NOT EXISTS idx_usage_user ON catchphrase_usage_log(user_id, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_paraphrase ON catchphrase_usage_log(paraphrase_id);

-- ============================================================================
-- Table 4: catchphrase_fetch_jobs (auto-fetch history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catchphrase_fetch_jobs (
  id SERIAL PRIMARY KEY,
  fetch_date DATE NOT NULL,
  episodes_processed INT DEFAULT 0,
  catchphrases_added INT DEFAULT 0,
  paraphrases_generated INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB -- Additional metadata (e.g., { model: 'gemini-2.5-pro', avgConfidence: 0.87 })
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_fetch_date ON catchphrase_fetch_jobs(fetch_date DESC);
CREATE INDEX IF NOT EXISTS idx_fetch_status ON catchphrase_fetch_jobs(status);

-- ============================================================================
-- Functions
-- ============================================================================

/**
 * Get random approved catchphrase for user (never-repeat last 50)
 */
CREATE OR REPLACE FUNCTION get_random_catchphrase(p_user_id VARCHAR, p_tone VARCHAR DEFAULT NULL)
RETURNS TABLE (
  id INT,
  paraphrased_text TEXT,
  manglish_words TEXT[],
  original_character VARCHAR,
  tone VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.paraphrased_text,
    pc.manglish_words,
    opc.character AS original_character,
    opc.tone
  FROM paraphrased_catchphrases pc
  JOIN one_piece_catchphrases opc ON pc.original_id = opc.id
  WHERE pc.approved = true
    AND (p_tone IS NULL OR opc.tone = p_tone)
    AND pc.id NOT IN (
      -- Exclude last 50 used by this user
      SELECT paraphrase_id
      FROM catchphrase_usage_log
      WHERE user_id = p_user_id
      ORDER BY used_at DESC
      LIMIT 50
    )
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

/**
 * Log catchphrase usage
 */
CREATE OR REPLACE FUNCTION log_catchphrase_usage(
  p_user_id VARCHAR,
  p_paraphrase_id INT,
  p_context VARCHAR DEFAULT 'general'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO catchphrase_usage_log (user_id, paraphrase_id, context)
  VALUES (p_user_id, p_paraphrase_id, p_context);
END;
$$ LANGUAGE plpgsql;

/**
 * Get usage statistics for user
 */
CREATE OR REPLACE FUNCTION get_user_catchphrase_stats(p_user_id VARCHAR)
RETURNS TABLE (
  total_used INT,
  unique_catchphrases INT,
  last_used_at TIMESTAMP,
  favorite_tone VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT AS total_used,
    COUNT(DISTINCT paraphrase_id)::INT AS unique_catchphrases,
    MAX(used_at) AS last_used_at,
    (
      SELECT opc.tone
      FROM catchphrase_usage_log cul
      JOIN paraphrased_catchphrases pc ON cul.paraphrase_id = pc.id
      JOIN one_piece_catchphrases opc ON pc.original_id = opc.id
      WHERE cul.user_id = p_user_id
      GROUP BY opc.tone
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS favorite_tone
  FROM catchphrase_usage_log
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Seed Data (Sample Catchphrases - 10 examples for testing)
-- ============================================================================

-- Insert sample One Piece catchphrases (INTERNAL ONLY - never exposed to frontend)
INSERT INTO one_piece_catchphrases (episode_number, original_text, character, context, tone)
VALUES
  (1, 'I''m gonna be King of the Pirates!', 'Luffy', 'Declaration of dream', 'determined'),
  (45, 'If you don''t take risks, you can''t create a future!', 'Luffy', 'Encouragement', 'motivational'),
  (37, 'I don''t want to conquer anything. I just think the guy with the most freedom in this whole ocean is the Pirate King!', 'Luffy', 'Philosophy', 'friendly'),
  (151, 'A man forgives a woman''s lies.', 'Sanji', 'Chivalry', 'friendly'),
  (278, 'When do you think people die? When they are shot? No. When they eat a bad mushroom? No! People die when they are forgotten!', 'Dr. Hiluluk', 'Legacy', 'motivational'),
  (312, 'Forgive me for not being strong enough.', 'Ace', 'Farewell', 'emotional'),
  (405, 'I want to live!', 'Robin', 'Breakthrough', 'emotional'),
  (483, 'I''ll become the world''s greatest swordsman! And I won''t lose again!', 'Zoro', 'Determination', 'determined'),
  (573, 'Nothing happened.', 'Zoro', 'Sacrifice', 'stoic'),
  (877, 'The weak don''t get to choose how they die.', 'Kaido', 'Power', 'serious')
ON CONFLICT DO NOTHING;

-- Insert sample paraphrased versions (approved for use)
INSERT INTO paraphrased_catchphrases (original_id, paraphrased_text, manglish_words, gemini_confidence, approved, approved_by, approved_at)
VALUES
  (1, 'Yo nakama! I''m gonna help you find the BEST laptop lah! No compromise!', ARRAY['lah'], 0.92, true, 'admin', NOW()),
  (2, 'Cannot just play safe one! Must take the risk to find your perfect laptop!', ARRAY['cannot', 'one', 'must'], 0.88, true, 'admin', NOW()),
  (3, 'I don''t wanna force you to buy anything leh. Just want you to have the FREEDOM to choose the best laptop for YOU!', ARRAY['leh'], 0.91, true, 'admin', NOW()),
  (4, 'Wah, your laptop choice very good lah! I approve this one!', ARRAY['wah', 'lah'], 0.85, true, 'admin', NOW()),
  (5, 'Your laptop will live on through your work! Make it count, nakama!', ARRAY[], 0.89, true, 'admin', NOW()),
  (6, 'Aiya sorry I cannot find better options right now... but I''ll keep trying for you!', ARRAY['aiya'], 0.87, true, 'admin', NOW()),
  (7, 'I WANT TO HELP YOU! Tell me everything you need in a laptop!', ARRAY[], 0.93, true, 'admin', NOW()),
  (8, 'I''ll help you find the BEST laptop deal! Won''t give up one!', ARRAY['one'], 0.90, true, 'admin', NOW()),
  (9, 'Eh, don''t worry about the specs lah. Everything handled already!', ARRAY['eh', 'lah'], 0.86, true, 'admin', NOW()),
  (10, 'Only the best laptops make it to my recommendations. Can trust me!', ARRAY['can'], 0.84, true, 'admin', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE one_piece_catchphrases IS 'INTERNAL ONLY: Original One Piece catchphrases (never exposed to frontend)';
COMMENT ON TABLE paraphrased_catchphrases IS 'Paraphrased versions for frontend use - IP-safe with Manglish tone';
COMMENT ON TABLE catchphrase_usage_log IS 'Never-repeat tracking: last 50 per user';
COMMENT ON TABLE catchphrase_fetch_jobs IS 'Auto-fetch job history (runs daily at 3:00 AM MYT)';

COMMENT ON COLUMN paraphrased_catchphrases.gemini_confidence IS 'Gemini 2.5 Pro confidence score (minimum 0.75 required)';
COMMENT ON COLUMN paraphrased_catchphrases.approved IS 'Admin approval required before use';
COMMENT ON COLUMN paraphrased_catchphrases.manglish_words IS 'Manglish words injected (1-2 words per 100 characters)';

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamps on modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_one_piece_catchphrases_updated_at
  BEFORE UPDATE ON one_piece_catchphrases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paraphrased_catchphrases_updated_at
  BEFORE UPDATE ON paraphrased_catchphrases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Permissions (Production)
-- ============================================================================

-- Grant read-only access to application user
-- GRANT SELECT ON one_piece_catchphrases TO app_user;
-- GRANT SELECT ON paraphrased_catchphrases TO app_user;
-- GRANT INSERT ON catchphrase_usage_log TO app_user;
-- GRANT SELECT ON catchphrase_fetch_jobs TO app_user;

-- Grant full access to admin user
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO admin_user;
