/**
 * Performance Monitoring and Optimization Utilities
 * Tools for measuring and improving app performance
 */

/**
 * Performance metrics tracker
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.marks = new Map();
  }

  /**
   * Start measuring a task
   */
  start(name) {
    const mark = `${name}-start`;
    performance.mark(mark);
    this.marks.set(name, mark);
  }

  /**
   * End measuring a task
   */
  end(name) {
    const startMark = this.marks.get(name);
    if (!startMark) {
      console.warn(`No start mark found for: ${name}`);
      return null;
    }

    const endMark = `${name}-end`;
    performance.mark(endMark);

    const measure = performance.measure(name, startMark, endMark);

    const metric = {
      name,
      duration: measure.duration,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    this.marks.delete(name);

    return metric;
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return [...this.metrics];
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name) {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Log performance report
   */
  report() {
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.duration);
      return acc;
    }, {});

    console.group('Performance Report');
    Object.entries(grouped).forEach(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      console.log(`${name}:`, {
        count: durations.length,
        avg: `${avg.toFixed(2)}ms`,
        min: `${min.toFixed(2)}ms`,
        max: `${max.toFixed(2)}ms`
      });
    });
    console.groupEnd();
  }
}

// Global instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Measure function execution time
 */
export function measureAsync(name, fn) {
  return async (...args) => {
    perfMonitor.start(name);
    try {
      const result = await fn(...args);
      return result;
    } finally {
      const metric = perfMonitor.end(name);
      if (metric && metric.duration > 1000) {
        console.warn(`Slow operation: ${name} took ${metric.duration.toFixed(2)}ms`);
      }
    }
  };
}

/**
 * Measure sync function execution time
 */
export function measure(name, fn) {
  return (...args) => {
    perfMonitor.start(name);
    try {
      const result = fn(...args);
      return result;
    } finally {
      perfMonitor.end(name);
    }
  };
}

/**
 * Get Web Vitals metrics
 */
export async function getWebVitals() {
  // Check if browser supports Performance API
  if (!('performance' in window)) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');

  const metrics = {
    // Time to First Byte
    ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,

    // First Contentful Paint
    fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,

    // DOM Content Loaded
    dcl: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,

    // Load Complete
    loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,

    // Total Page Load Time
    pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0
  };

  // Try to get LCP (Largest Contentful Paint)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
    metrics.lcp = null;
  }

  return metrics;
}

/**
 * Image lazy loading helper
 */
export class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    };

    this.observer = new IntersectionObserver(
      this.onIntersection.bind(this),
      this.options
    );
  }

  /**
   * Observe elements for lazy loading
   */
  observe(elements) {
    elements.forEach(el => this.observer.observe(el));
  }

  /**
   * Handle intersection
   */
  onIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;

        // Load image
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }

        // Load srcset
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          delete img.dataset.srcset;
        }

        // Load background image
        if (img.dataset.bg) {
          img.style.backgroundImage = `url(${img.dataset.bg})`;
          delete img.dataset.bg;
        }

        // Stop observing
        this.observer.unobserve(img);

        // Add loaded class
        img.classList.add('lazy-loaded');
      }
    });
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    this.observer.disconnect();
  }
}

/**
 * Virtualized list for rendering large datasets
 */
export class VirtualList {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      itemHeight: 100,
      renderBuffer: 3,
      ...options
    };

    this.items = [];
    this.visibleRange = { start: 0, end: 0 };

    this.setupContainer();
    this.attachScrollListener();
  }

  /**
   * Setup container
   */
  setupContainer() {
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';

    this.viewport = document.createElement('div');
    this.viewport.style.position = 'relative';
    this.container.appendChild(this.viewport);
  }

  /**
   * Set items to render
   */
  setItems(items) {
    this.items = items;
    this.viewport.style.height = `${items.length * this.options.itemHeight}px`;
    this.render();
  }

  /**
   * Attach scroll listener
   */
  attachScrollListener() {
    let ticking = false;

    this.container.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.render();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * Render visible items
   */
  render() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / this.options.itemHeight) - this.options.renderBuffer);
    const end = Math.min(
      this.items.length,
      Math.ceil((scrollTop + containerHeight) / this.options.itemHeight) + this.options.renderBuffer
    );

    // Only re-render if range changed
    if (start === this.visibleRange.start && end === this.visibleRange.end) {
      return;
    }

    this.visibleRange = { start, end };

    // Clear viewport
    this.viewport.innerHTML = '';

    // Render visible items
    for (let i = start; i < end; i++) {
      const item = this.items[i];
      const element = this.options.renderItem(item, i);

      element.style.position = 'absolute';
      element.style.top = `${i * this.options.itemHeight}px`;
      element.style.width = '100%';

      this.viewport.appendChild(element);
    }
  }
}

/**
 * Request idle callback helper
 */
export function runWhenIdle(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    return setTimeout(callback, 1);
  }
}

/**
 * Cancel idle callback
 */
export function cancelIdle(id) {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Prefetch resources
 */
export function prefetch(urls) {
  if (!Array.isArray(urls)) {
    urls = [urls];
  }

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Preload critical resources
 */
export function preload(url, as) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Network quality detection
 */
export function getNetworkQuality() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    return {
      effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // ms
      saveData: connection.saveData // boolean
    };
  }

  return null;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Memory monitoring
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      percentUsed: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
    };
  }

  return null;
}

export default {
  PerformanceMonitor,
  perfMonitor,
  measureAsync,
  measure,
  getWebVitals,
  LazyLoader,
  VirtualList,
  runWhenIdle,
  cancelIdle,
  prefetch,
  preload,
  getNetworkQuality,
  prefersReducedMotion,
  getMemoryUsage
};
