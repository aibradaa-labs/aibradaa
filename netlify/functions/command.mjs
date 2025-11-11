import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import { filterLaptops, getLaptopById } from './utils/laptopDb.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    const user = getUserFromEvent(event);
    const rateLimit = await applyRateLimit(event, 'command');
    if (!rateLimit.allowed) return errorResponse('Rate limit exceeded', 429, rateLimit);

    const body = JSON.parse(event.body || '{}');
    const { command, params } = body;

    if (!command) return errorResponse('Command is required', 400);

    let result;
    switch (command) {
      case 'search':
        result = await filterLaptops(params || {});
        break;
      case 'details':
        if (!params?.id) return errorResponse('Laptop ID required', 400);
        result = await getLaptopById(params.id);
        break;
      case 'recommend':
        result = await filterLaptops({ limit: 10, sortBy: 'compositeScore', ...params });
        break;
      default:
        return errorResponse('Unknown command: ' + command, 400);
    }

    return successResponse({ command, result, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Command execution failed', 500, { error: error.message });
  }
}
