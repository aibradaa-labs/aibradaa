/**
 * AI Bradaa - App Core
 * Main application logic for PWA app
 *
 * ARCHITECTURE: 84-Mentor Council Standards
 * - Platform Council: Module loading, error boundaries, performance
 * - AI POD Council: Tool orchestration, graceful degradation
 * - Safety Council: Data persistence, PDPA compliance
 * - Customer Council: Loading states, delightful UX
 *
 * FEATURES:
 * - Dynamic module loading with lazy loading
 * - URL-based routing with History API
 * - Error boundaries for module failures
 * - Loading skeletons and progressive enhancement
 * - Network status monitoring
 * - PWA install prompt
 * - IndexedDB data persistence
 * - Push notification management
 * - Authentication state management
 */

class AppCore {
  constructor() {
    // Application state
    this.state = {
      currentTool: null,
      user: null,
      isOnline: navigator.onLine,
      isPWAInstalled: false,
      isLoading: false,
      networkSpeed: 'unknown'
    };

    // Loaded modules cache
    this.modules = new Map();

    // Tool configurations
    this.tools = {
      matchmaker: {
        name: 'Matchmaker',
        module: '/app/matchmaker/matchmaker.mjs',
        className: 'Matchmaker',
        icon: '🎯',
        requiresAuth: false,
        isPro: false
      },
      versus: {
        name: 'Versus',
        module: '/app/versus/versus.mjs',
        className: 'Versus',
        icon: '⚔️',
        requiresAuth: false,
        isPro: false
      },
      explorer: {
        name: 'Explorer',
        module: '/app/explorer/explorer.mjs',
        className: 'Explorer',
        icon: '🔍',
        requiresAuth: false,
        isPro: false
      },
      command: {
        name: 'Command',
        module: '/app/command/command.mjs',
        className: 'Command',
        icon: '🤖',
        requiresAuth: false,
        isPro: false
      },
      intel: {
        name: 'Intel',
        module: '/app/intel/intel.mjs',
        className: 'Intel',
        icon: '📊',
        requiresAuth: true,
        isPro: true
      },
      appendices: {
        name: 'Appendices',
        module: '/app/appendices/appendices.mjs',
        className: 'Appendices',
        icon: '📚',
        requiresAuth: false,
        isPro: false
      }
    };

    // DOM references
    this.dom = {
      appMain: null,
      loadingOverlay: null,
      toastContainer: null,
      modalContainer: null,
      offlineIndicator: null,
      installPrompt: null
    };

    // IndexedDB manager
    this.db = new IndexedDBManager();

    // Network monitor
    this.networkMonitor = new NetworkMonitor();

    // PWA install prompt
    this.installPromptEvent = null;

    // Service Worker registration
    this.swRegistration = null;

    // Error retry queue
    this.errorRetryQueue = [];
  }

  /**
   * Initialize the application
   * Platform Council: Fast startup, error resilience
   */
  async init() {
    try {
      console.log('[AppCore] Initializing...');

      // Initialize DOM references
      this.initDOMReferences();

      // Initialize IndexedDB
      await this.db.init();

      // Initialize network monitoring
      this.networkMonitor.init(this.onNetworkChange.bind(this));

      // Register service worker
      await this.registerServiceWorker();

      // Initialize PWA install prompt
      this.initPWAInstallPrompt();

      // Initialize push notifications
      await this.initPushNotifications();

      // Setup routing
      this.setupRouting();

      // Initialize Phase 4 integrations
      await this.initPhase4Integrations();

      // Load initial tool from URL
      await this.loadToolFromURL();

      // Check authentication
      await this.checkAuth();

      console.log('[AppCore] Initialization complete');

    } catch (error) {
      console.error('[AppCore] Initialization failed:', error);
      this.showError('Application initialization failed. Some features may not work.', true);
    }
  }

