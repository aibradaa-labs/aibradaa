import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';
import { filterLaptops } from './utils/laptopDb.mjs';
import { compressForAI } from './utils/toon.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    const params = event.queryStringParameters || {};
    const { useCase, maxPrice, limit = 20, compress = 'false' } = params;

    const filters = {};
    if (useCase) filters.useCase = useCase;
    if (maxPrice) filters.maxPrice = parseInt(maxPrice);
    filters.limit = parseInt(limit);

    const laptops = await filterLaptops(filters);

    const deck = {
      meta: { total: laptops.length, useCase, maxPrice, generated: new Date().toISOString() },
      laptops: laptops
    };

    if (compress === 'true') {
      const compressed = compressForAI(JSON.stringify(deck));
      return successResponse({ compressed: true, ...compressed });
    }

    return successResponse(deck);
  } catch (error) {
    return errorResponse('Failed to generate deck', 500, { error: error.message });
  }
}
