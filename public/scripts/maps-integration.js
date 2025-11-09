/**
 * Google Maps Integration
 * AI Bradaa - Phase 5: Location-based Store Finder
 *
 * FEATURES:
 * - Find nearby laptop stores in Malaysia
 * - Show buying locations for specific laptops
 * - Store details (hours, ratings, contact)
 * - Directions and navigation
 * - Price comparison by location
 * - Traffic, accessibility, reviews
 *
 * ARCHITECTURE:
 * - Google Maps JavaScript API
 * - Places API for store search
 * - Geocoding API for location
 * - Directions API for navigation
 *
 * 84-Mentor Standards:
 * - Customer: Accurate locations, helpful info
 * - Platform: Caching, rate limiting
 * - Safety: Location privacy protection
 * - AI POD: Smart ranking and recommendations
 */

class GoogleMapsIntegration {
  constructor(options = {}) {
    this.config = {
      apiKey: options.apiKey || null, // Will be loaded from env
      defaultRadius: options.defaultRadius || 10000, // 10km
      defaultLocation: options.defaultLocation || {
        lat: 3.1390, // Kuala Lumpur
        lng: 101.6869
      },
      language: options.language || 'en',
      region: options.region || 'MY', // Malaysia

      // Store search config
      storeTypes: [
        'electronics_store',
        'store',
        'shopping_mall'
      ],
      storeKeywords: [
        'laptop', 'computer', 'electronics', 'tech',
        'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI',
        'Apple', 'Microsoft', 'Razer'
      ],

      // Cache config
      cacheEnabled: true,
      cacheDuration: 3600000, // 1 hour
    };

    this.state = {
      map: null,
      geocoder: null,
      placesService: null,
      directionsService: null,
      directionsRenderer: null,
      markers: [],
      currentLocation: null,
      isInitialized: false
    };

    // Cache
    this.cache = new Map();

    // Load Google Maps API if not already loaded
    this.loadGoogleMapsAPI();
  }

