/**
 * Camera Tech API Routes
 * Handles image analysis and laptop identification
 */

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPersona, getGenerationConfig, logUsage } from '../../ai-pod/config.mjs';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory laptop database (in production, this would be a real database)
// For now, we'll use a simplified version
const laptopDatabase = [
  // This will be populated from the actual database
  // For now, mock data for testing
];

/**
 * Analyze uploaded image and identify laptop
 * POST /api/camera/analyze
 * Body: { image: base64_string }
 */
router.post('/analyze', async (req, res) => {
  const startTime = Date.now();

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: { message: 'Image data is required' }
      });
    }

    // Validate image format and size
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        error: { message: 'Invalid image format. Must be base64 encoded image.' }
      });
    }

    // Extract base64 data
    const base64Data = image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Check file size (max 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: { message: 'Image too large. Maximum 5MB allowed.' }
      });
    }

    // Get camera persona configuration
    const persona = getPersona('camera');
    const generationConfig = getGenerationConfig('camera');

    // Initialize Gemini Vision model
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro-vision',
      generationConfig,
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
    const visionPrompt = `${persona.systemPrompt}

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
        mimeType: image.split(',')[0].split(':')[1].split(';')[0]
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
      return res.status(500).json({
        error: { message: 'Failed to analyze image properly. Please try again.' }
      });
    }

    // Search database for matching laptop
    const identified = await searchLaptopDatabase(analysisResult);

    // Find similar laptops
    const similar = identified ? await findSimilarLaptops(identified, 3) : [];

    // Find better alternatives
    const alternatives = identified ? await findBetterAlternatives(identified, 3) : [];

    // Log usage
    const latency = Date.now() - startTime;
    logUsage({
      persona: 'camera',
      inputTokens: estimateTokens(visionPrompt),
      outputTokens: estimateTokens(text),
      latency,
      success: true
    });

    // Return results
    res.json({
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
    });

  } catch (error) {
    console.error('Camera analysis error:', error);

    // Log failed usage
    logUsage({
      persona: 'camera',
      inputTokens: 0,
      outputTokens: 0,
      latency: Date.now() - startTime,
      success: false
    });

    res.status(500).json({
      error: {
        message: 'Failed to analyze image. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * Get camera tech capabilities
 * GET /api/camera/capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
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
  });
});

/**
 * Helper: Search laptop database for matching model
 */
async function searchLaptopDatabase(analysis) {
  // In production, this would query a real database
  // For now, return mock data based on brand

  if (analysis.confidence === 'high' && analysis.model) {
    // Try exact match
    const brandLower = analysis.brand.toLowerCase();
    const modelLower = analysis.model.toLowerCase();

    // Mock database search (replace with actual DB query)
    // This would use the 90-laptop database in production

    return {
      id: 'laptop-' + Date.now(),
      brand: analysis.brand,
      model: analysis.model,
      price_MYR: 5499, // Mock price
      score_composite: 85,
      description: 'Identified from your image',
      image: null,
      specs: {
        cpu: analysis.estimatedSpecs?.processor || 'Intel Core i7',
        ram: { gb: 16 },
        storage: { gb: 512 },
        display: analysis.estimatedSpecs?.screenSize || '15.6" FHD'
      }
    };
  }

  return null;
}

/**
 * Helper: Find similar laptops
 */
async function findSimilarLaptops(laptop, limit = 3) {
  // In production, find laptops with:
  // - Same brand
  // - Similar price range (±20%)
  // - Similar screen size

  // Mock similar laptops
  return [
    {
      id: 'similar-1',
      brand: laptop.brand,
      model: laptop.model + ' (Alternative Config)',
      price_MYR: laptop.price_MYR * 0.9,
      score_composite: laptop.score_composite - 5,
      image: null
    },
    {
      id: 'similar-2',
      brand: laptop.brand,
      model: laptop.model + ' Pro',
      price_MYR: laptop.price_MYR * 1.1,
      score_composite: laptop.score_composite + 5,
      image: null
    }
  ];
}

/**
 * Helper: Find better value alternatives
 */
async function findBetterAlternatives(laptop, limit = 3) {
  // In production, find laptops with:
  // - Similar or lower price
  // - Higher composite score
  // - Different brand (for comparison)

  // Mock alternatives
  return [
    {
      id: 'alt-1',
      brand: 'Lenovo',
      model: 'ThinkBook 15',
      price_MYR: laptop.price_MYR * 0.95,
      score_composite: laptop.score_composite + 8,
      image: null,
      reason: 'Better performance per ringgit'
    },
    {
      id: 'alt-2',
      brand: 'ASUS',
      model: 'VivoBook Pro',
      price_MYR: laptop.price_MYR * 1.05,
      score_composite: laptop.score_composite + 10,
      image: null,
      reason: 'Higher specs at similar price'
    }
  ];
}

/**
 * Helper: Estimate token count
 */
function estimateTokens(text) {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export default router;
