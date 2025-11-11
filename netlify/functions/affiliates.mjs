import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    const params = event.queryStringParameters || {};
    const { laptopId, platform } = params;

    if (!laptopId) return errorResponse('Laptop ID required', 400);

    // Generate affiliate links (demo - would integrate with real affiliate programs)
    const links = {
      laptopId,
      affiliateLinks: [
        { platform: 'Lazada', url: 'https://lazada.com.my/laptop-' + laptopId, commission: '3-5%' },
        { platform: 'Shopee', url: 'https://shopee.com.my/laptop-' + laptopId, commission: '2-4%' }
      ],
      disclaimer: 'AI Bradaa may earn commissions from purchases through these links',
      timestamp: new Date().toISOString()
    };

    if (platform) {
      const filtered = links.affiliateLinks.filter(l => l.platform.toLowerCase() === platform.toLowerCase());
      return successResponse({ ...links, affiliateLinks: filtered });
    }

    return successResponse(links);
  } catch (error) {
    return errorResponse('Affiliate link generation failed', 500, { error: error.message });
  }
}
