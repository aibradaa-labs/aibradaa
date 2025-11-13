/**
 * Syeddy Orchestrator - Real 84-Mentor Decision Tools
 *
 * 84-Mentor Governance: Replace Math.random() with actual LLM-based voting
 * Approved by: Andrew Ng (AI), Geoffrey Hinton (Neural Reasoning)
 *
 * Features:
 * - Per-mentor LLM persona calls via OpenRouter
 * - Expertise-based relevance scoring
 * - Real composite score calculation (no randomization)
 * - Decision reasoning and dissent tracking
 * - Integration with syeddy_orchestrator.mjs
 *
 * @module orchestrator_tools
 */

import openrouterAdapter from '../adapters/openrouter_adapter.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory for relative imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// LOAD ALL 84 MENTOR PERSONAS FROM COUNCIL ROSTER (Source of Truth)
// ============================================================================

// Load council roster JSON (binding source from DOC_1)
const councilRosterPath = path.join(__dirname, '../../project/governance/84/council_roster.json');
let councilRoster;

try {
  const councilData = fs.readFileSync(councilRosterPath, 'utf8');
  councilRoster = JSON.parse(councilData);
} catch (error) {
  console.error('[Orchestrator Tools] Failed to load council_roster.json:', error.message);
  councilRoster = { mentors: [] };
}

// Generate MENTOR_PERSONAS from council roster (all 84 mentors)
export const MENTOR_PERSONAS = {};

councilRoster.mentors?.forEach((mentor) => {
  // Convert mentor ID to lowercase-hyphenated format
  const mentorId = mentor.id.toLowerCase().replace(/\s+/g, '-');

  MENTOR_PERSONAS[mentorId] = {
    name: mentor.name,
    expertise: mentor.departments || [],
    thinkingStyle: mentor.thinkingStyle || 'Strategic decision-maker',
    riskAppetite: mentor.riskAppetite || 'Balanced',
    votingWeight: 1.0, // Base weight (councils.json will override)
    executionPlaybook: mentor.executionPlaybook || [],
    keyQuestions: (mentor.executionPlaybook || []).slice(0, 3).map((step, i) =>
      `${i + 1}. ${step}`
    ),
  };
});

const mentorCount = Object.keys(MENTOR_PERSONAS).length;
console.log(`[Orchestrator Tools] Loaded ${mentorCount}/84 mentor personas from council roster`);

if (mentorCount < 84) {
  console.warn(`[Orchestrator Tools] WARNING: Only ${mentorCount} mentors loaded, expected 84`);
}

// ============================================================================
// REAL MENTOR VOTING (Replaces Math.random())
// ============================================================================

/**
 * Get mentor's vote using LLM persona simulation
 *
 * @param {Object} mentor - Mentor object { id, name, expertise, votingWeight }
 * @param {Object} decisionData - Decision context { type, title, description, context }
 * @returns {Promise<Object>} Vote { decision: 'approve'|'reject'|'abstain', confidence: number, reasoning: string }
 */
export async function getMentorVote(mentor, decisionData) {
  const persona = MENTOR_PERSONAS[mentor.id];

  // Fallback for mentors without LLM persona (use rule-based voting)
  if (!persona) {
    return getRuleBasedVote(mentor, decisionData);
  }

  try {
    // Construct mentor-specific prompt
    const prompt = `You are ${persona.name}, expert in: ${persona.expertise.join(', ')}.

Your thinking style: ${persona.thinkingStyle}
Your risk appetite: ${persona.riskAppetite}

You are evaluating this decision:

**Type:** ${decisionData.type}
**Title:** ${decisionData.title}
**Description:** ${decisionData.description}

**Context:**
${JSON.stringify(decisionData.context, null, 2)}

**Your key questions to consider:**
${persona.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Based on your expertise and principles, provide your vote:

1. **Vote:** Choose one: APPROVE, REJECT, or ABSTAIN
2. **Confidence:** Rate 0.0-1.0 (how confident are you in this vote?)
3. **Reasoning:** Explain your decision in 2-3 sentences

Respond in JSON format:
{
  "vote": "APPROVE|REJECT|ABSTAIN",
  "confidence": 0.85,
  "reasoning": "Your reasoning here..."
}`;

    // Call OpenRouter with FREE tier model for cost optimization
    const response = await openrouterAdapter.generateCompletion({
      prompt,
      type: 'governance',
      priority: decisionData.priority || 'P1',
      temperature: 0.3, // Lower temperature for consistent reasoning
      maxTokens: 300,
    });

    // Parse LLM response
    const parsed = parseVoteResponse(response.text);

    return {
      decision: parsed.vote.toLowerCase(),
      confidence: Math.max(0, Math.min(1, parsed.confidence)), // Clamp 0-1
      reasoning: parsed.reasoning,
      model: response.model,
      cost: response.costMYR,
    };

  } catch (error) {
    console.error(`[Orchestrator Tools] LLM vote failed for ${mentor.name}:`, error.message);

    // Fallback to rule-based voting
    return getRuleBasedVote(mentor, decisionData);
  }
}

/**
 * Parse LLM response into structured vote
 *
 * @param {string} llmResponse - Raw LLM output
 * @returns {Object} Parsed vote
 */
