import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';
import { getUserFromEvent, verifyToken } from './utils/auth.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { username, password } = body;

      if (!username || !password) {
        return errorResponse('Username and password required', 400);
      }

      // Simple demo auth - in production, verify against real database
      if (username === 'demo' && password === 'demo123') {
        const token = 'demo-jwt-token-' + Date.now();
        return successResponse({ token, user: { username, role: 'user' } });
      }

      return errorResponse('Invalid credentials', 401);
    }

    if (event.httpMethod === 'GET') {
      const user = getUserFromEvent(event);
      if (!user) return errorResponse('Unauthorized', 401);
      return successResponse({ user });
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    return errorResponse('Authentication failed', 500, { error: error.message });
  }
}
