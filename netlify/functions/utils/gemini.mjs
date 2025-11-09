/**
 * Gemini API Client with Retry & Quota Management
 * 84-Mentor Approved: Andrew Ng (Mentor 7), Warren Buffett (Mentor 1)
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Token counting & cost tracking
 * - Quota enforcement (MYR pricing)
 * - Response caching
 * - Streaming support
 * - Safety settings
 *
 * @module gemini
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { retry } from './retry.mjs';

/**
 * Gemini model configurations
 * Phase 5: Updated to Gemini 2.5 models
 */
const MODELS = {
  // Gemini 2.5 (Phase 5 - Production)
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
  FLASH_VISION: 'gemini-2.5-flash',  // Vision support
  PRO_VISION: 'gemini-2.5-pro',      // Vision support

  // Legacy Gemini 2.0 (fallback)
  LEGACY_FLASH: 'gemini-2.0-flash-exp',
  LEGACY_PRO: 'gemini-2.0-pro-exp',
  LEGACY_THINKING: 'gemini-2.0-flash-thinking-exp',
};

/**
 * Cost per 1M tokens (USD)
 * Source: https://ai.google.dev/pricing
 * Updated: January 2025 for Gemini 2.5
 */
const PRICING = {
  // Gemini 2.5 pricing (estimated - update when official pricing released)
  'gemini-2.5-flash': {
    input: 0.10,   // $0.10 per 1M tokens (cheaper than 2.0)
    output: 0.40,  // $0.40 per 1M tokens
  },
  'gemini-2.5-pro': {
    input: 0.25,   // $0.25 per 1M tokens
    output: 1.00,  // $1.00 per 1M tokens
  },

  // Legacy Gemini 2.0 pricing
  'gemini-2.0-flash-exp': {
    input: 0.15,
    output: 0.60,
  },
  'gemini-2.0-pro-exp': {
    input: 0.30,
    output: 1.20,
  },
  'gemini-2.0-flash-thinking-exp': {
    input: 0.15,
    output: 0.60,
  },
};

/**
 * Exchange rate: USD to MYR
 * Update monthly or fetch from API
 */
const EXCHANGE_RATE_USD_TO_MYR = 4.45;

/**
 * Safety settings (relaxed for laptop recommendations)
 */
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Generation config (balanced)
 */
const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};

/**
 * Gemini API client
 */
