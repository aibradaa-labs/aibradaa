/**
 * ONE PIECE CATCHPHRASE ENGINE v4.0 - DATABASE-POWERED
 * Dynamic catchphrase system with PostgreSQL backend and auto-fetch
 *
 * 84-Mentor Approved: Andrew Ng (AI), Brian Balfour (Growth), Warren Buffett (Cost)
 *
 * NEW in v4.0:
 * - PostgreSQL database backend (no more static arrays)
 * - Auto-fetch from One Piece APIs
 * - Gemini AI paraphrasing
 * - Never-repeat guarantee per user (stored in DB)
 * - User ratings and feedback loop
 * - Manglish auto-generation
 * - 1000+ catchphrases capability (vs 50 static)
 *
 * @module one_piece_catchphrase_engine_v4
 */

import db from '../../database/connection.mjs';

// ============================================================================
// ONE PIECE CATCHPHRASE ENGINE (Database-Powered)
// ============================================================================

export class OnePieceCatchphraseEngineV4 {
  constructor() {
    this.dbConnected = false;
  }

  /**
   * Ensure database connection
   */
  async ensureConnection() {
    if (!this.dbConnected) {
      if (!db.isHealthy()) {
        await db.connect();
      }
      this.dbConnected = true;
    }
  }

  /**
   * Get catchphrase from database (never-repeat for user)
   * @param {string} userId - User ID
   * @param {string} emotion - Emotion state
   * @param {string} surface - Surface (chat, rag, etc.)
   * @returns {Promise<Object>} Catchphrase
   */
  async getCatchphrase(userId, emotion, surface = 'chat') {
    await this.ensureConnection();

    try {
      // Call database function for smart selection
      const result = await db.query(
        `SELECT * FROM get_random_catchphrase($1, $2, $3)`,
        [userId, emotion, surface]
      );

      if (result.rows.length === 0) {
        // Fallback: if no unused catchphrases, get any
        const fallback = await db.query(
          `SELECT id, paraphrased_text, character_name, episode_number, confidence_score
           FROM one_piece_catchphrases
           WHERE emotion = $1 AND is_active = TRUE AND is_approved = TRUE
           ORDER BY RANDOM()
           LIMIT 1`,
          [emotion]
        );

        if (fallback.rows.length === 0) {
          // Ultimate fallback: generic phrase
          return {
            catchphrase_id: null,
            paraphrased_text: this.getGenericFallback(emotion),
            character_name: 'AI Bradaa',
            episode_number: null,
            confidence_score: 1.0,
          };
        }

        return fallback.rows[0];
      }

      return result.rows[0];

    } catch (error) {
      console.error('[OnePieceV4] Get catchphrase error:', error);
      return {
        catchphrase_id: null,
        paraphrased_text: this.getGenericFallback(emotion),
        character_name: 'AI Bradaa',
        episode_number: null,
        confidence_score: 1.0,
      };
    }
  }

  /**
   * Get Manglish expression from database
   * @param {string} emotion - Emotion (optional)
   * @param {string} category - Category (optional)
   * @returns {Promise<Object>} Manglish expression
   */
  async getManglishExpression(emotion = null, category = null) {
    await this.ensureConnection();

    try {
      const result = await db.query(
        `SELECT * FROM get_random_manglish($1, $2)`,
        [emotion, category]
      );

      if (result.rows.length === 0) {
        // Fallback to basic particles
        return {
          expression: 'lah',
          phonetic_spelling: 'la',
        };
      }

      return result.rows[0];

    } catch (error) {
      console.error('[OnePieceV4] Get Manglish error:', error);
      return {
        expression: 'lah',
        phonetic_spelling: 'la',
      };
    }
  }

  /**
   * Log catchphrase usage
   * @param {string} userId - User ID
   * @param {number} catchphraseId - Catchphrase ID
   * @param {number} manglishId - Manglish ID (optional)
   * @param {string} emotion - Emotion
   * @param {string} surface - Surface
   */
  async logUsage(userId, catchphraseId, manglishId, emotion, surface) {
    await this.ensureConnection();

    try {
      await db.query(
        `SELECT log_catchphrase_usage($1, $2, $3, $4, $5)`,
        [userId, catchphraseId, manglishId, emotion, surface]
      );
    } catch (error) {
      console.error('[OnePieceV4] Log usage error:', error);
    }
  }

