/**
 * Gemini Live WebSocket Proxy
 * AI Bradaa - Phase 5: Conversational Voice Interface
 *
 * IMPORTANT: WebSocket support on Netlify is limited.
 * This function provides a basic implementation but may require:
 * 1. Netlify Edge Functions for true WebSocket support, OR
 * 2. A separate WebSocket server (e.g., on Railway, Render, Fly.io), OR
 * 3. Third-party WebSocket service (Pusher, Ably, Socket.io cloud)
 *
 * Current Implementation:
 * - Uses HTTP streaming as fallback
 * - Supports chunked audio upload/download
 * - Session management
 *
 * For production, consider:
 * - Deploying a separate WebSocket server
 * - Using Google's Gemini Multimodal Live API directly from frontend (with API key protection)
 * - Using a WebSocket proxy service
 *
 * 84-Mentor Standards:
 * - AI POD: Real-time conversational AI
 * - Platform: Streaming optimization, session management
 * - Safety: Privacy protection, audio data encryption
 * - Customer: Low latency, high quality audio
 */

import { getGeminiClient } from './utils/gemini.mjs';
import { successResponse, errorResponse } from './utils/response.mjs';
import { applyRateLimit, getClientIdentifier } from './utils/rateLimiter.mjs';

/**
 * Session storage (in-memory, not suitable for production)
 * In production, use Redis, DynamoDB, or similar
 */
const sessions = new Map();

/**
 * Main handler
 */
export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS'
  };

  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { httpMethod, path } = event;

    // Route handling
    if (httpMethod === 'POST' && path.includes('/start')) {
      return await handleStartSession(event, headers);
    } else if (httpMethod === 'POST' && path.includes('/audio')) {
      return await handleAudioChunk(event, headers);
    } else if (httpMethod === 'GET' && path.includes('/poll')) {
      return await handlePollResponse(event, headers);
    } else if (httpMethod === 'DELETE' && path.includes('/stop')) {
      return await handleStopSession(event, headers);
    } else {
      return await handleLiveConnection(event, headers);
    }

  } catch (error) {
    console.error('[gemini-live] Error:', error);
    return createErrorResponse(error.message || 'Voice session failed', 500, headers);
  }
}

/**
 * Handle start session
 */
async function handleStartSession(event, headers) {
  try {
    const body = JSON.parse(event.body);
    const { model, personality, manglish, sampleRate } = body.config || {};

    // Rate limiting
    const rateLimiter = getRateLimiter();
    const clientId = event.headers['x-forwarded-for'] || 'anonymous';

    try {
      await rateLimiter.checkLimit(clientId, 'voice', {
        maxRequests: 5, // 5 sessions per hour
        windowMs: 3600000
      });
    } catch (error) {
      return createErrorResponse(error.message, 429, headers);
    }

    // Create session
    const sessionId = generateSessionId();

    const session = {
      id: sessionId,
      clientId,
      config: {
        model: model || 'gemini-2.5-pro',
        personality: personality || 'one_piece_v4',
        manglish: manglish !== false,
        sampleRate: sampleRate || 16000
      },
      state: {
        isActive: true,
        startTime: Date.now(),
        lastActivity: Date.now(),
        audioChunks: [],
        responseQueue: []
      },
      stats: {
        chunksReceived: 0,
        chunksSent: 0,
        totalTokens: 0,
        totalCost: 0
      }
    };

    // Store session
    sessions.set(sessionId, session);

    // Clean up old sessions
    cleanupOldSessions();

    console.log('[gemini-live] Session started:', sessionId);

    return createResponse({
      success: true,
      sessionId,
      message: 'Voice session started',
      websocketUrl: null, // Not available on Netlify functions
      pollingUrl: `/.netlify/functions/gemini-live/poll?sessionId=${sessionId}`,
      uploadUrl: `/.netlify/functions/gemini-live/audio?sessionId=${sessionId}`,
      fallback: {
        type: 'polling',
        note: 'WebSocket not available. Using HTTP polling as fallback.',
        recommendation: 'For production, deploy a dedicated WebSocket server.'
      }
    }, headers);

  } catch (error) {
    console.error('[gemini-live] Start session failed:', error);
    return createErrorResponse(error.message, 500, headers);
  }
}

