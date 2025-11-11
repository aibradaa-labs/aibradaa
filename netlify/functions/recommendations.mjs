import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';
import { getSmartRecommendations } from './utils/laptopDb.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    const body = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : {};
    const params = event.queryStringParameters || {};

    const preferences = {
      budget: parseInt(params.budget || body.budget || 5000),
      usage: (params.usage || body.usage || '').split(',').filter(Boolean),
      portability: params.portability || body.portability,
      limit: parseInt(params.limit || body.limit || 10)
    };

    const recommendations = await getSmartRecommendations(preferences);

    return successResponse({
      preferences,
      recommendations,
      count: recommendations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return errorResponse('Failed to get recommendations', 500, { error: error.message });
  }
}
