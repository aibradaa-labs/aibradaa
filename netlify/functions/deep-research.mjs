/**
 * Deep Research Agent - Multi-Step Research Capability
 * AI Bradaa - Phase 6: Advanced AI Features
 *
 * PURPOSE: Complex multi-step research for comprehensive answers
 * FEATURES:
 * - Query decomposition (break into sub-questions)
 * - Parallel research (answer each sub-question)
 * - Synthesis (combine findings)
 * - Source citations
 * - Progress tracking
 *
 * EXAMPLE:
 * User: "Compare gaming laptops for AAA titles in 2025, considering future-proofing"
 * Step 1: What are AAA titles in 2025? What specs needed?
 * Step 2: Which laptops have those specs? Price comparison?
 * Step 3: Future-proofing factors? Upgrade paths?
 * Step 4: Synthesize into recommendation with reasoning
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchLaptopsRAG } from './rag-search.mjs';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Initialize Gemini client
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Research agent configuration
 */
const config = {
  model: 'gemini-2.0-flash-exp',
  maxSteps: 5,
  maxSubQuestions: 4,
  temperature: 0.7
};

/**
 * Step 1: Decompose query into sub-questions
 *
 * @param {string} query - User's complex query
 * @returns {Promise<Array>} - Sub-questions
 */
