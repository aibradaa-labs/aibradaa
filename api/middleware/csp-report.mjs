/**
 * CSP Report Middleware
 * Handles Content Security Policy violation reports
 */

import { config } from '../config.mjs';

/**
 * In-memory store for CSP violations
 * In production, send to logging service
 */
const violations = [];
const MAX_VIOLATIONS = 1000;

/**
 * CSP Report Handler
 * Receives and logs CSP violation reports
 */
export function cspReportMiddleware(req, res) {
  try {
    const report = req.body;

    // Validate report structure
    if (!report || !report['csp-report']) {
      return res.status(400).json({ error: 'Invalid CSP report format' });
    }

    const violation = report['csp-report'];

    // Log violation
    const violationEntry = {
      timestamp: new Date().toISOString(),
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      effectiveDirective: violation['effective-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      statusCode: violation['status-code'],
      userAgent: req.get('user-agent'),
    };

    // Store violation
    violations.push(violationEntry);

    // Keep only last MAX_VIOLATIONS
    if (violations.length > MAX_VIOLATIONS) {
      violations.shift();
    }

    // Log to console in development
    if (config.env === 'development') {
      console.warn('🚨 CSP Violation:', violationEntry);
    }

    // In production, send to logging service
    if (config.env === 'production') {
      // TODO: Send to logging service (e.g., Sentry, LogRocket)
      console.error('CSP Violation:', JSON.stringify(violationEntry));
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error processing CSP report:', error);
    res.status(500).json({ error: 'Failed to process CSP report' });
  }
}

/**
 * Get CSP violations
 * Used by /api/metrics endpoint or admin dashboard
 */
export function getViolations(limit = 100) {
  return violations.slice(-limit).reverse();
}

/**
 * Get violation summary
 */
export function getViolationSummary() {
  const summary = {
    total: violations.length,
    byDirective: {},
    byBlockedUri: {},
    last24h: 0,
  };

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  violations.forEach((v) => {
    // Count by directive
    const directive = v.violatedDirective || 'unknown';
    summary.byDirective[directive] = (summary.byDirective[directive] || 0) + 1;

    // Count by blocked URI
    const uri = v.blockedUri || 'unknown';
    summary.byBlockedUri[uri] = (summary.byBlockedUri[uri] || 0) + 1;

    // Count last 24h
    if (new Date(v.timestamp).getTime() > oneDayAgo) {
      summary.last24h++;
    }
  });

  return summary;
}

/**
 * Clear violations (for testing/admin)
 */
export function clearViolations() {
  violations.length = 0;
}

export default cspReportMiddleware;