  /**
   * Initialize Phase 4 integrations
   * Phase 4: Data sync, AI integration, catchphrase system
   */
  async initPhase4Integrations() {
    try {
      console.log('[AppCore] Initializing Phase 4 integrations...');

      // Initialize Data Sync Manager
      if (window.dataSyncManager) {
        await window.dataSyncManager.init();

        // Listen for data sync events
        window.dataSyncManager.addListener(this.handleDataSyncEvent.bind(this));

        console.log('[AppCore] Data Sync Manager initialized');
      }

      // Initialize Catchphrase Manager (One Piece v4.0)
      if (window.catchphraseManager) {
        await window.catchphraseManager.init();
        console.log('[AppCore] Catchphrase Manager initialized');
      }

      // Initialize AI Integration (Gemini 2.0 Flash)
      if (window.aiIntegration) {
        const userTier = this.state.user?.tier || 'free';
        await window.aiIntegration.init(userTier);
        console.log('[AppCore] AI Integration initialized');
      }

      // Setup manual refresh button handlers
      this.setupManualRefreshHandlers();

      console.log('[AppCore] Phase 4 integrations complete');

    } catch (error) {
      console.error('[AppCore] Phase 4 integration failed:', error);
      // Don't throw - allow app to continue with fallbacks
    }
  }

  /**
   * Setup manual refresh button handlers
   * Customer Council: User control over data refresh
   */
  setupManualRefreshHandlers() {
    // Find all refresh buttons in the app
    const refreshButtons = document.querySelectorAll('[data-action="refresh"], .refresh-btn');

    refreshButtons.forEach(button => {
      button.addEventListener('click', async () => {
        await this.handleManualRefresh(button);
      });
    });

    // Create a global refresh function for inline handlers
    window.refreshData = async () => {
      await this.handleManualRefresh();
    };

    console.log('[AppCore] Manual refresh handlers setup');
  }

  /**
   * Handle manual refresh
   * Customer Council: Clear feedback, loading states
   */
  async handleManualRefresh(button = null) {
    try {
      console.log('[AppCore] Manual refresh triggered');

      // Show loading state
      if (button) {
        button.disabled = true;
        button.classList.add('loading');
      }

      this.showToast({
        message: 'Refreshing data...',
        type: 'info',
        duration: 2000
      });

      // Trigger data sync
      if (window.dataSyncManager) {
        await window.dataSyncManager.manualRefresh();
      }

      // Success feedback handled by data sync event listener

    } catch (error) {
      console.error('[AppCore] Manual refresh failed:', error);

      this.showToast({
        message: 'Failed to refresh data. Please try again.',
        type: 'error',
        duration: 5000
      });

    } finally {
      // Reset button state
      if (button) {
        button.disabled = false;
        button.classList.remove('loading');
      }
    }
  }

  /**
   * Handle data sync events
   * Customer Council: Real-time feedback on data operations
   */
  handleDataSyncEvent(event) {
    console.log('[AppCore] Data sync event:', event);

    switch (event.type) {
      case 'data':
        // Data updated
        if (event.source === 'network') {
          this.showToast({
            message: `Data refreshed! ${event.data?.length || 0} laptops loaded.`,
            type: 'success',
            duration: 3000
          });
        }
        break;

      case 'refresh':
        // Manual refresh completed
        if (event.status === 'success') {
          this.showToast({
            message: event.message || 'Data refreshed successfully!',
            type: 'success',
            duration: 3000
          });
        } else if (event.status === 'error') {
          this.showToast({
            message: event.message || 'Failed to refresh data.',
            type: 'error',
            duration: 5000
          });
        }
        break;

      case 'sync':
        // Sync status change
        if (event.status === 'start') {
          // Could show a sync indicator
          console.log('[AppCore] Sync started');
        } else if (event.status === 'end') {
          console.log('[AppCore] Sync ended');
        }
        break;

      case 'network':
        // Network status change (already handled by networkMonitor)
        break;

      case 'cache':
        // Cache operations
        if (event.status === 'cleared') {
          this.showToast({
            message: 'Cache cleared successfully',
            type: 'success',
            duration: 3000
          });
        }
        break;
    }
  }

