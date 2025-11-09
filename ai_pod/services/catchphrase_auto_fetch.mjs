/**
 * ONE PIECE CATCHPHRASE AUTO-FETCH SERVICE
 * Automatically fetches and updates catchphrase database from multiple sources
 *
 * Sources:
 * 1. One Piece API (official quotes)
 * 2. One Piece Wiki scraping
 * 3. Gemini AI paraphrasing
 * 4. Manglish expression generation
 *
 * @module catchphrase_auto_fetch
 */

import db from '../../database/connection.mjs';
import { getGeminiClient } from '../../netlify/functions/utils/gemini.mjs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // API endpoints
  apis: {
    onePieceAPI: 'https://api.api-onepiece.com/v2/characters/en',
    onePieceQuotes: 'https://animechan.xyz/api/quotes/anime?title=one%20piece',
    fallbackAPIs: [
      'https://one-piece-api.herokuapp.com/quotes',
      'https://waifu.it/api/quote?anime=One%20Piece',
    ],
  },

  // Fetch limits
  limits: {
    maxPerRun: 100,         // Max catchphrases per fetch run
    minConfidence: 0.75,    // Min AI paraphrasing confidence
    batchSize: 10,          // Process in batches
  },

  // Schedule (cron)
  schedule: {
    hourly: false,           // Run every hour
    daily: true,             // Run once per day
    weekly: false,           // Run weekly
    preferredTime: '03:00',  // 3 AM MYT (low traffic)
  },

  // Quality control
  quality: {
    requireApproval: true,   // Require manual approval for new catchphrases
    autoApproveThreshold: 0.95, // Auto-approve if confidence >= 95%
    flagSimilarity: 0.90,    // Flag if too similar to existing (90%)
  },
};

// ============================================================================
// FETCHER CLASSES
// ============================================================================

/**
 * Base Fetcher Class
 */
class BaseFetcher {
  constructor(jobType) {
    this.jobType = jobType;
    this.jobId = null;
    this.stats = {
      fetched: 0,
      approved: 0,
      rejected: 0,
    };
  }

  async startJob() {
    const result = await db.query(
      `INSERT INTO catchphrase_fetch_jobs (job_type, status, started_at)
       VALUES ($1, 'running', NOW())
       RETURNING id`,
      [this.jobType]
    );
    this.jobId = result.rows[0].id;
    console.log(`[AutoFetch] Job ${this.jobId} started (${this.jobType})`);
  }

  async completeJob(status = 'completed', errorMessage = null) {
    await db.query(
      `UPDATE catchphrase_fetch_jobs
       SET status = $1,
           completed_at = NOW(),
           catchphrases_fetched = $2,
           catchphrases_approved = $3,
           catchphrases_rejected = $4,
           error_message = $5
       WHERE id = $6`,
      [status, this.stats.fetched, this.stats.approved, this.stats.rejected, errorMessage, this.jobId]
    );
    console.log(`[AutoFetch] Job ${this.jobId} ${status}:`, this.stats);
  }

  async insertCatchphrase(data) {
    try {
      const autoApprove = data.confidence_score >= CONFIG.quality.autoApproveThreshold;

      const result = await db.query(
        `INSERT INTO one_piece_catchphrases (
          original_text, character_name, episode_number, arc_name,
          paraphrased_text, laptop_context, emotion, intensity, situation,
          source_type, source_url, source_api, confidence_score,
          is_approved, approved_by, copyright_safe
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (paraphrased_text) DO NOTHING
        RETURNING id`,
        [
          data.original_text, data.character_name, data.episode_number, data.arc_name,
          data.paraphrased_text, data.laptop_context, data.emotion, data.intensity, data.situation,
          data.source_type, data.source_url, data.source_api, data.confidence_score,
          autoApprove, autoApprove ? 'auto' : null, true
        ]
      );

      if (result.rows.length > 0) {
        this.stats.fetched++;
        if (autoApprove) {
          this.stats.approved++;
        }
        return result.rows[0].id;
      }

      return null; // Duplicate
    } catch (error) {
      console.error('[AutoFetch] Insert error:', error.message);
      this.stats.rejected++;
      return null;
    }
  }
}

