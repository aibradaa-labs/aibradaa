/**
 * Recommendations Netlify Function
 * Handles laptop recommendations using Gemini API
 * Routes: POST /, POST /compare
 */

import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  validateRequired
} from './utils/response.mjs';
import { getUserFromEvent } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';
import { compressForAI } from './utils/toon.mjs';
import {
  getSmartRecommendations,
  compareLaptops as dbCompareLaptops,
  getLaptopById
} from './utils/laptopDb.mjs';
import { getGeminiClient } from './utils/gemini.mjs';
import { enforceQuota } from './utils/quota.mjs';
import {
  detectEmotion,
  emotionalizeResponse,
} from '../../ai_pod/personas/catchphrases.mjs';

// Initialize Gemini client
const gemini = getGeminiClient(process.env.GEMINI_API_KEY);

/**
 * Get laptop recommendations using real database + AI insights
 */
async function getRecommendations({ budget, usage, preferences, userId }) {
  // Get real laptop recommendations from database
  const usageArray = Array.isArray(usage) ? usage : [usage];
  const recommendedLaptops = getSmartRecommendations({
    budget,
    usage: usageArray,
    preferences: preferences || {}
  }, 3);

  if (recommendedLaptops.length === 0) {
    return {
      recommendations: [],
      message: 'No laptops found matching your criteria. Try adjusting your budget or preferences.'
    };
  }

  // Use AI to generate reasoning and insights for each recommendation
  // Use TOON compression for laptop data (30-60% token savings)
  const laptopsCompressed = compressForAI(
    recommendedLaptops.map(l => ({
      brand: l.brandName,
      model: l.model,
      price: l.price,
      rating: l.rating,
      specs: {
        cpu: l.specs.cpu.model,
        gpu: l.specs.gpu.model,
        ram: l.specs.ram,
        storage: l.specs.storage,
        display: `${l.specs.display.size}" ${l.specs.display.refreshRate}Hz`
      },
      pros: l.pros,
      cons: l.cons
    })),
    { indent: false }
  );

  const preferencesStr = preferences && Object.keys(preferences).length > 0
    ? compressForAI(preferences, { indent: false })
    : 'none';

  const prompt = `You are an expert laptop advisor for AI Bradaa, Malaysia's laptop recommendation service.

User Requirements:
- Budget: MYR ${budget}
- Usage: ${usageArray.join(', ')}
- Preferences: ${preferencesStr}

Our database has selected these ${recommendedLaptops.length} laptops (TOON format):
${laptopsCompressed}

For each laptop, provide:
1. Brief reasoning (2-3 sentences) why it's recommended for this user
2. Match score (0-100) for user's needs

Respond in JSON:
{
  "insights": [
    {
      "laptopIndex": 0,
      "reasoning": "string",
      "matchScore": 85,
      "bestFor": "string"
    }
  ]
}`;

  let aiResult = null;

  try {
    // Generate AI insights with GeminiClient
    aiResult = await gemini.generate(prompt, {
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    });

    const text = aiResult.text;

    // Parse AI insights
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiInsights = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [] };

    // Combine database results with AI insights
    const recommendations = recommendedLaptops.map((laptop, index) => {
      const insight = aiInsights.insights?.find(i => i.laptopIndex === index) || {};
      return {
        id: laptop.id,
        name: laptop.fullName,
        brand: laptop.brandName,
        model: laptop.model,
        price: laptop.price,
        originalPrice: laptop.originalPrice,
        discount: laptop.discount,
        rating: laptop.rating,
        image: laptop.images.main,
        specs: {
          cpu: laptop.specs.cpu.model,
          gpu: laptop.specs.gpu.model,
          ram: laptop.specs.ram,
          storage: laptop.specs.storage,
          display: laptop.specs.display,
          battery: laptop.specs.batteryLife,
          weight: laptop.specs.weight
        },
        reasoning: insight.reasoning || `Great choice for ${usageArray.join(' and ')}`,
        matchScore: insight.matchScore || 75,
        bestFor: insight.bestFor || usageArray[0],
        pros: laptop.pros,
        cons: laptop.cons,
        availability: laptop.availability,
        url: `/laptop/${laptop.id}`
      };
    });

    // Add AI Bradaa personality to the overall response message
    const emotionContext = {
      userMessage: `Find laptop for ${usageArray.join(', ')} under MYR ${budget}`,
      responseText: `Found ${recommendations.length} great laptops`,
      isSuccess: true,
    };

    const emotion = detectEmotion(emotionContext);

    return {
      recommendations,
      count: recommendations.length,
      budget,
      usage: usageArray,
      emotion: emotion.name,
      aiUsage: aiResult ? {
        tokens: aiResult.tokens,
        cost: aiResult.cost,
      } : null,
    };

  } catch (error) {
    console.error('AI insights generation failed:', error);

    // Fallback: return recommendations without AI insights
    const recommendations = recommendedLaptops.map(laptop => ({
      id: laptop.id,
      name: laptop.fullName,
      brand: laptop.brandName,
      model: laptop.model,
      price: laptop.price,
      originalPrice: laptop.originalPrice,
      discount: laptop.discount,
      rating: laptop.rating,
      image: laptop.images.main,
      specs: {
        cpu: laptop.specs.cpu.model,
        gpu: laptop.specs.gpu.model,
        ram: laptop.specs.ram,
        storage: laptop.specs.storage,
        display: laptop.specs.display
      },
      reasoning: `Recommended for ${usageArray.join(' and ')} within your budget`,
      matchScore: 75,
      pros: laptop.pros,
      cons: laptop.cons,
      availability: laptop.availability,
      url: `/laptop/${laptop.id}`
    }));

    return {
      recommendations,
      count: recommendations.length,
      budget,
      usage: usageArray,
      note: 'AI insights unavailable, showing database recommendations'
    };
  }
}

