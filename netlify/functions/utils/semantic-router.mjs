/**
 * 84-Mentor Semantic Router V2 (ML-Powered)
 * Phase 9.20: Upgrade from keyword-based to semantic understanding
 *
 * Uses Gemini 2.5 Pro for:
 * - Intent classification
 * - Context extraction (impact, effort, reversibility)
 * - Confidence-based routing to mentor councils
 *
 * 84-Mentor Approved: Andrew Ng (AI/ML), Warren Buffett (Strategy)
 *
 * @module semantic-router
 */

import { getGeminiClient, MODELS } from './gemini.mjs';

/**
 * Intent categories for mentor routing
 */
export const INTENT_CATEGORIES = {
  FEATURE_REQUEST: 'feature_request',
  BUG_REPORT: 'bug_report',
  OPTIMIZATION: 'optimization',
  ARCHITECTURE_DECISION: 'architecture_decision',
  PRICING_CHANGE: 'pricing_change',
  SECURITY_CONCERN: 'security_concern',
  UX_IMPROVEMENT: 'ux_improvement',
  INFRASTRUCTURE_CHANGE: 'infrastructure_change',
};

/**
 * Confidence thresholds for routing
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.90,       // Route to primary council only
  MEDIUM: 0.70,     // Route to primary + secondary
  LOW: 0.50,        // Route to all relevant + escalate
  CONFLICTING: 0.40 // Escalate to CEO/Executive Board
};

/**
 * Mentor expertise mapping
 * Maps specific domain keywords to mentors
 */
export const MENTOR_EXPERTISE = {
  // Strategy Council
  'Reid Hoffman': ['strategy', 'scaling', 'blitzscaling', 'network effects', 'platform strategy'],
  'Ben Horowitz': ['leadership', 'organization', 'hard things', 'management', 'culture'],
  'Warren Buffett': ['finance', 'pricing', 'ROI', 'cost', 'value investing', 'moat'],
  'Peter Thiel': ['zero to one', 'monopoly', 'contrarian', 'competition', 'breakthrough'],
  'Marc Andreessen': ['software', 'market', 'pmf', 'product market fit', 'technology'],

  // Product Council
  'Marty Cagan': ['product', 'discovery', 'roadmap', 'feature prioritization', 'product strategy'],
  'Julie Zhuo': ['product design', 'team building', 'user research', 'product excellence'],
  'Josh Constine': ['product analysis', 'market trends', 'product critique'],
  'Casey Newton': ['content', 'media', 'journalism', 'storytelling'],

  // Design Council
  'Don Nielsen': ['UX', 'user experience', 'interface', 'usability', 'interaction design'],
  'Jony Ive': ['industrial design', 'aesthetics', 'product beauty', 'hardware'],
  'Dieter Rams': ['design principles', 'minimalism', 'good design', 'simplicity'],

  // Engineering Council
  'Linus Torvalds': ['linux', 'kernel', 'systems programming', 'open source'],
  'DHH': ['ruby', 'rails', 'web development', 'developer experience', 'productivity'],
  'Brendan Eich': ['javascript', 'browser', 'language design', 'web standards'],
  'Chris Lattner': ['compilers', 'llvm', 'swift', 'language implementation'],
  'Jeff Dean': ['distributed systems', 'scale', 'infrastructure', 'performance'],

  // Security Council
  'Bruce Schneier': ['security', 'encryption', 'privacy', 'cryptography', 'threat modeling'],
  'Arvind Narayanan': ['privacy', 'fairness', 'anonymity', 'data protection'],
  'Timnit Gebru': ['AI ethics', 'bias', 'fairness', 'responsible AI'],
  'Whitfield Diffie': ['cryptography', 'public key', 'secure communication'],

  // AI/ML Council
  'Andrew Ng': ['AI', 'machine learning', 'models', 'training', 'deep learning'],
  'Geoffrey Hinton': ['neural networks', 'backpropagation', 'deep learning theory'],
  'Yann LeCun': ['computer vision', 'convolutional networks', 'self-supervised learning'],
  'Fei-Fei Li': ['computer vision', 'image recognition', 'human-centered AI'],

  // Platform Council
  'Guillermo Rauch': ['vercel', 'nextjs', 'deployment', 'DX', 'developer experience'],
  'Gene Kim': ['devops', 'platform engineering', 'DORA metrics', 'continuous delivery'],
  'Kelsey Hightower': ['kubernetes', 'containers', 'cloud native', 'infrastructure'],

  // Growth Council
  'Brian Balfour': ['growth', 'acquisition', 'retention', 'activation', 'loops'],
  'Hiten Shah': ['SaaS', 'metrics', 'analytics', 'user feedback', 'product analytics'],
  'April Dunford': ['positioning', 'messaging', 'go-to-market', 'differentiation'],

  // Finance Council
  'Ray Dalio': ['principles', 'risk management', 'economic cycles', 'diversification'],
  'Nassim Taleb': ['antifragility', 'black swans', 'risk', 'uncertainty', 'optionality'],
};