  /**
   * Initialize DOM references
   */
  initDOMReferences() {
    this.dom.appMain = document.getElementById('appMain');
    this.dom.loadingOverlay = document.getElementById('loadingOverlay');
    this.dom.toastContainer = document.getElementById('toastContainer');
    this.dom.modalContainer = document.getElementById('modalContainer');

    // Create offline indicator if not exists
    if (!document.getElementById('offlineIndicator')) {
      const indicator = document.createElement('div');
      indicator.id = 'offlineIndicator';
      indicator.className = 'offline-indicator hidden';
      indicator.innerHTML = `
        <span class="offline-icon">📡</span>
        <span class="offline-text">You're offline. Some features may be limited.</span>
        <button class="offline-retry" onclick="window.appCore.checkConnection()">Retry</button>
      `;
      document.body.appendChild(indicator);
      this.dom.offlineIndicator = indicator;
    } else {
      this.dom.offlineIndicator = document.getElementById('offlineIndicator');
    }

    // Create PWA install prompt if not exists
    if (!document.getElementById('installPrompt')) {
      const prompt = document.createElement('div');
      prompt.id = 'installPrompt';
      prompt.className = 'install-prompt hidden';
      prompt.innerHTML = `
        <div class="install-prompt-content">
          <span class="install-icon">📱</span>
          <div class="install-text">
            <div class="install-title">Install AI Bradaa</div>
            <div class="install-subtitle">Access offline and get faster performance</div>
          </div>
          <button class="install-btn" onclick="window.appCore.installPWA()">Install</button>
          <button class="install-close" onclick="window.appCore.dismissInstallPrompt()">✕</button>
        </div>
      `;
      document.body.appendChild(prompt);
      this.dom.installPrompt = prompt;
    } else {
      this.dom.installPrompt = document.getElementById('installPrompt');
    }
  }

  /**
   * Register Service Worker
   * Platform Council: PWA functionality, offline support
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[AppCore] Service Worker not supported');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[AppCore] Service Worker registered:', this.swRegistration.scope);

      // Check for updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            this.showUpdateNotification();
          }
        });
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

    } catch (error) {
      console.error('[AppCore] Service Worker registration failed:', error);
    }
  }

  /**
   * Show update notification
   * Customer Council: User-friendly update prompt
   */
  showUpdateNotification() {
    this.showToast({
      message: 'New version available! Refresh to update.',
      type: 'info',
      duration: 0,
      action: {
        label: 'Refresh',
        handler: () => {
          window.location.reload();
        }
      }
    });
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(data) {
    console.log('[AppCore] Service Worker message:', data);

    switch (data.type) {
      case 'CACHE_SIZE':
        console.log('[AppCore] Cache size:', data.size);
        break;
      default:
        console.warn('[AppCore] Unknown service worker message:', data.type);
    }
  }

  /**
   * Initialize PWA install prompt
   * Customer Council: Delightful install experience
   */
  initPWAInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('[AppCore] PWA install prompt available');

      // Prevent the default install prompt
      event.preventDefault();

      // Store the event for later use
      this.installPromptEvent = event;

      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedDate = dismissed ? new Date(dismissed) : null;
      const daysSinceDismissal = dismissedDate ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24) : 999;

      // Show install prompt if not dismissed recently (within 7 days)
      if (daysSinceDismissal > 7) {
        setTimeout(() => {
          this.showInstallPrompt();
        }, 5000); // Show after 5 seconds
      }
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[AppCore] PWA installed');
      this.state.isPWAInstalled = true;
      this.hideInstallPrompt();
      this.showToast({
        message: 'AI Bradaa installed successfully! 🎉',
        type: 'success',
        duration: 5000
      });