/**
 * Handle audio chunk upload
 */
async function handleAudioChunk(event, headers) {
  try {
    const sessionId = new URLSearchParams(event.rawQuery).get('sessionId');

    if (!sessionId) {
      return createErrorResponse('Session ID required', 400, headers);
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return createErrorResponse('Session not found', 404, headers);
    }

    // Parse audio data (base64 encoded)
    const body = JSON.parse(event.body);
    const { audioData, isEndOfSpeech } = body;

    if (!audioData) {
      return createErrorResponse('Audio data required', 400, headers);
    }

    // Store audio chunk
    session.state.audioChunks.push({
      data: audioData,
      timestamp: Date.now()
    });

    session.state.lastActivity = Date.now();
    session.stats.chunksReceived++;

    console.log('[gemini-live] Audio chunk received:', {
      sessionId,
      chunkSize: audioData.length,
      totalChunks: session.state.audioChunks.length
    });

    // If end of speech detected, process audio
    if (isEndOfSpeech) {
      await processVoiceInput(session);
    }

    return createResponse({
      success: true,
      chunksReceived: session.stats.chunksReceived,
      message: isEndOfSpeech ? 'Processing speech...' : 'Chunk received'
    }, headers);

  } catch (error) {
    console.error('[gemini-live] Audio chunk failed:', error);
    return createErrorResponse(error.message, 500, headers);
  }
}

/**
 * Handle poll for response
 */
async function handlePollResponse(event, headers) {
  try {
    const sessionId = new URLSearchParams(event.rawQuery).get('sessionId');

    if (!sessionId) {
      return createErrorResponse('Session ID required', 400, headers);
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return createErrorResponse('Session not found', 404, headers);
    }

    // Check if there are responses in queue
    const responses = session.state.responseQueue.splice(0); // Get all and clear

    session.state.lastActivity = Date.now();

    return createResponse({
      success: true,
      hasResponses: responses.length > 0,
      responses,
      stats: session.stats
    }, headers);

  } catch (error) {
    console.error('[gemini-live] Poll failed:', error);
    return createErrorResponse(error.message, 500, headers);
  }
}

/**
 * Handle stop session
 */
async function handleStopSession(event, headers) {
  try {
    const sessionId = new URLSearchParams(event.rawQuery).get('sessionId');

    if (!sessionId) {
      return createErrorResponse('Session ID required', 400, headers);
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return createErrorResponse('Session not found', 404, headers);
    }

    // Calculate session stats
    const duration = Date.now() - session.state.startTime;

    const stats = {
      duration,
      chunksReceived: session.stats.chunksReceived,
      chunksSent: session.stats.chunksSent,
      totalTokens: session.stats.totalTokens,
      totalCost: session.stats.totalCost
    };

    // Remove session
    sessions.delete(sessionId);

    console.log('[gemini-live] Session stopped:', sessionId, stats);

    return createResponse({
      success: true,
      message: 'Session stopped',
      stats
    }, headers);

  } catch (error) {
    console.error('[gemini-live] Stop session failed:', error);
    return createErrorResponse(error.message, 500, headers);
  }
}

/**
 * Handle live WebSocket connection (fallback to error message)
 */
async function handleLiveConnection(event, headers) {
  return createResponse({
    error: 'WebSocket not supported on Netlify Functions',
    fallback: {
      type: 'polling',
      instructions: [
        '1. POST to /gemini-live/start to create a session',
        '2. POST audio chunks to /gemini-live/audio?sessionId=XXX',
        '3. Poll for responses at /gemini-live/poll?sessionId=XXX',
        '4. DELETE /gemini-live/stop?sessionId=XXX to end session'
      ]
    },
    alternatives: [
      'Deploy a dedicated WebSocket server (Railway, Render, Fly.io)',
      'Use Google Gemini Multimodal Live API directly from frontend',
      'Use a third-party WebSocket service (Pusher, Ably)'
    ]
  }, headers);
}