/**
 * Council to mentor mapping
 */
export const COUNCIL_MENTORS = {
  'Strategy Council': ['Reid Hoffman', 'Ben Horowitz', 'Warren Buffett', 'Peter Thiel', 'Marc Andreessen'],
  'Product Council': ['Marty Cagan', 'Julie Zhuo', 'Josh Constine', 'Casey Newton'],
  'Design Council': ['Don Nielsen', 'Jony Ive', 'Dieter Rams'],
  'Engineering Council': ['Linus Torvalds', 'DHH', 'Brendan Eich', 'Chris Lattner', 'Jeff Dean'],
  'Security Council': ['Bruce Schneier', 'Arvind Narayanan', 'Timnit Gebru', 'Whitfield Diffie'],
  'AI/ML Council': ['Andrew Ng', 'Geoffrey Hinton', 'Yann LeCun', 'Fei-Fei Li'],
  'Platform Council': ['Guillermo Rauch', 'Gene Kim', 'Kelsey Hightower'],
  'Growth Council': ['Brian Balfour', 'Hiten Shah', 'April Dunford'],
  'Finance Council': ['Warren Buffett', 'Ray Dalio', 'Nassim Taleb'],
};

/**
 * Intent to primary council mapping
 */
export const INTENT_TO_COUNCILS = {
  [INTENT_CATEGORIES.FEATURE_REQUEST]: ['Product Council', 'Design Council', 'Engineering Council'],
  [INTENT_CATEGORIES.BUG_REPORT]: ['Engineering Council', 'Platform Council'],
  [INTENT_CATEGORIES.OPTIMIZATION]: ['Engineering Council', 'Platform Council', 'AI/ML Council'],
  [INTENT_CATEGORIES.ARCHITECTURE_DECISION]: ['Engineering Council', 'Platform Council', 'Security Council'],
  [INTENT_CATEGORIES.PRICING_CHANGE]: ['Finance Council', 'Product Council', 'Strategy Council'],
  [INTENT_CATEGORIES.SECURITY_CONCERN]: ['Security Council', 'Engineering Council', 'Platform Council'],
  [INTENT_CATEGORIES.UX_IMPROVEMENT]: ['Design Council', 'Product Council'],
  [INTENT_CATEGORIES.INFRASTRUCTURE_CHANGE]: ['Platform Council', 'Engineering Council', 'Security Council'],
};

/**
 * Semantic Router Class
 */
export class SemanticRouter {
  constructor(apiKey, options = {}) {
    this.gemini = getGeminiClient(apiKey);
    this.model = options.model || MODELS.PRO; // Use Pro for semantic understanding
    this.routingHistory = [];
  }

  /**
   * Parse semantic understanding from query
   *
   * @param {string} query - User query
   * @returns {Promise<Object>} Semantic analysis with intent, context, routing
   */
  async route(query) {
    // Build semantic analysis prompt
    const prompt = this._buildSemanticPrompt(query);

    // Call Gemini 2.5 Pro for semantic understanding
    const response = await this.gemini.generate(prompt, {
      model: this.model,
      config: {
        temperature: 0.3, // Lower temperature for more consistent routing
        maxOutputTokens: 2048,
      },
    });

    // Parse JSON response
    let semanticAnalysis;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const text = response.text.trim();
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      semanticAnalysis = JSON.parse(jsonText);
    } catch (error) {
      console.error('[Semantic Router] Failed to parse LLM response:', error);
      // Fallback to keyword-based routing
      return this._fallbackRoute(query);
    }

    // Enhance with mentor-specific routing
    const enhancedRouting = this._enhanceWithMentorExpertise(query, semanticAnalysis);

    // Add metadata
    const routingResult = {
      ...enhancedRouting,
      timestamp: new Date().toISOString(),
      model: this.model,
      tokens: response.tokens,
      cost: response.cost,
    };

