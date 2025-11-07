/**
 * Camera Tech Netlify Function
 * Handles image analysis and laptop identification using Gemini Vision API
 * Routes: POST /analyze, GET /capabilities
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  identifyLaptopFromAnalysis,
  findSimilarLaptops,
  findBetterAlternatives
} from './utils/laptopDb.mjs';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze uploaded image and identify laptop
 */
async function analyzeImage(imageData, user) {
  const startTime = Date.now();

  // Validate image format
  if (!imageData.startsWith('data:image/')) {
    const error = new Error('Invalid image format. Must be base64 encoded image.');
    error.statusCode = 400;
    throw error;
  }

  // Extract base64 data and check size
  const base64Data = imageData.split(',')[1];
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Check file size (max 5MB)
  if (imageBuffer.length > 5 * 1024 * 1024) {
    const error = new Error('Image too large. Maximum 5MB allowed.');
    error.statusCode = 400;
    throw error;
  }

  // Initialize Gemini Vision model
  const model = genAI.getGenerativeModel({
    model: 'gemini-pro-vision',
    generationConfig: {
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ]
  });

  // Prepare vision prompt
  const visionPrompt = `You are an expert laptop identification assistant for AI Bradaa, Malaysia's laptop recommendation service.

Analyze this laptop image and provide:
1. Brand identification
2. Model identification (if visible)
3. Confidence level (High/Medium/Low)
4. Key visible features
5. Estimated specifications based on design

Respond in JSON format:
{
  "brand": "string",
  "model": "string or null",
  "confidence": "high|medium|low",
  "confidenceScore": 0-100,
  "observations": ["list of visible features"],
  "estimatedSpecs": {
    "screenSize": "string or null",
    "condition": "new|used|unknown"
  },
  "identificationNotes": "string"
}`;

  // Prepare image parts for Gemini
  const imageParts = [{
    inlineData: {
      data: base64Data,
      mimeType: imageData.split(',')[0].split(':')[1].split(';')[0]
    }
  }];

  // Call Gemini Vision API
  const result = await model.generateContent([visionPrompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();

  // Parse JSON response
  let analysisResult;
  try {
    // Extract JSON from response (Gemini might include markdown formatting)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    analysisResult = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', text);
    const error = new Error('Failed to analyze image properly. Please try again.');
    error.statusCode = 500;
    throw error;
  }

  // Search database for matching laptop using real database
  const identified = identifyLaptopFromAnalysis(analysisResult);

  // Find similar laptops using real database
  const similar = identified ? findSimilarLaptops(identified.id, 3) : [];

  // Find better alternatives using real database
  const alternatives = identified ? findBetterAlternatives(identified.id, 3) : [];

  const latency = Date.now() - startTime;

  return {
    identified: identified || {
      brand: analysisResult.brand,
      model: analysisResult.model || 'Model not identified',
      confidence: analysisResult.confidence,
      message: 'Could not find exact match in database. Showing analysis results.'
    },
    analysis: analysisResult,
    similar,
    alternatives,
    processingTime: latency
  };
}

/**
 * Get camera tech capabilities
 */
function getCapabilities() {
  return {
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    features: [
      'Brand recognition',
      'Model identification',
      'Condition assessment',
      'Similar laptop suggestions',
      'Better alternative recommendations'
    ],
    confidence: {
      high: 'Exact model identified with 90%+ certainty',
      medium: 'Brand and series identified, specific model uncertain',
      low: 'Limited information, generic identification'
    }
  };
}

// Mock helper functions removed - now using real database from laptopDb.mjs

/**
 * Main handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Get user from token (optional for some endpoints)
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

    // Route based on path and method
    const path = event.path.replace(/^\/\.netlify\/functions\/camera/, '');

    // POST /analyze
    if (path === '/analyze' && event.httpMethod === 'POST') {
      const body = parseBody(event);

      if (!body.image) {
        return errorResponse('Image data is required', 400);
      }

      const result = await analyzeImage(body.image, user);
      return successResponse({
        success: true,
        data: result
      });
    }

    // GET /capabilities
    if (path === '/capabilities' && event.httpMethod === 'GET') {
      const capabilities = getCapabilities();
      return successResponse(capabilities);
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('Camera error:', error);

    // Handle specific error types
    const statusCode = error.statusCode || 500;
    return errorResponse(
      error.message || 'Failed to process camera request',
      statusCode,
      process.env.NODE_ENV !== 'production' ? error.stack : null
    );
  }
}
