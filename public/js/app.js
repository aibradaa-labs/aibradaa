/**
 * AI Bradaa Main Application
 * Handles routing, state management, and core functionality
 */

import { Router } from './utils/router.js';
import { StateManager } from './utils/stateManager.js';
import { ApiClient } from './utils/apiClient.js';

class App {
  constructor() {
    this.router = new Router();
    this.state = new StateManager();
    this.api = new ApiClient();
    this.init();
  }

  init() {
    console.log('🚀 AI Bradaa initializing...');

    // Setup router
    this.setupRoutes();

    // Setup event listeners
    this.setupEventListeners();

    // Check auth state
    this.checkAuth();

    // Initialize IndexedDB
    this.initDB();

    console.log('✅ AI Bradaa ready');
  }

  setupRoutes() {
    this.router.addRoute('/', this.renderHome.bind(this));
    this.router.addRoute('/matchmaker', this.renderMatchmaker.bind(this));
    this.router.addRoute('/versus', this.renderVersus.bind(this));
    this.router.addRoute('/explorer', this.renderExplorer.bind(this));
    this.router.addRoute('/command', this.renderCommand.bind(this));
    this.router.addRoute('/intel', this.renderIntel.bind(this));
    this.router.addRoute('/appendices', this.renderAppendices.bind(this));
    this.router.addRoute('/auth/login', this.renderLogin.bind(this));
    this.router.addRoute('/auth/register', this.renderRegister.bind(this));

    this.router.init();
  }

  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
      mobileMenuButton.addEventListener('click', this.toggleMobileMenu.bind(this));
    }

    // Handle link clicks
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        this.router.navigate(e.target.getAttribute('href'));
      }
    });
  }

  toggleMobileMenu() {
    // TODO: Implement mobile menu toggle
    console.log('Mobile menu toggled');
  }

  async checkAuth() {
    const token = localStorage.getItem('ai_bradaa_token');
    if (token) {
      try {
        const user = await this.api.get('/users/profile');
        this.state.setState({ user, authenticated: true });
      } catch (error) {
        localStorage.removeItem('ai_bradaa_token');
        this.state.setState({ user: null, authenticated: false });
      }
    }
  }

  async initDB() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    const request = indexedDB.open('ai_bradaa_db', 1);

    request.onerror = () => console.error('IndexedDB error');

    request.onsuccess = (event) => {
      this.db = event.target.result;
      console.log('✅ IndexedDB initialized');
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('laptops')) {
        db.createObjectStore('laptops', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'url' });
      }
    };
  }

  // Route renderers (placeholders)
  renderHome() {
    console.log('Rendering home page');
    // Home is already in index.html
  }

  renderMatchmaker() {
    console.log('Rendering matchmaker');
    const content = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Matchmaker</h1>
        <p>Find your perfect laptop match...</p>
      </div>
    `;
    document.getElementById('main-content').innerHTML = content;
  }

  renderVersus() {
    console.log('Rendering versus');
    const content = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Versus</h1>
        <p>Compare laptops side-by-side...</p>
      </div>
    `;
    document.getElementById('main-content').innerHTML = content;
  }

  renderExplorer() {
    console.log('Rendering explorer');
    const content = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Explorer</h1>
        <p>Browse and filter laptops...</p>
      </div>
    `;
    document.getElementById('main-content').innerHTML = content;
  }

  renderCommand() {
    console.log('Rendering command');
    const content = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">AI Bradaa Command</h1>
        <p>Chat with our AI assistant...</p>
      </div>
    `;
    document.getElementById('main-content').innerHTML = content;
  }

  renderIntel() {
    console.log('Rendering intel');
    const content = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Intel</h1>
        <p>Deep technical insights...</p>
      </div>
    `;
    document.getElementById('main-content').innerHTML = content;
  }

  renderAppendices() {
    console.log('Rendering appendices');
    const content = `
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Appendices</h1>
        <p>Guides and resources...</p>
      </div>
    `;
    document.getElementById('main-content').innerHTML = content;
  }

  renderLogin() {
    console.log('Rendering login');
    const content = `
      <div class="container mx-auto px-4 py-8 max-w-md">
        <h1 class="text-4xl font-bold mb-8 text-center">Sign In</h1>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block mb-2 font-semibold">Email</label>
            <input type="email" name="email" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div>
            <label class="block mb-2 font-semibold">Password</label>
            <input type="password" name="password" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <button type="submit" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
            Sign In
          </button>
        </form>
        <p class="text-center mt-4">
          Don't have an account? <a href="/auth/register" class="text-indigo-600">Register</a>
        </p>
      </div>
    `;
    document.getElementById('main-content').innerHTML = content;
  }

  renderRegister() {
    console.log('Rendering register');
    const content = `
      <div class="container mx-auto px-4 py-8 max-w-md">
        <h1 class="text-4xl font-bold mb-8 text-center">Create Account</h1>
        <form id="register-form" class="space-y-4">
          <div>
            <label class="block mb-2 font-semibold">Name</label>
            <input type="text" name="name" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div>
            <label class="block mb-2 font-semibold">Email</label>
            <input type="email" name="email" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div>
            <label class="block mb-2 font-semibold">Password</label>
            <input type="password" name="password" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <button type="submit" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
            Create Account
          </button>
        </form>
        <p class="text-center mt-4">
          Already have an account? <a href="/auth/login" class="text-indigo-600">Sign In</a>
        </p>
      </div>
    `;
    document.getElementById('main-content').innerHTML = content;
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}

export default App;
