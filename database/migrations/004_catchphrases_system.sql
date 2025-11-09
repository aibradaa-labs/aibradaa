-- ============================================================================
-- MIGRATION 004: One Piece Catchphrase Auto-Fetch System
-- Date: 2025-11-09
-- Purpose: Database schema for dynamic catchphrase storage and auto-updates
-- ============================================================================

-- ============================================================================
-- TABLE: one_piece_catchphrases
-- Stores all One Piece catchphrases with metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS one_piece_catchphrases (
  id SERIAL PRIMARY KEY,

  -- Original Data
  original_text TEXT NOT NULL,
  character_name VARCHAR(100) NOT NULL,
  episode_number INT,
  arc_name VARCHAR(200),
  context TEXT,

  -- Paraphrased for Production
  paraphrased_text TEXT NOT NULL UNIQUE,
  laptop_context TEXT,

  -- Classification
  emotion VARCHAR(50) NOT NULL,
  intensity VARCHAR(20),
  situation VARCHAR(100),

  -- Source Metadata
  source_type VARCHAR(50) NOT NULL, -- 'manual', 'api', 'ai_generated', 'user_submission'
  source_url TEXT,
  source_api VARCHAR(100),
  confidence_score DECIMAL(3,2) DEFAULT 0.80, -- AI paraphrasing confidence

  -- Usage Tracking
  times_used INT DEFAULT 0,
  last_used_at TIMESTAMP,
  user_rating DECIMAL(3,2), -- Average user rating (1.00-5.00)
  rating_count INT DEFAULT 0,

  -- Quality Control
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,

  -- Legal Compliance
  copyright_safe BOOLEAN DEFAULT TRUE,
  legal_review_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  legal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT valid_emotion CHECK (emotion IN (
    'EXCITED', 'DETERMINED', 'CONFIDENT', 'CURIOUS', 'THOUGHTFUL',
    'FRIENDLY', 'PROTECTIVE', 'PLAYFUL', 'EMPATHETIC', 'PROUD',
    'CONCERNED', 'INSPIRED'
  )),
  CONSTRAINT valid_source CHECK (source_type IN (
    'manual', 'api', 'ai_generated', 'user_submission', 'web_scrape'
  )),
  CONSTRAINT valid_confidence CHECK (confidence_score BETWEEN 0 AND 1),
  CONSTRAINT valid_rating CHECK (user_rating IS NULL OR user_rating BETWEEN 1 AND 5)
);

-- Indexes for fast queries
CREATE INDEX idx_catchphrases_emotion ON one_piece_catchphrases(emotion);
CREATE INDEX idx_catchphrases_active ON one_piece_catchphrases(is_active, is_approved);
CREATE INDEX idx_catchphrases_character ON one_piece_catchphrases(character_name);
CREATE INDEX idx_catchphrases_episode ON one_piece_catchphrases(episode_number);
CREATE INDEX idx_catchphrases_times_used ON one_piece_catchphrases(times_used);
CREATE INDEX idx_catchphrases_rating ON one_piece_catchphrases(user_rating DESC NULLS LAST);

-- ============================================================================
-- TABLE: manglish_expressions
-- Dynamic Manglish expression database
-- ============================================================================
CREATE TABLE IF NOT EXISTS manglish_expressions (
  id SERIAL PRIMARY KEY,

  -- Expression Data
  expression TEXT NOT NULL UNIQUE,
  expression_type VARCHAR(50) NOT NULL, -- 'particle', 'phrase', 'idiom', 'slang'
  category VARCHAR(100), -- 'kopitiam', 'mamak', 'weather', 'modern', etc.

  -- Usage Context
  formality_level VARCHAR(50), -- 'casual', 'formal', 'authentic'
  emotion_compatibility TEXT[], -- Array of compatible emotions
  frequency_tier VARCHAR(20), -- 'common', 'moderate', 'rare'

  -- Pronunciation (for TTS)
  phonetic_spelling TEXT,
  tts_pronunciation TEXT,

  -- Cultural Context
  origin VARCHAR(100), -- 'malay', 'chinese', 'indian', 'mixed'
  cultural_notes TEXT,
  translation TEXT, -- English translation

  -- Source
  source_type VARCHAR(50) DEFAULT 'manual',
  source_url TEXT,
  verified BOOLEAN DEFAULT FALSE,

  -- Usage Tracking
  times_used INT DEFAULT 0,
  last_used_at TIMESTAMP,
  user_rating DECIMAL(3,2),
  rating_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_expression_type CHECK (expression_type IN (
    'particle', 'phrase', 'idiom', 'slang', 'cultural_reference'
  )),
  CONSTRAINT valid_formality CHECK (formality_level IN (
    'casual', 'formal', 'authentic', 'subtle'
  ))
);

