#!/usr/bin/env node
/**
 * Catchphrase Auto-Fetch Service
 * Runs daily at 3:00 AM MYT (cron job)
 *
 * 84-Mentor Approved: INTERNAL ONLY System
 * Fetches new catchphrases and auto-paraphrases via Gemini 2.5 Pro
 * Queues for admin approval
 *
 * Usage:
 * - Manual run: node scripts/catchphrase-auto-fetch.mjs
 * - Cron job: 0 3 * * * cd /path/to/aibradaa && node scripts/catchphrase-auto-fetch.mjs
 */

import 'dotenv/config';
import db from '../database/connection.mjs';
import { getGeminiClient } from '../netlify/functions/utils/gemini.mjs';

// Initialize Gemini client
const gemini = getGeminiClient(process.env.GEMINI_API_KEY);

/**
 * Configuration
 */
const CONFIG = {
  batchSize: 10, // Process 10 episodes per run
  minConfidence: 0.75, // Minimum confidence threshold
  manglishWordsPerHundred: 2, // 1-2 Manglish words per 100 characters
  autoApprove: false, // Auto-approve high confidence (>= 0.90)
  autoApproveThreshold: 0.90,
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
};

/**
 * Sample One Piece catchphrases (INTERNAL ONLY - never exposed to frontend)
 * In production, this would fetch from an episode database or API
 */
const SAMPLE_CATCHPHRASES = [
  {
    episodeNumber: 1,
    originalText: "I'm gonna be King of the Pirates!",
    character: 'Luffy',
    context: 'Declaration of dream',
    tone: 'determined',
  },
  {
    episodeNumber: 45,
    originalText: "If you don't take risks, you can't create a future!",
    character: 'Luffy',
    context: 'Encouragement',
    tone: 'motivational',
  },
  {
    episodeNumber: 37,
    originalText: 'I don\'t want to conquer anything. I just think the guy with the most freedom in this whole ocean is the Pirate King!',
    character: 'Luffy',
    context: 'Philosophy',
    tone: 'friendly',
  },
  {
    episodeNumber: 151,
    originalText: "A man forgives a woman's lies.",
    character: 'Sanji',
    context: 'Chivalry',
    tone: 'friendly',
  },
  {
    episodeNumber: 278,
    originalText: 'When do you think people die? When they are shot? No. When they eat a bad mushroom? No! People die when they are forgotten!',
    character: 'Dr. Hiluluk',
    context: 'Legacy',
    tone: 'motivational',
  },
];

/**
 * Paraphrase catchphrase using Gemini 2.5 Pro
 */
