/**
 * Router
 * Simple client-side router for SPA navigation
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeHooks = [];
    this.afterHooks = [];
  }

  /**
   * Register a route
   */
  register(path, handler) {
    this.routes.set(path, handler);
  }

  /**
   * Navigate to a path
   */
  async navigate(path, pushState = true) {
    // Run before hooks
    for (const hook of this.beforeHooks) {
      const result = await hook(path, this.currentRoute);
      if (result === false) {
        return; // Hook cancelled navigation
      }
    }

    // Find handler
    const handler = this.routes.get(path) || this.routes.get('*');

    if (!handler) {
      console.error(`No route handler for: ${path}`);
      return;
    }

    // Update browser history
    if (pushState) {
      window.history.pushState({ path }, '', path);
    }

    // Update current route
    const previousRoute = this.currentRoute;
    this.currentRoute = path;

    // Execute handler
    try {
      await handler(path, previousRoute);
    } catch (error) {
      console.error('Route handler error:', error);
    }

    // Run after hooks
    for (const hook of this.afterHooks) {
      await hook(path, previousRoute);
    }
  }

  /**
   * Add before navigation hook
   */
  beforeEach(hook) {
    this.beforeHooks.push(hook);
  }

  /**
   * Add after navigation hook
   */
  afterEach(hook) {
    this.afterHooks.push(hook);
  }

  /**
   * Handle browser back/forward
   */
  init() {
    window.addEventListener('popstate', (event) => {
      const path = event.state?.path || window.location.pathname;
      this.navigate(path, false);
    });

    // Handle initial load
    const initialPath = window.location.pathname;
    this.navigate(initialPath, false);
  }

  /**
   * Get current path
   */
  getCurrentPath() {
    return this.currentRoute;
  }
}

export const router = new Router();
export default router;
