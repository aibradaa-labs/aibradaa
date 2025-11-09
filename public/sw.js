/**
 * AI Bradaa - Service Worker
 * Offline-First PWA Strategy with Cache Management
 *
 * ARCHITECTURE: 84-Mentor Council Standards
 * - Platform Council: SLO, Error Budget, Performance
 * - Safety Council: PDPA/GDPR compliance, TTL enforcement
 * - Customer Council: Delightful offline experience
 *
 * CACHE STRATEGY:
 * - Static assets: Cache-first (HTML, CSS, JS, images, fonts)
 * - Dynamic data: Network-first (laptops.json, API calls)
 * - Fallback: offline.html when network fails
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `aibradaa-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `aibradaa-data-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Critical assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/app.html',
  '/offline.html',
  '/manifest.json',
  '/styles/app.css',
  '/styles/global.css',
  '/styles/landing.css',
  // Tool modules
  '/app/versus/versus.mjs',
  '/app/explorer/explorer.mjs',
  '/app/command/command.mjs',
  '/app/intel/intel.mjs',
  '/app/appendices/appendices.mjs',
  '/app/matchmaker/matchmaker.mjs',
  // Shared utilities
  '/app/shared/utils/api.mjs',
  '/app/shared/utils/storage.mjs',
  '/app/shared/utils/validators.mjs',
  '/app/shared/utils/formatters.mjs',
  // Essential data
  '/data/laptops.json',
  // Icons
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/assets/default-avatar.png'
];

// Dynamic content patterns (network-first)
const DYNAMIC_PATTERNS = [
  /\/api\//,
  /\/data\//,
  /\.json$/
];

// Never cache these patterns
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/admin\//,
  /analytics/,
  /tracking/
];

// Cache TTL (time-to-live) for PDPA compliance
const CACHE_TTL = {
  static: 7 * 24 * 60 * 60 * 1000,  // 7 days
  dynamic: 24 * 60 * 60 * 1000,      // 24 hours
  images: 30 * 24 * 60 * 60 * 1000   // 30 days
};

/**
 * Install Event - Precache critical assets
 * Platform Council: Fast activation, error budget compliance
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        // Precache critical assets with error handling
        const cachePromises = PRECACHE_ASSETS.map(async (url) => {
          try {
            await cache.add(url);
            console.log(`[Service Worker] Precached: ${url}`);
          } catch (error) {
            // Log but don't fail install for non-critical assets
            console.warn(`[Service Worker] Failed to precache ${url}:`, error);
          }
        });

        await Promise.allSettled(cachePromises);

        // Force activation
        await self.skipWaiting();

        console.log('[Service Worker] Install complete, precached', PRECACHE_ASSETS.length, 'assets');
      } catch (error) {
        console.error('[Service Worker] Install failed:', error);
        throw error;
      }
    })()
  );
});

/**
 * Activate Event - Clean up old caches
 * Platform Council: Cache versioning, no corruption
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');

  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys();

        // Delete old caches (except current version)
        const deletePromises = cacheNames.map((cacheName) => {
          if (cacheName.startsWith('aibradaa-') && cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        });

        await Promise.all(deletePromises);

        // Take control of all clients immediately
        await self.clients.claim();

        console.log('[Service Worker] Activated, old caches cleaned');
      } catch (error) {
        console.error('[Service Worker] Activation failed:', error);
        throw error;
      }
    })()
  );
});

/**
 * Fetch Event - Intelligent cache strategy
 * Platform Council: Cache-first for static, network-first for dynamic
 * Safety Council: Never cache sensitive data
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Never cache sensitive endpoints
  if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(fetch(request));
    return;
  }

  // Dynamic content: Network-first strategy
  if (DYNAMIC_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets: Cache-first strategy
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache-First Strategy - For static assets
 * Try cache first, fallback to network, cache the response
 */
