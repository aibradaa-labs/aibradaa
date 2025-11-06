/**
 * Health Check Routes
 * System health and status monitoring endpoints
 */

import express from 'express';
import { getRateLimitStats } from '../middleware/rateLimiter.mjs';
import { metrics } from '../middleware/logger.mjs';

const router = express.Router();

/**
 * Basic health check
 * GET /api/health
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Detailed health check
 * GET /api/health/detailed
 */
router.get('/detailed', (req, res) => {
  const memoryUsage = process.memoryUsage();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    },
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external),
      heapUsedPercent: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2) + '%'
    },
    api: {
      rateLimiter: getRateLimitStats(),
      metrics: metrics.getMetrics()
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

  res.json(health);
});

/**
 * Readiness check (for load balancers)
 * GET /api/health/ready
 */
router.get('/ready', (req, res) => {
  // Check if all required services are available
  const ready = {
    geminiApi: !!process.env.GEMINI_API_KEY,
    smtpConfigured: !!process.env.SMTP_HOST,
    jwtSecret: !!process.env.JWT_SECRET
  };

  const isReady = Object.values(ready).every(v => v);

  if (isReady) {
    res.json({
      status: 'ready',
      checks: ready,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      checks: ready,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness check (for container orchestration)
 * GET /api/health/live
 */
router.get('/live', (req, res) => {
  // Simple check - if this responds, the process is alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

/**
 * Metrics endpoint (for monitoring)
 * GET /api/health/metrics
 */
router.get('/metrics', (req, res) => {
  const apiMetrics = metrics.getMetrics();

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    api: apiMetrics,
    process: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  });
});

/**
 * Version info
 * GET /api/health/version
 */
router.get('/version', (req, res) => {
  // Read from package.json
  const version = process.env.npm_package_version || '1.0.0';

  res.json({
    version,
    buildDate: process.env.BUILD_DATE || 'development',
    commit: process.env.GIT_COMMIT || 'development',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Helper: Check if Gemini API is configured
 */
function checkGeminiService() {
  return {
    configured: !!process.env.GEMINI_API_KEY,
    status: process.env.GEMINI_API_KEY ? 'available' : 'not_configured'
  };
}

/**
 * Helper: Check if email service is configured
 */
function checkEmailService() {
  const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

  return {
    configured,
    status: configured ? 'available' : 'not_configured'
  };
}

/**
 * Helper: Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
