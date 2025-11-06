/**
 * API Client
 * Centralized fetch wrapper with auth, error handling, retries
 */

const API_BASE_URL = window.ENV?.API_URL || 'http://localhost:3000/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = this.getToken();
  }

  /**
   * Get auth token from localStorage
   */
  getToken() {
    try {
      return localStorage.getItem('ai_bradaa_token');
    } catch (e) {
      return null;
    }
  }

  /**
   * Set auth token
   */
  setToken(token) {
    try {
      localStorage.setItem('ai_bradaa_token', token);
      this.token = token;
    } catch (e) {
      console.error('Failed to save token:', e);
    }
  }

  /**
   * Clear auth token
   */
  clearToken() {
    try {
      localStorage.removeItem('ai_bradaa_token');
      this.token = null;
    } catch (e) {
      console.error('Failed to clear token:', e);
    }
  }

  /**
   * Make HTTP request
   */
  async request(url, options = {}) {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add auth header if token exists
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Make request
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    try {
      const response = await fetch(fullURL, config);

      // Handle different status codes
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/signup.html';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(error.message || 'Request failed');
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
export default apiClient;
