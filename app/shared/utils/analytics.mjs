/**
 * Analytics
 * Track user events and behavior (privacy-conscious)
 */

import { storage } from './storage.mjs';

/**
 * Analytics tracker
 */
export class Analytics {
  constructor() {
    this.enabled = true;
    this.sessionId = this.generateSessionId();
    this.events = [];
    this.maxEventsInMemory = 100;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track event
   */
  track(eventName, properties = {}) {
    if (!this.enabled) return;

    const event = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Store in memory
    this.events.push(event);

    // Trim if too many
    if (this.events.length > this.maxEventsInMemory) {
      this.events.shift();
    }

    // Store in IndexedDB for persistence
    this.persistEvent(event);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, properties);
    }
  }

  /**
   * Persist event to storage
   */
  async persistEvent(event) {
    try {
      await storage.put('history', {
        action: 'analytics-event',
        data: event,
        timestamp: event.timestamp,
      });
    } catch (error) {
      console.error('Failed to persist analytics event:', error);
    }
  }

  /**
   * Track page view
   */
  pageView(path, title) {
    this.track('page_view', {
      path: path || window.location.pathname,
      title: title || document.title,
    });
  }

  /**
   * Track button click
   */
  click(buttonName, properties = {}) {
    this.track('click', {
      button: buttonName,
      ...properties,
    });
  }

  /**
   * Track form submission
   */
  formSubmit(formName, properties = {}) {
    this.track('form_submit', {
      form: formName,
      ...properties,
    });
  }

  /**
   * Track search
   */
  search(query, resultCount = null) {
    this.track('search', {
      query,
      resultCount,
    });
  }

  /**
   * Track laptop view
   */
  laptopView(laptopId, laptopName) {
    this.track('laptop_view', {
      laptopId,
      laptopName,
    });
  }

  /**
   * Track comparison
   */
  comparison(laptopIds) {
    this.track('comparison', {
      laptopIds,
      count: laptopIds.length,
    });
  }

  /**
   * Track recommendation
   */
  recommendation(laptopIds, source) {
    this.track('recommendation', {
      laptopIds,
      count: laptopIds.length,
      source,
    });
  }

  /**
   * Track affiliate click
   */
  affiliateClick(laptopId, platform) {
    this.track('affiliate_click', {
      laptopId,
      platform,
    });
  }

  /**
   * Track error
   */
  error(errorMessage, errorType, context = {}) {
    this.track('error', {
      message: errorMessage,
      type: errorType,
      ...context,
    });
  }

  /**
   * Track timing (performance)
   */
  timing(category, variable, timeMs) {
    this.track('timing', {
      category,
      variable,
      time: timeMs,
    });
  }

  /**
   * Get session events
   */
  getSessionEvents() {
    return this.events.filter(e => e.sessionId === this.sessionId);
  }

  /**
   * Get all events
   */
  getAllEvents() {
    return this.events;
  }

  /**
   * Get event by name
   */
  getEventsByName(eventName) {
    return this.events.filter(e => e.name === eventName);
  }

  /**
   * Get event summary
   */
  getSummary() {
    const summary = {
      totalEvents: this.events.length,
      sessionId: this.sessionId,
      byEvent: {},
      timeRange: {
        start: this.events[0]?.timestamp,
        end: this.events[this.events.length - 1]?.timestamp,
      },
    };

    this.events.forEach(event => {
      summary.byEvent[event.name] = (summary.byEvent[event.name] || 0) + 1;
    });

    return summary;
  }

  /**
   * Clear events
   */
  clear() {
    this.events = [];
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Check if tracking is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

/**
 * Global analytics instance
 */
export const analytics = new Analytics();

/**
 * Initialize analytics tracking
 */
export function initAnalytics() {
  // Track initial page view
  analytics.pageView();

  // Track navigation
  window.addEventListener('popstate', () => {
    analytics.pageView();
  });

  // Track clicks (delegated)
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button && button.dataset.track) {
      analytics.click(button.dataset.track);
    }
  });

  console.log('Analytics initialized');
}

export default analytics;