async function paraphraseCatchphrase(originalText, tone, retries = 0) {
  try {
    const prompt = `You are a Manglish tone adapter for AI Bradaa, a Malaysian laptop recommendation platform.

TASK: Paraphrase the following catchphrase to make it IP-safe while maintaining the spirit and energy. Add light Manglish words (${CONFIG.manglishWordsPerHundred} per 100 characters).

ORIGINAL TEXT: "${originalText}"
TONE: ${tone}

REQUIREMENTS:
1. Keep the energy and spirit of the original
2. Make it IP-safe (no direct quotes or character names)
3. Inject ${CONFIG.manglishWordsPerHundred} Manglish words per 100 characters (lah, leh, can, wah, aiya, etc.)
4. Keep it natural and enthusiastic
5. Suitable for laptop recommendation context
6. Max 200 characters

IMPORTANT: Respond ONLY with a JSON object in this exact format:
{
  "paraphrased": "Your paraphrased text here",
  "manglishWords": ["lah", "wah"],
  "confidence": 0.92,
  "reasoning": "Brief explanation of changes"
}`;

    const result = await gemini.generate(prompt, {
      model: process.env.GEMINI_MODEL_PRO || 'gemini-exp-1206',
      temperature: 0.8,
      maxOutputTokens: 500,
    });

    // Parse JSON response
    let jsonText = result.text.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(jsonText);

    // Validate confidence threshold
    if (parsed.confidence < CONFIG.minConfidence) {
      throw new Error(`Low confidence (${parsed.confidence}). Minimum ${CONFIG.minConfidence} required.`);
    }

    return {
      paraphrasedText: parsed.paraphrased,
      manglishWords: parsed.manglishWords || [],
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      tokens: result.tokens,
      cost: result.cost,
    };

  } catch (error) {
    console.error(`[AutoFetch] Paraphrase error (attempt ${retries + 1}):`, error.message);

    // Retry on failure
    if (retries < CONFIG.retryAttempts) {
      console.log(`[AutoFetch] Retrying in ${CONFIG.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      return paraphraseCatchphrase(originalText, tone, retries + 1);
    }

    throw error;
  }
}

/**
 * Insert original catchphrase into database
 */
async function insertOriginalCatchphrase(catchphrase) {
  try {
    const result = await db.query(
      `INSERT INTO one_piece_catchphrases (episode_number, original_text, character, context, tone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (episode_number, original_text) DO NOTHING
       RETURNING id`,
      [
        catchphrase.episodeNumber,
        catchphrase.originalText,
        catchphrase.character,
        catchphrase.context,
        catchphrase.tone,
      ]
    );

    return result.rows.length > 0 ? result.rows[0].id : null;

  } catch (error) {
    console.error('[AutoFetch] Insert original error:', error.message);
    throw error;
  }
}

/**
 * Insert paraphrased catchphrase into database
 */
async function insertParaphrasedCatchphrase(originalId, paraphrased, autoApprove = false) {
  try {
    const result = await db.query(
      `INSERT INTO paraphrased_catchphrases (
        original_id,
        paraphrased_text,
        manglish_words,
        gemini_confidence,
        approved,
        approved_by,
        approved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        originalId,
        paraphrased.paraphrasedText,
        paraphrased.manglishWords,
        paraphrased.confidence,
        autoApprove,
        autoApprove ? 'system' : null,
        autoApprove ? new Date() : null,
      ]
    );

    return result.rows[0].id;

  } catch (error) {
    console.error('[AutoFetch] Insert paraphrased error:', error.message);
    throw error;
  }
}

/**
 * Create fetch job record
 */
async function createFetchJob() {
  try {
    const result = await db.query(
      `INSERT INTO catchphrase_fetch_jobs (fetch_date, status)
       VALUES (CURRENT_DATE, 'running')
       RETURNING id`,
      []
    );

    return result.rows[0].id;

  } catch (error) {
    console.error('[AutoFetch] Create job error:', error.message);
    throw error;
  }
}

/**
 * Update fetch job status
 */
async function updateFetchJob(jobId, stats, status = 'completed', errorMessage = null) {
  try {
    await db.query(
      `UPDATE catchphrase_fetch_jobs
       SET episodes_processed = $1,
           catchphrases_added = $2,
           paraphrases_generated = $3,
           status = $4,
           error_message = $5,
           completed_at = NOW(),
           metadata = $6
       WHERE id = $7`,
      [
        stats.episodesProcessed,
        stats.catchphrasesAdded,
        stats.paraphrasesGenerated,
        status,
        errorMessage,
        JSON.stringify(stats.metadata || {}),
        jobId,
      ]
    );

  } catch (error) {
    console.error('[AutoFetch] Update job error:', error.message);
  }
}

/**
 * Main auto-fetch function
 */
async function runAutoFetch() {
  console.log('[AutoFetch] Starting catchphrase auto-fetch...');
  console.log(`[AutoFetch] Time: ${new Date().toISOString()}`);

  let jobId = null;
  const stats = {
    episodesProcessed: 0,
    catchphrasesAdded: 0,
    paraphrasesGenerated: 0,
    autoApproved: 0,
    totalTokens: 0,
    totalCost: 0,
    metadata: {
      model: process.env.GEMINI_MODEL_PRO || 'gemini-exp-1206',
      avgConfidence: 0,
      confidenceScores: [],
    },
  };

  try {
    // Connect to database
    await db.connect();
    console.log('[AutoFetch] Database connected');

    // Create job record
    jobId = await createFetchJob();
    console.log(`[AutoFetch] Job created: ${jobId}`);

    // Fetch catchphrases (using sample data for now)
    // In production, this would fetch from an episode database or API
    const catchphrases = SAMPLE_CATCHPHRASES.slice(0, CONFIG.batchSize);
    console.log(`[AutoFetch] Processing ${catchphrases.length} catchphrases`);

    // Process each catchphrase
    for (const catchphrase of catchphrases) {
      console.log(`\n[AutoFetch] Processing episode ${catchphrase.episodeNumber}: "${catchphrase.originalText.substring(0, 50)}..."`);

      try {
        // Insert original catchphrase
        const originalId = await insertOriginalCatchphrase(catchphrase);

        if (!originalId) {
          console.log(`[AutoFetch] Skipping (already exists)`);
          continue;
        }

        stats.catchphrasesAdded++;

        // Paraphrase using Gemini
        const paraphrased = await paraphraseCatchphrase(catchphrase.originalText, catchphrase.tone);

        // Auto-approve if confidence is high enough
        const autoApprove = CONFIG.autoApprove && paraphrased.confidence >= CONFIG.autoApproveThreshold;

        // Insert paraphrased version
        const paraphrasedId = await insertParaphrasedCatchphrase(originalId, paraphrased, autoApprove);

        stats.paraphrasesGenerated++;
        if (autoApprove) stats.autoApproved++;
        stats.totalTokens += paraphrased.tokens.total;
        stats.totalCost += paraphrased.cost.sen;
        stats.metadata.confidenceScores.push(paraphrased.confidence);

        console.log(`[AutoFetch]  Paraphrased (confidence: ${paraphrased.confidence}, ${autoApprove ? 'auto-approved' : 'queued for approval'})`);
        console.log(`[AutoFetch]   Original: "${catchphrase.originalText.substring(0, 80)}..."`);
        console.log(`[AutoFetch]   Paraphrased: "${paraphrased.paraphrasedText}"`);
        console.log(`[AutoFetch]   Manglish words: [${paraphrased.manglishWords.join(', ')}]`);

      } catch (error) {
        console.error(`[AutoFetch]  Failed to process episode ${catchphrase.episodeNumber}:`, error.message);
      }

      stats.episodesProcessed++;
    }

    // Calculate average confidence
    if (stats.metadata.confidenceScores.length > 0) {
      stats.metadata.avgConfidence = (
        stats.metadata.confidenceScores.reduce((a, b) => a + b, 0) / stats.metadata.confidenceScores.length
      ).toFixed(2);
    }

    // Update job status
    await updateFetchJob(jobId, stats, 'completed');

    console.log('\n[AutoFetch] ========================================');
    console.log('[AutoFetch] Auto-fetch completed successfully!');
    console.log(`[AutoFetch] Episodes processed: ${stats.episodesProcessed}`);
    console.log(`[AutoFetch] Catchphrases added: ${stats.catchphrasesAdded}`);
    console.log(`[AutoFetch] Paraphrases generated: ${stats.paraphrasesGenerated}`);
    console.log(`[AutoFetch] Auto-approved: ${stats.autoApproved}`);
    console.log(`[AutoFetch] Average confidence: ${stats.metadata.avgConfidence}`);
    console.log(`[AutoFetch] Total tokens: ${stats.totalTokens}`);
    console.log(`[AutoFetch] Total cost: RM${(stats.totalCost / 100).toFixed(2)}`);
    console.log('[AutoFetch] ========================================\n');

    return {
      success: true,
      stats,
    };

  } catch (error) {
    console.error('[AutoFetch] Fatal error:', error);

    // Update job status as failed
    if (jobId) {
      await updateFetchJob(jobId, stats, 'failed', error.message);
    }

    return {
      success: false,
      error: error.message,
      stats,
    };

  } finally {
    // Disconnect database
    await db.disconnect();
    console.log('[AutoFetch] Database disconnected');
  }
}

/**
 * Run if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutoFetch()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('[AutoFetch] Unhandled error:', error);
      process.exit(1);
    });
}

export { runAutoFetch };
