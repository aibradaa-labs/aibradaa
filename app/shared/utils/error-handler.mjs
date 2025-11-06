/**
 * Error Handler
 * Centralized error handling and reporting
 */

import { toast } from '../components/toast.mjs';

/**
 * Error types
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Custom application error
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error handler class
 */
export class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.onError = null;
  }

  /**
   * Handle error
   */
  handle(error, context = {}) {
    // Normalize error
    const normalizedError = this.normalizeError(error);

    // Log error
    this.logError(normalizedError, context);

    // Report error (if handler set)
    if (this.onError) {
      try {
        this.onError(normalizedError, context);
      } catch (reportError) {
        console.error('Error reporting failed:', reportError);
      }
    }

    // Show user-friendly message
    this.showUserError(normalizedError);

    return normalizedError;
  }

  /**
   * Normalize error to AppError
   */
  normalizeError(error) {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Network error
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return new AppError(
        'Network connection failed. Please check your internet.',
        ErrorTypes.NETWORK,
        { originalError: error.message }
      );
    }

    // Auth error
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return new AppError(
        'Session expired. Please log in again.',
        ErrorTypes.AUTH,
        { originalError: error.message }
      );
    }

    // Rate limit error
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return new AppError(
        'Too many requests. Please wait a moment and try again.',
        ErrorTypes.RATE_LIMIT,
        { originalError: error.message }
      );
    }

    // Validation error
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return new AppError(
        error.message || 'Invalid input. Please check your data.',
        ErrorTypes.VALIDATION,
        { originalError: error.message }
      );
    }

    // Not found error
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return new AppError(
        'Resource not found.',
        ErrorTypes.NOT_FOUND,
        { originalError: error.message }
      );
    }

    // Server error
    if (error.message?.includes('500') || error.message?.includes('server error')) {
      return new AppError(
        'Server error. Our team has been notified.',
        ErrorTypes.SERVER,
        { originalError: error.message }
      );
    }

    // Generic error
    return new AppError(
      error.message || 'Something went wrong. Please try again.',
      ErrorTypes.UNKNOWN,
      { originalError: error }
    );
  }

  /**
   * Log error
   */
  logError(error, context) {
    const logEntry = {
      error: {
        message: error.message,
        type: error.type,
        details: error.details,
        timestamp: error.timestamp,
        stack: error.stack,
      },
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Add to error log
    this.errorLog.push(logEntry);

    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', logEntry);
    }
  }

  /**
   * Show user-friendly error message
   */
  showUserError(error) {
    // Different toast types based on error type
    switch (error.type) {
      case ErrorTypes.NETWORK:
        toast.error(error.message, {
          duration: 6000,
          action: {
            text: 'Retry',
            onClick: () => window.location.reload(),
          },
        });
        break;

      case ErrorTypes.AUTH:
        toast.warning(error.message, {
          duration: 8000,
          action: {
            text: 'Login',
            onClick: () => window.location.href = '/signup.html',
          },
        });
        break;

      case ErrorTypes.RATE_LIMIT:
        toast.warning(error.message, { duration: 5000 });
        break;

      case ErrorTypes.VALIDATION:
        toast.warning(error.message, { duration: 4000 });
        break;

      case ErrorTypes.SERVER:
        toast.error(error.message, { duration: 6000 });
        break;

      default:
        toast.error(error.message, { duration: 5000 });
    }
  }

  /**
   * Get error log
   */
  getLog(limit = 50) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }

  /**
   * Set error reporter
   */
  setReporter(callback) {
    this.onError = callback;
  }

  /**
   * Report error to external service (e.g., Sentry)
   */
  reportToService(error, context) {
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      // Sentry.captureException(error, { extra: context });
      console.log('Would report to external service:', { error, context });
    }
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    errorHandler.handle(event.reason, {
      type: 'unhandledRejection',
      promise: event.promise,
    });
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    errorHandler.handle(event.error || event.message, {
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  console.log('Global error handlers installed');
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handle(error, { ...context, function: fn.name });
      throw error; // Re-throw after handling
    }
  };
}

/**
 * Try-catch wrapper with error handling
 */
export async function tryCatch(fn, fallback = null, context = {}) {
  try {
    return await fn();
  } catch (error) {
    errorHandler.handle(error, context);
    return fallback;
  }
}

export default errorHandler;
