/**
 * Vision Analysis Function
 * AI Bradaa - Phase 5: Gemini Vision API
 *
 * Endpoint: /.netlify/functions/vision-analysis
 * Method: POST
 *
 * Features:
 * - Analyze laptop images
 * - Extract specifications from screenshots
 * - OCR for text extraction
 * - Benchmark chart analysis
 * - Multi-language translation
 *
 * 84-Mentor Standards:
 * - AI POD: Accurate vision analysis
 * - Platform: Rate limiting, validation
 * - Safety: Privacy protection, no storage
 * - Customer: Fast responses, clear results
 */

import { getGeminiClient } from './utils/gemini.mjs';
import { createResponse, createErrorResponse } from './utils/response.mjs';
import { getRateLimiter } from './utils/rateLimiter.mjs';

/**
 * Main handler
 */
export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405, headers);
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { image, mimeType, prompt, analysisType, options = {} } = body;

    // Validate input
    if (!image) {
      return createErrorResponse('Image data is required', 400, headers);
    }

    if (!mimeType) {
      return createErrorResponse('MIME type is required', 400, headers);
    }

    // Validate MIME type
    const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(mimeType)) {
      return createErrorResponse(`Unsupported format: ${mimeType}`, 400, headers);
    }

    // Rate limiting
    const rateLimiter = getRateLimiter();
    const clientId = event.headers['x-forwarded-for'] || 'anonymous';

    try {
      await rateLimiter.checkLimit(clientId, 'vision', {
        maxRequests: 10, // 10 images per hour
        windowMs: 3600000
      });
    } catch (error) {
      return createErrorResponse(error.message, 429, headers);
    }

    // Initialize Gemini client
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const geminiClient = getGeminiClient(geminiApiKey);

    // Prepare analysis prompt
    const analysisPrompt = prompt || getDefaultPrompt(analysisType);

    console.log('[vision-analysis] Starting analysis:', {
      analysisType,
      mimeType,
      promptLength: analysisPrompt.length
    });

    // Analyze image with Gemini Vision
    const result = await geminiClient.generateWithVision(
      analysisPrompt,
      { data: image, mimeType },
      {
        model: options.model || 'gemini-2.5-flash',
        config: {
          temperature: options.temperature || 0.4, // Lower temp for accuracy
          topK: 40,
          topP: 0.95,
          maxOutputTokens: options.maxOutputTokens || 2048
        }
      }
    );

    // Extract structured data if applicable
    let extractedData = null;
    if (analysisType === 'extract_specs') {
      extractedData = parseSpecifications(result.text);
    } else if (analysisType === 'benchmark_chart') {
      extractedData = parseBenchmarkData(result.text);
    }

    // Prepare response
    const response = {
      success: true,
      analysisType,
      result: result.text,
      extractedData,
      confidence: calculateConfidence(result.text, analysisType),
      tokens: result.tokens,
      cost: result.cost,
      model: result.model,
      metadata: {
        timestamp: new Date().toISOString(),
        analysisType,
        mimeType
      }
    };

    console.log('[vision-analysis] Analysis complete:', {
      tokens: result.tokens.total,
      cost: result.cost.sen,
      confidence: response.confidence
    });

    return createResponse(response, headers);

  } catch (error) {
    console.error('[vision-analysis] Error:', error);

    // Handle specific errors
    if (error.message?.includes('quota')) {
      return createErrorResponse('API quota exceeded. Please try again later.', 429, headers);
    }

    if (error.message?.includes('safety')) {
      return createErrorResponse('Image failed safety checks. Please use a different image.', 400, headers);
    }

    return createErrorResponse(error.message || 'Vision analysis failed', 500, headers);
  }
}

/**
 * Get default prompt for analysis type
 */
