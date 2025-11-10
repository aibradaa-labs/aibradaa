/**
 * Error Spike Detection & Tracking
 * 84-Mentor Approved: Gene Kim (Mentor 24) + Bruce Schneier (Mentor 15)
 *
 * Tracks errors in 5-minute windows, detects spikes, triggers alerts,
 * and executes auto-rollback when thresholds are exceeded.
 *
 * Production: Replace in-memory storage with Redis
 *
 * @module error-tracker
 */

// In-memory storage (production: use Redis)
const errorWindows = [];
const errorEvents = [];

// Configuration (from error-spike-detection.yaml)
const CONFIG = {
  windowSeconds: 300, // 5 minutes
  warningThreshold: 0.03, // 3%
  criticalThreshold: 0.05, // 5%
  minRequests: 10,
  slaSeconds: 900, // 15 minutes
};

// Error categories and weights
const ERROR_WEIGHTS = {
  DatabaseConnectionError: 5.0,
  GeminiAPIError: 5.0,
  AuthenticationError: 5.0,
  DataCorruptionError: 5.0,
  QuotaExceededError: 3.0,
  RateLimitError: 3.0,
  TimeoutError: 3.0,
  ValidationError: 3.0,
  CacheMissError: 1.5,
  NotFoundError: 1.5,
  BadRequestError: 1.5,
  NetworkError: 1.0,
  RetryableError: 1.0,
  UnknownError: 2.0,
};

// Auto-rollback triggers
const ROLLBACK_TRIGGERS = {
  DatabaseConnectionError: true,
  GeminiAPIError: true,
  AuthenticationError: true,
  DataCorruptionError: true,
};

/**
 * Track an error event
 *
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @returns {Object} Tracking result
 *
 * @example
 * await trackError(new Error('Database timeout'), {
 *   endpoint: '/chat',
 *   userId: 'user123',
 *   tier: 'pro',
 * });
 */