    // Log to routing history
    this._logRouting(query, routingResult);

    return routingResult;
  }

  /**
   * Build semantic analysis prompt for Gemini
   *
   * @private
   * @param {string} query - User query
   * @returns {string} Prompt
   */
  _buildSemanticPrompt(query) {
    return `You are an AI routing system for a mentor consultation platform with 84 world-class mentors across 9 councils.

Analyze this query and return a JSON object with semantic understanding:

Query: "${query}"

Return JSON with this exact structure:
{
  "intent": "<one of: feature_request, bug_report, optimization, architecture_decision, pricing_change, security_concern, ux_improvement, infrastructure_change>",
  "context": {
    "impact": "<one of: critical, high, medium, low>",
    "effort": "<one of: high, medium, low>",
    "reversible": <boolean>,
    "urgency": "<one of: immediate, high, medium, low>"
  },
  "domains": ["<domain1>", "<domain2>"],
  "keywords": ["<keyword1>", "<keyword2>"],
  "routing": [
    {
      "council": "<council name>",
      "confidence": <0.0-1.0>,
      "reasoning": "<1 sentence why this council is relevant>"
    }
  ]
}

Available councils:
- Strategy Council: Business strategy, competitive positioning, long-term vision
- Product Council: Product strategy, roadmap, feature prioritization
- Design Council: UX/UI, user experience, interface design
- Engineering Council: Technical implementation, architecture, code quality
- Security Council: Security, privacy, compliance, encryption
- AI/ML Council: Machine learning, AI models, training, inference
- Platform Council: Infrastructure, DevOps, platform engineering, scalability
- Growth Council: User acquisition, retention, growth loops, metrics
- Finance Council: Pricing, costs, ROI, financial strategy

Rules:
1. Return ONLY valid JSON, no markdown formatting
2. Include top 3 most relevant councils
3. Confidence scores must sum to reasonable values (primary > secondary > tertiary)
4. Primary council should have confidence >= 0.70
5. Include reasoning for each council

Return the JSON now:`;
  }

  /**
   * Enhance routing with mentor-specific expertise matching
   *
   * @private
   * @param {string} query - User query
   * @param {Object} semanticAnalysis - LLM analysis
   * @returns {Object} Enhanced routing with specific mentors
   */
  _enhanceWithMentorExpertise(query, semanticAnalysis) {
    const queryLower = query.toLowerCase();

    // For each routed council, identify the best mentor
    const enhancedRouting = semanticAnalysis.routing.map(route => {
      const councilMentors = COUNCIL_MENTORS[route.council] || [];

      // Score each mentor based on expertise matching
      const mentorScores = councilMentors.map(mentor => {
        const expertise = MENTOR_EXPERTISE[mentor] || [];
        const matchCount = expertise.filter(keyword =>
          queryLower.includes(keyword.toLowerCase())
        ).length;

        // Boost score based on keyword matches
        const baseScore = route.confidence;
        const expertiseBoost = matchCount * 0.05;
        const finalScore = Math.min(baseScore + expertiseBoost, 0.99);

        return {
          mentor,
          score: finalScore,
          matchedKeywords: expertise.filter(kw => queryLower.includes(kw.toLowerCase())),
        };
      });

      // Sort by score and pick top mentor
      mentorScores.sort((a, b) => b.score - a.score);
      const topMentor = mentorScores[0];

      return {
        ...route,
        mentor: topMentor?.mentor || councilMentors[0] || 'General Council',
        mentorConfidence: topMentor?.score || route.confidence,
        matchedExpertise: topMentor?.matchedKeywords || [],
      };
    });

    // Sort by confidence (descending)
    enhancedRouting.sort((a, b) => b.confidence - b.confidence);

    // Determine escalation based on confidence
    const primaryConfidence = enhancedRouting[0]?.confidence || 0;
    const shouldEscalate = primaryConfidence < CONFIDENCE_THRESHOLDS.MEDIUM;
    const isConflicting = primaryConfidence < CONFIDENCE_THRESHOLDS.CONFLICTING;

    return {
      intent: semanticAnalysis.intent,
      context: semanticAnalysis.context,
      domains: semanticAnalysis.domains,
      keywords: semanticAnalysis.keywords,
      routing: enhancedRouting,
      escalation: {
        required: shouldEscalate,
        reason: isConflicting
          ? 'Conflicting signals - escalate to executive board'
          : shouldEscalate
          ? 'Low confidence - route to all relevant councils'
          : 'Sufficient confidence for targeted routing',
        level: isConflicting ? 'executive' : shouldEscalate ? 'all_councils' : 'none',
      },
      confidenceLevel: this._getConfidenceLevel(primaryConfidence),
    };
  }

  /**
   * Get confidence level label
   *
   * @private
   * @param {number} confidence - Confidence score
   * @returns {string} Level label
   */
  _getConfidenceLevel(confidence) {
    if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
    if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
    if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'low';
    return 'conflicting';
  }

  /**
   * Fallback to keyword-based routing
   *
   * @private
   * @param {string} query - User query
   * @returns {Object} Fallback routing
   */
  _fallbackRoute(query) {
    const queryLower = query.toLowerCase();

    // Simple keyword matching
    const keywordMap = {
      'Strategy Council': ['strategy', 'competitive', 'positioning', 'market'],
      'Product Council': ['product', 'feature', 'roadmap', 'user story'],
      'Design Council': ['design', 'ux', 'ui', 'interface', 'user experience', 'dark mode', 'theme'],
      'Engineering Council': ['code', 'bug', 'technical', 'architecture', 'performance', 'slow'],
      'Security Council': ['security', 'privacy', 'encryption', 'gdpr', 'compliance'],
      'AI/ML Council': ['ai', 'ml', 'model', 'training', 'inference'],
      'Platform Council': ['infrastructure', 'platform', 'devops', 'deployment'],
      'Growth Council': ['growth', 'acquisition', 'retention', 'metrics'],
      'Finance Council': ['price', 'pricing', 'cost', 'roi', 'finance', 'rm'],
    };

    const matches = [];
    for (const [council, keywords] of Object.entries(keywordMap)) {
      const matchCount = keywords.filter(kw => queryLower.includes(kw)).length;
      if (matchCount > 0) {
        matches.push({
          council,
          confidence: Math.min(0.50 + (matchCount * 0.10), 0.80),
          reasoning: `Matched ${matchCount} keyword(s)`,
          mentor: COUNCIL_MENTORS[council]?.[0] || 'General Council',
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    // Default to Strategy Council if no matches
    if (matches.length === 0) {
      matches.push({
        council: 'Strategy Council',
        confidence: 0.40,
        reasoning: 'No clear match - defaulting to strategy',
        mentor: 'Warren Buffett',
      });
    }

    return {
      intent: 'unknown',
      context: { impact: 'medium', effort: 'medium', reversible: true, urgency: 'medium' },
      domains: ['general'],
      keywords: [],
      routing: matches.slice(0, 3),
      escalation: {
        required: true,
        reason: 'Fallback routing - semantic analysis failed',
        level: 'all_councils',
      },
      confidenceLevel: 'low',
      fallback: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Log routing decision for learning
   *
   * @private
   * @param {string} query - Original query
   * @param {Object} routing - Routing result
   */
  _logRouting(query, routing) {
    this.routingHistory.push({
      query,
      intent: routing.intent,
      routedCouncils: routing.routing.map(r => r.council),
      primaryMentor: routing.routing[0]?.mentor,
      confidence: routing.routing[0]?.confidence,
      timestamp: routing.timestamp,
    });

    // Keep last 100 entries in memory
    if (this.routingHistory.length > 100) {
      this.routingHistory.shift();
    }
  }

  /**
   * Get routing history
   *
   * @returns {Array} Routing history
   */
  getHistory() {
    return this.routingHistory;
  }

  /**
   * Calculate routing accuracy (requires feedback)
   *
   * @param {Array} feedback - Array of { query, routedCouncil, actualApprover, wasCorrect }
   * @returns {Object} Accuracy metrics
   */
  calculateAccuracy(feedback) {
    if (feedback.length === 0) {
      return { accuracy: 0, total: 0, correct: 0 };
    }

    const correct = feedback.filter(f => f.wasCorrect).length;
    const total = feedback.length;
    const accuracy = correct / total;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      total,
      correct,
      incorrect: total - correct,
    };
  }
}

/**
 * Singleton instance
 */
let semanticRouterInstance = null;

export function getSemanticRouter(apiKey) {
  if (!semanticRouterInstance && apiKey) {
    semanticRouterInstance = new SemanticRouter(apiKey);
  }
  return semanticRouterInstance;
}

export default SemanticRouter;