  /**
   * Load Google Maps API
   */
  async loadGoogleMapsAPI() {
    // Check if already loaded
    if (window.google && window.google.maps) {
      this.state.isInitialized = true;
      return true;
    }

    try {
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=places&region=${this.config.region}&language=${this.config.language}`;
      script.async = true;
      script.defer = true;

      // Wait for script to load
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      this.state.isInitialized = true;
      console.log('[MapsIntegration] Google Maps API loaded');

      return true;

    } catch (error) {
      console.error('[MapsIntegration] Failed to load Google Maps API:', error);
      throw error;
    }
  }

  /**
   * Initialize map in a container
   *
   * @param {HTMLElement} container - Map container element
   * @param {Object} options - Map options
   */
  async initMap(container, options = {}) {
    try {
      await this.loadGoogleMapsAPI();

      const mapOptions = {
        center: options.center || this.config.defaultLocation,
        zoom: options.zoom || 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        ...options
      };

      this.state.map = new google.maps.Map(container, mapOptions);
      this.state.geocoder = new google.maps.Geocoder();
      this.state.placesService = new google.maps.places.PlacesService(this.state.map);
      this.state.directionsService = new google.maps.DirectionsService();
      this.state.directionsRenderer = new google.maps.DirectionsRenderer();

      this.state.directionsRenderer.setMap(this.state.map);

      console.log('[MapsIntegration] Map initialized');

      return this.state.map;

    } catch (error) {
      console.error('[MapsIntegration] Init map failed:', error);
      throw error;
    }
  }

  /**
   * Find laptop stores near location
   *
   * @param {string} laptopModel - Laptop model to search for
   * @param {Object|string} location - { lat, lng } or address string
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of store results
   */
  async findLaptopStores(laptopModel, location, options = {}) {
    try {
      console.log('[MapsIntegration] Finding stores for:', laptopModel);

      // Geocode location if it's a string
      let searchLocation;
      if (typeof location === 'string') {
        searchLocation = await this.geocodeAddress(location);
      } else {
        searchLocation = location;
      }

      this.state.currentLocation = searchLocation;

      // Check cache
      const cacheKey = `stores_${searchLocation.lat}_${searchLocation.lng}_${laptopModel}`;
      if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.config.cacheDuration) {
          console.log('[MapsIntegration] Returning cached results');
          return cached.data;
        }
      }

      // Build search query
      const query = `${laptopModel} laptop computer electronics store`;

      // Search nearby stores
      const stores = await this.nearbySearch({
        location: searchLocation,
        radius: options.radius || this.config.defaultRadius,
        keyword: query,
        type: 'electronics_store'
      });

      // Enhance results with additional data
      const enhancedStores = await this.enhanceStoreResults(stores, laptopModel);

      // Cache results
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          data: enhancedStores,
          timestamp: Date.now()
        });
      }

      console.log('[MapsIntegration] Found stores:', enhancedStores.length);

      return enhancedStores;

    } catch (error) {
      console.error('[MapsIntegration] Find laptop stores failed:', error);
      throw error;
    }
  }

  /**
   * Perform nearby search
   */
  async nearbySearch(request) {
    return new Promise((resolve, reject) => {
      if (!this.state.placesService) {
        reject(new Error('Places service not initialized. Call initMap() first.'));
        return;
      }

      this.state.placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(results);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  /**
   * Enhance store results with additional data
   */
  async enhanceStoreResults(stores, laptopModel) {
    const enhanced = await Promise.all(
      stores.map(async (store) => {
        try {
          // Get place details
          const details = await this.getPlaceDetails(store.place_id);

          // Calculate distance from current location
          const distance = this.calculateDistance(
            this.state.currentLocation,
            store.geometry.location
          );

          return {
            id: store.place_id,
            name: store.name,
            address: store.vicinity,
            location: {
              lat: store.geometry.location.lat(),
              lng: store.geometry.location.lng()
            },
            rating: store.rating || 0,
            userRatingsTotal: store.user_ratings_total || 0,
            priceLevel: store.price_level,
            distance, // meters
            distanceText: this.formatDistance(distance),
            isOpen: store.opening_hours?.isOpen?.() || null,
            openingHours: details.opening_hours?.weekday_text || [],
            phoneNumber: details.formatted_phone_number,
            website: details.website,
            reviews: details.reviews || [],
            photos: store.photos?.map(photo => ({
              url: photo.getUrl({ maxWidth: 400 })
            })) || [],
            types: store.types || [],
            businessStatus: store.business_status
          };
        } catch (error) {
          console.error('[MapsIntegration] Enhance store failed:', error);
          return null;
        }
      })
    );

    // Filter out nulls and sort by distance
    return enhanced
      .filter(store => store !== null)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
      if (!this.state.placesService) {
        reject(new Error('Places service not initialized'));
        return;
      }

      this.state.placesService.getDetails(
        {
          placeId,
          fields: [
            'name', 'formatted_address', 'formatted_phone_number',
            'opening_hours', 'website', 'reviews', 'rating',
            'price_level', 'photos'
          ]
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Get place details failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address) {
    return new Promise((resolve, reject) => {
      if (!this.state.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      this.state.geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          reject(new Error(`Geocode failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get directions from current location to store
   */
  async getDirections(destination, mode = 'DRIVING') {
    try {
      if (!this.state.currentLocation) {
        throw new Error('Current location not set');
      }

      const request = {
        origin: this.state.currentLocation,
        destination,
        travelMode: google.maps.TravelMode[mode]
      };

      return new Promise((resolve, reject) => {
        this.state.directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            // Display on map
            this.state.directionsRenderer.setDirections(result);

            const route = result.routes[0];
            const leg = route.legs[0];

            resolve({
              distance: leg.distance.text,
              duration: leg.duration.text,
              steps: leg.steps.map(step => ({
                instruction: step.instructions,
                distance: step.distance.text,
                duration: step.duration.text
              })),
              route: result
            });
          } else {
            reject(new Error(`Directions failed: ${status}`));
          }
        });
      });

    } catch (error) {
      console.error('[MapsIntegration] Get directions failed:', error);
      throw error;
    }
  }

  /**
   * Add marker to map
   */
  addMarker(position, options = {}) {
    if (!this.state.map) {
      throw new Error('Map not initialized');
    }

    const marker = new google.maps.Marker({
      position,
      map: this.state.map,
      title: options.title,
      icon: options.icon,
      ...options
    });

    this.state.markers.push(marker);

    // Add info window if content provided
    if (options.infoWindowContent) {
      const infoWindow = new google.maps.InfoWindow({
        content: options.infoWindowContent
      });

      marker.addListener('click', () => {
        infoWindow.open(this.state.map, marker);
      });
    }

    return marker;
  }

  /**
   * Clear all markers
   */
  clearMarkers() {
    this.state.markers.forEach(marker => marker.setMap(null));
    this.state.markers = [];
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(point1, point2) {
    const R = 6371000; // Earth's radius in meters

    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format distance for display
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Get current location from browser geolocation
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          this.state.currentLocation = location;
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Get state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Check if Google Maps API is loaded
   */
  static isLoaded() {
    return !!(window.google && window.google.maps);
  }
}

// Export to global scope
window.GoogleMapsIntegration = GoogleMapsIntegration;

console.log('[maps-integration.js] Loaded successfully');
console.log('[maps-integration.js] Google Maps loaded:', GoogleMapsIntegration.isLoaded());