function getDefaultPrompt(analysisType) {
  const prompts = {
    identify: `Analyze this laptop image and identify:
1. Brand and model
2. Visible specifications (CPU, RAM, storage, display, etc.)
3. Approximate year/generation
4. Notable features
5. Estimated price range (in MYR if possible)

Be specific and detailed.`,

    extract_specs: `Extract ALL technical specifications visible in this image.
Format as structured data with these fields:
- Brand
- Model
- CPU (processor)
- RAM (memory)
- Storage (SSD/HDD)
- Display (size, resolution, refresh rate)
- GPU (graphics card)
- Battery
- Ports
- Weight
- Dimensions
- Other features

Only include specs that are clearly visible. Mark uncertain values with "?".`,

    benchmark_chart: `Analyze this performance benchmark chart or graph.
Extract:
1. Type of benchmark (gaming, CPU, GPU, etc.)
2. Laptops or components being compared
3. Numerical scores/results
4. Test conditions
5. Winner/best performer
6. Performance insights

Provide scores in a structured format.`,

    ocr: `Extract ALL text from this image using OCR.
- Maintain original formatting
- Preserve line breaks
- Include all visible text
- Note if text is in multiple languages`,

    translate: `Translate all non-English text in this image to English.
- Preserve technical terms
- Maintain context
- Indicate original language
- Provide both original and translated text`
  };

  return prompts[analysisType] || `Analyze this laptop-related image and provide detailed information.`;
}

/**
 * Parse specifications from text
 */
function parseSpecifications(text) {
  try {
    const specs = {};

    // Extract common specs using regex patterns
    const patterns = {
      brand: /(?:Brand|Manufacturer):\s*([^\n]+)/i,
      model: /(?:Model|Product):\s*([^\n]+)/i,
      cpu: /(?:CPU|Processor):\s*([^\n]+)/i,
      ram: /(?:RAM|Memory):\s*([^\n]+)/i,
      storage: /(?:Storage|SSD|HDD):\s*([^\n]+)/i,
      display: /(?:Display|Screen):\s*([^\n]+)/i,
      gpu: /(?:GPU|Graphics):\s*([^\n]+)/i,
      battery: /(?:Battery):\s*([^\n]+)/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        specs[key] = match[1].trim();
      }
    }

    return Object.keys(specs).length > 0 ? specs : null;

  } catch (error) {
    console.error('[vision-analysis] Parse specs failed:', error);
    return null;
  }
}

/**
 * Parse benchmark data from text
 */
function parseBenchmarkData(text) {
  try {
    const benchmarks = {};

    // Extract scores using common patterns
    const scorePattern = /(\w+(?:\s+\w+)*?):\s*(\d+(?:\.\d+)?)/g;
    let match;

    while ((match = scorePattern.exec(text)) !== null) {
      const [, name, score] = match;
      benchmarks[name.trim()] = parseFloat(score);
    }

    return Object.keys(benchmarks).length > 0 ? benchmarks : null;

  } catch (error) {
    console.error('[vision-analysis] Parse benchmark failed:', error);
    return null;
  }
}

/**
 * Calculate confidence score based on analysis
 */
function calculateConfidence(text, analysisType) {
  try {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on text characteristics
    if (text.length > 100) confidence += 0.1;
    if (text.length > 500) confidence += 0.1;

    // Analysis type specific confidence
    if (analysisType === 'identify') {
      if (text.match(/brand|model/i)) confidence += 0.2;
      if (text.match(/cpu|processor|ram|memory/i)) confidence += 0.1;
    } else if (analysisType === 'extract_specs') {
      const specCount = (text.match(/:\s*[^\n]+/g) || []).length;
      confidence += Math.min(specCount * 0.05, 0.3);
    } else if (analysisType === 'benchmark_chart') {
      const scoreCount = (text.match(/\d+(?:\.\d+)?/g) || []).length;
      confidence += Math.min(scoreCount * 0.03, 0.3);
    }

    // Cap at 0.95 (never 100% certain)
    return Math.min(confidence, 0.95);

  } catch (error) {
    return 0.5; // Default confidence
  }
}
