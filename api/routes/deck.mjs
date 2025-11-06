/**
 * Deck Routes
 * Handles Deck v2 card generation and export
 */

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.mjs';
import { applyTierLimiter } from '../middleware/rate-limit.mjs';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * POST /api/deck/generate
 * Generate a complete Deck (8 cards) for a query
 */
router.post('/generate', applyTierLimiter, async (req, res) => {
  try {
    const { query, mode = 'standard' } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query is required',
      });
    }

    // Select model
    const modelName = config.gemini.model;
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
User Tier: ${req.user?.tier || 'free'}`;

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

    res.json({
      success: true,
      data: {
        query,
        cards,
        mode,
        model: modelName,
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
      },
    });
  } catch (error) {
    console.error('Deck generation error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate Deck',
    });
  }
});

/**
 * POST /api/deck/export
 * Export Deck to various formats (MD, PNG, PDF)
 */
router.post('/export', applyTierLimiter, async (req, res) => {
  try {
    const { cards, format = 'md' } = req.body;

    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cards array is required',
      });
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

      default:
        return res.status(400).json({
          error: 'Bad Request',
          message: `Unsupported format: ${format}. Use md, json, or txt.`,
        });
    }

    // Send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exported);
  } catch (error) {
    console.error('Deck export error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export Deck',
    });
  }
});

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

export default router;