      // Track installation
      this.trackEvent('pwa_installed', { source: 'prompt' });
    });
  }

  /**
   * Show PWA install prompt
   */
  showInstallPrompt() {
    if (this.dom.installPrompt) {
      this.dom.installPrompt.classList.remove('hidden');
    }
  }

  /**
   * Hide PWA install prompt
   */
  hideInstallPrompt() {
    if (this.dom.installPrompt) {
      this.dom.installPrompt.classList.add('hidden');
    }
  }

  /**
   * Install PWA
   */
  async installPWA() {
    if (!this.installPromptEvent) {
      console.warn('[AppCore] No install prompt event available');
      return;
    }

    try {
      // Show the install prompt
      this.installPromptEvent.prompt();

      // Wait for the user's response
      const choiceResult = await this.installPromptEvent.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('[AppCore] User accepted PWA install');
        this.trackEvent('pwa_install_accepted', { source: 'prompt' });
      } else {
        console.log('[AppCore] User dismissed PWA install');
        this.trackEvent('pwa_install_dismissed', { source: 'prompt' });
      }

      // Clear the event
      this.installPromptEvent = null;
      this.hideInstallPrompt();

    } catch (error) {
      console.error('[AppCore] PWA install failed:', error);
    }
  }

  /**
   * Dismiss install prompt
   */
  dismissInstallPrompt() {
    this.hideInstallPrompt();
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    this.trackEvent('pwa_install_dismissed', { source: 'user_action' });
  }

  /**
   * Initialize push notifications
   * Customer Council: Permission request flow
   * Safety Council: User consent required
   */
  async initPushNotifications() {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.warn('[AppCore] Push notifications not supported');
      return;
    }

    // Check current permission
    const permission = Notification.permission;

    if (permission === 'granted') {
      // Subscribe to push notifications
      await this.subscribeToPushNotifications();
    } else if (permission === 'default') {
      // Don't request permission immediately
      // Wait for user action or appropriate time
      console.log('[AppCore] Push notification permission not requested yet');
    } else {
      console.log('[AppCore] Push notification permission denied');
    }
  }

  /**
   * Request push notification permission
   * Safety Council: Explicit user consent
   */
  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('[AppCore] Notification permission granted');
        await this.subscribeToPushNotifications();
        this.showToast({
          message: 'Notifications enabled! We\'ll alert you about price drops and new laptops.',
          type: 'success',
          duration: 5000
        });
        this.trackEvent('notification_permission_granted');
      } else {
        console.log('[AppCore] Notification permission denied');
        this.trackEvent('notification_permission_denied');
      }

      return permission;

    } catch (error) {
      console.error('[AppCore] Notification permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications() {
    if (!this.swRegistration) {
      console.warn('[AppCore] Service Worker not registered, cannot subscribe to push');
      return;
    }

    try {
      // Get existing subscription
      let subscription = await this.swRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // TODO: Replace with actual VAPID key

        // Convert VAPID key to Uint8Array
        const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        console.log('[AppCore] Push subscription created:', subscription);

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
      } else {
        console.log('[AppCore] Push subscription already exists');
      }

    } catch (error) {
      console.error('[AppCore] Push subscription failed:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Send push subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.db.getToken()}`
        },
        body: JSON.stringify(subscription)
      });

      console.log('[AppCore] Push subscription sent to server');

    } catch (error) {
      console.error('[AppCore] Failed to send push subscription to server:', error);
    }
  }

  /**
   * Setup routing with History API
   * Platform Council: URL-based navigation
   */
  setupRouting() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.loadToolFromURL();
    });

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.loadToolFromURL();
    });
  }

  /**
   * Load tool from URL
   */
  async loadToolFromURL() {
    // Get tool from URL hash
    const hash = window.location.hash.slice(1);
    const urlParams = new URLSearchParams(window.location.search);
    const toolParam = urlParams.get('tool');

    const toolId = hash || toolParam || 'command'; // Default to command

    // Check if tool exists
    if (!this.tools[toolId]) {
      console.warn('[AppCore] Unknown tool:', toolId);
      this.showError(`Tool "${toolId}" not found. Redirecting to Command.`);
      window.location.hash = 'command';
      return;
    }

    // Load the tool
    await this.loadTool(toolId);
  }

  /**
   * Load a tool module
   * Platform Council: Dynamic imports, lazy loading, error boundaries
   * Customer Council: Loading states, progressive enhancement
   */
  async loadTool(toolId) {
    try {
      console.log('[AppCore] Loading tool:', toolId);

      // Check if tool requires authentication
      const toolConfig = this.tools[toolId];

      if (toolConfig.requiresAuth && !this.state.user) {
        this.showLoginPrompt(`Please login to access ${toolConfig.name}`);
        return;
      }

      if (toolConfig.isPro && (!this.state.user || this.state.user.tier === 'free')) {
        this.showUpgradePrompt(`${toolConfig.name} is a PRO feature`);
        return;
      }

      // Show loading skeleton
      this.showLoadingSkeleton(toolId);

      // Check if module already loaded
      if (this.modules.has(toolId)) {
        console.log('[AppCore] Using cached module:', toolId);
        await this.activateTool(toolId);
        return;
      }

      // Dynamic import with retry logic
      const moduleInstance = await this.loadModuleWithRetry(toolId);

      // Cache the module
      this.modules.set(toolId, moduleInstance);

      // Activate the tool
      await this.activateTool(toolId);

    } catch (error) {
      console.error('[AppCore] Failed to load tool:', toolId, error);
      this.showToolError(toolId, error);
    }
  }

  /**
   * Load module with retry logic
   * Platform Council: Error resilience, retry strategy
   */
  async loadModuleWithRetry(toolId, retries = 3) {
    const toolConfig = this.tools[toolId];

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[AppCore] Loading module (attempt ${attempt}/${retries}):`, toolConfig.module);

        // Dynamic import
        const module = await import(toolConfig.module);

        // Get the class from module
        const ModuleClass = module[toolConfig.className];

        if (!ModuleClass) {
          throw new Error(`Module class "${toolConfig.className}" not found in ${toolConfig.module}`);
        }

        // Create instance
        const instance = new ModuleClass();

        // Get or create container for this tool
        const container = this.getOrCreateToolContainer(toolId);

        // Initialize the module with its container
        await instance.init(container);

        console.log('[AppCore] Module loaded successfully:', toolId);

        return instance;

      } catch (error) {
        console.error(`[AppCore] Module load attempt ${attempt} failed:`, error);

        if (attempt === retries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await this.sleep(Math.pow(2, attempt) * 500);
      }
    }
  }

  /**
   * Get or create tool container
   */
  getOrCreateToolContainer(toolId) {
    let container = document.getElementById(`section-${toolId}`);

    if (!container) {
      // Create new section
      container = document.createElement('section');
      container.id = `section-${toolId}`;
      container.className = 'app-section';
      container.dataset.section = toolId;

      // Create inner container
      const innerContainer = document.createElement('div');
      innerContainer.className = 'section-container';
      innerContainer.id = `${toolId}-container`;

      container.appendChild(innerContainer);
      this.dom.appMain.appendChild(container);

      console.log('[AppCore] Created new container for tool:', toolId);
    }

    return container;
  }

  /**
   * Activate tool (make visible)
   */
  async activateTool(toolId) {
    // Update active state
    this.state.currentTool = toolId;

    // Update UI
    this.updateActiveSection(toolId);
    this.updateActiveNavItem(toolId);

    // Hide loading skeleton
    this.hideLoadingSkeleton();

    // Update page title
    const toolConfig = this.tools[toolId];
    document.title = `${toolConfig.name} - AI Bradaa`;

    // Track tool activation
    this.trackEvent('tool_activated', { tool: toolId });

    console.log('[AppCore] Tool activated:', toolId);
  }

  /**
   * Update active section
   */
  updateActiveSection(toolId) {
    const sections = document.querySelectorAll('.app-section');

    sections.forEach(section => {
      if (section.dataset.section === toolId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }

  /**
   * Update active nav item
   */
  updateActiveNavItem(toolId) {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      if (item.dataset.section === toolId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Show loading skeleton
   * Customer Council: Loading states for delightful UX
   */
  showLoadingSkeleton(toolId) {
    const container = this.getOrCreateToolContainer(toolId);
    const innerContainer = container.querySelector('.section-container');

    if (!innerContainer) return;

    // Create skeleton based on tool type
    const skeleton = this.createSkeletonForTool(toolId);

    // Clear existing content
    innerContainer.innerHTML = '';

    // Add skeleton
    innerContainer.appendChild(skeleton);

    // Show container
    container.classList.add('active');
  }

  /**
   * Create skeleton for specific tool
   */
  createSkeletonForTool(toolId) {
    const skeleton = document.createElement('div');
    skeleton.className = 'tool-skeleton';

    // Generic skeleton (can be customized per tool)
    skeleton.innerHTML = `
      <div class="skeleton-header">
        <div class="skeleton-title"></div>
        <div class="skeleton-actions">
          <div class="skeleton-button"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    `;

    return skeleton;
  }

  /**
   * Hide loading skeleton
   */
  hideLoadingSkeleton() {
    const skeletons = document.querySelectorAll('.tool-skeleton');
    skeletons.forEach(skeleton => skeleton.remove());
  }

  /**
   * Show tool error
   * Platform Council: Error boundaries, graceful degradation
   */
  showToolError(toolId, error) {
    const container = this.getOrCreateToolContainer(toolId);
    const innerContainer = container.querySelector('.section-container');

    if (!innerContainer) return;

    // Create error UI
    const errorUI = document.createElement('div');
    errorUI.className = 'tool-error';
    errorUI.innerHTML = `
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">Oops! Something went wrong</h2>
      <p class="error-message">${this.getFriendlyErrorMessage(error)}</p>
      <div class="error-actions">
        <button class="btn btn-primary" onclick="window.appCore.retryLoadTool('${toolId}')">
          Try Again
        </button>
        <button class="btn btn-secondary" onclick="window.location.hash = 'command'">
          Go to Command
        </button>
      </div>
      <details class="error-details">
        <summary>Technical Details</summary>
        <pre>${error.stack || error.message}</pre>
      </details>
    `;

    // Clear container and show error
    innerContainer.innerHTML = '';
    innerContainer.appendChild(errorUI);

    // Show container
    container.classList.add('active');

    // Track error
    this.trackEvent('tool_error', {
      tool: toolId,
      error: error.message
    });
  }

  /**
   * Get friendly error message
   * Customer Council: User-friendly error messages
   */
  getFriendlyErrorMessage(error) {
    if (!this.state.isOnline) {
      return 'You\'re offline and this tool hasn\'t been cached yet. Please connect to the internet and try again.';
    }

    if (error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }

    if (error.message.includes('not found')) {
      return 'This tool couldn\'t be loaded. It may still be under development.';
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Retry loading a tool
   */
  async retryLoadTool(toolId) {
    // Clear cached module
    this.modules.delete(toolId);

    // Try loading again
    await this.loadTool(toolId);
  }

  /**
   * Network change handler
   */
  onNetworkChange(isOnline) {
    this.state.isOnline = isOnline;

    if (isOnline) {
      this.hideOfflineIndicator();
      this.showToast({
        message: 'You\'re back online! 🌐',
        type: 'success',
        duration: 3000
      });

      // Retry failed requests
      this.retryFailedRequests();
    } else {
      this.showOfflineIndicator();
      this.showToast({
        message: 'You\'re offline. Some features may be limited.',
        type: 'warning',
        duration: 5000
      });
    }
  }

  /**
   * Show offline indicator
   */
  showOfflineIndicator() {
    if (this.dom.offlineIndicator) {
      this.dom.offlineIndicator.classList.remove('hidden');
    }
  }

  /**
   * Hide offline indicator
   */
  hideOfflineIndicator() {
    if (this.dom.offlineIndicator) {
      this.dom.offlineIndicator.classList.add('hidden');
    }
  }

  /**
   * Check connection
   */
  async checkConnection() {
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });

      if (response.ok) {
        this.state.isOnline = true;
        this.hideOfflineIndicator();
        this.showToast({
          message: 'Connection restored! 🌐',
          type: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      this.showToast({
        message: 'Still offline. Please check your connection.',
        type: 'error',
        duration: 3000
      });
    }
  }

  /**
   * Retry failed requests
   */
  async retryFailedRequests() {
    if (this.errorRetryQueue.length === 0) return;

    console.log('[AppCore] Retrying failed requests:', this.errorRetryQueue.length);

    const queue = [...this.errorRetryQueue];
    this.errorRetryQueue = [];

    for (const request of queue) {
      try {
        await request.retry();
      } catch (error) {
        console.error('[AppCore] Retry failed:', error);
        this.errorRetryQueue.push(request);
      }
    }
  }

  /**
   * Check authentication
   */
  async checkAuth() {
    try {
      const token = await this.db.getToken();

      if (token) {
        // Validate token with server
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.state.user = data.user;
          console.log('[AppCore] User authenticated:', this.state.user.email);
        } else {
          // Invalid token
          await this.db.clearToken();
          this.state.user = null;
        }
      }
    } catch (error) {
      console.error('[AppCore] Auth check failed:', error);
    }
  }

  /**
   * Show login prompt
   */
  showLoginPrompt(message) {
    this.showModal({
      title: 'Login Required',
      content: `<p>${message}</p>`,
      actions: [
        {
          label: 'Login',
          primary: true,
          handler: () => {
            window.location.href = '/login.html';
          }
        },
        {
          label: 'Sign Up',
          handler: () => {
            window.location.href = '/signup.html';
          }
        },
        {
          label: 'Cancel',
          handler: () => {
            this.hideModal();
          }
        }
      ]
    });
  }

  /**
   * Show upgrade prompt
   */
  showUpgradePrompt(message) {
    this.showModal({
      title: 'PRO Feature',
      content: `
        <p>${message}</p>
        <p>Upgrade to PRO to unlock:</p>
        <ul>
          <li>📊 Intel - Market insights and trends</li>
          <li>🔔 Price drop alerts</li>
          <li>💾 Unlimited wishlist saves</li>
          <li>⚡ Priority support</li>
        </ul>
      `,
      actions: [
        {
          label: 'Upgrade to PRO',
          primary: true,
          handler: () => {
            window.location.href = '/pricing.html';
          }
        },
        {
          label: 'Maybe Later',
          handler: () => {
            this.hideModal();
          }
        }
      ]
    });
  }

  /**
   * Show toast notification
   */
  showToast({ message, type = 'info', duration = 3000, action = null }) {
    if (!this.dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let actionHTML = '';
    if (action) {
      actionHTML = `<button class="toast-action" data-action="true">${action.label}</button>`;
    }

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        ${actionHTML}
      </div>
      <button class="toast-close">✕</button>
    `;

    this.dom.toastContainer.appendChild(toast);

    // Add event listeners
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.hideToast(toast);
    });

    if (action) {
      const actionBtn = toast.querySelector('.toast-action');
      actionBtn.addEventListener('click', () => {
        action.handler();
        this.hideToast(toast);
      });
    }

    // Auto hide after duration (0 = persistent)
    if (duration > 0) {
      setTimeout(() => {
        this.hideToast(toast);
      }, duration);
    }

    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
  }

  /**
   * Hide toast
   */
  hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  /**
   * Show modal
   */
  showModal({ title, content, actions = [] }) {
    if (!this.dom.modalContainer) return;

    const modal = document.createElement('div');
    modal.className = 'modal';

    const actionsHTML = actions.map(action => `
      <button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" data-action="${action.label}">
        ${action.label}
      </button>
    `).join('');

    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          ${actionsHTML}
        </div>
      </div>
    `;

    this.dom.modalContainer.innerHTML = '';
    this.dom.modalContainer.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');

    const closeModal = () => {
      this.hideModal();
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Action buttons
    actions.forEach(action => {
      const btn = modal.querySelector(`[data-action="${action.label}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          action.handler();
        });
      }
    });

    // Animate in
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

  /**
   * Hide modal
   */
  hideModal() {
    const modal = this.dom.modalContainer.querySelector('.modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        this.dom.modalContainer.innerHTML = '';
      }, 300);
    }
  }

  /**
   * Show error
   */
  showError(message, persistent = false) {
    this.showToast({
      message,
      type: 'error',
      duration: persistent ? 0 : 5000
    });
  }

  /**
   * Track event (analytics)
   */
  trackEvent(eventName, eventData = {}) {
    // Send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }

    // Queue for background sync if offline
    if (!this.state.isOnline) {
      this.db.queueAnalyticsEvent({ eventName, eventData });
    }

    console.log('[AppCore] Event tracked:', eventName, eventData);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * IndexedDB Manager
 * Safety Council: PDPA compliance, data persistence, TTL enforcement
 */
class IndexedDBManager {
  constructor() {
    this.db = null;
    this.dbName = 'AIBradaaDB';
    this.dbVersion = 2;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[IndexedDB] Open failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        this.upgradeSchema(event.oldVersion);
      };
    });
  }

  /**
   * Upgrade database schema
   */
  upgradeSchema(oldVersion) {
    console.log('[IndexedDB] Upgrading schema from version', oldVersion);

    // Version 1: Initial schema
    if (oldVersion < 1) {
      // Auth store
      if (!this.db.objectStoreNames.contains('auth')) {
        const authStore = this.db.createObjectStore('auth', { keyPath: 'key' });
        authStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Preferences store
      if (!this.db.objectStoreNames.contains('preferences')) {
        const prefsStore = this.db.createObjectStore('preferences', { keyPath: 'key' });
        prefsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Wishlist store
      if (!this.db.objectStoreNames.contains('wishlist')) {
        const wishlistStore = this.db.createObjectStore('wishlist', { keyPath: 'id', autoIncrement: true });
        wishlistStore.createIndex('laptopId', 'laptopId', { unique: false });
        wishlistStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Search history store
      if (!this.db.objectStoreNames.contains('searchHistory')) {
        const searchStore = this.db.createObjectStore('searchHistory', { keyPath: 'id', autoIncrement: true });
        searchStore.createIndex('query', 'query', { unique: false });
        searchStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    }

    // Version 2: Add sync queue and analytics
    if (oldVersion < 2) {
      // Sync queue store
      if (!this.db.objectStoreNames.contains('syncQueue')) {
        const syncStore = this.db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Analytics events store
      if (!this.db.objectStoreNames.contains('analyticsEvents')) {
        const analyticsStore = this.db.createObjectStore('analyticsEvents', { keyPath: 'id', autoIncrement: true });
        analyticsStore.createIndex('eventName', 'eventName', { unique: false });
        analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Price alerts store
      if (!this.db.objectStoreNames.contains('priceAlerts')) {
        const alertsStore = this.db.createObjectStore('priceAlerts', { keyPath: 'id', autoIncrement: true });
        alertsStore.createIndex('laptopId', 'laptopId', { unique: false });
        alertsStore.createIndex('threshold', 'threshold', { unique: false });
        alertsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    }
  }

  /**
   * Get token
   */
  async getToken() {
    try {
      const tx = this.db.transaction(['auth'], 'readonly');
      const store = tx.objectStore('auth');
      const request = store.get('token');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result?.value || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[IndexedDB] Get token failed:', error);
      return null;
    }
  }

  /**
   * Set token
   */
  async setToken(token) {
    try {
      const tx = this.db.transaction(['auth'], 'readwrite');
      const store = tx.objectStore('auth');
      await store.put({
        key: 'token',
        value: token,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[IndexedDB] Set token failed:', error);
    }
  }

  /**
   * Clear token
   */
  async clearToken() {
    try {
      const tx = this.db.transaction(['auth'], 'readwrite');
      const store = tx.objectStore('auth');
      await store.delete('token');
    } catch (error) {
      console.error('[IndexedDB] Clear token failed:', error);
    }
  }

  /**
   * Queue analytics event
   */
  async queueAnalyticsEvent(event) {
    try {
      const tx = this.db.transaction(['analyticsEvents'], 'readwrite');
      const store = tx.objectStore('analyticsEvents');
      await store.add({
        ...event,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[IndexedDB] Queue analytics event failed:', error);
    }
  }

  /**
   * Export all data (GDPR compliance)
   */
  async exportAllData() {
    const data = {};

    const storeNames = ['auth', 'preferences', 'wishlist', 'searchHistory', 'priceAlerts'];

    for (const storeName of storeNames) {
      try {
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        data[storeName] = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`[IndexedDB] Export ${storeName} failed:`, error);
      }
    }

    return data;
  }

  /**
   * Delete all data (GDPR compliance)
   */
  async deleteAllData() {
    const storeNames = Array.from(this.db.objectStoreNames);

    for (const storeName of storeNames) {
      try {
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        await store.clear();
      } catch (error) {
        console.error(`[IndexedDB] Delete ${storeName} failed:`, error);
      }
    }
  }
}

/**
 * Network Monitor
 * Platform Council: Network status tracking, adaptive loading
 */
class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callback = null;
    this.connectionType = 'unknown';
    this.effectiveType = 'unknown';
  }

  /**
   * Initialize network monitoring
   */
  init(callback) {
    this.callback = callback;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyChange();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyChange();
    });

    // Check Network Information API
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      if (connection) {
        this.connectionType = connection.type || 'unknown';
        this.effectiveType = connection.effectiveType || 'unknown';

        connection.addEventListener('change', () => {
          this.connectionType = connection.type || 'unknown';
          this.effectiveType = connection.effectiveType || 'unknown';
          console.log('[NetworkMonitor] Connection changed:', this.effectiveType);
        });
      }
    }
  }

  /**
   * Notify callback of network change
   */
  notifyChange() {
    if (this.callback) {
      this.callback(this.isOnline);
    }
  }

  /**
   * Get connection quality
   */
  getConnectionQuality() {
    if (!this.isOnline) return 'offline';

    switch (this.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'poor';
      case '3g':
        return 'moderate';
      case '4g':
        return 'good';
      default:
        return 'unknown';
    }
  }
}

// Export AppCore as global
window.AppCore = AppCore;
window.IndexedDBManager = IndexedDBManager;
window.NetworkMonitor = NetworkMonitor;

console.log('[app-core.js] Loaded successfully');