async function decomposeQuery(query) {
  try {
    console.log('[DeepResearch] Decomposing query...');

    const model = genAI.getGenerativeModel({ model: config.model });

    const prompt = `You are a research assistant helping to break down complex laptop-related questions.

USER QUERY: "${query}"

TASK: Decompose this query into 2-4 specific sub-questions that need to be answered to fully address the user's question.

RULES:
- Each sub-question should be specific and answerable
- Sub-questions should build on each other logically
- Focus on actionable information (specs, prices, comparisons)
- Keep sub-questions concise (1 sentence each)

FORMAT YOUR RESPONSE AS JSON:
{
  "subQuestions": [
    "Sub-question 1?",
    "Sub-question 2?",
    "Sub-question 3?"
  ],
  "reasoning": "Brief explanation of how these sub-questions address the main query"
}

RESPOND WITH ONLY THE JSON:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse decomposition response');
    }

    const decomposition = JSON.parse(jsonMatch[0]);

    console.log('[DeepResearch] Decomposed into', decomposition.subQuestions.length, 'sub-questions');

    return {
      subQuestions: decomposition.subQuestions.slice(0, config.maxSubQuestions),
      reasoning: decomposition.reasoning
    };

  } catch (error) {
    console.error('[DeepResearch] Query decomposition failed:', error);

    // Fallback: use original query as single question
    return {
      subQuestions: [query],
      reasoning: 'Direct research without decomposition'
    };
  }
}

/**
 * Step 2: Research individual sub-question
 *
 * @param {string} subQuestion - Sub-question to research
 * @param {Object} context - Research context
 * @returns {Promise<Object>} - Research findings
 */
async function researchSubQuestion(subQuestion, context = {}) {
  try {
    console.log('[DeepResearch] Researching:', subQuestion);

    // Use RAG to find relevant laptops
    const ragResults = await searchLaptopsRAG(subQuestion, {
      topK: 3,
      filters: context.filters || {}
    });

    // Generate focused answer
    const model = genAI.getGenerativeModel({ model: config.model });

    const laptopsContext = ragResults.results.map((result, index) => {
      const laptop = result.laptop;
      return `[${index + 1}] ${laptop.fullName} - RM${laptop.price}
Specs: ${laptop.specs?.cpu?.model}, ${laptop.specs?.gpu?.model}, ${laptop.specs?.ram?.size}GB RAM`;
    }).join('\n');

    const prompt = `Answer this specific question based on laptop data:

QUESTION: ${subQuestion}

RELEVANT LAPTOPS:
${laptopsContext}

INSTRUCTIONS:
- Provide a concise, factual answer (2-3 sentences)
- Use data from the laptops above
- Cite laptop names when relevant
- Focus on answering the specific question asked

YOUR ANSWER:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    return {
      question: subQuestion,
      answer,
      sources: ragResults.results.map(r => ({
        laptopName: r.laptop.fullName,
        laptopId: r.laptop.id,
        similarity: r.similarity
      })),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[DeepResearch] Sub-question research failed:', error);

    return {
      question: subQuestion,
      answer: 'Unable to research this question at the moment.',
      sources: [],
      error: error.message
    };
  }
}

/**
 * Step 3: Research all sub-questions in parallel
 *
 * @param {Array} subQuestions - Sub-questions to research
 * @param {Object} context - Research context
 * @returns {Promise<Array>} - All research findings
 */
async function researchAllSubQuestions(subQuestions, context = {}) {
  try {
    console.log('[DeepResearch] Researching', subQuestions.length, 'sub-questions in parallel...');

    const findings = await Promise.all(
      subQuestions.map(sq => researchSubQuestion(sq, context))
    );

    return findings;

  } catch (error) {
    console.error('[DeepResearch] Parallel research failed:', error);
    throw error;
  }
}

/**
 * Step 4: Synthesize findings into final answer
 *
 * @param {string} originalQuery - Original user query
 * @param {Object} decomposition - Query decomposition
 * @param {Array} findings - Research findings
 * @returns {Promise<Object>} - Synthesized answer
 */
async function synthesizeFindings(originalQuery, decomposition, findings) {
  try {
    console.log('[DeepResearch] Synthesizing findings...');

    const model = genAI.getGenerativeModel({ model: config.model });

    // Build findings context
    const findingsContext = findings.map((finding, index) => {
      return `SUB-QUESTION ${index + 1}: ${finding.question}
ANSWER: ${finding.answer}
SOURCES: ${finding.sources.map(s => s.laptopName).join(', ') || 'None'}`;
    }).join('\n\n');

    // Extract all unique laptops mentioned
    const allLaptops = new Set();
    findings.forEach(f => {
      f.sources.forEach(s => allLaptops.add(s.laptopName));
    });

    const prompt = `You are AI Bradaa, Malaysia's friendly AI laptop advisor. Synthesize research findings into a comprehensive answer.

ORIGINAL QUERY: "${originalQuery}"

RESEARCH FINDINGS:
${findingsContext}

LAPTOPS MENTIONED:
${Array.from(allLaptops).join(', ') || 'Various laptops'}

INSTRUCTIONS:
1. Provide a comprehensive answer to the original query
2. Synthesize insights from all sub-questions
3. Make clear recommendations with reasoning
4. Cite specific laptop names when recommending
5. Include price ranges and key specs
6. Use friendly, enthusiastic Manglish tone (lah, wah, etc.)
7. Structure:
   - Brief intro (1 sentence)
   - Key findings (2-3 paragraphs)
   - Clear recommendation (1 paragraph)
   - Confidence score (1-10)

YOUR COMPREHENSIVE ANSWER:`;

    const result = await model.generateContent(prompt);
    const synthesizedAnswer = result.response.text().trim();

    // Extract confidence score if present
    const confidenceMatch = synthesizedAnswer.match(/confidence[:\s]+(\d+)/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 8;

    return {
      answer: synthesizedAnswer,
      confidence,
      basedOn: {
        subQuestions: decomposition.subQuestions.length,
        laptopsAnalyzed: allLaptops.size,
        sourcesUsed: findings.reduce((sum, f) => sum + f.sources.length, 0)
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[DeepResearch] Synthesis failed:', error);

    // Fallback: concatenate findings
    const fallbackAnswer = findings.map((f, i) => {
      return `${i + 1}. ${f.question}\n${f.answer}`;
    }).join('\n\n');

    return {
      answer: fallbackAnswer,
      confidence: 5,
      basedOn: {
        subQuestions: findings.length,
        laptopsAnalyzed: 0,
        sourcesUsed: 0
      },
      fallback: true
    };
  }
}

/**
 * Perform deep research
 *
 * @param {string} query - User's complex query
 * @param {Object} options - Research options
 * @returns {Promise<Object>} - Research results
 */
export async function performDeepResearch(query, options = {}) {
  try {
    const startTime = Date.now();

    console.log('[DeepResearch] Starting research for:', query);

    // Step 1: Decompose query
    const decomposition = await decomposeQuery(query);

    // Step 2 & 3: Research sub-questions in parallel
    const findings = await researchAllSubQuestions(
      decomposition.subQuestions,
      options.context || {}
    );

    // Step 4: Synthesize findings
    const synthesis = await synthesizeFindings(query, decomposition, findings);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[DeepResearch] Research completed in', duration, 'ms');

    return {
      query,
      decomposition,
      findings,
      synthesis,
      metadata: {
        duration,
        steps: findings.length + 2, // decomposition + synthesis + findings
        totalLaptopsAnalyzed: synthesis.basedOn.laptopsAnalyzed,
        confidence: synthesis.confidence,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('[DeepResearch] Research failed:', error);
    throw error;
  }
}

/**
 * Netlify function handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Only accept POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { query, context = {} } = body;

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Query is required' })
      };
    }

    // Perform deep research
    const results = await performDeepResearch(query, { context });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        ...results
      })
    };

  } catch (error) {
    console.error('[DeepResearch] Handler error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: process.env.NODE_ENV !== 'production' ? error.message : undefined
      })
    };
  }
}
