/**
 * Logging Middleware
 * Structured logging for requests and errors
 */

/**
 * Request logger middleware
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log request
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous'
  };

  // Log after response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      console.error('[ERROR]', responseLog);
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', responseLog);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[INFO]', responseLog);
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn('[SLOW]', `Request took ${duration}ms:`, {
        method: req.method,
        path: req.path
      });
    }
  });

  next();
}

/**
 * Error logger middleware
 */
export function errorLogger(err, req, res, next) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode || 500
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizeBody(req.body),
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    }
  };

  console.error('[ERROR]', errorLog);

  // In production, send to error tracking service (Sentry configured via env)
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // Sentry SDK will auto-capture errors when initialized in server.mjs
    // Error already logged to console above for debugging
  }

  next(err);
}

/**
 * Sanitize request body (remove sensitive data from logs)
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitive = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  const sanitized = { ...body };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Performance logger
 */
export class PerformanceLogger {
  constructor(label) {
    this.label = label;
    this.startTime = Date.now();
  }

  end() {
    const duration = Date.now() - this.startTime;

    if (duration > 100) {
      console.log(`[PERF] ${this.label}: ${duration}ms`);
    }

    return duration;
  }
}

/**
 * API metrics tracker
 */
export class MetricsTracker {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalDuration: 0,
      endpoints: {}
    };
  }

  track(endpoint, duration, success) {
    this.metrics.requests++;
    this.metrics.totalDuration += duration;

    if (!success) {
      this.metrics.errors++;
    }

    if (!this.metrics.endpoints[endpoint]) {
      this.metrics.endpoints[endpoint] = {
        count: 0,
        errors: 0,
        totalDuration: 0,
        avgDuration: 0
      };
    }

    const endpointMetrics = this.metrics.endpoints[endpoint];
    endpointMetrics.count++;
    endpointMetrics.totalDuration += duration;
    endpointMetrics.avgDuration = endpointMetrics.totalDuration / endpointMetrics.count;

    if (!success) {
      endpointMetrics.errors++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      avgDuration: this.metrics.requests > 0
        ? this.metrics.totalDuration / this.metrics.requests
        : 0,
      errorRate: this.metrics.requests > 0
        ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalDuration: 0,
      endpoints: {}
    };
  }
}

// Global metrics tracker
export const metrics = new MetricsTracker();

/**
 * Metrics middleware
 */
export function metricsMiddleware(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    metrics.track(endpoint, duration, success);
  });

  next();
}

export default {
  requestLogger,
  errorLogger,
  PerformanceLogger,
  MetricsTracker,
  metrics,
  metricsMiddleware
};