CREATE INDEX idx_manglish_type ON manglish_expressions(expression_type);
CREATE INDEX idx_manglish_category ON manglish_expressions(category);
CREATE INDEX idx_manglish_verified ON manglish_expressions(verified);
CREATE INDEX idx_manglish_frequency ON manglish_expressions(frequency_tier);

-- ============================================================================
-- TABLE: catchphrase_usage_log
-- Track catchphrase usage per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS catchphrase_usage_log (
  id SERIAL PRIMARY KEY,

  user_id VARCHAR(255) NOT NULL,
  catchphrase_id INT REFERENCES one_piece_catchphrases(id) ON DELETE CASCADE,
  manglish_id INT REFERENCES manglish_expressions(id) ON DELETE SET NULL,

  -- Context
  emotion VARCHAR(50),
  surface VARCHAR(50), -- 'chat', 'rag', 'deep_research', 'tts'
  session_id VARCHAR(255),

  -- User Feedback
  user_reaction VARCHAR(50), -- 'liked', 'disliked', 'neutral', 'reported'
  user_rating INT CHECK (user_rating BETWEEN 1 AND 5),
  user_comment TEXT,

  -- Timestamps
  used_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT valid_surface CHECK (surface IN (
    'chat', 'rag', 'deep_research', 'tts', 'other'
  ))
);

CREATE INDEX idx_usage_user ON catchphrase_usage_log(user_id, used_at DESC);
CREATE INDEX idx_usage_catchphrase ON catchphrase_usage_log(catchphrase_id);
CREATE INDEX idx_usage_surface ON catchphrase_usage_log(surface);
CREATE INDEX idx_usage_reaction ON catchphrase_usage_log(user_reaction);

-- ============================================================================
-- TABLE: catchphrase_fetch_jobs
-- Track auto-fetch jobs and their status
-- ============================================================================
CREATE TABLE IF NOT EXISTS catchphrase_fetch_jobs (
  id SERIAL PRIMARY KEY,

  -- Job Info
  job_type VARCHAR(50) NOT NULL, -- 'onepiece_api', 'wiki_scrape', 'ai_generation'
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed

  -- Results
  catchphrases_fetched INT DEFAULT 0,
  catchphrases_approved INT DEFAULT 0,
  catchphrases_rejected INT DEFAULT 0,

  -- Metadata
  source_url TEXT,
  api_endpoint TEXT,
  batch_size INT,

  -- Error Handling
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,

  -- Timestamps
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_job_type CHECK (job_type IN (
    'onepiece_api', 'wiki_scrape', 'ai_generation', 'gemini_paraphrase', 'user_submissions'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled'
  ))
);

CREATE INDEX idx_fetch_jobs_status ON catchphrase_fetch_jobs(status, next_run_at);
CREATE INDEX idx_fetch_jobs_type ON catchphrase_fetch_jobs(job_type);

-- ============================================================================
-- FUNCTIONS: Smart Catchphrase Selection
-- ============================================================================

