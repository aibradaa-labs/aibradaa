/**
 * Centralized Configuration Loader
 * Loads and validates all environment variables and app config
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Configuration object with all app settings
 */
export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Base URLs
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',

  // Google Gemini API
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    modelPro: process.env.GEMINI_MODEL_PRO || 'gemini-exp-1206',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    topK: parseInt(process.env.GEMINI_TOP_K || '40', 10),
    topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '8192', 10),
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  },

  // Email (for magic links)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@aibradaa.com',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // requests per windowMs
    freeTier: parseInt(process.env.RATE_LIMIT_FREE || '10', 10),
    proTier: parseInt(process.env.RATE_LIMIT_PRO || '50', 10),
    ultimateTier: parseInt(process.env.RATE_LIMIT_ULTIMATE || '200', 10),
  },

  // Quota Management (Token limits per tier)
  quota: {
    free: {
      tokensPerDay: 50000,
      tokensPerRequest: 6000,
    },
    pro: {
      tokensPerDay: 500000,
      tokensPerRequest: 12000,
    },
    ultimate: {
      tokensPerDay: 2000000,
      tokensPerRequest: 24000,
    },
  },

  // Cache TTL (Time To Live)
  cache: {
    ttl: {
      logs: 30 * 24 * 60 * 60 * 1000, // 30 days
      cache: 3 * 24 * 60 * 60 * 1000, // 3 days
      audit: 90 * 24 * 60 * 60 * 1000, // 90 days
    },
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'https://www.aibradaa.com'],
    credentials: true,
  },

  // CSP (Content Security Policy)
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Temporary for development, remove in production
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Features
  features: {
    enableOAuth: process.env.ENABLE_OAUTH !== 'false',
    enableMagicLinks: process.env.ENABLE_MAGIC_LINKS !== 'false',
    enable2FA: process.env.ENABLE_2FA !== 'false',
    enableRAG: process.env.ENABLE_RAG !== 'false',
    enableTTS: process.env.ENABLE_TTS !== 'false',
    enableSouls: process.env.ENABLE_SOULS !== 'false',
  },
};

/**
 * Validate required configuration
 */
export function validateConfig() {
  const errors = [];

  if (!config.gemini.apiKey && config.env === 'production') {
    errors.push('GEMINI_API_KEY is required in production');
  }

  if (!config.auth.jwtSecret || config.auth.jwtSecret === 'your-secret-key-change-in-production') {
    if (config.env === 'production') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

/**
 * Get tier-specific configuration
 */
export function getTierConfig(tier = 'free') {
  const normalizedTier = tier.toLowerCase();

  return {
    rateLimit: config.rateLimit[`${normalizedTier}Tier`] || config.rateLimit.freeTier,
    quota: config.quota[normalizedTier] || config.quota.free,
  };
}

export default config;
