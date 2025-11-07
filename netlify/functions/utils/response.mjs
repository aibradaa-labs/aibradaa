/**
 * Netlify Function Response Utilities
 * Standard response formatters for consistent API responses
 */

/**
 * Standard CORS headers for all responses
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

/**
 * Standard security headers per policy_security.md
 */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
};

/**
 * Create success response
 */
export function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...SECURITY_HEADERS
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create error response
 */
export function errorResponse(message, statusCode = 500, details = null) {
  const error = {
    error: {
      code: getErrorCode(statusCode),
      message,
      timestamp: new Date().toISOString()
    }
  };

  if (details && process.env.NODE_ENV !== 'production') {
    error.error.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...SECURITY_HEADERS
    },
    body: JSON.stringify(error)
  };
}

/**
 * Handle OPTIONS (preflight) requests
 */
export function handleOptions() {
  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      ...SECURITY_HEADERS
    },
    body: ''
  };
}

/**
 * Get error code name from HTTP status
 */
function getErrorCode(statusCode) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };

  return codes[statusCode] || 'UNKNOWN_ERROR';
}

/**
 * Parse request body (handles both JSON and URL-encoded)
 */
export function parseBody(event) {
  if (!event.body) {
    return null;
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    // If JSON parse fails, try URL-encoded
    if (event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      return Object.fromEntries(new URLSearchParams(event.body));
    }
    throw new Error('Invalid request body');
  }
}

/**
 * Get query parameters from event
 */
export function getQueryParams(event) {
  return event.queryStringParameters || {};
}

/**
 * Get path parameters (extract from event.path)
 */
export function getPathParam(event, paramName) {
  const match = event.path.match(new RegExp(`/${paramName}/([^/]+)`));
  return match ? match[1] : null;
}

/**
 * Validate required fields in body
 */
export function validateRequired(body, fields) {
  const missing = fields.filter(field => !body[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  return true;
}
