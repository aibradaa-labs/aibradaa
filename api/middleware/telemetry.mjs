/**
 * Telemetry Middleware
 * Tracks request metrics, latency, and errors for observability
 */

/**
 * Simple in-memory metrics store
 * In production, this would send to Prometheus/Grafana
 */
const metrics = {
  requests: {
    total: 0,
    byPath: {},
    byStatus: {},
  },
  latency: {
    sum: 0,
    count: 0,
    p95: [],
    p99: [],
  },
  errors: {
    total: 0,
    byType: {},
  },
};

/**
 * Telemetry middleware
 * Captures request start time and logs completion metrics
 */
export function telemetryMiddleware(req, res, next) {
  const startTime = Date.now();
  const path = req.path;

  // Increment request count
  metrics.requests.total++;
  metrics.requests.byPath[path] = (metrics.requests.byPath[path] || 0) + 1;

  // Capture response finish
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    // Log latency
    metrics.latency.sum += duration;
    metrics.latency.count++;
    metrics.latency.p95.push(duration);
    metrics.latency.p99.push(duration);

    // Keep only last 1000 values for percentile calculation
    if (metrics.latency.p95.length > 1000) {
      metrics.latency.p95.shift();
    }
    if (metrics.latency.p99.length > 1000) {
      metrics.latency.p99.shift();
    }

    // Log status code
    const statusCode = res.statusCode;
    metrics.requests.byStatus[statusCode] = (metrics.requests.byStatus[statusCode] || 0) + 1;

    // Log errors
    if (statusCode >= 400) {
      metrics.errors.total++;
      const errorType = statusCode >= 500 ? 'server' : 'client';
      metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
    }

    // Log to console (in production, send to logging service)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${path} ${statusCode} ${duration}ms`
      );
    }

    // Add performance header
    res.setHeader('X-Response-Time', `${duration}ms`);

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Get current metrics
 * Used by /api/metrics endpoint
 */
export function getMetrics() {
  const avgLatency = metrics.latency.count > 0 ? metrics.latency.sum / metrics.latency.count : 0;

  // Calculate p95 and p99
  const sortedP95 = [...metrics.latency.p95].sort((a, b) => a - b);
  const sortedP99 = [...metrics.latency.p99].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedP95.length * 0.95);
  const p99Index = Math.floor(sortedP99.length * 0.99);

  return {
    requests: {
      total: metrics.requests.total,
      byPath: metrics.requests.byPath,
      byStatus: metrics.requests.byStatus,
    },
    latency: {
      avg: Math.round(avgLatency),
      p95: sortedP95[p95Index] || 0,
      p99: sortedP99[p99Index] || 0,
    },
    errors: {
      total: metrics.errors.total,
      rate: metrics.requests.total > 0 ? (metrics.errors.total / metrics.requests.total) * 100 : 0,
      byType: metrics.errors.byType,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics() {
  metrics.requests = { total: 0, byPath: {}, byStatus: {} };
  metrics.latency = { sum: 0, count: 0, p95: [], p99: [] };
  metrics.errors = { total: 0, byType: {} };
}

export default telemetryMiddleware;
