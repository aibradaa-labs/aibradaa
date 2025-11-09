/**
 * Matchmaker Recommend Netlify Function
 * 5-question wizard → 3 perfect laptop matches
 * Smart scoring algorithm with budget as primary constraint
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
import { getGeminiClient } from './utils/gemini.mjs';
import { enforceQuota } from './utils/quota.mjs';

// Initialize Gemini client
const gemini = getGeminiClient(process.env.GEMINI_API_KEY);

/**
 * Mock laptop database (Top 100 curated)
 * In production, this would come from database
 */
const LAPTOP_DATABASE = [
  {
    id: '1',
    name: 'Dell XPS 15',
    brand: 'Dell',
    price: 6999,
    specs: { cpu: 'Intel i7-13700H', ram: '16GB', storage: '512GB SSD', gpu: 'RTX 4050' },
    image: '/assets/laptops/dell-xps-15.jpg',
    useCases: ['work', 'creative', 'programming'],
    portability: 'moderate',
    specsPriority: ['performance', 'display', 'balanced']
  },
  {
    id: '2',
    name: 'MacBook Pro 14"',
    brand: 'Apple',
    price: 9999,
    specs: { cpu: 'M3 Pro', ram: '18GB', storage: '512GB SSD', gpu: 'M3 Pro GPU' },
    image: '/assets/laptops/macbook-pro-14.jpg',
    useCases: ['creative', 'programming', 'work'],
    portability: 'very',
    specsPriority: ['performance', 'battery', 'display']
  },
  {
    id: '3',
    name: 'Lenovo ThinkPad E14',
    brand: 'Lenovo',
    price: 3499,
    specs: { cpu: 'Intel i5-1335U', ram: '16GB', storage: '256GB SSD', gpu: 'Integrated' },
    image: '/assets/laptops/thinkpad-e14.jpg',
    useCases: ['work', 'student', 'general'],
    portability: 'very',
    specsPriority: ['battery', 'balanced']
  },
  {
    id: '4',
    name: 'ASUS ROG Zephyrus G14',
    brand: 'ASUS',
    price: 7999,
    specs: { cpu: 'AMD Ryzen 9 7940HS', ram: '16GB', storage: '1TB SSD', gpu: 'RTX 4060' },
    image: '/assets/laptops/rog-g14.jpg',
    useCases: ['gaming', 'creative', 'programming'],
    portability: 'moderate',
    specsPriority: ['performance', 'display']
  },
  {
    id: '5',
    name: 'HP Spectre x360 14',
    brand: 'HP',
    price: 6499,
    specs: { cpu: 'Intel i7-1355U', ram: '16GB', storage: '512GB SSD', gpu: 'Integrated' },
    image: '/assets/laptops/hp-spectre.jpg',
    useCases: ['work', 'creative', 'student'],
    portability: 'very',
    specsPriority: ['display', 'battery', 'balanced']
  },
  {
    id: '6',
    name: 'Lenovo IdeaPad 3',
    brand: 'Lenovo',
    price: 2299,
    specs: { cpu: 'Intel i5-1235U', ram: '8GB', storage: '512GB SSD', gpu: 'Integrated' },
    image: '/assets/laptops/ideapad-3.jpg',
    useCases: ['student', 'general', 'work'],
    portability: 'moderate',
    specsPriority: ['balanced', 'storage']
  },
  {
    id: '7',
    name: 'ASUS ZenBook 14',
    brand: 'ASUS',
    price: 4999,
    specs: { cpu: 'Intel i7-1355U', ram: '16GB', storage: '512GB SSD', gpu: 'Integrated' },
    image: '/assets/laptops/zenbook-14.jpg',
    useCases: ['work', 'student', 'programming'],
    portability: 'very',
    specsPriority: ['battery', 'performance', 'balanced']
  },
  {
    id: '8',
    name: 'Acer Predator Helios 300',
    brand: 'Acer',
    price: 6299,
    specs: { cpu: 'Intel i7-13700HX', ram: '16GB', storage: '512GB SSD', gpu: 'RTX 4060' },
    image: '/assets/laptops/predator-helios.jpg',
    useCases: ['gaming', 'creative'],
    portability: 'not',
    specsPriority: ['performance', 'display']
  }
];

/**
 * Get budget tier from price
 */