-- Function: Get random catchphrase by emotion (never-repeat for user)
CREATE OR REPLACE FUNCTION get_random_catchphrase(
  p_user_id VARCHAR,
  p_emotion VARCHAR,
  p_surface VARCHAR DEFAULT 'chat'
) RETURNS TABLE (
  catchphrase_id INT,
  paraphrased_text TEXT,
  character_name VARCHAR,
  episode_number INT,
  confidence_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.paraphrased_text,
    c.character_name,
    c.episode_number,
    c.confidence_score
  FROM one_piece_catchphrases c
  WHERE c.emotion = p_emotion
    AND c.is_active = TRUE
    AND c.is_approved = TRUE
    AND c.copyright_safe = TRUE
    -- Exclude recently used by this user (last 50)
    AND c.id NOT IN (
      SELECT catchphrase_id
      FROM catchphrase_usage_log
      WHERE user_id = p_user_id
        AND catchphrase_id IS NOT NULL
      ORDER BY used_at DESC
      LIMIT 50
    )
  ORDER BY
    -- Prefer higher rated
    c.user_rating DESC NULLS LAST,
    -- Prefer less used globally (keep fresh)
    c.times_used ASC,
    -- Random selection
    RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Get random Manglish expression
CREATE OR REPLACE FUNCTION get_random_manglish(
  p_emotion VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL
) RETURNS TABLE (
  expression TEXT,
  phonetic_spelling TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.expression,
    m.phonetic_spelling
  FROM manglish_expressions m
  WHERE m.verified = TRUE
    AND (p_emotion IS NULL OR p_emotion = ANY(m.emotion_compatibility))
    AND (p_category IS NULL OR m.category = p_category)
  ORDER BY
    -- Weight by frequency tier
    CASE m.frequency_tier
      WHEN 'common' THEN 3
      WHEN 'moderate' THEN 2
      ELSE 1
    END DESC,
    RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Log catchphrase usage
CREATE OR REPLACE FUNCTION log_catchphrase_usage(
  p_user_id VARCHAR,
  p_catchphrase_id INT,
  p_manglish_id INT,
  p_emotion VARCHAR,
  p_surface VARCHAR
) RETURNS VOID AS $$
BEGIN
  -- Insert usage log
  INSERT INTO catchphrase_usage_log (
    user_id, catchphrase_id, manglish_id, emotion, surface
  ) VALUES (
    p_user_id, p_catchphrase_id, p_manglish_id, p_emotion, p_surface
  );

  -- Update catchphrase usage count
  IF p_catchphrase_id IS NOT NULL THEN
    UPDATE one_piece_catchphrases
    SET times_used = times_used + 1,
        last_used_at = NOW()
    WHERE id = p_catchphrase_id;
  END IF;

  -- Update Manglish usage count
  IF p_manglish_id IS NOT NULL THEN
    UPDATE manglish_expressions
    SET times_used = times_used + 1,
        last_used_at = NOW()
    WHERE id = p_manglish_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Update catchphrase rating
CREATE OR REPLACE FUNCTION update_catchphrase_rating(
  p_catchphrase_id INT,
  p_rating INT
) RETURNS VOID AS $$
BEGIN
  UPDATE one_piece_catchphrases
  SET
    rating_count = rating_count + 1,
    user_rating = COALESCE(
      (user_rating * rating_count + p_rating) / (rating_count + 1),
      p_rating
    )
  WHERE id = p_catchphrase_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA: Initial Catchphrases (from v1)
-- ============================================================================

-- Insert Luffy core catchphrases
INSERT INTO one_piece_catchphrases (
  original_text, character_name, episode_number, arc_name,
  paraphrased_text, laptop_context, emotion, intensity, situation,
  source_type, is_approved, approved_by, copyright_safe
) VALUES
  ('I''m gonna be King of the Pirates!', 'Monkey D. Luffy', 1, 'Romance Dawn',
   'I''ll find you the BEST laptop, that''s my promise!', 'big_goal',
   'DETERMINED', 'high', 'promise', 'manual', TRUE, 'Syeddy', TRUE),

  ('Meat!', 'Monkey D. Luffy', 1, 'Romance Dawn',
   'Perfect specs! Just what we need!', 'discovery',
   'EXCITED', 'high', 'discovery', 'manual', TRUE, 'Syeddy', TRUE),

  ('That''s what friends are for!', 'Monkey D. Luffy', 20, 'Orange Town',
   'That''s what nakama do - help each other!', 'helping',
   'FRIENDLY', 'medium', 'support', 'manual', TRUE, 'Syeddy', TRUE),

  ('If you don''t take risks, you can''t create a future.', 'Monkey D. Luffy', 151, 'Alabasta',
   'Sometimes gotta invest more now for better future performance!', 'risk_taking',
   'CONFIDENT', 'medium', 'philosophy', 'manual', TRUE, 'Syeddy', TRUE),

  ('I''m not giving up!', 'Monkey D. Luffy', 37, 'Arlong Park',
   'We''ll find the right one, I never give up!', 'persistence',
   'DETERMINED', 'high', 'persistence', 'manual', TRUE, 'Syeddy', TRUE),

  ('Don''t you dare hurt my friends!', 'Monkey D. Luffy', 377, 'Enies Lobby',
   'No way I''m letting you buy overpriced junk!', 'warning',
   'PROTECTIVE', 'high', 'protection', 'manual', TRUE, 'Syeddy', TRUE),

  ('Of course I can do it!', 'Monkey D. Luffy', 130, 'Alabasta',
   'Of course we can find it - trust me!', 'assurance',
   'CONFIDENT', 'high', 'assurance', 'manual', TRUE, 'Syeddy', TRUE)
ON CONFLICT (paraphrased_text) DO NOTHING;

-- Insert Manglish expressions
INSERT INTO manglish_expressions (
  expression, expression_type, category, formality_level,
  emotion_compatibility, frequency_tier, phonetic_spelling, translation, verified
) VALUES
  ('lah', 'particle', 'basic', 'casual', ARRAY['FRIENDLY', 'EXCITED', 'CONFIDENT'], 'common', 'la', 'emphasis particle', TRUE),
  ('leh', 'particle', 'basic', 'casual', ARRAY['CURIOUS', 'PLAYFUL'], 'common', 'le', 'question/suggestion particle', TRUE),
  ('lor', 'particle', 'basic', 'casual', ARRAY['EMPATHETIC', 'THOUGHTFUL'], 'common', 'lor', 'resignation particle', TRUE),
  ('wah', 'particle', 'emphatic', 'authentic', ARRAY['EXCITED', 'PROUD'], 'moderate', 'wa', 'amazement exclamation', TRUE),
  ('shiok', 'slang', 'modern', 'authentic', ARRAY['EXCITED', 'PROUD'], 'moderate', 'shiok', 'satisfying/excellent', TRUE),
  ('mantap', 'slang', 'modern', 'authentic', ARRAY['EXCITED', 'CONFIDENT'], 'moderate', 'mantap', 'excellent/awesome', TRUE),
  ('Like uncle at kopitiam say', 'phrase', 'kopitiam', 'authentic', ARRAY['THOUGHTFUL', 'FRIENDLY'], 'rare', 'like uncle at kopitiam say', 'wisdom from coffee shop uncle', TRUE),
  ('Steady lah', 'phrase', 'modern', 'casual', ARRAY['CONFIDENT', 'PROUD'], 'common', 'steady la', 'reliable/good', TRUE)
ON CONFLICT (expression) DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================
-- Grant permissions (adjust as needed for your user)
-- GRANT SELECT, INSERT, UPDATE ON one_piece_catchphrases TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON manglish_expressions TO your_app_user;
-- GRANT INSERT ON catchphrase_usage_log TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON catchphrase_fetch_jobs TO your_app_user;

-- ============================================================================
-- END MIGRATION 004
-- ============================================================================