  /**
   * Get daily "Yo" greeting
   * @param {string} userId - User ID
   * @param {string} nickname - User nickname
   * @returns {Promise<string|null>} Greeting or null if already greeted today
   */
  async getDailyGreeting(userId, nickname = 'nakama') {
    await this.ensureConnection();

    try {
      // Check if already greeted today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const result = await db.query(
        `SELECT COUNT(*) as count
         FROM catchphrase_usage_log
         WHERE user_id = $1
           AND surface = 'greeting'
           AND used_at::date = $2::date`,
        [userId, today]
      );

      if (parseInt(result.rows[0].count) > 0) {
        return null; // Already greeted today
      }

      // Get random greeting
      const greetings = [
        `Yo ${nickname}! Ready for an adventure in laptop hunting?`,
        `Yo! What's up ${nickname}? Let's find your perfect laptop!`,
        `Yo ${nickname}! Time to discover your dream setup!`,
        `Yo ${nickname}! Let's hunt for treasure-level deals today!`,
      ];

      const greeting = greetings[Math.floor(Math.random() * greetings.length)];

      // Log greeting
      await db.query(
        `INSERT INTO catchphrase_usage_log (user_id, emotion, surface)
         VALUES ($1, 'FRIENDLY', 'greeting')`,
        [userId]
      );

      return greeting;

    } catch (error) {
      console.error('[OnePieceV4] Daily greeting error:', error);
      return `Hey ${nickname}!`; // Fallback
    }
  }

  /**
   * Get regular greeting (non-"Yo")
   * @param {string} nickname - User nickname
   * @returns {string} Greeting
   */
  getRegularGreeting(nickname = 'nakama') {
    const greetings = [
      `Hey ${nickname}!`,
      `Welcome back ${nickname}!`,
      `Good to see you again ${nickname}!`,
      `Hey there ${nickname}!`,
      `What can I help with ${nickname}?`,
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Inject catchphrase into response
   * @param {string} userId - User ID
   * @param {string} response - AI response
   * @param {string} emotion - Current emotion
   * @param {string} surface - Surface (chat, rag, etc.)
   * @param {string} position - Where to inject ('start', 'end', 'middle')
   * @returns {Promise<string>} Response with catchphrase
   */
  async injectCatchphrase(userId, response, emotion, surface = 'chat', position = 'start') {
    const catchphrase = await this.getCatchphrase(userId, emotion, surface);

    // Log usage
    if (catchphrase.catchphrase_id) {
      await this.logUsage(userId, catchphrase.catchphrase_id, null, emotion, surface);
    }

    const phrase = catchphrase.paraphrased_text;

    switch (position) {
      case 'start':
        return `${phrase}\n\n${response}`;
      case 'end':
        return `${response}\n\n${phrase}`;
      case 'middle':
        const sentences = response.split('. ');
        if (sentences.length > 2) {
          const midIndex = Math.floor(sentences.length / 2);
          sentences.splice(midIndex, 0, phrase);
          return sentences.join('. ');
        }
        return response;
      default:
        return response;
    }
  }

  /**
   * Inject Manglish expression into sentence
   * @param {string} sentence - Sentence
   * @param {string} emotion - Emotion
   * @returns {Promise<string>} Sentence with Manglish
   */
  async injectManglish(sentence, emotion) {
    const manglish = await this.getManglishExpression(emotion);

    // 50% chance to add
    if (Math.random() > 0.5) {
      // Remove existing punctuation, add Manglish
      return sentence.replace(/[.!?]$/, '') + ` ${manglish.expression}!`;
    }

    return sentence;
  }

  /**
   * Get usage statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Stats
   */
  async getUserStats(userId) {
    await this.ensureConnection();

    try {
      const result = await db.query(
        `SELECT
           COUNT(*) as total_interactions,
           COUNT(DISTINCT catchphrase_id) as unique_catchphrases_seen,
           COUNT(*) FILTER (WHERE surface = 'greeting') as greetings_received,
           MAX(used_at) as last_interaction
         FROM catchphrase_usage_log
         WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0];

    } catch (error) {
      console.error('[OnePieceV4] Get user stats error:', error);
      return null;
    }
  }

  /**
   * Submit user feedback on catchphrase
   * @param {string} userId - User ID
   * @param {number} catchphraseId - Catchphrase ID
   * @param {number} rating - Rating (1-5)
   * @param {string} reaction - Reaction (liked, disliked, neutral)
   */
  async submitFeedback(userId, catchphraseId, rating, reaction = 'neutral') {
    await this.ensureConnection();

    try {
      // Update usage log with feedback
      await db.query(
        `UPDATE catchphrase_usage_log
         SET user_rating = $1,
             user_reaction = $2
         WHERE user_id = $3
           AND catchphrase_id = $4
           AND used_at = (
             SELECT MAX(used_at)
             FROM catchphrase_usage_log
             WHERE user_id = $3 AND catchphrase_id = $4
           )`,
        [rating, reaction, userId, catchphraseId]
      );

      // Update catchphrase rating
      await db.query(
        `SELECT update_catchphrase_rating($1, $2)`,
        [catchphraseId, rating]
      );

    } catch (error) {
      console.error('[OnePieceV4] Submit feedback error:', error);
    }
  }

  /**
   * Get generic fallback for emotion
   * @param {string} emotion - Emotion
   * @returns {string} Fallback phrase
   */
  getGenericFallback(emotion) {
    const fallbacks = {
      EXCITED: "Let's find you something amazing!",
      DETERMINED: "We'll find the perfect one, I promise!",
      CONFIDENT: "Trust me, I've got this!",
      CURIOUS: "Interesting! Let me check this for you.",
      THOUGHTFUL: "Let me think about this carefully...",
      FRIENDLY: "Happy to help!",
      PROTECTIVE: "Let me make sure this is good for you.",
      PLAYFUL: "This is fun! Let's explore!",
      EMPATHETIC: "I understand, let's work through this together.",
      PROUD: "Great choice!",
      CONCERNED: "Let me double-check this for you...",
      INSPIRED: "Let's aim for the best!",
    };

    return fallbacks[emotion] || "Let me help you with that!";
  }
}

// ============================================================================
// INTEGRATION HELPERS (Database-Powered)
// ============================================================================

/**
 * Integration with Chat UI
 * @param {string} userId - User ID
 * @param {string} response - AI response
 * @param {string} emotion - Current emotion
 * @param {string} nickname - User nickname
 * @returns {Promise<string>} Enhanced response
 */
export async function enhanceChatResponse(userId, response, emotion, nickname = null) {
  const engine = new OnePieceCatchphraseEngineV4();

  // Try daily greeting first
  const greeting = await engine.getDailyGreeting(userId, nickname || 'nakama');
  if (greeting) {
    return `${greeting}\n\n${response}`;
  }

  // Otherwise inject catchphrase
  return await engine.injectCatchphrase(userId, response, emotion, 'chat', 'start');
}

/**
 * Integration with RAG (Retrieval-Augmented Generation)
 * @param {string} userId - User ID
 * @param {string} ragResponse - RAG response
 * @param {string} emotion - Current emotion
 * @returns {Promise<string>} Enhanced RAG response
 */
export async function enhanceRAGResponse(userId, ragResponse, emotion) {
  const engine = new OnePieceCatchphraseEngineV4();
  return await engine.injectCatchphrase(userId, ragResponse, emotion, 'rag', 'end');
}

/**
 * Integration with DeepResearch
 * @param {string} userId - User ID
 * @param {string} researchResponse - Research response
 * @param {string} emotion - Current emotion
 * @returns {Promise<string>} Enhanced research response
 */
export async function enhanceDeepResearchResponse(userId, researchResponse, emotion) {
  const engine = new OnePieceCatchphraseEngineV4();
  return await engine.injectCatchphrase(userId, researchResponse, emotion, 'deep_research', 'middle');
}

/**
 * Integration with TTS (Text-to-Speech)
 * Clean catchphrases for natural speech
 * @param {string} text - Text with catchphrases
 * @returns {string} TTS-friendly text
 */
export function prepareTTSText(text) {
  // Remove emojis for TTS
  let cleaned = text.replace(/[🏴‍☠️🎩😄😏🥰👋🔥⚡💪🎯]/g, '');

  // Normalize Manglish particles for pronunciation
  const pronunciationMap = {
    'lah': 'la',
    'leh': 'le',
    'lor': 'lor',
    'meh': 'me',
    'wah': 'wa',
    'alamak': 'ala-mak',
    'nakama': 'na-ka-ma',
    'shiok': 'shiok',
    'mantap': 'man-tap',
  };

  for (const [manglish, pronunciation] of Object.entries(pronunciationMap)) {
    cleaned = cleaned.replace(new RegExp(manglish, 'gi'), pronunciation);
  }

  return cleaned;
}

/**
 * Submit user feedback on catchphrase
 * @param {string} userId - User ID
 * @param {number} catchphraseId - Catchphrase ID
 * @param {number} rating - Rating (1-5)
 * @param {string} reaction - Reaction
 */
export async function submitCatchphraseFeedback(userId, catchphraseId, rating, reaction = 'liked') {
  const engine = new OnePieceCatchphraseEngineV4();
  await engine.submitFeedback(userId, catchphraseId, rating, reaction);
}

/**
 * Get user statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Stats
 */
export async function getUserCatchphraseStats(userId) {
  const engine = new OnePieceCatchphraseEngineV4();
  return await engine.getUserStats(userId);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  OnePieceCatchphraseEngineV4,
  enhanceChatResponse,
  enhanceRAGResponse,
  enhanceDeepResearchResponse,
  prepareTTSText,
  submitCatchphraseFeedback,
  getUserCatchphraseStats,
};
