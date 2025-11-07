/**
 * AI Bradaa - Theme Switcher
 * Handles theme switching between dark (cyberpunk) and light modes
 * Features:
 * - System preference detection
 * - LocalStorage persistence
 * - Smooth transitions
 * - Accessibility support
 */

(function() {
  'use strict';

  const THEME_KEY = 'aibradaa-theme';
  const THEMES = {
    DARK: 'dark',
    LIGHT: 'light'
  };

  /**
   * Theme Manager Class
   */
  class ThemeManager {
    constructor() {
      this.currentTheme = null;
      this.toggleButton = null;
      this.init();
    }

    /**
     * Initialize theme system
     */
    init() {
      // Prevent transition on page load
      document.documentElement.classList.add('no-transition');

      // Load theme preference
      this.currentTheme = this.getThemePreference();

      // Apply theme immediately (before page renders)
      this.applyTheme(this.currentTheme, false);

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    /**
     * Setup after DOM is ready
     */
    setup() {
      // Remove no-transition class after setup
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transition');
      });

      // Create toggle button if it doesn't exist
      this.createToggleButton();

      // Listen for system theme changes
      this.watchSystemTheme();

      // Announce theme to screen readers
      this.announceTheme();
    }

    /**
     * Get theme preference (priority: localStorage > system > default)
     */
    getThemePreference() {
      // Check localStorage first
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme && (savedTheme === THEMES.DARK || savedTheme === THEMES.LIGHT)) {
        return savedTheme;
      }

      // Check system preference
      if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          return THEMES.LIGHT;
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return THEMES.DARK;
        }
      }

      // Default to dark (cyberpunk aesthetic)
      return THEMES.DARK;
    }

    /**
     * Apply theme to document
     * @param {string} theme - Theme name ('dark' or 'light')
     * @param {boolean} animate - Whether to animate the transition
     */
    applyTheme(theme, animate = true) {
      if (!animate) {
        document.documentElement.classList.add('no-transition');
      }

      // Set theme attribute
      document.documentElement.setAttribute('data-theme', theme);

      // Update meta theme-color for browser UI
      this.updateMetaThemeColor(theme);

      // Update current theme
      this.currentTheme = theme;

      // Save to localStorage
      localStorage.setItem(THEME_KEY, theme);

      // Update toggle button if it exists
      if (this.toggleButton) {
        this.updateToggleButton();
      }

      if (!animate) {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('no-transition');
        });
      }

      // Dispatch custom event for other scripts
      window.dispatchEvent(new CustomEvent('themechange', {
        detail: { theme }
      }));
    }

    /**
     * Toggle between themes
     */
    toggle() {
      const newTheme = this.currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      this.applyTheme(newTheme, true);
      this.announceTheme();
    }

    /**
     * Update browser theme-color meta tag
     */
    updateMetaThemeColor(theme) {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        // Dark: Cyberpunk dark blue, Light: White
        const color = theme === THEMES.DARK ? '#010409' : '#ffffff';
        metaThemeColor.setAttribute('content', color);
      }
    }

    /**
     * Create theme toggle button
     */
    createToggleButton() {
      // Check if button already exists
      let container = document.querySelector('.header-actions');
      if (!container) {
        container = document.querySelector('header');
      }
      if (!container) return;

      // Create button
      const button = document.createElement('button');
      button.className = 'theme-toggle';
      button.setAttribute('aria-label', 'Toggle theme');
      button.setAttribute('title', 'Switch between dark and light themes');
      button.innerHTML = `
        <span class="theme-toggle-slider">
          <svg class="theme-toggle-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
          </svg>
        </span>
        <svg class="icon-moon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
        </svg>
        <svg class="icon-sun" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
        </svg>
      `;

      // Add click handler
      button.addEventListener('click', () => this.toggle());

      // Add keyboard support
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });

      // Insert button before the "Launch App" button if it exists
      const launchButton = container.querySelector('.btn-primary');
      if (launchButton) {
        container.insertBefore(button, launchButton);
      } else {
        container.appendChild(button);
      }

      this.toggleButton = button;
      this.updateToggleButton();
    }

    /**
     * Update toggle button state
     */
    updateToggleButton() {
      if (!this.toggleButton) return;

      const isDark = this.currentTheme === THEMES.DARK;
      const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

      this.toggleButton.setAttribute('aria-label', label);
      this.toggleButton.setAttribute('title', label);
    }

    /**
     * Watch for system theme changes
     */
    watchSystemTheme() {
      if (!window.matchMedia) return;

      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const lightModeQuery = window.matchMedia('(prefers-color-scheme: light)');

      // Only apply system theme if user hasn't manually set a preference
      const handleSystemThemeChange = () => {
        // Check if user has explicitly set a theme
        const hasUserPreference = localStorage.getItem(THEME_KEY) !== null;
        if (hasUserPreference) return; // Respect user's choice

        // Apply system theme
        const newTheme = darkModeQuery.matches ? THEMES.DARK : THEMES.LIGHT;
        if (newTheme !== this.currentTheme) {
          this.applyTheme(newTheme, true);
        }
      };

      // Modern browsers
      if (darkModeQuery.addEventListener) {
        darkModeQuery.addEventListener('change', handleSystemThemeChange);
        lightModeQuery.addEventListener('change', handleSystemThemeChange);
      }
      // Fallback for older browsers
      else if (darkModeQuery.addListener) {
        darkModeQuery.addListener(handleSystemThemeChange);
        lightModeQuery.addListener(handleSystemThemeChange);
      }
    }

    /**
     * Announce theme change to screen readers
     */
    announceTheme() {
      const themeName = this.currentTheme === THEMES.DARK ? 'Dark' : 'Light';
      const announcement = `${themeName} theme activated`;

      // Create or update announcement element
      let announcer = document.getElementById('theme-announcer');
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'theme-announcer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(announcer);
      }

      announcer.textContent = announcement;
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
      return this.currentTheme;
    }

    /**
     * Set theme programmatically
     * @param {string} theme - Theme name ('dark' or 'light')
     */
    setTheme(theme) {
      if (theme === THEMES.DARK || theme === THEMES.LIGHT) {
        this.applyTheme(theme, true);
        this.announceTheme();
      }
    }
  }

  // Initialize theme manager
  const themeManager = new ThemeManager();

  // Expose to window for external access
  window.ThemeManager = themeManager;

  // Expose utility functions
  window.toggleTheme = () => themeManager.toggle();
  window.setTheme = (theme) => themeManager.setTheme(theme);
  window.getCurrentTheme = () => themeManager.getCurrentTheme();

})();

/**
 * Usage Examples:
 *
 * // Toggle theme
 * window.toggleTheme();
 *
 * // Set specific theme
 * window.setTheme('light');
 * window.setTheme('dark');
 *
 * // Get current theme
 * const theme = window.getCurrentTheme(); // 'dark' or 'light'
 *
 * // Listen for theme changes
 * window.addEventListener('themechange', (e) => {
 *   console.log('Theme changed to:', e.detail.theme);
 * });
 */
