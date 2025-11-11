import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    const user = getUserFromEvent(event);
    const rateLimit = await applyRateLimit(event, 'chat');
    if (!rateLimit.allowed) return errorResponse('Rate limit exceeded', 429, rateLimit);

    if (event.httpMethod !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const body = JSON.parse(event.body || '{}');
    const { message, context } = body;

    if (!message) return errorResponse('Message is required', 400);

    // AI Bradaa chat response (demo mode - would integrate with Gemini in production)
    const response = {
      message: 'AI Bradaa here! I can help you find the perfect laptop. What are you looking for?',
      suggestions: ['Show me laptops for gaming', 'Best laptops under RM5000', 'Laptops for programming'],
      context: context || {},
      timestamp: new Date().toISOString()
    };

    return successResponse(response);
  } catch (error) {
    return errorResponse('Chat failed', 500, { error: error.message });
  }
}