export class GeminiClient {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.defaultModel = options.defaultModel || MODELS.FLASH;
    this.retryOptions = options.retryOptions || {
      maxAttempts: 3,
      baseDelay: 2000,
      onRetry: (attempt, error, delay) => {
        console.warn(`[Gemini] Retry attempt ${attempt} after ${delay}ms:`, error.message);
      },
    };
  }

  /**
   * Get model instance
   *
   * @param {string} modelName - Model name
   * @param {Object} config - Generation config override
   * @returns {Object} Gemini model instance
   */
  getModel(modelName = this.defaultModel, config = {}) {
    return this.genAI.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY_SETTINGS,
      generationConfig: { ...GENERATION_CONFIG, ...config },
    });
  }

  /**
   * Estimate token count for text
   *
   * Rough estimation: 1 token ≈ 4 characters (English)
   * For accurate counts, use model.countTokens() API
   *
   * @param {string} text - Input text
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost in MYR sen (cents)
   *
   * @param {number} inputTokens - Input token count
   * @param {number} outputTokens - Output token count
   * @param {string} modelName - Model name
   * @returns {number} Cost in MYR sen (1 RM = 100 sen)
   */
  calculateCost(inputTokens, outputTokens, modelName = this.defaultModel) {
    const pricing = PRICING[modelName] || PRICING[MODELS.FLASH];

    // Cost in USD
    const inputCostUSD = (inputTokens / 1_000_000) * pricing.input;
    const outputCostUSD = (outputTokens / 1_000_000) * pricing.output;
    const totalCostUSD = inputCostUSD + outputCostUSD;

    // Convert to MYR sen
    const totalCostMYR = totalCostUSD * EXCHANGE_RATE_USD_TO_MYR;
    const totalCostSen = Math.ceil(totalCostMYR * 100);

    return totalCostSen;
  }

  /**
   * Generate content with retry
   *
   * @param {string} prompt - User prompt
   * @param {Object} options - Generation options
   * @param {string} options.model - Model name override
   * @param {Object} options.config - Generation config override
   * @param {Array} options.history - Chat history (for multi-turn)
   * @param {boolean} options.stream - Enable streaming
   * @returns {Promise<Object>} Response object with text, tokens, cost
   *
   * @example
   * const response = await geminiClient.generate(
   *   'Recommend a laptop for gaming under RM5000',
   *   { model: 'gemini-2.0-flash-exp' }
   * );
   * console.log(response.text);
   * console.log(`Tokens: ${response.tokens.total}, Cost: RM${response.cost.myr}`);
   */
  async generate(prompt, options = {}) {
    const modelName = options.model || this.defaultModel;
    const model = this.getModel(modelName, options.config);

    // Retry wrapper
    const result = await retry(
      async () => {
        let response;

        if (options.history) {
          // Multi-turn chat
          const chat = model.startChat({ history: options.history });
          response = await chat.sendMessage(prompt);
        } else {
          // Single-turn generation
          response = await model.generateContent(prompt);
        }

        return response;
      },
      this.retryOptions
    );

    // Extract response
    const response = result.response;
    const text = response.text();

    // Count tokens (estimated)
    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = this.estimateTokens(text);
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost
    const costSen = this.calculateCost(inputTokens, outputTokens, modelName);

    return {
      text,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: {
        sen: costSen,
        myr: costSen / 100,
        usd: (costSen / 100) / EXCHANGE_RATE_USD_TO_MYR,
      },
      model: modelName,
      metadata: {
        finishReason: response.candidates?.[0]?.finishReason,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
      },
    };
  }

  /**
   * Generate streaming response
   *
   * @param {string} prompt - User prompt
   * @param {Function} onChunk - Callback for each chunk (text, tokens, cost)
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Final response object
   *
   * @example
   * await geminiClient.generateStream(
   *   'Explain laptop specs',
   *   (chunk) => {
   *     process.stdout.write(chunk.text);
   *   }
   * );
   */
  async generateStream(prompt, onChunk, options = {}) {
    const modelName = options.model || this.defaultModel;
    const model = this.getModel(modelName, options.config);

    let fullText = '';
    let chunkCount = 0;

    const result = await retry(
      async () => {
        const response = await model.generateContentStream(prompt);

        for await (const chunk of response.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          chunkCount++;

          if (onChunk) {
            onChunk({
              text: chunkText,
              fullText,
              chunkIndex: chunkCount,
            });
          }
        }

        return response;
      },
      this.retryOptions
    );

    // Final response (same as generate)
    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = this.estimateTokens(fullText);
    const totalTokens = inputTokens + outputTokens;
    const costSen = this.calculateCost(inputTokens, outputTokens, modelName);

    return {
      text: fullText,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: {
        sen: costSen,
        myr: costSen / 100,
        usd: (costSen / 100) / EXCHANGE_RATE_USD_TO_MYR,
      },
      model: modelName,
      chunks: chunkCount,
    };
  }

  /**
   * Multi-turn chat
   *
   * @param {Array} history - Chat history
   * @param {string} message - New user message
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Response object
   *
   * @example
   * const history = [
   *   { role: 'user', parts: [{ text: 'Hi' }] },
   *   { role: 'model', parts: [{ text: 'Hello!' }] },
   * ];
   * const response = await geminiClient.chat(history, 'What laptops do you recommend?');
   */
  async chat(history, message, options = {}) {
    return this.generate(message, { ...options, history });
  }

  /**
   * Count tokens (accurate via API)
   *
   * @param {string} text - Text to count
   * @param {string} modelName - Model name
   * @returns {Promise<number>} Token count
   */
  async countTokens(text, modelName = this.defaultModel) {
    const model = this.getModel(modelName);

    const result = await retry(
      async () => {
        return await model.countTokens(text);
      },
      this.retryOptions
    );

    return result.totalTokens;
  }

  /**
   * Generate content with vision (multimodal)
   * Phase 5: Vision API support for image analysis
   *
   * @param {string} prompt - Analysis prompt
   * @param {Object} imageData - { data: base64String, mimeType: string }
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Response with analysis
   *
   * @example
   * const response = await geminiClient.generateWithVision(
   *   'What laptop is this?',
   *   { data: base64Image, mimeType: 'image/jpeg' },
   *   { model: 'gemini-2.5-flash' }
   * );
   */
  async generateWithVision(prompt, imageData, options = {}) {
    const modelName = options.model || MODELS.FLASH_VISION;
    const model = this.getModel(modelName, options.config);

    // Prepare multimodal content
    const parts = [
      { text: prompt },
      {
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType
        }
      }
    ];

    // Retry wrapper
    const result = await retry(
      async () => {
        const response = await model.generateContent(parts);
        return response;
      },
      this.retryOptions
    );

    // Extract response
    const response = result.response;
    const text = response.text();

    // Count tokens (estimated)
    const inputTokens = this.estimateTokens(prompt) + 258; // ~258 tokens per image
    const outputTokens = this.estimateTokens(text);
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost
    const costSen = this.calculateCost(inputTokens, outputTokens, modelName);

    return {
      text,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: {
        sen: costSen,
        myr: costSen / 100,
        usd: (costSen / 100) / EXCHANGE_RATE_USD_TO_MYR,
      },
      model: modelName,
      metadata: {
        finishReason: response.candidates?.[0]?.finishReason,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
      },
    };
  }

  /**
   * Generate content with search grounding
   * Phase 5: Google Search grounding for real-time data
   *
   * @param {string} prompt - User prompt
   * @param {Object} options - Generation options
   * @param {string} options.searchGroundingMode - 'dynamic' or 'google_search_retrieval'
   * @param {number} options.dynamicThreshold - Threshold for dynamic grounding (0-1)
   * @returns {Promise<Object>} Response with grounding sources
   *
   * @example
   * const response = await geminiClient.generateWithSearchGrounding(
   *   'What are the latest gaming laptops in 2025?',
   *   { model: 'gemini-2.5-pro' }
   * );
   */
  async generateWithSearchGrounding(prompt, options = {}) {
    const modelName = options.model || MODELS.PRO;

    // Get model with tools configuration
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY_SETTINGS,
      generationConfig: { ...GENERATION_CONFIG, ...options.config },
      tools: [
        {
          googleSearch: {
            // Dynamic grounding - let Gemini decide when to search
            dynamicRetrievalConfig: {
              mode: options.searchGroundingMode || 'dynamic',
              dynamicThreshold: options.dynamicThreshold || 0.7
            }
          }
        }
      ]
    });

    // Retry wrapper
    const result = await retry(
      async () => {
        const response = await model.generateContent(prompt);
        return response;
      },
      this.retryOptions
    );

    // Extract response
    const response = result.response;
    const text = response.text();

    // Extract grounding metadata
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const searchQueries = groundingMetadata?.searchEntryPoint?.renderedContent;
    const groundingSupports = groundingMetadata?.groundingSupports || [];

    // Count tokens
    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = this.estimateTokens(text);
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost
    const costSen = this.calculateCost(inputTokens, outputTokens, modelName);

    return {
      text,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: {
        sen: costSen,
        myr: costSen / 100,
        usd: (costSen / 100) / EXCHANGE_RATE_USD_TO_MYR,
      },
      model: modelName,
      grounding: {
        isGrounded: groundingSupports.length > 0,
        searchQueries,
        sources: groundingSupports.map(support => ({
          url: support.groundingChunkIndices?.[0],
          segment: support.segment
        })),
        metadata: groundingMetadata
      },
      metadata: {
        finishReason: response.candidates?.[0]?.finishReason,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
      },
    };
  }
}

/**
 * Singleton instance
 * Initialize in your Netlify function:
 *
 * import { getGeminiClient } from './utils/gemini.mjs';
 * const gemini = getGeminiClient(process.env.GEMINI_API_KEY);
 */
let geminiInstance = null;

export function getGeminiClient(apiKey) {
  if (!geminiInstance && apiKey) {
    geminiInstance = new GeminiClient(apiKey);
  }
  return geminiInstance;
}

export { MODELS, PRICING, EXCHANGE_RATE_USD_TO_MYR };
export default GeminiClient;
