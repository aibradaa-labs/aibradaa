/**
 * Health Check Netlify Function
 * Handles: /api/health, /api/health/detailed, /api/health/ready, /api/health/live, etc.
 */

import { successResponse, errorResponse, handleOptions } from './utils/response.mjs';

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if Gemini API is configured
 */
function checkGeminiService() {
  return {
    configured: !!process.env.GEMINI_API_KEY,
    status: process.env.GEMINI_API_KEY ? 'available' : 'not_configured'
  };
}

/**
 * Check if email service is configured
 */
function checkEmailService() {
  const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

  return {
    configured,
    status: configured ? 'available' : 'not_configured'
  };
}

/**
 * Basic health check
 */
function basicHealth() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  };
}

/**
 * Detailed health check
 */
function detailedHealth() {
  const memoryUsage = process.memoryUsage();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'production'
    },
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external),
      heapUsedPercent: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2) + '%'
    },
    services: {
      gemini: checkGeminiService(),
      database: 'IndexedDB (client-side)',
      email: checkEmailService()
    }
  };

  // Determine overall health status
  if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
    health.status = 'degraded';
    health.warnings = ['High memory usage'];
  }

  return health;
}

/**
 * Readiness check (for load balancers)
 */
function readinessCheck() {
  const ready = {
    geminiApi: !!process.env.GEMINI_API_KEY,
    smtpConfigured: !!process.env.SMTP_HOST,
    jwtSecret: !!process.env.JWT_SECRET
  };

  const isReady = Object.values(ready).every(v => v);

  return {
    status: isReady ? 'ready' : 'not_ready',
    checks: ready,
    timestamp: new Date().toISOString(),
    statusCode: isReady ? 200 : 503
  };
}

/**
 * Liveness check
 */
function livenessCheck() {
  return {
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid
  };
}

/**
 * Metrics endpoint
 */
function metricsCheck() {
  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    process: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };
}

/**
 * Version info
 */
function versionInfo() {
  return {
    version: process.env.npm_package_version || '2.0.0',
    buildDate: process.env.BUILD_DATE || new Date().toISOString(),
    commit: process.env.GIT_COMMIT || 'development',
    environment: process.env.NODE_ENV || 'production'
  };
}

/**
 * Main handler
 */
export async function handler(event, context) {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Route based on path
    const path = event.path.replace(/^\/\.netlify\/functions\/health/, '');

    switch (path) {
      case '':
      case '/':
        return successResponse(basicHealth());

      case '/detailed':
        return successResponse(detailedHealth());

      case '/ready':
        const ready = readinessCheck();
        return successResponse(ready, ready.statusCode);

      case '/live':
        return successResponse(livenessCheck());

      case '/metrics':
        return successResponse(metricsCheck());

      case '/version':
        return successResponse(versionInfo());

      default:
        return errorResponse('Health endpoint not found', 404);
    }
  } catch (error) {
    console.error('Health check error:', error);
    return errorResponse(
      'Health check failed',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
