/**
 * Error Handling Utilities
 * Centralized error handling and reporting
 */

import { getAnalytics } from './analytics.js';
import { Toast } from '../components/ui.js';

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class APIError extends AppError {
  constructor(message, statusCode = 500) {
    super(message, statusCode, true);
    this.name = 'APIError';
  }
}

export class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network request failed') {
    super(message, 0, true);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true);
    this.name = 'AuthError';
  }
}

/**
 * Global error handler
 */
export class ErrorHandler {
  constructor() {
    this.analytics = null;
    this.setupGlobalHandlers();
  }

  /**
   * Initialize with analytics
   */
  init(analytics) {
    this.analytics = analytics;
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        type: 'uncaught',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        type: 'unhandledRejection',
        promise: true
      });
    });
  }

  /**
   * Handle error
   */
  handleError(error, context = {}) {
    console.error('Error occurred:', error);

    // Track in analytics
    if (this.analytics) {
      this.analytics.error(error, context);
    }

    // Show user-friendly message
    const userMessage = this.getUserMessage(error);
    Toast.show({
      message: userMessage,
      type: 'error',
      duration: 5000
    });

    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, context);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error) {
    if (error instanceof ValidationError) {
      return error.message;
    }

    if (error instanceof AuthError) {
      return 'Authentication failed. Please log in again.';
    }

    if (error instanceof NetworkError) {
      return 'Network error. Please check your connection and try again.';
    }

    if (error instanceof APIError) {
      if (error.statusCode === 429) {
        return 'Too many requests. Please wait a moment and try again.';
      }
      if (error.statusCode === 404) {
        return 'The requested resource was not found.';
      }
      return error.message || 'An error occurred. Please try again.';
    }

    // Generic error
    return 'Aiya! Something went wrong. Please try again or contact support if the problem persists.';
  }

  /**
   * Report error to monitoring service
   */
  reportError(error, context) {
    // TODO: Implement error reporting to service like Sentry
    // For now, just log to console in production

    const errorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      statusCode: error.statusCode,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // In production, send to monitoring service
    if (window.Sentry) {
      window.Sentry.captureException(error, { contexts: { app: context } });
    } else {
      console.error('[Error Report]', errorReport);
    }
  }

  /**
   * Handle API response errors
   */
  async handleApiError(response) {
    let errorData;

    try {
      errorData = await response.json();
    } catch (e) {
      // Response doesn't have JSON
      throw new APIError(
        response.statusText || 'API request failed',
        response.status
      );
    }

    const message = errorData.error?.message || errorData.message || 'API request failed';

    throw new APIError(message, response.status);
  }

  /**
   * Wrap async function with error handling
   */
  wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, {
          function: fn.name,
          args: args.length
        });
        throw error;
      }
    };
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

/**
 * Retry utility for failed operations
 */
export async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);

        if (onRetry) {
          onRetry(attempt, waitTime, error);
        }

        await sleep(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(json, defaultValue = null) {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return defaultValue;
  }
}

/**
 * Assert utility
 */
export function assert(condition, message) {
  if (!condition) {
    throw new AppError(message || 'Assertion failed', 500, false);
  }
}

/**
 * Try-catch wrapper
 */
export function tryCatch(fn, fallback) {
  try {
    return fn();
  } catch (error) {
    console.error('Error in tryCatch:', error);
    return fallback;
  }
}

/**
 * Async try-catch wrapper
 */
export async function tryCatchAsync(fn, fallback) {
  try {
    return await fn();
  } catch (error) {
    console.error('Error in tryCatchAsync:', error);
    return fallback;
  }
}

/**
 * Initialize error handling
 */
export function initErrorHandling() {
  const analytics = getAnalytics();
  if (analytics) {
    errorHandler.init(analytics);
  }

  console.log('Error handling initialized');
}

export default {
  AppError,
  APIError,
  ValidationError,
  NetworkError,
  AuthError,
  ErrorHandler,
  errorHandler,
  retry,
  sleep,
  safeJsonParse,
  assert,
  tryCatch,
  tryCatchAsync,
  initErrorHandling
};
