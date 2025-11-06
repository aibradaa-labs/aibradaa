/**
 * Simple Client-Side Router
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
  }

  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  init() {
    window.addEventListener('popstate', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const path = window.location.pathname;
    const handler = this.routes.get(path);

    if (handler) {
      this.currentRoute = path;
      handler();
    } else {
      // 404 - redirect to home
      this.navigate('/');
    }
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }
}