function getBudgetTier(budget) {
  if (budget === 'budget') return { min: 2000, max: 3500 };
  if (budget === 'mid') return { min: 3500, max: 6000 };
  if (budget === 'premium') return { min: 6000, max: 10000 };
  if (budget === 'flagship') return { min: 10000, max: 99999 };
  return { min: 0, max: 99999 };
}

/**
 * Score laptop based on user answers
 * Budget is PRIMARY constraint (filter first, then score)
 */
function scoreLaptop(laptop, answers) {
  let score = 50; // Base score

  // Use case match (+20 for exact match, +10 for partial)
  if (answers.useCase && laptop.useCases.includes(answers.useCase)) {
    score += 20;
  }

  // Portability match (+15 if matches)
  if (answers.portability && laptop.portability === answers.portability) {
    score += 15;
  }

  // Specs priority (+10 for each matching priority)
  if (answers.specsPriority && laptop.specsPriority.includes(answers.specsPriority)) {
    score += 10;
  }

  // Brand preference (+5 if matches, doesn't penalize if no preference)
  if (answers.brand && answers.brand !== 'any' && laptop.brand.toLowerCase() === answers.brand) {
    score += 5;
  }

  // Price optimization (closer to middle of budget range is better)
  const budgetTier = getBudgetTier(answers.budget);
  const budgetMid = (budgetTier.min + budgetTier.max) / 2;
  const priceDiff = Math.abs(laptop.price - budgetMid);
  const maxDiff = (budgetTier.max - budgetTier.min) / 2;
  const priceScore = Math.max(0, 10 * (1 - priceDiff / maxDiff));
  score += priceScore;

  return Math.min(100, Math.round(score));
}

/**
 * Get recommendations based on user answers
 */
function getRecommendations(answers) {
  // Step 1: Filter by budget (PRIMARY constraint)
  const budgetTier = getBudgetTier(answers.budget);
  const budgetFiltered = LAPTOP_DATABASE.filter(
    laptop => laptop.price >= budgetTier.min && laptop.price <= budgetTier.max
  );

  // Step 2: Score each laptop
  const scored = budgetFiltered.map(laptop => ({
    ...laptop,
    matchScore: scoreLaptop(laptop, answers)
  }));

  // Step 3: Sort by score (descending)
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // Step 4: Return top 3
  const top3 = scored.slice(0, 3);

  // Step 5: Add reasons for each recommendation
  return top3.map((laptop, index) => ({
    ...laptop,
    reason: generateReason(laptop, answers, index)
  }));
}

/**
 * Generate reason for recommendation
 */
function generateReason(laptop, answers, rank) {
  const reasons = [];

  if (rank === 0) {
    reasons.push('Best overall match for your needs');
  } else if (rank === 1) {
    reasons.push('Excellent value for money');
  } else {
    reasons.push('Premium alternative worth considering');
  }

  if (answers.useCase && laptop.useCases.includes(answers.useCase)) {
    const useCaseLabels = {
      work: 'work and productivity',
      gaming: 'gaming',
      creative: 'creative work',
      programming: 'programming',
      student: 'student needs',
      general: 'general use'
    };
    reasons.push(`Perfect for ${useCaseLabels[answers.useCase]}`);
  }

  if (answers.portability === 'very' && laptop.portability === 'very') {
    reasons.push('Ultra-portable as you requested');
  }

  if (answers.specsPriority === 'performance' && laptop.specsPriority.includes('performance')) {
    reasons.push('High-performance specs');
  }

  if (answers.specsPriority === 'battery' && laptop.specsPriority.includes('battery')) {
    reasons.push('Excellent battery life');
  }

  return reasons.join('. ') + '.';
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

    // Validate required fields (all 5 questions)
    validateRequired(body, ['useCase', 'budget', 'portability', 'specsPriority', 'brand']);

    // Get recommendations using scoring algorithm
    const recommendations = getRecommendations(body);

    return successResponse({
      success: true,
      data: {
        recommendations,
        answers: body,
        meta: {
          timestamp: new Date().toISOString(),
          tier,
          totalMatches: recommendations.length
        }
      }
    });

  } catch (error) {
    console.error('[Matchmaker] Error:', error);

    // Handle specific error types
    if (error.message.includes('Missing required fields')) {
      return errorResponse(error.message, 400);
    }

    return errorResponse(
      'Failed to get recommendations',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
