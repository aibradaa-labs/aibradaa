/**
 * Catchphrase Fetch Netlify Function
 * Routes:
 * - GET /daily - Get daily greeting catchphrase
 * - GET /random - Get random catchphrase
 * - GET /contextual - Get contextual catchphrase (tool, emotion, timeOfDay)
 *
 * Phase 6: Legal-safe paraphrasing with Gemini AI
 * - 80%+ transformation from internal references
 * - No direct One Piece quotes or character names
 */

import {
  successResponse,
  errorResponse,
  handleOptions
} from './utils/response.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import { paraphraseWithGemini, getToneFromEpisodeDatabase } from './paraphrase-engine.mjs';

/**
 * In-memory catchphrase storage (fallback when database not available)
 * In production, this would fetch from database
 */
const catchphrases = {
  daily: [
    {
      id: 'daily-1',
      text: "Wah, ready to hunt for your perfect laptop adventure today? Let's find something that fits you perfectly!",
      emotion: 'excited',
      context: 'daily_greeting'
    },
    {
      id: 'daily-2',
      text: "Yo! Welcome back to AI Bradaa! Time to discover some amazing laptop deals together!",
      emotion: 'confident',
      context: 'daily_greeting'
    },
    {
      id: 'daily-3',
      text: "Hello lah! Ready to explore the best laptops in Malaysia? I'm here to guide you!",
      emotion: 'supportive',
      context: 'daily_greeting'
    }
  ],
  contextual: {
    matchmaker_excited: "Let's find your dream laptop! I know exactly what will work for you!",
    matchmaker_supportive: "Don't worry, we'll find something perfect together lah!",
    versus_confident: "Good choice comparing these! Let me break down the differences for you.",
    versus_analytical: "Interesting matchup! Let's analyze which one gives you better value.",
    command_playful: "Ask away! I'm ready to help you find what you need!",
    command_supportive: "I'm here to answer all your laptop questions, no rush!",
    explorer_excited: "Wah, so many great options to choose from! Let's explore!",
    explorer_curious: "What kind of laptop catches your eye today?",
    intel_confident: "Check out these insights - they'll help you make a smart choice!",
    intel_professional: "Here's the latest data to guide your decision.",
    general_determined: "We won't stop until we find the perfect laptop for you!",
    general_enthusiastic: "This is going to be exciting - let's find your next laptop!"
  }
};

/**
 * Get daily greeting catchphrase with paraphrasing
 */
async function getDailyCatchphrase() {
  // Rotate based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const index = dayOfYear % catchphrases.daily.length;

  const baseCatchphrase = catchphrases.daily[index];

  // Get tone concept from episode database
  const toneConcept = getToneFromEpisodeDatabase({
    emotion: baseCatchphrase.emotion,
    context: 'daily_greeting'
  });

  // Paraphrase with Gemini (80%+ transformation)
  try {
    const paraphrasedText = await paraphraseWithGemini(toneConcept, {
      emotion: baseCatchphrase.emotion,
      context: 'daily_greeting',
      addManglish: true,
      energyLevel: 8
    });

    return {
      ...baseCatchphrase,
      text: paraphrasedText,
      paraphrased: true
    };
  } catch (error) {
    console.error('[Catchphrases] Paraphrase failed, using fallback:', error);
    return baseCatchphrase;
  }
}

/**
 * Get random catchphrase
 */
function getRandomCatchphrase() {
  const randomIndex = Math.floor(Math.random() * catchphrases.daily.length);
  return catchphrases.daily[randomIndex];
}

/**
 * Get contextual catchphrase with paraphrasing
 */
async function getContextualCatchphrase(tool = 'general', emotion = 'supportive') {
  const key = `${tool}_${emotion}`;

  // Try exact match
  let baseCatchphrase = catchphrases.contextual[key];

  if (!baseCatchphrase) {
    // Try tool with default emotion
    const defaultKey = `${tool}_supportive`;
    baseCatchphrase = catchphrases.contextual[defaultKey];
  }

  if (!baseCatchphrase) {
    // Fallback to general
    const fallbackKey = `general_${emotion}`;
    baseCatchphrase = catchphrases.contextual[fallbackKey];
  }

  if (!baseCatchphrase) {
    // Ultimate fallback
    baseCatchphrase = "Let me help you find the perfect laptop!";
  }

  // Get tone concept from episode database
  const toneConcept = getToneFromEpisodeDatabase({
    emotion,
    context: tool
  });

  // Paraphrase with Gemini (80%+ transformation)
  try {
    const paraphrasedText = await paraphraseWithGemini(toneConcept, {
      emotion,
      context: tool,
      addManglish: true,
      energyLevel: emotion === 'excited' ? 9 : 7
    });

    return {
      id: key,
      text: paraphrasedText,
      emotion,
      context: tool,
      paraphrased: true
    };
  } catch (error) {
    console.error('[Catchphrases] Paraphrase failed, using fallback:', error);
    return {
      id: key,
      text: typeof baseCatchphrase === 'string' ? baseCatchphrase : baseCatchphrase.text,
      emotion,
      context: tool,
      paraphrased: false
    };
  }
}

/**
 * Main handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Apply rate limiting (guest tier - 60 req/min)
    try {
      applyRateLimit(event, 'guest');
    } catch (rateLimitError) {
      if (rateLimitError.statusCode === 429) {
        return errorResponse(
          'Rate limit exceeded',
          429,
          { retryAfter: rateLimitError.retryAfter }
        );
      }
      throw rateLimitError;
    }

    // Route based on path
    const path = event.path.replace(/^\/\.netlify\/functions\/catchphrases/, '');
    const queryParams = event.queryStringParameters || {};

    // ========================================================================
    // GET /daily - Daily greeting catchphrase
    // ========================================================================
    if ((path === '/daily' || path === '') && event.httpMethod === 'GET') {
      const catchphrase = await getDailyCatchphrase();

      return successResponse({
        catchphrase,
        timestamp: new Date().toISOString(),
        expiresIn: '24h',
        paraphrased: catchphrase.paraphrased || false
      });
    }

    // ========================================================================
    // GET /random - Random catchphrase
    // ========================================================================
    if (path === '/random' && event.httpMethod === 'GET') {
      const catchphrase = getRandomCatchphrase();

      return successResponse({
        catchphrase,
        timestamp: new Date().toISOString()
      });
    }

    // ========================================================================
    // GET /contextual - Contextual catchphrase
    // ========================================================================
    if (path === '/contextual' && event.httpMethod === 'GET') {
      const { tool, emotion, timeOfDay, userTier } = queryParams;

      const catchphrase = await getContextualCatchphrase(tool, emotion);

      // Optionally adjust based on time of day
      if (timeOfDay === 'morning') {
        catchphrase.text = catchphrase.text.replace(/Hello|Hi|Hey|Yo/i, 'Good morning');
      } else if (timeOfDay === 'evening') {
        catchphrase.text = catchphrase.text.replace(/Hello|Hi|Hey|Yo/i, 'Good evening');
      }

      return successResponse({
        catchphrase,
        context: { tool, emotion, timeOfDay, userTier },
        timestamp: new Date().toISOString(),
        paraphrased: catchphrase.paraphrased || false
      });
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('[Catchphrases] Error:', error);

    return errorResponse(
      'Failed to fetch catchphrase',
      500,
      process.env.NODE_ENV !== 'production' ? { error: error.message } : null
    );
  }
}
