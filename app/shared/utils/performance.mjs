/**
 * Performance Monitoring
 * Track and measure application performance
 */

/**
 * Performance metrics tracker
 */
export class PerformanceTracker {
  constructor() {
    this.metrics = {
      pageLoad: null,
      firstPaint: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      firstInputDelay: null,
      cumulativeLayoutShift: null,
      timeToInteractive: null,
      customMarks: new Map(),
      customMeasures: new Map(),
    };

    this.initWebVitals();
  }

  /**
   * Initialize Web Vitals tracking
   */
  initWebVitals() {
    // Observe LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Observe FID
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });

        // Observe CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.cumulativeLayoutShift = clsValue;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('PerformanceObserver not supported:', e);
      }
    }

    // Get navigation timing
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          this.metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
          this.metrics.timeToInteractive = timing.domInteractive - timing.navigationStart;
        }, 0);
      });
    }

    // Get paint timing
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          this.metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      });
    }
  }

  /**
   * Mark a performance point
   */
  mark(name) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
      this.metrics.customMarks.set(name, window.performance.now());
    }
  }

  /**
   * Measure between two marks
   */
  measure(name, startMark, endMark) {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0];
        this.metrics.customMeasures.set(name, measure.duration);
        return measure.duration;
      } catch (e) {
        console.warn('Performance measure failed:', e);
      }
    }
    return null;
  }

  /**
   * Time a function execution
   */
  async timeAsync(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    this.mark(startMark);

    try {
      const result = await fn();
      this.mark(endMark);
      const duration = this.measure(name, startMark, endMark);

      return { result, duration };
    } catch (error) {
      this.mark(endMark);
      throw error;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      customMarks: Object.fromEntries(this.metrics.customMarks),
      customMeasures: Object.fromEntries(this.metrics.customMeasures),
    };
  }

  /**
   * Get Core Web Vitals
   */
  getWebVitals() {
    return {
      lcp: this.metrics.largestContentfulPaint,
      fid: this.metrics.firstInputDelay,
      cls: this.metrics.cumulativeLayoutShift,
      fcp: this.metrics.firstContentfulPaint,
      ttfb: this.getTTFB(),
    };
  }

  /**
   * Get Time to First Byte
   */
  getTTFB() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      return timing.responseStart - timing.requestStart;
    }
    return null;
  }

  /**
   * Report metrics to console
   */
  report() {
    console.group('Performance Metrics');
    console.table(this.getWebVitals());
    console.groupEnd();
  }
}

/**
 * Measure function execution time
 */
export function measureTime(fn, label) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  console.log(`${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * Measure async function execution time
 */
export async function measureTimeAsync(fn, label) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  console.log(`${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * Check if performance is acceptable
 */
export function checkPerformance(metrics) {
  const thresholds = {
    lcp: 2500,  // Good if < 2.5s
    fid: 100,   // Good if < 100ms
    cls: 0.1,   // Good if < 0.1
    fcp: 1800,  // Good if < 1.8s
  };

  const results = {
    pass: true,
    scores: {},
  };

  Object.entries(thresholds).forEach(([metric, threshold]) => {
    const value = metrics[metric];
    if (value !== null && value !== undefined) {
      const passes = value < threshold;
      results.scores[metric] = {
        value,
        threshold,
        passes,
      };
      if (!passes) {
        results.pass = false;
      }
    }
  });

  return results;
}

/**
 * Global performance tracker instance
 */
export const performanceTracker = new PerformanceTracker();

export default performanceTracker;