async function cacheFirstStrategy(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Check if cached response is still fresh (TTL)
      const cachedDate = new Date(cachedResponse.headers.get('date'));
      const now = new Date();
      const age = now - cachedDate;

      // Determine TTL based on content type
      let ttl = CACHE_TTL.static;
      const contentType = cachedResponse.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        ttl = CACHE_TTL.images;
      }

      // Return cached if still fresh
      if (age < ttl) {
        console.log('[Service Worker] Cache hit (fresh):', request.url);
        return cachedResponse;
      }

      console.log('[Service Worker] Cache hit (stale), refreshing:', request.url);
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses (200-299)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('[Service Worker] Cached from network:', request.url);
    }

    return networkResponse;

  } catch (error) {
    console.error('[Service Worker] Cache-first strategy failed:', error);

    // Try cache again (even if stale)
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Returning stale cache:', request.url);
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // Return generic offline response
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Network-First Strategy - For dynamic data
 * Try network first, fallback to cache, update cache on success
 */
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('[Service Worker] Data cached from network:', request.url);
    }

    return networkResponse;

  } catch (error) {
    console.warn('[Service Worker] Network failed, trying cache:', error);

    // Fallback to cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Returning cached data:', request.url);
      return cachedResponse;
    }

    // No cache available
    console.error('[Service Worker] No cache available for:', request.url);
    return new Response(JSON.stringify({ error: 'Offline - Data not available' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });
  }
}

/**
 * Push Event - Handle push notifications
 * Customer Council: Delightful notification experience
 * Safety Council: User consent required
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  let data = {
    title: 'AI Bradaa',
    body: 'New notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'default',
    requireInteraction: false
  };

  // Parse push data
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      data: data.data || {},
      actions: data.actions || []
    })
  );
});

/**
 * Notification Click Event - Handle notification interactions
 * Customer Council: Navigate to relevant tool on click
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);

  event.notification.close();

  // Determine target URL based on notification data
  let targetUrl = '/app.html';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  // Handle action buttons
  if (event.action) {
    console.log('[Service Worker] Notification action:', event.action);

    // Custom action handlers
    switch (event.action) {
      case 'view':
        targetUrl = event.notification.data.url || '/app.html';
        break;
      case 'dismiss':
        return; // Just close, don't navigate
      default:
        break;
    }
  }

  // Open or focus app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes('/app.html') && 'focus' in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }

      // Open new window if app not open
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/**
 * Background Sync Event - Handle offline actions
 * Platform Council: Retry failed requests when back online
 * Safety Council: Queue sensitive operations securely
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-wishlist') {
    event.waitUntil(syncWishlist());
  } else if (event.tag === 'sync-preferences') {
    event.waitUntil(syncPreferences());
  } else if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

/**
 * Sync Wishlist - Send queued wishlist updates to server
 */
async function syncWishlist() {
  try {
    console.log('[Service Worker] Syncing wishlist...');

    // Get pending wishlist updates from IndexedDB
    const db = await openDatabase();
    const tx = db.transaction(['syncQueue'], 'readonly');
    const store = tx.objectStore('syncQueue');
    const requests = await store.getAll();

    // Send each request
    for (const request of requests) {
      if (request.type === 'wishlist') {
        try {
          await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(request.body)
          });

          // Remove from queue on success
          const deleteTx = db.transaction(['syncQueue'], 'readwrite');
          const deleteStore = deleteTx.objectStore('syncQueue');
          await deleteStore.delete(request.id);

          console.log('[Service Worker] Synced wishlist item:', request.id);
        } catch (error) {
          console.error('[Service Worker] Failed to sync wishlist item:', error);
          // Keep in queue for next sync
        }
      }
    }

    db.close();
  } catch (error) {
    console.error('[Service Worker] Wishlist sync failed:', error);
    throw error;
  }
}

/**
 * Sync Preferences - Send queued preference updates to server
 */
