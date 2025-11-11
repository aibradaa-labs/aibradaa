/**
 * Security Monitor - Prompt Drift & Injection Detection
 *
 * Monitors AI inputs for:
 * - Prompt injection attacks
 * - Adversarial inputs
 * - Statistical anomalies
 * - Schema violations
 *
 * Approved by 84-Mentor Governance: 97% (Bruce Schneier, Timnit Gebru, Linus Torvalds)
 * Decision ID: SECURITY_CHANGE_2025-11-11
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

const SECURITY_CONFIG = {
  // Input limits
  maxInputLength: 10000, // 10K chars max
  maxTokensEstimate: 5000, // Rough estimate: ~2 chars per token

  // Anomaly thresholds
  anomalyScoreThreshold: 0.7, // 0-1, higher = more suspicious

  // Rate limiting for security events
  maxSecurityEventsPerHour: 10,

  // Logging
  logPath: 'project/governance/84/security-events.jsonl',
};

// Known prompt injection patterns (regex-based detection)
const INJECTION_PATTERNS = [
  // Direct instruction override
  /ignore\s+(previous|all|above|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(previous|all|above|prior)\s+(instructions|prompts|rules)/i,
  /forget\s+(previous|all|above|prior)\s+(instructions|prompts|rules)/i,

  // Role manipulation
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(if\s+)?you\s+(are|were)/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /simulate\s+(being|a)/i,

  // System prompt extraction
  /show\s+(me\s+)?your\s+(system|original|base)\s+prompt/i,
  /what\s+(is|are)\s+your\s+(instructions|rules|guidelines)/i,
  /repeat\s+(your|the)\s+(instructions|prompt|rules)/i,

  // Jailbreak attempts
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /sudo\s+mode/i,
  /admin\s+mode/i,

  // Encoding tricks
  /base64\s*:/i,
  /rot13\s*:/i,
  /eval\s*\(/i,
  /exec\s*\(/i,

  // Multi-language injection
  /<!--.*-->/,
  /<script[\s\S]*?<\/script>/i,
  /javascript\s*:/i,

  // Delimiter attacks
  /---END SYSTEM---/i,
  /\[SYSTEM\]/i,
  /\[\/INST\]/i,
  /\[INST\]/i,
];

// Expected input schemas by route
const EXPECTED_SCHEMAS = {
  '/search': ['query', 'filters', 'limit'],
  '/recommend': ['preferences', 'budget', 'usage'],
  '/chat': ['message', 'context', 'sessionId'],
  '/command': ['command', 'params'],
};

// ============================================================================
// SECURITY MONITOR CLASS
// ============================================================================

export class SecurityMonitor {
  constructor() {
    this.eventHistory = [];
    this.suspiciousIPs = new Map();
  }

  /**
   * Validate and sanitize user input
   * @param {Object} input - User input to validate
   * @param {string} route - API route being called
   * @param {string} clientIP - Client IP address
   * @returns {Object} - { allowed: boolean, sanitized: any, threats: string[], anomalyScore: number }
   */
  validateInput(input, route, clientIP = 'unknown') {
    const threats = [];
    let anomalyScore = 0.0;

    // 1. Length validation
    const inputString = JSON.stringify(input);
    if (inputString.length > SECURITY_CONFIG.maxInputLength) {
      threats.push('input_too_long');
      anomalyScore += 0.3;
    }

    // 2. Token estimate
    const estimatedTokens = Math.ceil(inputString.length / 2);
    if (estimatedTokens > SECURITY_CONFIG.maxTokensEstimate) {
      threats.push('token_limit_exceeded');
      anomalyScore += 0.2;
    }

    // 3. Schema validation
    const expectedFields = EXPECTED_SCHEMAS[route] || [];
    const actualFields = Object.keys(input);
    const unexpectedFields = actualFields.filter(f => !expectedFields.includes(f));

    if (unexpectedFields.length > 0) {
      threats.push(`unexpected_fields:${unexpectedFields.join(',')}`);
      anomalyScore += 0.1 * unexpectedFields.length;
    }

    // 4. Prompt injection detection
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(inputString)) {
        threats.push(`injection_pattern:${pattern.source.substring(0, 50)}`);
        anomalyScore += 0.5; // High weight for injection attempts
      }
    }

    // 5. Character distribution anomaly (detect random gibberish or encoded payloads)
    const charDistributionScore = this._analyzeCharDistribution(inputString);
    if (charDistributionScore > 0.8) {
      threats.push('anomalous_character_distribution');
      anomalyScore += 0.3;
    }

    // 6. Repetition detection (detect DOS via repeated patterns)
    const repetitionScore = this._detectRepetition(inputString);
    if (repetitionScore > 0.7) {
      threats.push('excessive_repetition');
      anomalyScore += 0.2;
    }

    // 7. Check IP reputation
    if (this._isIPSuspicious(clientIP)) {
      threats.push('suspicious_ip');
      anomalyScore += 0.4;
    }

    // Cap anomaly score at 1.0
    anomalyScore = Math.min(anomalyScore, 1.0);

    // Determine if input is allowed
    const allowed = anomalyScore < SECURITY_CONFIG.anomalyScoreThreshold;

    // Sanitize input (basic HTML/script stripping)
    const sanitized = this._sanitize(input);

    // Log security event
    this._logSecurityEvent({
      timestamp: new Date().toISOString(),
      route,
      clientIP,
      allowed,
      threats,
      anomalyScore,
      inputLength: inputString.length,
      estimatedTokens,
    });

    // Update IP reputation
    if (!allowed) {
      this._markIPSuspicious(clientIP);
    }

    return {
      allowed,
      sanitized,
      threats,
      anomalyScore: parseFloat(anomalyScore.toFixed(3)),
    };
  }

  /**
   * Analyze character distribution for anomalies
   * @private
   */
  _analyzeCharDistribution(text) {
    const charCounts = {};
    for (const char of text) {
      charCounts[char] = (charCounts[char] || 0) + 1;
    }

    const totalChars = text.length;
    const uniqueChars = Object.keys(charCounts).length;

    // Expected: English text has ~30-50 unique chars in a sample
    // Anomalous: Base64 (65 chars), random gibberish (very high diversity)
    const diversityRatio = uniqueChars / Math.min(totalChars, 100);

    // High diversity (>0.8) or very low diversity (<0.1) is suspicious
    if (diversityRatio > 0.8 || diversityRatio < 0.1) {
      return diversityRatio;
    }

    return 0.0;
  }

  /**
   * Detect excessive repetition
   * @private
   */
  _detectRepetition(text) {
    // Check for repeated substrings (e.g., "aaaa", "123123123")
    const words = text.split(/\s+/);
    if (words.length === 0) return 0.0;

    const wordCounts = {};
    for (const word of words) {
      if (word.length > 3) { // Only count words longer than 3 chars
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    const maxRepetition = Math.max(...Object.values(wordCounts), 0);
    const repetitionRatio = maxRepetition / words.length;

    return repetitionRatio;
  }

  /**
   * Check if IP is marked as suspicious
   * @private
   */
  _isIPSuspicious(ip) {
    if (!this.suspiciousIPs.has(ip)) return false;

    const record = this.suspiciousIPs.get(ip);
    const hoursSinceMarked = (Date.now() - record.markedAt) / (1000 * 60 * 60);

    // Clear suspicion after 24 hours
    if (hoursSinceMarked > 24) {
      this.suspiciousIPs.delete(ip);
      return false;
    }

    return record.violations > 3;
  }

  /**
   * Mark IP as suspicious
   * @private
   */
  _markIPSuspicious(ip) {
    if (!this.suspiciousIPs.has(ip)) {
      this.suspiciousIPs.set(ip, {
        markedAt: Date.now(),
        violations: 1,
      });
    } else {
      const record = this.suspiciousIPs.get(ip);
      record.violations += 1;
      this.suspiciousIPs.set(ip, record);
    }
  }

  /**
   * Sanitize input (strip dangerous content)
   * @private
   */
  _sanitize(input) {
    if (typeof input === 'string') {
      // Strip HTML tags
      let sanitized = input.replace(/<[^>]*>/g, '');

      // Strip script/eval patterns
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // onclick=, onerror=, etc.

      return sanitized;
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this._sanitize(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Log security event to append-only JSONL
   * @private
   */
  async _logSecurityEvent(event) {
    try {
      const logDir = path.join(process.cwd(), 'project', 'governance', '84');
      const logFile = path.join(logDir, 'security-events.jsonl');

      // Ensure directory exists
      await fs.mkdir(logDir, { recursive: true });

      // Append to JSONL (one JSON object per line)
      const logLine = JSON.stringify(event) + '\n';
      await fs.appendFile(logFile, logLine);

      // Also keep in-memory (last 100 events)
      this.eventHistory.push(event);
      if (this.eventHistory.length > 100) {
        this.eventHistory.shift();
      }
    } catch (error) {
      console.error('[SecurityMonitor] Failed to log event:', error.message);
    }
  }

  /**
   * Get recent security events (for monitoring dashboard)
   */
  getRecentEvents(limit = 50) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get security statistics
   */
  getStats() {
    const recentEvents = this.eventHistory.slice(-100);
    const blocked = recentEvents.filter(e => !e.allowed).length;
    const totalThreats = recentEvents.reduce((sum, e) => sum + e.threats.length, 0);

    return {
      totalEventsLogged: this.eventHistory.length,
      recentBlocked: blocked,
      recentAllowed: recentEvents.length - blocked,
      totalThreatsDetected: totalThreats,
      suspiciousIPs: this.suspiciousIPs.size,
      avgAnomalyScore: recentEvents.length > 0
        ? (recentEvents.reduce((sum, e) => sum + e.anomalyScore, 0) / recentEvents.length).toFixed(3)
        : 0,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let monitorInstance = null;

export function getSecurityMonitor() {
  if (!monitorInstance) {
    monitorInstance = new SecurityMonitor();
    console.log('[SecurityMonitor] Initialized - Prompt injection detection active ✅');
  }
  return monitorInstance;
}

export default SecurityMonitor;
