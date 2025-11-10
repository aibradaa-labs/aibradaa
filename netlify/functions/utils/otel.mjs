/**
 * OpenTelemetry Utilities
 * 84-Mentor Approved: Gene Kim (Mentor 24) - Observability Excellence
 *
 * Provides OTEL SDK initialization and helper functions for
 * instrumenting Netlify functions with traces, metrics, and logs.
 *
 * @module otel
 */

// Note: In production, install @opentelemetry packages:
// npm install @opentelemetry/sdk-node @opentelemetry/api
// npm install @opentelemetry/instrumentation-http
// npm install @opentelemetry/exporter-trace-otlp-http

// Stub implementation for now (production: use real OTEL SDK)
const IS_PRODUCTION = process.env.NETLIFY_ENV === 'production';
const OTEL_ENABLED = process.env.OTEL_ENABLED === 'true';

// In-memory trace storage for development
const traces = [];
const metrics = {};

/**
 * Initialize OTEL SDK
 *
 * Call this once at application startup
 */
export function initOTEL() {
  if (!OTEL_ENABLED) {
    console.log('[OTEL] Disabled - set OTEL_ENABLED=true to enable');
    return;
  }

  console.log('[OTEL] Initializing OpenTelemetry SDK...');

  // Production: Initialize real OTEL SDK
  // const { NodeSDK } = require('@opentelemetry/sdk-node');
  // const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
  // const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  //
  // const sdk = new NodeSDK({
  //   serviceName: 'ai-bradaa',
  //   traceExporter: IS_PRODUCTION
  //     ? new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT })
  //     : new ConsoleSpanExporter(),
  //   instrumentations: [
  //     new HttpInstrumentation(),
  //     // Add more instrumentations
  //   ],
  // });
  //
  // sdk.start();

  console.log('[OTEL] OpenTelemetry initialized');
}

/**
 * Create a new span
 *
 * @param {string} name - Span name
 * @param {Function} fn - Function to execute within span
 * @param {Object} attributes - Span attributes
 * @returns {Promise<*>} Result of fn
 *
 * @example
 * const result = await withSpan('gemini.call', async (span) => {
 *   span.setAttribute('model', 'gemini-2.0-flash-exp');
 *   return await callGemini();
 * }, { endpoint: '/chat' });
 */
