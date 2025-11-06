/**
 * SSE Deck Stream
 * Server-Sent Events for streaming Deck card generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.mjs';

/**
 * Stream Deck cards via SSE
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function streamDeck(req, res) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const { query, mode = 'standard' } = req.body;

    if (!query) {
      sendEvent(res, 'error', { message: 'Query is required' });
      res.end();
      return;
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const modelName = config.gemini.model;
    const model = genAI.getGenerativeModel({ model: modelName });

    // Send initial event
    sendEvent(res, 'start', { query, mode });

    // Prompt for structured Deck
    const systemPrompt = `You are Syeddy, generating 8 Deck cards for this query: "${query}"

Generate JSON with array of 8 card objects:
1. Answer
2. Why/How
3. Trade-offs
4. Steps
5. Offer
6. Risk
7. Sources
8. Next

Each card: {title: string, content: string, type: string}`;

    // Stream generation
    const result = await model.generateContentStream(systemPrompt);

    let buffer = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      buffer += chunkText;

      // Send chunk event
      sendEvent(res, 'chunk', { text: chunkText });

      // Try to parse accumulated buffer for complete cards
      const cards = tryParseCards(buffer);
      if (cards && cards.length > 0) {
        cards.forEach((card, index) => {
          sendEvent(res, 'card', { card, index });
        });
      }
    }

    // Final parse
    const finalCards = tryParseCards(buffer);
    sendEvent(res, 'complete', { cards: finalCards, buffer });
    res.end();
  } catch (error) {
    console.error('SSE stream error:', error);
    sendEvent(res, 'error', { message: error.message });
    res.end();
  }
}

/**
 * Send SSE event
 */
function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Try to parse JSON cards from buffer
 */
function tryParseCards(buffer) {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = buffer.match(/```json\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : buffer;

    const parsed = JSON.parse(jsonText);
    return parsed.cards || parsed;
  } catch (e) {
    return null;
  }
}

export default streamDeck;