function parseVoteResponse(llmResponse) {
  try {
    // Try to extract JSON from response
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        vote: parsed.vote?.toUpperCase() || 'ABSTAIN',
        confidence: parseFloat(parsed.confidence) || 0.5,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    }

    // Fallback: keyword detection
    const upper = llmResponse.toUpperCase();
    let vote = 'ABSTAIN';
    if (upper.includes('APPROVE')) vote = 'APPROVE';
    else if (upper.includes('REJECT')) vote = 'REJECT';

    return {
      vote,
      confidence: 0.5,
      reasoning: llmResponse.substring(0, 200),
    };

  } catch (error) {
    console.error('[Orchestrator Tools] Failed to parse vote:', error.message);
    return {
      vote: 'ABSTAIN',
      confidence: 0.5,
      reasoning: 'Parse error, abstaining',
    };
  }
}

/**
 * Rule-based voting fallback (for mentors without LLM persona or API failures)
 *
 * @param {Object} mentor - Mentor object
 * @param {Object} decisionData - Decision context
 * @returns {Object} Vote
 */
function getRuleBasedVote(mentor, decisionData) {
  const relevance = calculateRelevance(mentor, decisionData);
  const confidence = 0.6 + relevance * 0.4;

  // Security mentors are cautious
  if (['bruce-schneier', 'timnit-gebru', 'margaret-hamilton'].includes(mentor.id)) {
    if (decisionData.type.includes('SECURITY') || decisionData.type.includes('SAFETY')) {
      const approvalChance = 0.6 + relevance * 0.3;
      return {
        decision: relevance > 0.7 ? 'approve' : 'reject',
        confidence,
        reasoning: relevance > 0.7
          ? 'Security measures adequate, proceed with caution'
          : 'Requires additional security review and threat modeling',
      };
    }
  }

  // Innovators favor bold moves
  if (['steve-jobs', 'elon-musk', 'marc-andreessen', 'peter-thiel'].includes(mentor.id)) {
    return {
      decision: relevance > 0.5 ? 'approve' : 'abstain',
      confidence,
      reasoning: relevance > 0.5
        ? 'Aligns with product vision, ship it'
        : 'Need more context on user impact',
    };
  }

  // Default: pragmatic approval
  return {
    decision: relevance > 0.6 ? 'approve' : 'abstain',
    confidence,
    reasoning: relevance > 0.6
      ? 'Practical improvement, low risk'
      : 'Neutral, defer to specialists',
  };
}

/**
 * Calculate mentor's relevance to decision
 *
 * @param {Object} mentor - Mentor object
 * @param {Object} decisionData - Decision context
 * @returns {number} Relevance score 0.0-1.0
 */
function calculateRelevance(mentor, decisionData) {
  const { type, title, description } = decisionData;
  const decisionText = `${type} ${title} ${description}`.toLowerCase();

  let relevance = 0.3; // Base relevance

  // Check expertise keywords
  if (mentor.expertise && Array.isArray(mentor.expertise)) {
    const matchCount = mentor.expertise.filter(exp =>
      decisionText.includes(exp.toLowerCase())
    ).length;
    relevance += matchCount * 0.15;
  }

  // Check specialization
  if (mentor.specialization && decisionText.includes(mentor.specialization.toLowerCase())) {
    relevance += 0.25;
  }

  return Math.min(relevance, 1.0);
}

/**
 * Calculate composite score from all mentor votes
 *
 * @param {Array} mentorVotes - Array of { mentor, vote, confidence, reasoning }
 * @returns {number} Composite score 0-100
 */
export function calculateCompositeScore(mentorVotes) {
  if (!mentorVotes || mentorVotes.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  mentorVotes.forEach(({ mentor, vote, confidence }) => {
    const votingWeight = mentor.votingWeight || 1.0;

    // Convert vote to score
    let voteScore = 0;
    if (vote.decision === 'approve') voteScore = 10;
    else if (vote.decision === 'reject') voteScore = 0;
    else voteScore = 5; // abstain

    // Weight by confidence
    const weightedScore = voteScore * confidence * votingWeight;

    totalWeightedScore += weightedScore;
    totalWeight += votingWeight;
  });

  // Convert to 0-100 scale
  const compositeScore = (totalWeightedScore / totalWeight) * 10;
  return Math.round(compositeScore * 10) / 10; // Round to 1 decimal
}

/**
 * Track dissenting votes for governance transparency
 *
 * @param {Array} mentorVotes - All mentor votes
 * @returns {Array} Dissenting votes
 */
export function trackDissent(mentorVotes) {
  const approvals = mentorVotes.filter(v => v.vote.decision === 'approve').length;
  const total = mentorVotes.length;
  const approvalRate = approvals / total;

  // Find dissenters (those who voted against majority)
  const majority = approvalRate >= 0.5 ? 'approve' : 'reject';
  const dissenters = mentorVotes.filter(v => v.vote.decision !== majority && v.vote.decision !== 'abstain');

  return dissenters.map(({ mentor, vote }) => ({
    mentorName: mentor.name,
    mentorId: mentor.id,
    vote: vote.decision,
    reasoning: vote.reasoning,
    confidence: vote.confidence,
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getMentorVote,
  calculateCompositeScore,
  calculateRelevance,
  trackDissent,
  MENTOR_PERSONAS,
};