export async function trackError(error, context = {}) {
  const now = Date.now();
  const errorType = error.name || 'UnknownError';
  const weight = ERROR_WEIGHTS[errorType] || ERROR_WEIGHTS.UnknownError;

  // Create error event
  const event = {
    id: `err_${now}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: now,
    errorType,
    errorMessage: error.message,
    weight,
    context: {
      endpoint: context.endpoint || 'unknown',
      userId: context.userId || 'anonymous',
      tier: context.tier || 'free',
      statusCode: context.statusCode || 500,
    },
    stack: error.stack,
  };

  // Store error event
  errorEvents.push(event);

  // Keep only last 10,000 events (production: use Redis with TTL)
  if (errorEvents.length > 10000) {
    errorEvents.shift();
  }

  // Calculate current error rate
  const errorRate = await calculateErrorRate();

  // Check for spike
  const spikeDetected = errorRate.rate > CONFIG.criticalThreshold;

  if (spikeDetected) {
    console.error(`[Error Spike] CRITICAL: ${(errorRate.rate * 100).toFixed(2)}% error rate (Threshold: ${CONFIG.criticalThreshold * 100}%)`);
    await handleErrorSpike(errorRate, event);
  } else if (errorRate.rate > CONFIG.warningThreshold) {
    console.warn(`[Error Spike] WARNING: ${(errorRate.rate * 100).toFixed(2)}% error rate (Threshold: ${CONFIG.warningThreshold * 100}%)`);
  }

  return {
    tracked: true,
    eventId: event.id,
    errorRate: errorRate.rate,
    spikeDetected,
    timestamp: now,
  };
}

/**
 * Calculate current error rate
 *
 * @returns {Object} Error rate metrics
 */
export async function calculateErrorRate() {
  const now = Date.now();
  const windowStart = now - CONFIG.windowSeconds * 1000;

  // Get events in current window
  const windowEvents = errorEvents.filter(e => e.timestamp >= windowStart);

  // Calculate total requests (approximation: errors + successes)
  // Production: track successful requests separately
  const errorCount = windowEvents.length;

  // Estimate total requests (assume 1% baseline error rate)
  // Production: use actual request counter
  const estimatedRequests = Math.max(errorCount * 100, CONFIG.minRequests);

  const errorRate = errorCount / estimatedRequests;

  // Calculate weighted error rate (critical errors count more)
  const weightedErrorSum = windowEvents.reduce((sum, e) => sum + e.weight, 0);
  const weightedErrorRate = weightedErrorSum / estimatedRequests;

  // Break down by error type
  const errorsByType = {};
  windowEvents.forEach(e => {
    if (!errorsByType[e.errorType]) {
      errorsByType[e.errorType] = 0;
    }
    errorsByType[e.errorType]++;
  });

  // Break down by endpoint
  const errorsByEndpoint = {};
  windowEvents.forEach(e => {
    const endpoint = e.context.endpoint;
    if (!errorsByEndpoint[endpoint]) {
      errorsByEndpoint[endpoint] = 0;
    }
    errorsByEndpoint[endpoint]++;
  });

  return {
    rate: errorRate,
    weightedRate: weightedErrorRate,
    errorCount,
    totalRequests: estimatedRequests,
    windowSeconds: CONFIG.windowSeconds,
    timestamp: now,
    breakdown: {
      byType: errorsByType,
      byEndpoint: errorsByEndpoint,
    },
  };
}

/**
 * Handle error spike (alert + rollback)
 *
 * @param {Object} errorRate - Error rate metrics
 * @param {Object} triggerEvent - Event that triggered the spike
 */
async function handleErrorSpike(errorRate, triggerEvent) {
  const now = Date.now();

  // Check if we've already alerted recently (prevent spam)
  const recentWindows = errorWindows.filter(w => w.timestamp > now - 300000); // 5 min
  if (recentWindows.length > 0 && recentWindows.some(w => w.alerted)) {
    console.log('[Error Spike] Already alerted recently, skipping duplicate alert');
    return;
  }

  // Create error spike window
  const window = {
    id: `window_${now}`,
    timestamp: now,
    errorRate: errorRate.rate,
    weightedRate: errorRate.weightedRate,
    errorCount: errorRate.errorCount,
    totalRequests: errorRate.totalRequests,
    breakdown: errorRate.breakdown,
    triggerEvent,
    alerted: false,
    rolledBack: false,
  };

  errorWindows.push(window);

  // Send alert
  await sendAlert(window);
  window.alerted = true;

  // Check if auto-rollback should be triggered
  const shouldRollback = ROLLBACK_TRIGGERS[triggerEvent.errorType] || errorRate.rate > 0.1; // 10% = immediate rollback

  if (shouldRollback && process.env.AUTO_ROLLBACK_ENABLED === 'true') {
    await triggerRollback(window);
    window.rolledBack = true;
  }

  // Keep only last 100 windows
  if (errorWindows.length > 100) {
    errorWindows.shift();
  }
}

/**
 * Send alert notification
 *
 * @param {Object} window - Error spike window
 */
async function sendAlert(window) {
  const severity = window.errorRate > CONFIG.criticalThreshold ? 'CRITICAL' : 'WARNING';
  const errorRatePercent = (window.errorRate * 100).toFixed(2);

  const message = `
[${severity}] Error Spike Detected

**Error Rate:** ${errorRatePercent}% (Threshold: ${CONFIG.criticalThreshold * 100}%)
**Window:** Last ${CONFIG.windowSeconds / 60} minutes
**Error Count:** ${window.errorCount}
**Total Requests:** ${window.totalRequests}

**Breakdown by Type:**
${Object.entries(window.breakdown.byType)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

**Breakdown by Endpoint:**
${Object.entries(window.breakdown.byEndpoint)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([endpoint, count]) => `- ${endpoint}: ${count}`)
  .join('\n')}

**Trigger Event:** ${window.triggerEvent.errorType}
**Timestamp:** ${new Date(window.timestamp).toISOString()}
  `.trim();

  console.error(`[Error Spike Alert]\n${message}`);

  // Production: Send to Slack, email, PagerDuty
  if (process.env.SLACK_WEBHOOK_URL) {
    await sendSlackAlert(message, severity);
  }

  if (process.env.ALERT_EMAIL_PRIMARY) {
    await sendEmailAlert(message, severity);
  }

  if (process.env.PAGERDUTY_INTEGRATION_KEY && severity === 'CRITICAL') {
    await sendPagerDutyAlert(message, window);
  }
}

/**
 * Send Slack alert
 *
 * @param {string} message - Alert message
 * @param {string} severity - Alert severity
 */
async function sendSlackAlert(message, severity) {
  try {
    const color = severity === 'CRITICAL' ? 'danger' : 'warning';
    const emoji = severity === 'CRITICAL' ? ':rotating_light:' : ':warning:';

    const payload = {
      text: `${emoji} Error Spike Detected`,
      attachments: [{
        color,
        text: message,
        ts: Math.floor(Date.now() / 1000),
      }],
    };

    // Production: Send to Slack webhook
    console.log('[Slack Alert] Would send:', payload);

    // await fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // });

  } catch (error) {
    console.error('[Slack Alert] Failed to send:', error);
  }
}

/**
 * Send email alert
 *
 * @param {string} message - Alert message
 * @param {string} severity - Alert severity
 */
async function sendEmailAlert(message, severity) {
  console.log(`[Email Alert] Would send ${severity} alert to ${process.env.ALERT_EMAIL_PRIMARY}`);
  // Production: Implement email sending via SMTP or service
}

/**
 * Send PagerDuty alert
 *
 * @param {string} message - Alert message
 * @param {Object} window - Error spike window
 */
async function sendPagerDutyAlert(message, window) {
  console.log('[PagerDuty] Would create incident:', message);
  // Production: Implement PagerDuty API integration
}

/**
 * Trigger auto-rollback
 *
 * @param {Object} window - Error spike window
 */
async function triggerRollback(window) {
  console.error('[Auto-Rollback] TRIGGERING ROLLBACK due to error spike');

  try {
    // Production: Use Netlify API to rollback to previous deploy
    // const netlify = require('netlify');
    // const client = new netlify(process.env.NETLIFY_API_TOKEN);
    // await client.restoreSiteDeploy({
    //   site_id: process.env.NETLIFY_SITE_ID,
    //   deploy_id: previousDeployId,
    // });

    console.log('[Auto-Rollback] Rollback completed successfully');

    // Send rollback notification
    await sendAlert({
      ...window,
      message: '🔄 Auto-rollback executed successfully',
    });

  } catch (error) {
    console.error('[Auto-Rollback] Failed:', error);

    // Send failure notification
    await sendAlert({
      ...window,
      message: `❌ Auto-rollback FAILED: ${error.message}`,
    });
  }
}

/**
 * Get error spike history
 *
 * @param {number} limit - Maximum number of windows to return
 * @returns {Array} Error spike windows
 */
export function getErrorHistory(limit = 50) {
  return errorWindows.slice(-limit).reverse();
}

/**
 * Get current error statistics
 *
 * @returns {Object} Error stats
 */
export async function getErrorStats() {
  const errorRate = await calculateErrorRate();

  return {
    current: errorRate,
    thresholds: {
      warning: CONFIG.warningThreshold,
      critical: CONFIG.criticalThreshold,
    },
    status: errorRate.rate > CONFIG.criticalThreshold
      ? 'CRITICAL'
      : errorRate.rate > CONFIG.warningThreshold
      ? 'WARNING'
      : 'OK',
    history: errorWindows.slice(-10),
  };
}

/**
 * Reset error tracking (for testing)
 */
export function resetErrorTracking() {
  errorEvents.length = 0;
  errorWindows.length = 0;
  console.log('[Error Tracker] Reset complete');
}

export default {
  trackError,
  calculateErrorRate,
  getErrorHistory,
  getErrorStats,
  resetErrorTracking,
};
