/**
 * Netlify Functions Integration Tests
 * Tests all 10 function endpoints without requiring API keys
 */

import { describe, it, expect } from '@jest/globals';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-only';
process.env.GEMINI_API_KEY = 'test-key';
process.env.BASE_URL = 'http://localhost:8888';

describe('Netlify Functions - Import Tests', () => {
  it('should import health function', async () => {
    const { handler } = await import('../netlify/functions/health.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import auth function', async () => {
    const { handler } = await import('../netlify/functions/auth.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import command function', async () => {
    const { handler } = await import('../netlify/functions/command.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import deck function', async () => {
    const { handler } = await import('../netlify/functions/deck.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import recommendations function', async () => {
    const { handler } = await import('../netlify/functions/recommendations.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import chat function', async () => {
    const { handler } = await import('../netlify/functions/chat.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import users function', async () => {
    const { handler } = await import('../netlify/functions/users.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import intel function', async () => {
    const { handler } = await import('../netlify/functions/intel.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import camera function', async () => {
    const { handler } = await import('../netlify/functions/camera.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should import affiliates function', async () => {
    const { handler } = await import('../netlify/functions/affiliates.mjs');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });
});

describe('Netlify Functions - Utility Tests', () => {
  it('should import response utilities', async () => {
    const utils = await import('../netlify/functions/utils/response.mjs');
    expect(utils.successResponse).toBeDefined();
    expect(utils.errorResponse).toBeDefined();
    expect(utils.handleOptions).toBeDefined();
  });

  it('should import auth utilities', async () => {
    const utils = await import('../netlify/functions/utils/auth.mjs');
    expect(utils.getUserFromEvent).toBeDefined();
    expect(utils.verifyToken).toBeDefined();
  });

  it('should import rate limiter utilities', async () => {
    const utils = await import('../netlify/functions/utils/rateLimiter.mjs');
    expect(utils.applyRateLimit).toBeDefined();
  });

  it('should import TOON utilities', async () => {
    const utils = await import('../netlify/functions/utils/toon.mjs');
    expect(utils.compressForAI).toBeDefined();
    expect(utils.calculateSavings).toBeDefined();
    expect(utils.wrapForAI).toBeDefined();
  });
});

describe('Netlify Functions - Health Check', () => {
  it('should return healthy status', async () => {
    const { handler } = await import('../netlify/functions/health.mjs');

    const mockEvent = {
      httpMethod: 'GET',
      path: '/.netlify/functions/health/',
      headers: {},
      queryStringParameters: {}
    };

    const response = await handler(mockEvent, {});

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('should handle OPTIONS request', async () => {
    const { handler } = await import('../netlify/functions/health.mjs');

    const mockEvent = {
      httpMethod: 'OPTIONS',
      path: '/.netlify/functions/health/',
      headers: {},
      queryStringParameters: {}
    };

    const response = await handler(mockEvent, {});

    expect(response.statusCode).toBe(200);
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
  });
});

describe('Netlify Functions - TOON Integration', () => {
  it('should compress JSON to TOON format', async () => {
    const { compressForAI, calculateSavings } = await import('../netlify/functions/utils/toon.mjs');

    const testData = {
      brand: 'Apple',
      model: 'MacBook Pro 14',
      price: 7999,
      specifications: {
        processor: 'M4',
        cores: 10,
        memory: 16
      }
    };

    const compressed = compressForAI(testData, { indent: false });
    const savings = calculateSavings(testData);

    expect(compressed).toBeDefined();
    expect(compressed.length).toBeLessThan(JSON.stringify(testData).length);
    expect(savings.percentageSaved).toMatch(/%$/);
    expect(parseFloat(savings.percentageSaved)).toBeGreaterThan(20); // Should save at least 20%
  });

  it('should handle TOON compression gracefully', async () => {
    const { safeCompress } = await import('../netlify/functions/utils/toon.mjs');

    const testData = { test: 'data' };
    const result = safeCompress(testData);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

describe('Netlify Functions - Response Utilities', () => {
  it('should create success response', async () => {
    const { successResponse } = await import('../netlify/functions/utils/response.mjs');

    const response = successResponse({ message: 'test' }, 200);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['Access-Control-Allow-Origin']).toBeDefined();

    const body = JSON.parse(response.body);
    expect(body.message).toBe('test');
  });

  it('should create error response', async () => {
    const { errorResponse } = await import('../netlify/functions/utils/response.mjs');

    const response = errorResponse('Test error', 400);

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBeDefined();
    expect(body.error.message).toBe('Test error');
    expect(body.error.code).toBeDefined();
  });
});

describe('Netlify Functions - Rate Limiter', () => {
  it('should apply rate limiting', async () => {
    const { applyRateLimit } = await import('../netlify/functions/utils/rateLimiter.mjs');

    const mockEvent = {
      headers: { 'client-ip': '127.0.0.1' }
    };

    // Should not throw on first request
    expect(() => applyRateLimit(mockEvent, 'guest')).not.toThrow();
  });
});
