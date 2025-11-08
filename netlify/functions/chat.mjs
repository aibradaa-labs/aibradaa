/**
 * Chat Netlify Function
 * Handles AI chat interactions with Gemini
 * Routes: POST /, POST /stream
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  validateRequired
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import { getGeminiClient } from './utils/gemini.mjs';
import { enforceQuota } from './utils/quota.mjs';
import {
  detectEmotion,
  emotionalizeResponse,
} from '../../ai_pod/personas/catchphrases.mjs';

// Initialize Gemini client
const gemini = getGeminiClient(process.env.GEMINI_API_KEY);

/**
 * Chat with Gemini + AI Bradaa personality
 */
async function chatWithGemini({ message, context, userId }) {
  // Build conversation history from context
  const history = (context || []).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Generate response with Gemini
  const result = await gemini.chat(history, message, {
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  });

  // Detect emotion and add catchphrase
  const emotionContext = {
    userMessage: message,
    conversationHistory: context || [],
    responseText: result.text,
  };

  const emotion = detectEmotion(emotionContext);
  const emotionalizedText = emotionalizeResponse(
    result.text,
    emotionContext,
    'greeting' // Add catchphrase at start of response
  );

  return {
    message: emotionalizedText,
    role: 'assistant',
    emotion: emotion.name,
    tokens: result.tokens,
    cost: result.cost,
  };
}

/**
 * Main handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Get user from token (optional)
    const user = getUserFromEvent(event);
    const tier = user?.tier || 'guest';

    // Apply rate limiting
    try {
      applyRateLimit(event, tier);
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

    // Parse request body
    const body = parseBody(event);

    // Route based on path
    const path = event.path.replace(/^\/\.netlify\/functions\/chat/, '');

    if (path === '' || path === '/') {
      // Regular chat
      validateRequired(body, ['message']);

      // Enforce quota BEFORE AI call
      const quotaCheck = await enforceQuota(user);
      if (!quotaCheck.allowed) {
        return quotaCheck.response;
      }

      // Generate AI response
      const response = await chatWithGemini({
        message: body.message,
        context: body.context || [],
        userId: user?.id
      });

      // Record usage AFTER AI call
      await quotaCheck.recordUsage(
        response.tokens.total,
        response.cost.sen,
        '/.netlify/functions/chat',
        {
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
          emotion: response.emotion,
          messageLength: body.message.length,
        }
      );

      return successResponse({
        response: {
          message: response.message,
          role: response.role,
          emotion: response.emotion,
        },
        usage: {
          tokens: response.tokens,
          cost: response.cost,
        },
        quota: quotaCheck.status.remaining,
        timestamp: new Date().toISOString(),
        userId: user?.id
      });
    } else if (path === '/stream') {
      // Streaming chat (not yet implemented)
      // Netlify Functions have limited streaming support
      // Consider using Netlify Edge Functions for true streaming
      validateRequired(body, ['message']);

      return successResponse({
        message: 'Streaming not yet implemented. Use regular chat endpoint.',
        note: 'Consider Netlify Edge Functions for streaming support'
      });
    } else {
      return errorResponse('Endpoint not found', 404);
    }

  } catch (error) {
    console.error('Chat error:', error);

    // Handle specific error types
    if (error.message.includes('Missing required fields')) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes('API key not valid')) {
      return errorResponse('AI service unavailable', 503);
    }

    return errorResponse(
      'Failed to process chat message',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
