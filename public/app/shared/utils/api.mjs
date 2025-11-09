/**
 * API Client - Centralized HTTP requests with auth
 * AI Bradaa PWA
 */

import { storage } from './storage.mjs';

class APIClient {
  constructor() {
    this.baseURL = window.location.origin;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Get auth token
    const token = await storage.getToken();

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build request options
    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      ...options
    };

    // Add body for POST/PUT/PATCH
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new APIError(
          data.message || data.error || 'Request failed',
          response.status,
          data
        );
      }

      return {
        status: response.status,
        data,
        headers: response.headers
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error.message || 'Network error',
        0,
        { originalError: error }
      );
    }
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // AI Bradaa specific endpoints
  async chat(message, context = {}) {
    return this.post('/.netlify/functions/chat', { message, context });
  }

  async getRecommendations(preferences) {
    return this.post('/.netlify/functions/recommendations', preferences);
  }

  async compareDevices(deviceIds) {
    return this.post('/.netlify/functions/versus', { deviceIds });
  }

  async executeCommand(command, context = {}) {
    return this.post('/.netlify/functions/command', { command, context });
  }

  async getIntel(filters = {}) {
    return this.post('/.netlify/functions/intel', filters);
  }

  async getQuota() {
    return this.get('/.netlify/functions/quota');
  }

  async getUserProfile() {
    return this.get('/.netlify/functions/auth/me');
  }

  async updatePreferences(preferences) {
    return this.patch('/.netlify/functions/preferences', preferences);
  }

  async submitFeedback(feedback) {
    return this.post('/.netlify/functions/feedback', feedback);
  }
}

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Singleton instance
export const apiClient = new APIClient();
export { APIError };