async function syncPreferences() {
  try {
    console.log('[Service Worker] Syncing preferences...');

    const db = await openDatabase();
    const tx = db.transaction(['syncQueue'], 'readonly');
    const store = tx.objectStore('syncQueue');
    const requests = await store.getAll();

    for (const request of requests) {
      if (request.type === 'preferences') {
        try {
          await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(request.body)
          });

          const deleteTx = db.transaction(['syncQueue'], 'readwrite');
          const deleteStore = deleteTx.objectStore('syncQueue');
          await deleteStore.delete(request.id);

          console.log('[Service Worker] Synced preferences:', request.id);
        } catch (error) {
          console.error('[Service Worker] Failed to sync preferences:', error);
        }
      }
    }

    db.close();
  } catch (error) {
    console.error('[Service Worker] Preferences sync failed:', error);
    throw error;
  }
}

/**
 * Sync Analytics - Send queued analytics events
 */
async function syncAnalytics() {
  try {
    console.log('[Service Worker] Syncing analytics...');

    const db = await openDatabase();
    const tx = db.transaction(['syncQueue'], 'readonly');
    const store = tx.objectStore('syncQueue');
    const requests = await store.getAll();

    for (const request of requests) {
      if (request.type === 'analytics') {
        try {
          await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(request.body)
          });

          const deleteTx = db.transaction(['syncQueue'], 'readwrite');
          const deleteStore = deleteTx.objectStore('syncQueue');
          await deleteStore.delete(request.id);

          console.log('[Service Worker] Synced analytics event:', request.id);
        } catch (error) {
          console.error('[Service Worker] Failed to sync analytics:', error);
        }
      }
    }

    db.close();
  } catch (error) {
    console.error('[Service Worker] Analytics sync failed:', error);
    throw error;
  }
}

/**
 * Message Event - Communication between app and service worker
 * Platform Council: Two-way communication for cache management
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;

      case 'CLEAR_CACHE':
        event.waitUntil(
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (cacheName.startsWith('aibradaa-')) {
                  console.log('[Service Worker] Clearing cache:', cacheName);
                  return caches.delete(cacheName);
                }
              })
            );
          })
        );
        break;

      case 'CACHE_URLS':
        if (event.data.urls && Array.isArray(event.data.urls)) {
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
              return cache.addAll(event.data.urls);
            })
          );
        }
        break;

      case 'GET_CACHE_SIZE':
        event.waitUntil(
          (async () => {
            const size = await getCacheSize();
            event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
          })()
        );
        break;

      default:
        console.warn('[Service Worker] Unknown message type:', event.data.type);
    }
  }
});

/**
 * Helper: Open IndexedDB
 * Safety Council: Versioned schema for data migrations
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AIBradaaDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Helper: Calculate total cache size
 * Platform Council: Cache budget monitoring
 */
async function getCacheSize() {
  if ('estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usagePercentage: (estimate.usage / estimate.quota * 100).toFixed(2)
    };
  }

  return { usage: 0, quota: 0, usagePercentage: 0 };
}

/**
 * Helper: Clean up expired cache entries
 * Safety Council: TTL enforcement for PDPA compliance
 */
async function cleanupExpiredCache() {
  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('aibradaa-')) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const cachedDate = new Date(response.headers.get('date'));
            const now = new Date();
            const age = now - cachedDate;

            // Determine TTL
            let ttl = CACHE_TTL.static;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('image')) {
              ttl = CACHE_TTL.images;
            } else if (contentType.includes('json')) {
              ttl = CACHE_TTL.dynamic;
            }

            // Delete if expired
            if (age > ttl) {
              await cache.delete(request);
              console.log('[Service Worker] Deleted expired cache entry:', request.url);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Service Worker] Cache cleanup failed:', error);
  }
}

// Run cache cleanup periodically (every 24 hours)
setInterval(cleanupExpiredCache, 24 * 60 * 60 * 1000);

console.log('[Service Worker] Loaded successfully, version:', CACHE_VERSION);