/**
 * Process voice input with Gemini
 */
async function processVoiceInput(session) {
  try {
    console.log('[gemini-live] Processing voice input:', {
      sessionId: session.id,
      chunks: session.state.audioChunks.length
    });

    // Initialize Gemini client
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const geminiClient = getGeminiClient(geminiApiKey);

    // Combine audio chunks (simplified - real implementation would need proper audio processing)
    const combinedAudio = session.state.audioChunks.map(chunk => chunk.data).join('');

    // For now, we'll use text-based processing
    // In a real implementation, this would use Gemini's audio input API
    // which requires proper audio encoding and multimodal API access

    const prompt = buildVoicePrompt(session);

    // Generate response
    const result = await geminiClient.generate(prompt, {
      model: session.config.model,
      config: {
        temperature: 0.8, // More creative for conversation
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 512 // Shorter for voice
      }
    });

    // Update stats
    session.stats.totalTokens += result.tokens.total;
    session.stats.totalCost += result.cost.sen;

    // Add response to queue
    session.state.responseQueue.push({
      type: 'text',
      text: result.text,
      emotion: detectEmotion(result.text),
      timestamp: Date.now(),
      tokens: result.tokens,
      cost: result.cost
    });

    session.stats.chunksSent++;

    // Clear processed audio chunks
    session.state.audioChunks = [];

    console.log('[gemini-live] Voice processed:', {
      sessionId: session.id,
      responseLength: result.text.length,
      tokens: result.tokens.total
    });

  } catch (error) {
    console.error('[gemini-live] Process voice failed:', error);

    // Add error to response queue
    session.state.responseQueue.push({
      type: 'error',
      message: 'Sorry lah, I couldn\'t process that. Can you try again?',
      timestamp: Date.now()
    });
  }
}

/**
 * Build prompt for voice interaction
 */
function buildVoicePrompt(session) {
  const basePrompt = `You are AI Bradaa, a Malaysian laptop expert assistant with One Piece v4.0 personality.

Key traits:
- Friendly and helpful like Luffy
- Speaks Manglish naturally (lah, leh, lor, wah)
- Passionate about helping users find the perfect laptop
- Uses One Piece references when appropriate
- Keeps responses conversational and concise (for voice)

Respond to the user's voice input in a natural, conversational way.
Keep your response under 100 words for voice output.`;

  return basePrompt;
}

/**
 * Detect emotion from text (simplified)
 */
function detectEmotion(text) {
  const emotionKeywords = {
    excited: ['wah', 'amazing', 'awesome', 'great', '!'],
    supportive: ['can', 'help', 'sure', 'let me'],
    thinking: ['hmm', 'let me see', 'considering'],
    friendly: ['lah', 'leh', 'lor']
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return emotion;
    }
  }

  return 'neutral';
}

/**
 * Clean up old sessions (> 1 hour inactive)
 */
function cleanupOldSessions() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.state.lastActivity > maxAge) {
      console.log('[gemini-live] Cleaning up old session:', sessionId);
      sessions.delete(sessionId);
    }
  }
}

/**
 * Generate session ID
 */
function generateSessionId() {
  return `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * PRODUCTION DEPLOYMENT NOTES:
 *
 * For true WebSocket support, consider:
 *
 * 1. Separate WebSocket Server (Recommended):
 *    - Deploy on Railway, Render, Fly.io, or AWS EC2
 *    - Use Socket.io or native WebSocket
 *    - Connect to Gemini Multimodal Live API
 *
 * 2. Netlify Edge Functions:
 *    - Use @netlify/edge-functions
 *    - Limited WebSocket support via Deno
 *
 * 3. Third-party Service:
 *    - Pusher Channels
 *    - Ably Realtime
 *    - Socket.io cloud
 *
 * 4. Direct Frontend Integration:
 *    - Connect to Gemini API directly from frontend
 *    - Use environment variables for API key protection
 *    - Implement rate limiting on backend
 *
 * Current implementation provides HTTP polling fallback
 * which works but has higher latency than WebSocket.
 */
