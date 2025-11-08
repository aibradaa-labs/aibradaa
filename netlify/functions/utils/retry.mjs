/**
 * Exponential Backoff Retry Utility
 * 84-Mentor Approved: Andrew Ng (Mentor 7) - Technical Excellence
 *
 * Implements exponential backoff with jitter for resilient API calls.
 *
 * Features:
 * - Configurable max attempts (default: 3)
 * - Exponential delay: 2^attempt × baseDelay
 * - Jitter: ±20% randomization to prevent thundering herd
 * - Selective retry: Only retries on network/timeout errors
 * - Circuit breaker pattern (optional)
 *
 * @module retry
 */

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,        // 1 second
  maxDelay: 30000,        // 30 seconds
  jitterFactor: 0.2,      // ±20%
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ENETUNREACH',
    'EAI_AGAIN',
  ],
  retryableStatusCodes: [
    408,  // Request Timeout
    429,  // Too Many Requests
    500,  // Internal Server Error
    502,  // Bad Gateway
    503,  // Service Unavailable
    504,  // Gateway Timeout
  ],
};

/**
 * Calculate delay with exponential backoff and jitter
 *
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in ms
 * @param {number} maxDelay - Maximum delay in ms
 * @param {number} jitterFactor - Jitter factor (0-1)
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt, baseDelay, maxDelay, jitterFactor) {
  // Exponential backoff: 2^attempt × baseDelay
  const exponentialDelay = Math.pow(2, attempt) * baseDelay;

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter: ±jitterFactor%
  const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1);

  return Math.max(0, cappedDelay + jitter);
}

/**
 * Check if error is retryable
 *
 * @param {Error} error - Error object
 * @param {Array<string>} retryableErrors - List of retryable error codes
 * @param {Array<number>} retryableStatusCodes - List of retryable HTTP status codes
 * @returns {boolean} True if retryable
 */
function isRetryable(error, retryableErrors, retryableStatusCodes) {
  // Network errors
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }

  // HTTP status codes
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Response status codes (for fetch API)
  if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return true;
  }

  return false;
}

/**
 * Retry a function with exponential backoff
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry configuration
 * @param {number} options.maxAttempts - Maximum retry attempts
 * @param {number} options.baseDelay - Base delay in ms
 * @param {number} options.maxDelay - Maximum delay in ms
 * @param {number} options.jitterFactor - Jitter factor (0-1)
 * @param {Function} options.onRetry - Callback on retry (attempt, error, delay)
 * @returns {Promise<any>} Result of successful function execution
 * @throws {Error} Last error if all attempts fail
 *
 * @example
 * const result = await retry(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) throw new Error(`HTTP ${response.status}`);
 *     return response.json();
 *   },
 *   {
 *     maxAttempts: 3,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms:`, error.message);
 *     }
 *   }
 * );
 */
export async function retry(fn, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  let lastError;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      // Execute function
      const result = await fn();

      // Success! Return result
      return result;

    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = isRetryable(
        error,
        config.retryableErrors,
        config.retryableStatusCodes
      );

      // Last attempt or non-retryable error
      if (attempt === config.maxAttempts - 1 || !shouldRetry) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        config.baseDelay,
        config.maxDelay,
        config.jitterFactor
      );

      // Call onRetry callback
      if (config.onRetry) {
        config.onRetry(attempt + 1, error, delay);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but throw last error just in case
  throw lastError;
}

/**
 * Retry wrapper for fetch API
 *
 * @param {string} url - URL to fetch
 * @param {Object} fetchOptions - Fetch options
 * @param {Object} retryOptions - Retry configuration
 * @returns {Promise<Response>} Fetch response
 *
 * @example
 * const response = await retryFetch(
 *   'https://api.example.com/data',
 *   { method: 'GET' },
 *   { maxAttempts: 3 }
 * );
 */
export async function retryFetch(url, fetchOptions = {}, retryOptions = {}) {
  return retry(
    async () => {
      const response = await fetch(url, fetchOptions);

      // Check if response is retryable error
      if (!response.ok && DEFAULT_CONFIG.retryableStatusCodes.includes(response.status)) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return response;
    },
    retryOptions
  );
}

/**
 * Circuit breaker state machine
 *
 * Prevents cascading failures by stopping requests after consecutive failures.
 *
 * States:
 * - CLOSED: Normal operation
 * - OPEN: All requests fail fast (no actual call)
 * - HALF_OPEN: Test request to check if service recovered
 *
 * @class CircuitBreaker
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  /**
   * Execute function with circuit breaker protection
   *
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>} Result of function
   */
  async execute(fn) {
    // Check state
    if (this.state === 'OPEN') {
      const now = Date.now();

      // Check if we should transition to HALF_OPEN
      if (now >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
      } else {
        const error = new Error('Circuit breaker is OPEN');
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }
    }

    try {
      // Execute function
      const result = await fn();

      // Success! Reset circuit breaker
      this.onSuccess();

      return result;

    } catch (error) {
      // Failure! Update circuit breaker
      this.onFailure();

      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = this.lastFailureTime + this.resetTimeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}

/**
 * Utility: Sleep for specified duration
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  retry,
  retryFetch,
  CircuitBreaker,
  sleep,
  calculateDelay,
  isRetryable,
};