/**
 * One Piece API Fetcher
 */
class OnePieceAPIFetcher extends BaseFetcher {
  constructor() {
    super('onepiece_api');
    this.gemini = getGeminiClient(process.env.GEMINI_API_KEY);
  }

  async fetch() {
    await this.startJob();

    try {
      // Try primary API
      let quotes = await this.fetchFromPrimaryAPI();

      // Fallback to other APIs if primary fails
      if (!quotes || quotes.length === 0) {
        quotes = await this.fetchFromFallbackAPIs();
      }

      if (!quotes || quotes.length === 0) {
        throw new Error('No quotes fetched from any API');
      }

      // Process in batches
      const batches = this.createBatches(quotes, CONFIG.limits.batchSize);

      for (const batch of batches) {
        await this.processBatch(batch);
      }

      await this.completeJob('completed');

    } catch (error) {
      console.error('[OnePieceAPI] Fetch error:', error);
      await this.completeJob('failed', error.message);
    }
  }

  async fetchFromPrimaryAPI() {
    try {
      console.log('[OnePieceAPI] Fetching from primary API...');
      const response = await fetch(CONFIG.apis.onePieceQuotes, {
        headers: { 'User-Agent': 'AI Bradaa Bot/1.0' },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`[OnePieceAPI] Fetched ${data.length} quotes`);

      return data.map(q => ({
        original: q.quote || q.text,
        character: q.character,
        anime: q.anime,
      }));

    } catch (error) {
      console.error('[OnePieceAPI] Primary API failed:', error.message);
      return null;
    }
  }

  async fetchFromFallbackAPIs() {
    for (const apiUrl of CONFIG.apis.fallbackAPIs) {
      try {
        console.log(`[OnePieceAPI] Trying fallback: ${apiUrl}`);
        const response = await fetch(apiUrl);

        if (!response.ok) continue;

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          return data.map(q => ({
            original: q.quote || q.text || q.content,
            character: q.character || q.author || 'Unknown',
          }));
        }

      } catch (error) {
        console.error(`[OnePieceAPI] Fallback ${apiUrl} failed:`, error.message);
      }
    }

    return null;
  }