/**
 * Compare laptops using real database + AI insights
 */
async function compareLaptops(laptopIds, userId) {
  // Get laptops from database
  const comparisonData = dbCompareLaptops(laptopIds);

  if (!comparisonData || comparisonData.laptops.length === 0) {
    return {
      error: 'No laptops found with the provided IDs',
      laptopIds
    };
  }

  const { laptops, comparison: dbComparison } = comparisonData;

  // Use AI to generate insights
  // Use TOON compression for laptop data
  const laptopsCompressed = compressForAI(
    laptops.map(l => ({
      id: l.id,
      brand: l.brandName,
      model: l.model,
      price: l.price,
      rating: l.rating,
      specs: {
        cpu: l.specs.cpu.model,
        gpu: l.specs.gpu.model,
        ram: l.specs.ram,
        storage: l.specs.storage,
        display: `${l.specs.display.size}" ${l.specs.display.refreshRate}Hz`,
        battery: l.specs.batteryLife,
        weight: l.specs.weight
      },
      pros: l.pros,
      cons: l.cons
    })),
    { indent: false }
  );

  const prompt = `Compare these laptops from our Malaysian database (TOON format):
${laptopsCompressed}

Database analysis:
- Price range: MYR ${dbComparison.priceRange.min} - ${dbComparison.priceRange.max}
- Best rating: ${dbComparison.bestRating.fullName} (${dbComparison.bestRating.rating}/5)
- Lightest: ${dbComparison.lightest.fullName} (${dbComparison.lightest.specs.weight}kg)

For each laptop, provide:
1. Key strengths (2-3 points)
2. Key weaknesses (1-2 points)
3. Best suited for (user type/use case)

Then provide overall recommendation.

Respond in JSON:
{
  "comparison": {
    "laptops": [
      {
        "id": "string",
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1"],
        "bestFor": "string"
      }
    ],
    "recommendation": "Which laptop is best overall and why (2-3 sentences)",
    "summary": "Key differences summary (2-3 sentences)"
  }
}`;

  let aiResult = null;

  try {
    // Generate comparison insights with GeminiClient
    aiResult = await gemini.generate(prompt, {
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    });

    const text = aiResult.text;

    // Parse AI insights
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiInsights = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    // Combine database data with AI insights
    const enrichedLaptops = laptops.map(laptop => {
      const aiData = aiInsights?.comparison?.laptops?.find(l => l.id === laptop.id) || {};
      return {
        id: laptop.id,
        name: laptop.fullName,
        brand: laptop.brandName,
        model: laptop.model,
        price: laptop.price,
        originalPrice: laptop.originalPrice,
        discount: laptop.discount,
        rating: laptop.rating,
        image: laptop.images.main,
        specs: {
          cpu: laptop.specs.cpu.model,
          gpu: laptop.specs.gpu.model,
          ram: laptop.specs.ram,
          storage: laptop.specs.storage,
          display: laptop.specs.display,
          battery: laptop.specs.batteryLife,
          weight: laptop.specs.weight
        },
        strengths: aiData.strengths || laptop.pros.slice(0, 3),
        weaknesses: aiData.weaknesses || laptop.cons.slice(0, 2),
        bestFor: aiData.bestFor || laptop.useCases[0],
        pros: laptop.pros,
        cons: laptop.cons,
        availability: laptop.availability
      };
    });

    // Add AI Bradaa personality to comparison
    const emotionContext = {
      userMessage: `Compare laptops: ${laptopIds.join(', ')}`,
      responseText: `Compared ${laptops.length} laptops`,
      isSuccess: true,
    };

    const emotion = detectEmotion(emotionContext);

    return {
      comparison: {
        laptops: enrichedLaptops,
        recommendation: aiInsights?.comparison?.recommendation ||
          `${dbComparison.bestRating.fullName} offers the best overall rating`,
        summary: aiInsights?.comparison?.summary ||
          `Comparing ${laptops.length} laptops across price range MYR ${dbComparison.priceRange.min}-${dbComparison.priceRange.max}`,
        stats: {
          priceRange: dbComparison.priceRange,
          bestRating: {
            name: dbComparison.bestRating.fullName,
            rating: dbComparison.bestRating.rating
          },
          bestValue: {
            name: dbComparison.bestValue.fullName,
            valueRatio: (dbComparison.bestValue.rating / dbComparison.bestValue.price * 1000).toFixed(2)
          },
          lightest: {
            name: dbComparison.lightest.fullName,
            weight: dbComparison.lightest.specs.weight
          },
          longestBattery: {
            name: dbComparison.longestBattery.fullName,
            hours: dbComparison.longestBattery.specs.batteryLife
          }
        }
      },
      emotion: emotion.name,
      aiUsage: aiResult ? {
        tokens: aiResult.tokens,
        cost: aiResult.cost,
      } : null,
    };

  } catch (error) {
    console.error('AI comparison generation failed:', error);

    // Fallback: return database comparison without AI insights
    const enrichedLaptops = laptops.map(laptop => ({
      id: laptop.id,
      name: laptop.fullName,
      brand: laptop.brandName,
      model: laptop.model,
      price: laptop.price,
      rating: laptop.rating,
      image: laptop.images.main,
      specs: laptop.specs,
      strengths: laptop.pros.slice(0, 3),
      weaknesses: laptop.cons.slice(0, 2),
      bestFor: laptop.useCases[0],
      pros: laptop.pros,
      cons: laptop.cons,
      availability: laptop.availability
    }));

    return {
      comparison: {
        laptops: enrichedLaptops,
        recommendation: `${dbComparison.bestRating.fullName} has the highest rating`,
        summary: `Comparing ${laptops.length} laptops`,
        stats: {
          priceRange: dbComparison.priceRange,
          bestRating: { name: dbComparison.bestRating.fullName, rating: dbComparison.bestRating.rating },
          bestValue: { name: dbComparison.bestValue.fullName },
          lightest: { name: dbComparison.lightest.fullName, weight: dbComparison.lightest.specs.weight },
          longestBattery: { name: dbComparison.longestBattery.fullName, hours: dbComparison.longestBattery.specs.batteryLife }
        }
      },
      note: 'AI insights unavailable, showing database comparison'
    };
  }
}

