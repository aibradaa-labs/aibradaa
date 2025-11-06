/**
 * Main Application Entry Point
 * Initializes the app and global functionality
 */

import { initAnalytics } from './utils/analytics.js';
import { initErrorHandling } from './utils/error-handler.js';
import { getDB } from './utils/db.js';
import { perfMonitor } from './utils/performance.js';

/**
 * App initialization
 */
class MainApp {
  constructor() {
    this.initialized = false;
    this.db = null;
  }

  /**
   * Initialize application
   */
  async init() {
    if (this.initialized) return;

    perfMonitor.start('app-init');

    try {
      // Initialize error handling
      initErrorHandling();

      // Initialize analytics
      const analytics = initAnalytics({
        autoPageViews: true,
        autoClicks: true,
        autoErrors: true
      });

      // Initialize database
      this.db = await getDB();

      // Register service worker
      await this.registerServiceWorker();

      // Setup global event listeners
      this.setupGlobalListeners();

      // Check for updates
      this.checkForUpdates();

      this.initialized = true;

      perfMonitor.end('app-init');

      console.log('✅ AI Bradaa initialized successfully');

    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showInitError(error);
    }
  }

  /**
   * Register service worker for PWA
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');

      console.log('Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateNotification();
          }
        });
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup global event listeners
   */
  setupGlobalListeners() {
    // Online/offline status
    window.addEventListener('online', () => {
      this.showToast('Back online! 🌐', 'success');
    });

    window.addEventListener('offline', () => {
      this.showToast('You are offline. Some features may be limited.', 'warning');
    });

    // Before install prompt (PWA)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.showToast('AI Bradaa installed! 🎉', 'success');
    });

    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-indigo-600 text-white p-4 rounded-lg shadow-xl z-50';
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-2xl">🎉</div>
        <div class="flex-1">
          <p class="font-semibold mb-1">Update Available!</p>
          <p class="text-sm text-indigo-100 mb-3">A new version of AI Bradaa is ready.</p>
          <button id="update-btn" class="bg-white text-indigo-600 px-4 py-2 rounded font-medium text-sm hover:bg-indigo-50">
            Update Now
          </button>
        </div>
        <button id="dismiss-update" class="text-indigo-100 hover:text-white">✕</button>
      </div>
    `;

    document.body.appendChild(notification);

    document.getElementById('update-btn')?.addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('dismiss-update')?.addEventListener('click', () => {
      notification.remove();
    });
  }

  /**
   * Show install prompt
   */
  showInstallPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white p-4 rounded-lg shadow-xl border-2 border-indigo-600 z-50';
    prompt.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-2xl">📱</div>
        <div class="flex-1">
          <p class="font-semibold mb-1">Install AI Bradaa</p>
          <p class="text-sm text-gray-600 mb-3">Install our app for faster access and offline support!</p>
          <div class="flex gap-2">
            <button id="install-btn" class="bg-indigo-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-indigo-700">
              Install
            </button>
            <button id="dismiss-install" class="border border-gray-300 text-gray-700 px-4 py-2 rounded font-medium text-sm hover:bg-gray-50">
              Later
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(prompt);

    document.getElementById('install-btn')?.addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          console.log('User accepted install prompt');
        }

        this.deferredPrompt = null;
      }
      prompt.remove();
    });

    document.getElementById('dismiss-install')?.addEventListener('click', () => {
      prompt.remove();
    });
  }

  /**
   * Check for updates
   */
  async checkForUpdates() {
    if (!navigator.serviceWorker?.controller) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const event = new CustomEvent('show-toast', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }

  /**
   * Show initialization error
   */
  showInitError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-50 p-4';
    errorDiv.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md">
        <div class="text-center mb-4">
          <div class="text-6xl mb-4">⚠️</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Initialization Failed</h2>
          <p class="text-gray-600 mb-4">AI Bradaa failed to start properly.</p>
          <p class="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded mb-4">${error.message}</p>
          <button onclick="window.location.reload()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700">
            Reload Page
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new MainApp();
    app.init();
  });
} else {
  const app = new MainApp();
  app.init();
}

// Make app globally accessible
window.aiBradaaApp = new MainApp();

export default MainApp;
