/**
 * Analytics & Tracking Utilities
 * Privacy-first analytics without third-party trackers
 */

/**
 * Simple event tracker
 * Tracks events locally without sending to external services
 */
export class EventTracker {
  constructor(options = {}) {
    this.options = {
      storageKey: 'ai_bradaa_analytics',
      maxEvents: 1000,
      ...options
    };

    this.events = this.loadEvents();
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  /**
   * Track an event
   */
  track(eventName, properties = {}) {
    const event = {
      id: this.generateEventId(),
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.options.maxEvents) {
      this.events = this.events.slice(-this.options.maxEvents);
    }

    this.saveEvents();

    // Dispatch custom event for listeners
    window.dispatchEvent(new CustomEvent('analytics-event', { detail: event }));

    return event;
  }

  /**
   * Track page view
   */
  pageView(path = window.location.pathname) {
    return this.track('page_view', {
      path,
      referrer: document.referrer,
      title: document.title
    });
  }

  /**
   * Track user interaction
   */
  interaction(element, action) {
    return this.track('interaction', {
      element: element.tagName,
      action,
      text: element.textContent?.substring(0, 50),
      id: element.id,
      class: element.className
    });
  }

  /**
   * Track search query
   */
  search(query, resultCount) {
    return this.track('search', {
      query,
      resultCount,
      length: query.length
    });
  }

  /**
   * Track laptop view
   */
  laptopView(laptopId, laptop) {
    return this.track('laptop_view', {
      laptopId,
      brand: laptop.brand,
      model: laptop.model,
      price: laptop.price_MYR,
      score: laptop.score_composite
    });
  }

  /**
   * Track recommendation request
   */
  recommendationRequest(filters) {
    return this.track('recommendation_request', filters);
  }

  /**
   * Track comparison
   */
  comparison(laptopIds) {
    return this.track('comparison', {
      laptopCount: laptopIds.length,
      laptopIds
    });
  }

  /**
   * Track error
   */
  error(error, context = {}) {
    return this.track('error', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  /**
   * Track performance metric
   */
  performance(metric, value) {
    return this.track('performance', {
      metric,
      value,
      unit: 'ms'
    });
  }

  /**
   * Get all events
   */
  getEvents(filter = {}) {
    let filtered = [...this.events];

    if (filter.name) {
      filtered = filtered.filter(e => e.name === filter.name);
    }

    if (filter.sessionId) {
      filtered = filtered.filter(e => e.sessionId === filter.sessionId);
    }

    if (filter.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filter.startDate);
    }

    if (filter.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filter.endDate);
    }

    return filtered;
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const sessionEvents = this.getEvents({ sessionId: this.sessionId });
    const duration = Date.now() - this.sessionStart;

    const eventCounts = sessionEvents.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {});

    const pages = [...new Set(sessionEvents.map(e => e.page))];

    return {
      sessionId: this.sessionId,
      duration,
      eventCount: sessionEvents.length,
      eventCounts,
      pages,
      startTime: this.sessionStart,
      endTime: Date.now()
    };
  }

  /**
   * Export analytics data
   */
  export(format = 'json') {
    const data = {
      exportDate: new Date().toISOString(),
      sessionStats: this.getSessionStats(),
      events: this.events
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'csv') {
      return this.convertToCSV(this.events);
    }

    return data;
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = [];
    this.saveEvents();
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate event ID
   */
  generateEventId() {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load events from storage
   */
  loadEvents() {
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load analytics:', error);
      return [];
    }
  }

  /**
   * Save events to storage
   */
  saveEvents() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  /**
   * Convert events to CSV
   */
  convertToCSV(events) {
    if (events.length === 0) return '';

    const headers = ['id', 'name', 'timestamp', 'sessionId', 'page'];
    const rows = events.map(event => [
      event.id,
      event.name,
      new Date(event.timestamp).toISOString(),
      event.sessionId,
      event.page
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}

/**
 * Funnel tracker - track user journey through steps
 */
export class FunnelTracker {
  constructor(name, steps) {
    this.name = name;
    this.steps = steps;
    this.currentStepIndex = 0;
    this.startTime = Date.now();
    this.stepTimings = [];
  }

  /**
   * Move to next step
   */
  nextStep(data = {}) {
    const stepTime = Date.now();
    const duration = stepTime - (this.stepTimings[this.stepTimings.length - 1]?.timestamp || this.startTime);

    this.stepTimings.push({
      step: this.steps[this.currentStepIndex],
      timestamp: stepTime,
      duration,
      data
    });

    this.currentStepIndex++;

    if (analytics) {
      analytics.track('funnel_step', {
        funnel: this.name,
        step: this.steps[this.currentStepIndex - 1],
        stepIndex: this.currentStepIndex - 1,
        duration
      });
    }

    return this.currentStepIndex < this.steps.length;
  }

  /**
   * Complete funnel
   */
  complete(data = {}) {
    const totalDuration = Date.now() - this.startTime;

    if (analytics) {
      analytics.track('funnel_complete', {
        funnel: this.name,
        totalDuration,
        stepCount: this.steps.length,
        data
      });
    }

    return {
      funnel: this.name,
      completed: true,
      totalDuration,
      stepTimings: this.stepTimings
    };
  }

  /**
   * Abandon funnel
   */
  abandon(reason = '') {
    if (analytics) {
      analytics.track('funnel_abandon', {
        funnel: this.name,
        abandonedAt: this.steps[this.currentStepIndex],
        stepIndex: this.currentStepIndex,
        reason
      });
    }
  }
}

/**
 * A/B test tracker
 */
export class ABTestTracker {
  constructor() {
    this.tests = new Map();
  }

  /**
   * Assign user to variant
   */
  assignVariant(testName, variants) {
    const stored = localStorage.getItem(`ab_test_${testName}`);

    if (stored) {
      return stored;
    }

    // Random assignment
    const variant = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(`ab_test_${testName}`, variant);

    if (analytics) {
      analytics.track('ab_test_assigned', {
        test: testName,
        variant
      });
    }

    return variant;
  }

  /**
   * Track conversion
   */
  conversion(testName, metric = 'default') {
    const variant = localStorage.getItem(`ab_test_${testName}`);

    if (!variant) return;

    if (analytics) {
      analytics.track('ab_test_conversion', {
        test: testName,
        variant,
        metric
      });
    }
  }
}

// Global analytics instance
export let analytics = null;

/**
 * Initialize analytics
 */
export function initAnalytics(options = {}) {
  analytics = new EventTracker(options);

  // Auto-track page views
  if (options.autoPageViews !== false) {
    analytics.pageView();

    // Track navigation
    window.addEventListener('popstate', () => {
      analytics.pageView();
    });
  }

  // Auto-track clicks
  if (options.autoClicks !== false) {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (target) {
        analytics.interaction(target, 'click');
      }
    });
  }

  // Track errors
  if (options.autoErrors !== false) {
    window.addEventListener('error', (e) => {
      analytics.error(e.error, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      analytics.error(new Error(e.reason), {
        type: 'unhandledRejection'
      });
    });
  }

  return analytics;
}

/**
 * Get analytics instance
 */
export function getAnalytics() {
  return analytics;
}

export default {
  EventTracker,
  FunnelTracker,
  ABTestTracker,
  initAnalytics,
  getAnalytics
};
