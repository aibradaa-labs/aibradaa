/**
 * RAG (Retrieval Augmented Generation) Search
 * AI Bradaa - Phase 6: Advanced AI Features
 *
 * PURPOSE: Vector-based semantic search for laptop recommendations
 * FEATURES:
 * - Gemini Embedding API for vector embeddings
 * - Cosine similarity search
 * - Top-k retrieval
 * - Grounded recommendations with source citations
 *
 * ARCHITECTURE:
 * 1. User query → Generate embedding
 * 2. Find top-k similar laptops (cosine similarity)
 * 3. Include in Gemini context as grounded data
 * 4. Generate response with citations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Initialize Gemini client
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Load laptop database
 */
let laptopDatabase = null;

function loadLaptopDatabase() {
  if (!laptopDatabase) {
    try {
      const dataPath = join(process.cwd(), 'data', 'laptops.json');
      const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
      laptopDatabase = data.laptops || [];
    } catch (error) {
      console.error('[RAG] Failed to load laptop database:', error);
      laptopDatabase = [];
    }
  }
  return laptopDatabase;
}

/**
 * Generate embedding for text
 *
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent(text);
    const embedding = result.embedding;

    return embedding.values;
  } catch (error) {
    console.error('[RAG] Embedding generation failed:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 *
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Cosine similarity (-1 to 1)
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Create searchable text for laptop
 *
 * @param {Object} laptop - Laptop object
 * @returns {string} - Searchable text
 */
function createLaptopSearchText(laptop) {
  const parts = [
    laptop.fullName || laptop.model,
    laptop.brandName,
    laptop.segment,
    laptop.tier,
    `Price: RM${laptop.price}`,
    `CPU: ${laptop.specs?.cpu?.model || 'N/A'}`,
    `GPU: ${laptop.specs?.gpu?.model || 'N/A'}`,
    `RAM: ${laptop.specs?.ram?.size || 'N/A'}GB`,
    `Storage: ${laptop.specs?.storage?.size || 'N/A'}GB ${laptop.specs?.storage?.type || ''}`,
    `Display: ${laptop.specs?.display?.size || 'N/A'}" ${laptop.specs?.display?.resolution || ''}`,
    laptop.description || '',
    `Rating: ${laptop.rating}/5`
  ];

  return parts.filter(Boolean).join('. ');
}

/**
 * Search laptops using RAG
 *
 * @param {string} query - User search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
export async function searchLaptopsRAG(query, options = {}) {
  try {
    const {
      topK = 5,
      minSimilarity = 0.5,
      filters = {}
    } = options;

    // Load laptop database
    const laptops = loadLaptopDatabase();

    if (laptops.length === 0) {
      throw new Error('Laptop database is empty');
    }

    // Generate query embedding
    console.log('[RAG] Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);

    // Generate embeddings for all laptops (in production, these would be pre-computed)
    console.log('[RAG] Searching laptops...');

    // For now, use simplified embedding (in production, use pre-computed embeddings)
    const results = [];

    for (const laptop of laptops) {
      // Apply filters
      if (filters.segment && laptop.segment !== filters.segment) continue;
      if (filters.tier && laptop.tier !== filters.tier) continue;
      if (filters.minPrice && laptop.price < filters.minPrice) continue;
      if (filters.maxPrice && laptop.price > filters.maxPrice) continue;

      // Create searchable text
      const laptopText = createLaptopSearchText(laptop);

      // Generate laptop embedding
      const laptopEmbedding = await generateEmbedding(laptopText);

      // Calculate similarity
      const similarity = cosineSimilarity(queryEmbedding, laptopEmbedding);

      if (similarity >= minSimilarity) {
        results.push({
          laptop,
          similarity,
          searchText: laptopText
        });
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);

    // Return top-k results
    const topResults = results.slice(0, topK);

    return {
      query,
      results: topResults,
      totalMatches: results.length,
      topK,
      embedding: queryEmbedding.slice(0, 10) // First 10 dimensions for debugging
    };

  } catch (error) {
    console.error('[RAG] Search failed:', error);
    throw error;
  }
}

/**
 * Generate AI response with RAG context
 *
 * @param {string} query - User query
 * @param {Array} ragResults - RAG search results
 * @returns {Promise<string>} - AI response
 */
export async function generateRAGResponse(query, ragResults) {
  try {
    // Build context from RAG results
    const context = ragResults.map((result, index) => {
      const laptop = result.laptop;
      return `[${index + 1}] ${laptop.fullName}
- Price: RM${laptop.price}${laptop.originalPrice ? ` (save RM${laptop.originalPrice - laptop.price})` : ''}
- CPU: ${laptop.specs?.cpu?.model || 'N/A'}
- GPU: ${laptop.specs?.gpu?.model || 'N/A'}
- RAM: ${laptop.specs?.ram?.size || 'N/A'}GB
- Storage: ${laptop.specs?.storage?.size || 'N/A'}GB ${laptop.specs?.storage?.type || ''}
- Display: ${laptop.specs?.display?.size || 'N/A'}" ${laptop.specs?.display?.resolution || ''}
- Rating: ${laptop.rating}/5
- Segment: ${laptop.segment}
- Similarity Score: ${(result.similarity * 100).toFixed(1)}%`;
    }).join('\n\n');

    // Generate response with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are AI Bradaa, Malaysia's friendly AI laptop advisor. A user asked: "${query}"

I've found these relevant laptops from our database (sorted by relevance):

${context}

INSTRUCTIONS:
1. Answer the user's question based on the laptops above
2. Recommend the most suitable options and explain why
3. Use a friendly, enthusiastic tone (Manglish welcome: lah, wah, etc.)
4. Cite laptop names when making recommendations
5. If comparing, highlight key differences
6. Keep it concise but helpful (2-3 paragraphs max)

YOUR RESPONSE:`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    return response.text();

  } catch (error) {
    console.error('[RAG] Response generation failed:', error);
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
    const { query, topK = 5, filters = {}, generateResponse = true } = body;

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

    // Perform RAG search
    const searchResults = await searchLaptopsRAG(query, { topK, filters });

    // Generate AI response if requested
    let aiResponse = null;
    if (generateResponse) {
      aiResponse = await generateRAGResponse(query, searchResults.results);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        query,
        results: searchResults.results.map(r => ({
          laptop: r.laptop,
          similarity: r.similarity
        })),
        totalMatches: searchResults.totalMatches,
        topK: searchResults.topK,
        response: aiResponse,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('[RAG] Handler error:', error);

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
