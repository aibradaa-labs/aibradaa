/**
 * AI Bradaa - API Unit Tests
 *
 * Tests for API utility functions
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock API client (simplified version)
class APIClient {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    return { url, config };
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

describe('APIClient', () => {
  let client;

  beforeEach(() => {
    client = new APIClient();
  });

  test('should create instance with default baseURL', () => {
    expect(client.baseURL).toBe('http://localhost:3000/api');
    expect(client.token).toBeNull();
  });

  test('should set and clear token', () => {
    const testToken = 'test-jwt-token';

    client.setToken(testToken);
    expect(client.token).toBe(testToken);

    client.clearToken();
    expect(client.token).toBeNull();
  });

  test('should build GET request correctly', async () => {
    const result = await client.get('/laptops');

    expect(result.url).toBe('http://localhost:3000/api/laptops');
    expect(result.config.method).toBe('GET');
    expect(result.config.headers['Content-Type']).toBe('application/json');
  });

  test('should build POST request correctly', async () => {
    const data = { email: 'test@example.com', password: 'password123' };
    const result = await client.post('/auth/login', data);

    expect(result.url).toBe('http://localhost:3000/api/auth/login');
    expect(result.config.method).toBe('POST');
    expect(result.config.body).toBe(JSON.stringify(data));
  });

  test('should include Authorization header when token is set', async () => {
    const testToken = 'test-jwt-token';
    client.setToken(testToken);

    const result = await client.get('/user/profile');

    expect(result.config.headers['Authorization']).toBe(`Bearer ${testToken}`);
  });

  test('should not include Authorization header when token is not set', async () => {
    const result = await client.get('/laptops');

    expect(result.config.headers['Authorization']).toBeUndefined();
  });
});
