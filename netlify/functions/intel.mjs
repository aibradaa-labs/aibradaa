import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';
import { getAllLaptops, getDatabaseStats } from './utils/laptopDb.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    const params = event.queryStringParameters || {};
    const { type = 'overview' } = params;

    let result;
    switch (type) {
      case 'overview':
        const stats = await getDatabaseStats();
        result = {
          type: 'overview',
          stats,
          lastUpdated: new Date().toISOString()
        };
        break;
      case 'trends':
        result = {
          type: 'trends',
          trending: ['Gaming laptops', 'Ultraportables', 'AMD Ryzen 7'],
          priceRanges: { budget: 2000-3000, midrange: 3000-5000, premium: '5000+' },
          popularBrands: ['ASUS', 'Lenovo', 'Dell', 'HP']
        };
        break;
      case 'compare':
        result = {
          type: 'compare',
          message: 'Comparison data available',
          note: 'Use /deck endpoint with IDs to compare laptops'
        };
        break;
      default:
        return errorResponse('Unknown intel type', 400);
    }

    return successResponse(result);
  } catch (error) {
    return errorResponse('Intel gathering failed', 500, { error: error.message });
  }
}