/**
 * Main handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Get user from token (optional)
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

    // Parse request body
    const body = parseBody(event);

    // Route based on path
    const path = event.path.replace(/^\/\.netlify\/functions\/recommendations/, '');

    if (path === '' || path === '/') {
      // Get recommendations
      validateRequired(body, ['budget', 'usage']);

      // Enforce quota BEFORE AI call
      const quotaCheck = await enforceQuota(user);
      if (!quotaCheck.allowed) {
        return quotaCheck.response;
      }

      const result = await getRecommendations({
        budget: body.budget,
        usage: body.usage,
        preferences: body.preferences || {},
        userId: user?.id
      });

      // Record usage AFTER AI call (if AI was used)
      if (result.aiUsage) {
        await quotaCheck.recordUsage(
          result.aiUsage.tokens.total,
          result.aiUsage.cost.sen,
          '/.netlify/functions/recommendations',
          {
            budget: body.budget,
            usage: body.usage,
            recommendationCount: result.count,
            emotion: result.emotion,
          }
        );
      }

      return successResponse({
        ...result,
        quota: quotaCheck.status.remaining,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: user?.id,
          tier: user?.tier || 'guest'
        }
      });
    } else if (path === '/compare') {
      // Compare laptops
      validateRequired(body, ['laptopIds']);

      if (!Array.isArray(body.laptopIds) || body.laptopIds.length < 2) {
        return errorResponse('At least 2 laptop IDs required for comparison', 400);
      }

      // Enforce quota BEFORE AI call
      const quotaCheck = await enforceQuota(user);
      if (!quotaCheck.allowed) {
        return quotaCheck.response;
      }

      const result = await compareLaptops(body.laptopIds, user?.id);

      // Record usage AFTER AI call (if AI was used)
      if (result.aiUsage) {
        await quotaCheck.recordUsage(
          result.aiUsage.tokens.total,
          result.aiUsage.cost.sen,
          '/.netlify/functions/recommendations/compare',
          {
            laptopIds: body.laptopIds,
            laptopCount: body.laptopIds.length,
            emotion: result.emotion,
          }
        );
      }

      return successResponse({
        ...result,
        quota: quotaCheck.status.remaining,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: user?.id
        }
      });
    } else {
      return errorResponse('Endpoint not found', 404);
    }

  } catch (error) {
    console.error('Recommendations error:', error);

    // Handle specific error types
    if (error.message.includes('Missing required fields')) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes('API key not valid')) {
      return errorResponse('AI service unavailable', 503);
    }

    return errorResponse(
      'Failed to get recommendations',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
