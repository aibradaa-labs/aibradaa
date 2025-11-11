import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    const user = getUserFromEvent(event);
    if (!user) return errorResponse('Unauthorized', 401);

    if (event.httpMethod === 'GET') {
      // Get user profile
      return successResponse({
        user: {
          id: user.id || 'demo-user',
          username: user.username || 'demo',
          role: user.role || 'user',
          preferences: {},
          savedSearches: [],
          lastActive: new Date().toISOString()
        }
      });
    }

    if (event.httpMethod === 'PUT') {
      // Update user preferences
      const body = JSON.parse(event.body || '{}');
      return successResponse({
        message: 'User preferences updated',
        preferences: body.preferences || {}
      });
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    return errorResponse('User operation failed', 500, { error: error.message });
  }
}
