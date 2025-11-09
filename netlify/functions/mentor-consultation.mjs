/**
 * 84-Mentor Consultation API V2
 * POST /api/mentor/consult
 *
 * Routes queries to appropriate mentor councils using ML semantic routing.
 * Phase 9.20: Upgraded to semantic understanding with confidence scores.
 * 84-Mentor Approved: Syeddy Orchestrator - Governance Excellence
 *
 * @module mentor-consultation
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { getSemanticRouter } from './utils/semantic-router.mjs';

// Load mentor council configuration
const COUNCIL_ROUTES_PATH = join(process.cwd(), 'project/governance/84/council_routes.yaml');
const EXECUTIVE_BOARD_PATH = join(process.cwd(), 'project/governance/84/executive_board.json');

// In-memory consultation log (production: use database)
const consultationLog = [];

// Category to department mapping from council_routes.yaml
const CATEGORY_CONFIG = {
  strategy: {
    primaryDepartments: ['Strategy', 'Finance & IR', 'Growth'],
    secondaryDepartments: ['Customer & Design'],
    mentors: [1, 2, 3, 18, 19, 22, 23], // Buffett, Munger, Taleb, Thiel, Andreessen, Usmani, Menk
    votingThreshold: 0.71,
    recruitmentCount: 7,
  },
  product: {
    primaryDepartments: ['Customer & Design', 'Strategy', 'Growth'],
    secondaryDepartments: ['AI POD', 'Platform'],
    mentors: [12, 13, 14, 20, 21, 1, 2, 18, 19], // Julie Zhuo, Jony Ive, Dieter Rams, etc.
    votingThreshold: 0.67,
    recruitmentCount: 6,
  },
  infrastructure: {
    primaryDepartments: ['Platform', 'AI POD', 'Operations & Localization'],
    secondaryDepartments: ['Safety & Governance'],
    mentors: [4, 5, 6, 7, 24, 25, 78, 79, 80, 81, 82], // Bezos, Ng, Horowitz, PG, Gene Kim, etc.
    votingThreshold: 0.71,
    recruitmentCount: 7,
  },
  safety: {
    primaryDepartments: ['Safety & Governance', 'Legal & Compliance', 'Platform'],
    secondaryDepartments: ['AI POD'],
    mentors: [15, 16, 17, 22, 23, 38, 39], // Schneier, Narayanan, Gebru, Usmani, etc.
    votingThreshold: 0.83,
    recruitmentCount: 6,
  },
  finance: {
    primaryDepartments: ['Finance & IR', 'Strategy', 'Growth'],
    secondaryDepartments: ['Operations & Localization'],
    mentors: [1, 3, 18, 19], // Buffett, Taleb, Thiel, Andreessen
    votingThreshold: 0.80,
    recruitmentCount: 5,
  },
  design: {
    primaryDepartments: ['Customer & Design'],
    secondaryDepartments: ['Strategy'],
    mentors: [12, 13, 14, 20, 21], // Julie Zhuo, Jony Ive, Dieter Rams, Josh Constine, Casey Newton
    votingThreshold: 0.67,
    recruitmentCount: 5,
  },
};

// Mentor names (subset from council_roster.json)
const MENTOR_NAMES = {
  1: 'Warren Buffett',
  2: 'Charlie Munger',
  3: 'Nassim Taleb',
  4: 'Ben Horowitz',
  5: 'Paul Graham',
  6: 'Brian Chesky',
  7: 'Andrew Ng',
  12: 'Julie Zhuo',
  13: 'Jony Ive',
  14: 'Dieter Rams',
  15: 'Bruce Schneier',
  16: 'Arvind Narayanan',
  17: 'Timnit Gebru',
  18: 'Peter Thiel',
  19: 'Marc Andreessen',
  20: 'Josh Constine',
  21: 'Casey Newton',
  22: 'Muhammad Taqi Usmani',
  23: 'Mufti Menk',
  24: 'Gene Kim',
  25: 'Sam Altman',
  38: 'Danielle Citron',
  39: 'Lawrence Lessig',
  78: 'Linus Torvalds',
  79: 'Brendan Eich',
  80: 'Bjarne Stroustrup',
  81: 'Chris Lattner',
  82: 'Jeff Dean',
};

/**
 * Simulate mentor consultation (in production: use LLM API)
 *
 * @param {number} mentorId - Mentor ID
 * @param {string} query - User query
 * @param {Object} context - Additional context
 * @returns {Object} Mentor response
 */
