import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    // Camera/smartphone catalog endpoint (future expansion)
    return successResponse({
      message: 'Camera catalog coming soon!',
      status: 'planned',
      eta: '2025 Q2',
      note: 'AI Bradaa will expand to cameras, smartphones, and gadgets',
      currentFocus: 'Laptops (100% complete)',
      nextCategory: 'Cameras'
    });
  } catch (error) {
    return errorResponse('Camera endpoint error', 500, { error: error.message });
  }
}
