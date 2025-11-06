/**
 * AI POD Configuration
 * Centralized configuration for all AI personas and integrations
 */

import { matchmakerPersona } from './personas/matchmaker.mjs';
import { versusPersona } from './personas/versus.mjs';
import { commandPersona } from './personas/command.mjs';
import { explorerPersona } from './personas/explorer.mjs';
import { cameraPersona } from './personas/camera.mjs';

/**
 * AI POD (Prompt-Optimized Deployment)
 * Centralized AI configuration and persona management
 */
export const aiPodConfig = {
  // Global AI settings
  provider: 'google_gemini',
  defaultModel: 'gemini-pro',
  visionModel: 'gemini-pro-vision',

  // API configuration
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 3,
  retryDelay: 1000, // ms
  timeout: 30000, // 30 seconds

  // Global generation settings
  defaultGenerationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 1024,
    stopSequences: []
  },

  // Safety settings (Google Gemini)
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],

  // Registered personas
  personas: {
    matchmaker: matchmakerPersona,
    versus: versusPersona,
    command: commandPersona,
    explorer: explorerPersona,
    camera: cameraPersona
  },

  // Route to persona mapping
  routes: {
    '/sections/matchmaker.html': 'matchmaker',
    '/sections/versus.html': 'versus',
    '/sections/command.html': 'command',
    '/sections/explorer.html': 'explorer',
    '/sections/camera-tech.html': 'camera',
    '/api/recommendations': 'matchmaker',
    '/api/compare': 'versus',
    '/api/chat': 'command',
    '/api/camera/analyze': 'camera'
  },

  // Feature flags
  features: {
    streaming: true, // Enable streaming responses
    vision: true, // Enable vision API for Camera Tech
    multimodal: true, // Support text + image inputs
    ragPipeline: false, // RAG not implemented yet
    voiceInput: false, // Voice not implemented yet
    tts: false // Text-to-speech not implemented yet
  },

  // Token management
  tokens: {
    maxContextWindow: 32768, // Gemini Pro context window
    reserveForResponse: 2048, // Reserve tokens for response
    truncationStrategy: 'oldest_first', // How to truncate conversation history
    compressionThreshold: 0.8 // Compress when context reaches 80% capacity
  },

  // TOON (Token-Optimized Object Notation) settings
  toon: {
    enabled: false, // Not implemented yet in Phase 1
    compressionRatio: 0.5, // Target 50% token reduction
    abbreviations: {
      brand: 'b',
      model: 'm',
      price_MYR: 'p',
      cpu: 'c',
      ram: 'r',
      storage: 's',
      score_composite: 'sc'
    }
  },

  // Rate limiting per persona
  rateLimits: {
    matchmaker: {
      requestsPerMinute: 20,
      requestsPerHour: 100
    },
    versus: {
      requestsPerMinute: 15,
      requestsPerHour: 80
    },
    command: {
      requestsPerMinute: 30,
      requestsPerHour: 200
    },
    explorer: {
      requestsPerMinute: 25,
      requestsPerHour: 150
    },
    camera: {
      requestsPerMinute: 10, // Lower due to vision API cost
      requestsPerHour: 50
    }
  },

  // Caching strategy
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 100, // Max cached responses
    keyPrefix: 'ai_bradaa_cache:',
    cacheableEndpoints: [
      '/api/recommendations',
      '/api/compare',
      '/api/camera/analyze'
    ]
  },

  // Monitoring and logging
  monitoring: {
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    logPersonaUsage: true,
    logTokenUsage: true,
    logLatency: true,
    logErrors: true,
    sentryEnabled: false // Not configured yet
  },

  // Cost management
  costTracking: {
    enabled: true,
    geminiPricing: {
      inputTokenCost: 0.00025 / 1000, // $0.00025 per 1K input tokens
      outputTokenCost: 0.0005 / 1000, // $0.0005 per 1K output tokens
      visionInputCost: 0.0025 / 1000 // Vision API higher cost
    },
    monthlyBudget: 38.00, // USD
    alertThreshold: 0.8 // Alert at 80% budget
  },

  // Fallback strategies
  fallbacks: {
    onError: {
      strategy: 'graceful_degradation',
      defaultMessage: 'Aiya sorry, something went wrong. Can you try again? If problem persists, contact us!',
      retryAfter: 5000 // ms
    },
    onTimeout: {
      strategy: 'return_partial',
      message: 'Request taking longer than expected... still processing...'
    },
    onRateLimit: {
      strategy: 'queue_request',
      message: 'Wah quite busy now! Your request is queued, please wait a moment...',
      maxQueueSize: 10
    }
  },

  // Compliance and privacy
  compliance: {
    pdpa: {
      enabled: true,
      dataRetention: 90, // days
      anonymizeAfter: 30, // days
      consentRequired: true
    },
    logging: {
      excludeFields: ['email', 'phone', 'payment_info'],
      hashUserIds: true,
      retainLogs: 30 // days
    }
  },

  // A/B testing framework
  experiments: {
    enabled: false, // Not implemented yet
    active: []
  }
};

/**
 * Get persona configuration by name or route
 */
export function getPersona(identifier) {
  // Check if identifier is a route
  const personaName = aiPodConfig.routes[identifier] || identifier;

  const persona = aiPodConfig.personas[personaName];
  if (!persona) {
    throw new Error(`Persona not found: ${identifier}`);
  }

  return persona;
}

/**
 * Get generation config for specific persona
 */
export function getGenerationConfig(personaName) {
  const persona = getPersona(personaName);

  return {
    ...aiPodConfig.defaultGenerationConfig,
    temperature: persona.temperature || aiPodConfig.defaultGenerationConfig.temperature,
    maxOutputTokens: persona.maxOutputTokens || aiPodConfig.defaultGenerationConfig.maxOutputTokens
  };
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(featureName) {
  return aiPodConfig.features[featureName] === true;
}

/**
 * Get rate limit for persona
 */
export function getRateLimit(personaName) {
  return aiPodConfig.rateLimits[personaName] || {
    requestsPerMinute: 10,
    requestsPerHour: 50
  };
}

/**
 * Calculate estimated cost for tokens
 */
export function estimateCost(inputTokens, outputTokens, isVision = false) {
  const { geminiPricing } = aiPodConfig.costTracking;

  const inputCost = inputTokens * (isVision ? geminiPricing.visionInputCost : geminiPricing.inputTokenCost);
  const outputCost = outputTokens * geminiPricing.outputTokenCost;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD'
  };
}

/**
 * Log usage metrics
 */
export function logUsage(metrics) {
  if (!aiPodConfig.monitoring.logTokenUsage) return;

  const { persona, inputTokens, outputTokens, latency, success } = metrics;

  console.log('[AI POD Usage]', {
    timestamp: new Date().toISOString(),
    persona,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    },
    latency: `${latency}ms`,
    success,
    estimatedCost: estimateCost(inputTokens, outputTokens, persona === 'camera')
  });
}

export default aiPodConfig;