function simulateMentorResponse(mentorId, query, context) {
  const mentorName = MENTOR_NAMES[mentorId] || `Mentor ${mentorId}`;

  // Simulate scoring (in production: LLM-based evaluation)
  const baseScore = 7 + Math.random() * 2.5; // 7.0-9.5
  const score = Math.round(baseScore * 10) / 10;

  // Simulate vote
  const vote = score >= 8.5 ? 'approve' : score >= 7.5 ? 'conditional' : 'reject';

  // Generate simulated response
  const responses = {
    approve: `Approved. This aligns with our principles and meets quality standards.`,
    conditional: `Conditional approval. Needs refinement in key areas before shipping.`,
    reject: `Cannot approve. Significant concerns that must be addressed.`,
  };

  return {
    mentorId,
    mentorName,
    score,
    vote,
    response: responses[vote],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate consensus from mentor votes
 *
 * @param {Array} votes - Array of mentor votes
 * @param {number} threshold - Voting threshold
 * @returns {Object} Consensus result
 */
function calculateConsensus(votes, threshold) {
  const totalVotes = votes.length;
  const approvals = votes.filter(v => v.vote === 'approve').length;
  const conditionals = votes.filter(v => v.vote === 'conditional').length;
  const rejections = votes.filter(v => v.vote === 'reject').length;

  const approvalRate = approvals / totalVotes;
  const compositeScore = votes.reduce((sum, v) => sum + v.score, 0) / totalVotes;

  const passed = approvalRate >= threshold && compositeScore >= 8.0;

  return {
    passed,
    approvalRate: Math.round(approvalRate * 100) / 100,
    compositeScore: Math.round(compositeScore * 10) / 10,
    threshold,
    breakdown: {
      approve: approvals,
      conditional: conditionals,
      reject: rejections,
      total: totalVotes,
    },
    confidence: compositeScore >= 9.0 ? 'high' : compositeScore >= 8.0 ? 'medium' : 'low',
  };
}

/**
 * Main handler for mentor consultation
 */
export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request
    const body = JSON.parse(event.body);
    const { query, context: userContext = {}, category = null, useSemanticRouting = true } = body;

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: query' }),
      };
    }

    // Phase 9.20: Use semantic routing if enabled and API key available
    let semanticRouting = null;
    let selectedCategory = category;
    let recruitedMentors = [];
    let config = null;

    if (useSemanticRouting && process.env.GEMINI_API_KEY) {
      try {
        // Initialize semantic router
        const semanticRouter = getSemanticRouter(process.env.GEMINI_API_KEY);

        // Get semantic routing recommendation
        semanticRouting = await semanticRouter.route(query);

        // Use primary routed council if no category specified
        if (!selectedCategory && semanticRouting.routing.length > 0) {
          const primaryCouncil = semanticRouting.routing[0].council;

          // Map council name to category
          const councilToCategoryMap = {
            'Strategy Council': 'strategy',
            'Product Council': 'product',
            'Design Council': 'design',
            'Engineering Council': 'infrastructure',
            'Security Council': 'safety',
            'AI/ML Council': 'infrastructure',
            'Platform Council': 'infrastructure',
            'Growth Council': 'strategy',
            'Finance Council': 'finance',
          };

          selectedCategory = councilToCategoryMap[primaryCouncil] || 'strategy';
        }
      } catch (error) {
        console.error('[Mentor Consultation] Semantic routing failed:', error);
        // Fallback to keyword-based routing
        selectedCategory = category || 'strategy';
      }
    } else {
      selectedCategory = category || 'strategy';
    }

    // Validate category
    const validCategories = Object.keys(CATEGORY_CONFIG);
    if (!validCategories.includes(selectedCategory)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid category',
          validCategories,
        }),
      };
    }

    // Get category configuration
    config = CATEGORY_CONFIG[selectedCategory];

    // Recruit mentors for this category
    recruitedMentors = config.mentors.slice(0, config.recruitmentCount);

    // Simulate mentor consultations
    const mentorVotes = recruitedMentors.map(mentorId =>
      simulateMentorResponse(mentorId, query, userContext)
    );

    // Calculate consensus
    const consensus = calculateConsensus(mentorVotes, config.votingThreshold);

    // Build response
    const response = {
      consultation: {
        id: `consult_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        query,
        category: selectedCategory,
        context: userContext,
        semanticRoutingEnabled: useSemanticRouting && !!semanticRouting,
      },
      // Phase 9.20: Include semantic routing analysis
      semanticRouting: semanticRouting || null,
      council: {
        category: selectedCategory,
        primaryDepartments: config.primaryDepartments,
        secondaryDepartments: config.secondaryDepartments,
        recruitedCount: recruitedMentors.length,
      },
      mentors: mentorVotes,
      consensus,
      recommendation: consensus.passed
        ? 'Approved by mentor council. Proceed with implementation.'
        : 'Does not meet mentor approval threshold. Review feedback and iterate.',
      nextSteps: consensus.passed
        ? ['Proceed with implementation', 'Monitor composite score', 'Track to completion']
        : ['Review mentor feedback', 'Address concerns', 'Re-submit for consultation'],
    };

    // Log consultation (in production: save to database)
    consultationLog.push({
      id: response.consultation.id,
      timestamp: response.consultation.timestamp,
      category: selectedCategory,
      passed: consensus.passed,
      compositeScore: consensus.compositeScore,
      semanticRoutingUsed: !!semanticRouting,
      primaryCouncil: semanticRouting?.routing[0]?.council || null,
      confidence: semanticRouting?.routing[0]?.confidence || null,
    });

    // Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('[Mentor Consultation] Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
}

/**
 * GET handler for consultation history
 */
export async function getHandler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    // Return recent consultation history
    const recentConsultations = consultationLog.slice(-50).reverse();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        consultations: recentConsultations,
        total: consultationLog.length,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to retrieve consultation history',
        message: error.message,
      }),
    };
  }
}