  createBatches(items, size) {
    const batches = [];
    for (let i = 0; i < items.length && i < CONFIG.limits.maxPerRun; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  async processBatch(batch) {
    for (const quote of batch) {
      try {
        // Use Gemini to paraphrase for laptop context
        const paraphrased = await this.paraphraseWithGemini(quote.original, quote.character);

        if (!paraphrased) {
          this.stats.rejected++;
          continue;
        }

        // Detect emotion from original quote
        const emotion = await this.detectEmotion(quote.original);

        // Insert into database
        await this.insertCatchphrase({
          original_text: quote.original,
          character_name: quote.character || 'Unknown',
          episode_number: null, // Not available from API
          arc_name: null,
          paraphrased_text: paraphrased.text,
          laptop_context: paraphrased.context,
          emotion: emotion,
          intensity: this.detectIntensity(quote.original),
          situation: paraphrased.situation,
          source_type: 'api',
          source_url: CONFIG.apis.onePieceQuotes,
          source_api: 'animechan',
          confidence_score: paraphrased.confidence,
        });

      } catch (error) {
        console.error('[OnePieceAPI] Process error:', error.message);
        this.stats.rejected++;
      }
    }
  }

  async paraphraseWithGemini(originalQuote, character) {
    try {
      const prompt = `
You are an expert at paraphrasing One Piece quotes for a laptop recommendation AI assistant.

Original quote from ${character}:
"${originalQuote}"

Paraphrase this quote to fit a laptop shopping context. Make it:
1. Natural and conversational
2. Related to laptop hunting/recommendations
3. Maintain the spirit/emotion of the original
4. Keep it concise (1-2 sentences)
5. Malaysian English friendly (can use "lah", "leh", etc. if natural)

Respond in JSON format:
{
  "paraphrased": "your paraphrased quote here",
  "context": "when to use this (e.g., discovery, helping, warning)",
  "situation": "specific situation (e.g., good_deal, tough_choice)",
  "confidence": 0.85
}
`;

      const result = await this.gemini.chat([], prompt, {
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
        temperature: 0.7,
      });

      const parsed = JSON.parse(result.text.replace(/```json\\n?|```/g, '').trim());

      // Validate confidence
      if (parsed.confidence < CONFIG.limits.minConfidence) {
        console.log(`[OnePieceAPI] Low confidence (${parsed.confidence}), skipping`);
        return null;
      }

      return {
        text: parsed.paraphrased,
        context: parsed.context,
        situation: parsed.situation,
        confidence: parsed.confidence,
      };

    } catch (error) {
      console.error('[OnePieceAPI] Paraphrase error:', error.message);
      return null;
    }
  }

  detectEmotion(text) {
    const lower = text.toLowerCase();

    // Simple keyword-based emotion detection
    if (lower.includes('!') && (lower.includes('gonna') || lower.includes('will'))) return 'DETERMINED';
    if (lower.includes('!') && lower.match(/amazing|awesome|great|perfect/)) return 'EXCITED';
    if (lower.includes('friend') || lower.includes('crew')) return 'FRIENDLY';
    if (lower.includes('protect') || lower.includes('hurt')) return 'PROTECTIVE';
    if (lower.includes('?')) return 'CURIOUS';
    if (lower.includes('trust') || lower.includes('course')) return 'CONFIDENT';
    if (lower.includes('understand') || lower.includes('feel')) return 'EMPATHETIC';
    if (lower.match(/haha|hehe|fun/)) return 'PLAYFUL';
    if (lower.includes('worry') || lower.includes('careful')) return 'CONCERNED';
    if (lower.includes('dream') || lower.includes('future')) return 'INSPIRED';
    if (lower.match(/good|nice|well done/)) return 'PROUD';

    return 'THOUGHTFUL'; // Default
  }

  detectIntensity(text) {
    const exclamations = (text.match(/!/g) || []).length;
    const caps = (text.match(/[A-Z]/g) || []).length;
    const total = text.length;

    const intensity = (exclamations * 2 + (caps / total) * 10);

    if (intensity > 5) return 'high';
    if (intensity > 2) return 'medium';
    return 'low';
  }
}

/**
 * Manglish Expression Generator
 * Uses Gemini to generate new Manglish expressions
 */
class ManglishExpressionGenerator extends BaseFetcher {
  constructor() {
    super('ai_generation');
    this.gemini = getGeminiClient(process.env.GEMINI_API_KEY);
  }

  async generate() {
    await this.startJob();

    try {
      const newExpressions = await this.generateWithGemini();

      for (const expr of newExpressions) {
        await this.insertManglishExpression(expr);
      }

      await this.completeJob('completed');

    } catch (error) {
      console.error('[Manglish] Generation error:', error);
      await this.completeJob('failed', error.message);
    }
  }

  async generateWithGemini() {
    try {
      const prompt = `
You are a Malaysian Manglish expert. Generate 20 new authentic Manglish expressions for a laptop recommendation AI.

Categories to include:
- Kopitiam (coffee shop) culture
- Mamak (Indian-Muslim restaurant) culture
- Modern Malaysian slang
- Malaysian weather/traffic idioms
- Pantun-style wisdom (paraphrased, not direct quotes)

For each expression, provide:
{
  "expression": "the Manglish phrase",
  "type": "particle|phrase|idiom|slang",
  "category": "kopitiam|mamak|modern|weather|wisdom",
  "formality": "casual|formal|authentic",
  "translation": "English translation",
  "phonetic": "how to pronounce for TTS",
  "emotions": ["EXCITED", "FRIENDLY"] // compatible emotions
}

Return as JSON array. Make them authentic and culturally rich!
`;

      const result = await this.gemini.chat([], prompt, {
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
        temperature: 0.9, // Higher creativity
      });

      const expressions = JSON.parse(result.text.replace(/```json\\n?|```/g, '').trim());

      return expressions;

    } catch (error) {
      console.error('[Manglish] Gemini generation error:', error.message);
      return [];
    }
  }

  async insertManglishExpression(expr) {
    try {
      const result = await db.query(
        `INSERT INTO manglish_expressions (
          expression, expression_type, category, formality_level,
          emotion_compatibility, translation, phonetic_spelling,
          source_type, verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ai_generated', FALSE)
        ON CONFLICT (expression) DO NOTHING
        RETURNING id`,
        [
          expr.expression,
          expr.type,
          expr.category,
          expr.formality,
          expr.emotions,
          expr.translation,
          expr.phonetic,
        ]
      );

      if (result.rows.length > 0) {
        this.stats.fetched++;
        this.stats.approved++; // Will need manual verification
      }

    } catch (error) {
      console.error('[Manglish] Insert error:', error.message);
      this.stats.rejected++;
    }
  }
}

// ============================================================================
// SCHEDULER
// ============================================================================

/**
 * Main scheduler function
 * Call this from cron or scheduled job
 */
export async function runScheduledFetch() {
  console.log('[AutoFetch] Starting scheduled fetch...');

  try {
    // Ensure database connection
    if (!db.isHealthy()) {
      await db.connect();
    }

    // Run One Piece API fetcher
    const apiFetcher = new OnePieceAPIFetcher();
    await apiFetcher.fetch();

    // Run Manglish generator (less frequently)
    const now = new Date();
    if (now.getDay() === 0) { // Sunday only
      const manglishGen = new ManglishExpressionGenerator();
      await manglishGen.generate();
    }

    console.log('[AutoFetch] Scheduled fetch completed');

  } catch (error) {
    console.error('[AutoFetch] Scheduled fetch error:', error);
  }
}

/**
 * Manual trigger (for testing or admin panel)
 */
export async function triggerManualFetch(fetchType = 'all') {
  console.log(`[AutoFetch] Manual trigger: ${fetchType}`);

  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    if (fetchType === 'onepiece' || fetchType === 'all') {
      const apiFetcher = new OnePieceAPIFetcher();
      await apiFetcher.fetch();
    }

    if (fetchType === 'manglish' || fetchType === 'all') {
      const manglishGen = new ManglishExpressionGenerator();
      await manglishGen.generate();
    }

    return { success: true, message: 'Manual fetch completed' };

  } catch (error) {
    console.error('[AutoFetch] Manual trigger error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get fetch statistics
 */
export async function getFetchStats() {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) as total_catchphrases,
        COUNT(*) FILTER (WHERE is_approved = TRUE) as approved,
        COUNT(*) FILTER (WHERE is_approved = FALSE) as pending_approval,
        COUNT(*) FILTER (WHERE source_type = 'api') as from_api,
        COUNT(*) FILTER (WHERE source_type = 'ai_generated') as from_ai,
        COUNT(*) FILTER (WHERE source_type = 'manual') as from_manual,
        AVG(confidence_score) as avg_confidence,
        MAX(created_at) as last_fetch
      FROM one_piece_catchphrases
    `);

    const manglishResult = await db.query(`
      SELECT
        COUNT(*) as total_expressions,
        COUNT(*) FILTER (WHERE verified = TRUE) as verified,
        COUNT(*) FILTER (WHERE source_type = 'ai_generated') as ai_generated
      FROM manglish_expressions
    `);

    const jobsResult = await db.query(`
      SELECT
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        MAX(completed_at) as last_run
      FROM catchphrase_fetch_jobs
    `);

    return {
      catchphrases: result.rows[0],
      manglish: manglishResult.rows[0],
      jobs: jobsResult.rows[0],
    };

  } catch (error) {
    console.error('[AutoFetch] Stats error:', error);
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  runScheduledFetch,
  triggerManualFetch,
  getFetchStats,
  OnePieceAPIFetcher,
  ManglishExpressionGenerator,
};