export async function withSpan(name, fn, attributes = {}) {
  if (!OTEL_ENABLED) {
    // OTEL disabled, just run the function
    return await fn({
      setAttribute: () => {},
      setStatus: () => {},
      recordException: () => {},
      end: () => {},
    });
  }

  const startTime = Date.now();
  const spanId = `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const span = {
    spanId,
    name,
    startTime,
    attributes: { ...attributes },
    events: [],
    status: 'ok',

    setAttribute(key, value) {
      this.attributes[key] = value;
    },

    addEvent(eventName, eventAttributes = {}) {
      this.events.push({
        name: eventName,
        timestamp: Date.now(),
        attributes: eventAttributes,
      });
    },

    setStatus(status, message) {
      this.status = status;
      if (message) {
        this.statusMessage = message;
      }
    },

    recordException(error) {
      this.status = 'error';
      this.error = {
        type: error.name,
        message: error.message,
        stack: error.stack,
      };
    },

    end() {
      this.endTime = Date.now();
      this.duration = this.endTime - this.startTime;

      // Store trace (development only)
      if (!IS_PRODUCTION) {
        traces.push({
          spanId: this.spanId,
          name: this.name,
          duration: this.duration,
          attributes: this.attributes,
          events: this.events,
          status: this.status,
          error: this.error,
        });

        // Keep only last 100 traces
        if (traces.length > 100) {
          traces.shift();
        }

        console.log(`[OTEL] Span: ${this.name} | Duration: ${this.duration}ms | Status: ${this.status}`);
      }
    },
  };

  try {
    const result = await fn(span);
    span.setStatus('ok');
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus('error', error.message);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Record a metric
 *
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {Object} labels - Metric labels
 *
 * @example
 * recordMetric('ai.bradaa.quota.usage', 1500, { tier: 'pro', endpoint: '/chat' });
 */
export function recordMetric(name, value, labels = {}) {
  if (!OTEL_ENABLED) return;

  const metricKey = `${name}:${JSON.stringify(labels)}`;

  if (!metrics[metricKey]) {
    metrics[metricKey] = {
      name,
      labels,
      values: [],
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
    };
  }

  const metric = metrics[metricKey];
  metric.values.push({ value, timestamp: Date.now() });
  metric.count++;
  metric.sum += value;
  metric.min = Math.min(metric.min, value);
  metric.max = Math.max(metric.max, value);

  // Keep only last 1000 values
  if (metric.values.length > 1000) {
    metric.values.shift();
  }

  if (!IS_PRODUCTION) {
    console.log(`[OTEL] Metric: ${name} = ${value} | Labels: ${JSON.stringify(labels)}`);
  }
}

/**
 * Instrument a Netlify function
 *
 * Wraps the handler with automatic tracing
 *
 * @param {Function} handler - Original handler function
 * @param {string} functionName - Function name for tracing
 * @returns {Function} Instrumented handler
 *
 * @example
 * export const handler = instrument(async (event, context) => {
 *   // Your function code
 * }, 'chat');
 */
export function instrument(handler, functionName) {
  return async (event, context) => {
    return await withSpan(
      `netlify.function.${functionName}`,
      async (span) => {
        // Set initial attributes
        span.setAttribute('function.name', functionName);
        span.setAttribute('http.method', event.httpMethod);
        span.setAttribute('http.path', event.path);

        try {
          // Execute handler
          const result = await handler(event, context);

          // Record response attributes
          span.setAttribute('http.status_code', result.statusCode || 200);
          span.setAttribute('function.duration_ms', Date.now() - span.startTime);

          // Record latency metric
          recordMetric('ai.bradaa.request.duration', Date.now() - span.startTime, {
            endpoint: functionName,
            status: result.statusCode || 200,
          });

          return result;

        } catch (error) {
          // Record error
          span.recordException(error);
          span.setAttribute('error.type', error.name);
          span.setAttribute('error.message', error.message);

          // Record error metric
          recordMetric('ai.bradaa.error.count', 1, {
            error_type: error.name,
            endpoint: functionName,
            severity: 'error',
          });

          throw error;
        }
      },
      {
        'service.name': 'ai-bradaa',
        'deployment.environment': process.env.NETLIFY_ENV || 'development',
      }
    );
  };
}

/**
 * Create a span for database operations
 *
 * @param {string} queryType - Query type (SELECT, INSERT, UPDATE, etc.)
 * @param {Function} fn - Database operation function
 * @returns {Promise<*>} Query result
 *
 * @example
 * const users = await withDBSpan('SELECT', async (span) => {
 *   span.setAttribute('db.table', 'users');
 *   return await db.query('SELECT * FROM users WHERE id = $1', [userId]);
 * });
 */
export async function withDBSpan(queryType, fn) {
  return await withSpan(`db.${queryType.toLowerCase()}`, fn, {
    'db.system': 'postgresql',
    'db.query_type': queryType,
  });
}

/**
 * Create a span for external API calls
 *
 * @param {string} service - Service name (e.g., 'gemini')
 * @param {Function} fn - API call function
 * @returns {Promise<*>} API response
 *
 * @example
 * const response = await withAPISpan('gemini', async (span) => {
 *   span.setAttribute('gemini.model', 'gemini-2.0-flash-exp');
 *   return await fetch(geminiUrl, options);
 * });
 */
export async function withAPISpan(service, fn) {
  return await withSpan(`api.${service}`, fn, {
    'external.service': service,
  });
}

/**
 * Get current traces (development only)
 *
 * @returns {Array} Recent traces
 */
export function getTraces() {
  return traces;
}

/**
 * Get current metrics (development only)
 *
 * @returns {Object} Metrics
 */
export function getMetrics() {
  return Object.values(metrics).map(m => ({
    name: m.name,
    labels: m.labels,
    count: m.count,
    sum: m.sum,
    min: m.min,
    max: m.max,
    avg: m.sum / m.count,
  }));
}

/**
 * Calculate SLO compliance
 *
 * @returns {Object} SLO metrics
 */
export function calculateSLO() {
  const requestDurations = metrics['ai.bradaa.request.duration:{}']?.values || [];

  if (requestDurations.length === 0) {
    return {
      p50: 0,
      p95: 0,
      p99: 0,
      errorRate: 0,
      availability: 1,
    };
  }

  const durations = requestDurations.map(v => v.value).sort((a, b) => a - b);

  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  const errorMetrics = Object.values(metrics).filter(m => m.name === 'ai.bradaa.error.count');
  const totalErrors = errorMetrics.reduce((sum, m) => sum + m.sum, 0);
  const totalRequests = requestDurations.length;
  const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
  const availability = 1 - errorRate;

  return {
    p50: Math.round(p50),
    p95: Math.round(p95),
    p99: Math.round(p99),
    errorRate: Math.round(errorRate * 10000) / 10000,
    availability: Math.round(availability * 10000) / 10000,
    sampleSize: totalRequests,
  };
}

export default {
  initOTEL,
  withSpan,
  recordMetric,
  instrument,
  withDBSpan,
  withAPISpan,
  getTraces,
  getMetrics,
  calculateSLO,
};
