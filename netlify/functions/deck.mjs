/**
 * Deck Netlify Function
 * Handles Deck v2 card generation and export
 * Routes: POST /generate, POST /export
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  successResponse,
  errorResponse,
  handleOptions,
  parseBody,
  validateRequired
} from './utils/response.mjs';
import { getUserFromEvent, requireTier } from './utils/auth.mjs';
import { applyRateLimit } from './utils/rateLimiter.mjs';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Export cards to Markdown format
 */
function exportToMarkdown(cards) {
  let md = '# AI Bradaa Deck\n\n';
  md += `_Generated: ${new Date().toISOString()}_\n\n`;
  md += `---\n\n`;

  cards.forEach((card, index) => {
    md += `## ${index + 1}. ${card.title}\n\n`;
    md += `${card.content}\n\n`;

    if (card.metadata) {
      md += `_Metadata: ${JSON.stringify(card.metadata)}_\n\n`;
    }

    md += `---\n\n`;
  });

  md += `\n\n_Powered by AI Bradaa • www.aibradaa.com_\n`;

  return md;
}

/**
 * Export cards to plain text format
 */
function exportToText(cards) {
  let text = 'AI BRADAA DECK\n';
  text += `Generated: ${new Date().toISOString()}\n`;
  text += `${'='.repeat(60)}\n\n`;

  cards.forEach((card, index) => {
    text += `${index + 1}. ${card.title.toUpperCase()}\n`;
    text += `${'-'.repeat(60)}\n`;
    text += `${card.content}\n\n`;
  });

  text += `\nPowered by AI Bradaa • www.aibradaa.com\n`;

  return text;
}

/**
 * Generate Deck cards
 */
async function generateDeck(body, user) {
  const { query, mode = 'standard' } = body;

  // Validate required fields
  validateRequired(body, ['query']);

  // Select model
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
  const model = genAI.getGenerativeModel({ model: modelName });

  // Prompt for structured Deck output
  const systemPrompt = `You are Syeddy, generating a comprehensive Deck response with 8 cards:

1. Answer - Direct answer to user's question
2. Why/How - Explanation of reasoning
3. Trade-offs - Pros and cons
4. Steps - Actionable next steps
5. Offer - Recommended laptop(s) with price
6. Risk - Potential concerns
7. Sources - Citations (if RAG enabled)
8. Next - Follow-up questions

Format: JSON with card objects containing {title, content, type}

User Query: ${query}
User Tier: ${user?.tier || 'free'}`;

  const result = await model.generateContent(systemPrompt);
  const response = await result.response;
  const text = response.text();

  // Parse JSON (assuming AI returns valid JSON)
  let cards = [];
  try {
    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    const parsed = JSON.parse(jsonText);
    cards = parsed.cards || parsed;
  } catch (parseError) {
    console.error('Failed to parse Deck JSON:', parseError);
    // Fallback: create single card with raw text
    cards = [
      {
        title: 'Answer',
        content: text,
        type: 'answer',
      },
    ];
  }

  return {
    query,
    cards,
    mode,
    model: modelName,
    meta: {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      tier: user?.tier || 'free'
    }
  };
}

/**
 * Export Deck to various formats
 */
function exportDeck(body, user) {
  const { cards, format = 'md' } = body;

  // Validate required fields
  validateRequired(body, ['cards']);

  if (!Array.isArray(cards)) {
    throw new Error('Cards must be an array');
  }

  // Check tier requirements for certain formats
  if (format === 'pdf' && user?.tier !== 'pro') {
    const error = new Error('PDF export requires Pro tier');
    error.statusCode = 403;
    throw error;
  }

  // Generate export based on format
  let exported;
  let contentType;
  let filename;

  switch (format.toLowerCase()) {
    case 'md':
    case 'markdown':
      exported = exportToMarkdown(cards);
      contentType = 'text/markdown';
      filename = `deck-${Date.now()}.md`;
      break;

    case 'json':
      exported = JSON.stringify(cards, null, 2);
      contentType = 'application/json';
      filename = `deck-${Date.now()}.json`;
      break;

    case 'txt':
    case 'text':
      exported = exportToText(cards);
      contentType = 'text/plain';
      filename = `deck-${Date.now()}.txt`;
      break;

    case 'pdf':
      // PDF generation requires additional library (e.g., puppeteer, jsPDF)
      // For now, return error with message
      throw new Error('PDF export not yet implemented. Use MD or TXT format.');

    default:
      throw new Error(`Unsupported format: ${format}. Use md, json, or txt.`);
  }

  return {
    content: exported,
    contentType,
    filename,
    format
  };
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

    // Parse request body
    const body = parseBody(event);

    // Route based on path
    const path = event.path.replace(/^\/\.netlify\/functions\/deck/, '');

    if (path === '/generate') {
      // Generate Deck cards
      const result = await generateDeck(body, user);
      return successResponse({
        success: true,
        data: result
      });
    } else if (path === '/export') {
      // Export Deck
      const result = exportDeck(body, user);

      // Return file as downloadable attachment
      return {
        statusCode: 200,
        headers: {
          'Content-Type': result.contentType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: result.content
      };
    } else {
      return errorResponse('Endpoint not found', 404);
    }

  } catch (error) {
    console.error('Deck error:', error);

    // Handle specific error types
    if (error.message.includes('Missing required fields')) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes('Cards must be an array')) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes('requires Pro tier')) {
      return errorResponse(error.message, 403);
    }

    if (error.message.includes('Unsupported format')) {
      return errorResponse(error.message, 400);
    }

    const statusCode = error.statusCode || 500;
    return errorResponse(
      error.message || 'Deck operation failed',
      statusCode,
      process.env.NODE_ENV !== 'production' ? error.stack : null
    );
  }
}
