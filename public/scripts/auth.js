/**
 * AI Bradaa - Authentication Module
 * Login, Signup, Session Management
 *
 * ARCHITECTURE: 84-Mentor Council Standards
 * - Safety Council: Secure token storage, session management
 * - Customer Council: Delightful auth experience
 * - Platform Council: Error handling, retry logic
 *
 * FEATURES:
 * - Login/Signup form handling
 * - Session management with JWT
 * - Token storage (IndexedDB + httpOnly strategy)
 * - OAuth provider integration (UI ready)
 * - Password reset flow
 * - Protected route checks
 * - Remember me functionality
 * - Auto token refresh
 */

class AuthManager {
  constructor() {
    // Auth state
    this.state = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    };

    // Token refresh interval
    this.tokenRefreshInterval = null;

    // Callbacks
    this.onAuthChange = null;
  }

  /**
   * Initialize auth manager
   */
  async init(onAuthChange = null) {
    this.onAuthChange = onAuthChange;

    try {
      // Check if user is already authenticated
      await this.checkAuth();

      // Setup token refresh
      if (this.state.isAuthenticated) {
        this.setupTokenRefresh();
      }

      console.log('[AuthManager] Initialized, authenticated:', this.state.isAuthenticated);

    } catch (error) {
      console.error('[AuthManager] Initialization failed:', error);
    }
  }

  /**
   * Check authentication status
   * Platform Council: Validate token with server
   */
  async checkAuth() {
    try {
      // Get token from storage
      const token = await this.getStoredToken();

      if (!token) {
        this.state.isAuthenticated = false;
        this.notifyAuthChange();
        return false;
      }

      // Validate token with server
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.state.user = data.user;
        this.state.token = token;
        this.state.isAuthenticated = true;
        this.notifyAuthChange();
        return true;
      } else {
        // Token invalid, clear it
        await this.clearToken();
        this.state.isAuthenticated = false;
        this.notifyAuthChange();
        return false;
      }

    } catch (error) {
      console.error('[AuthManager] Auth check failed:', error);
      this.state.isAuthenticated = false;
      this.notifyAuthChange();
      return false;
    }
  }

  /**
   * Login with email and password
   * Customer Council: Clear error messages, loading states
   */
  async login(email, password, rememberMe = false) {
    try {
      this.state.isLoading = true;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        await this.storeToken(data.token, rememberMe);

        // Update state
        this.state.user = data.user;
        this.state.token = data.token;
        this.state.isAuthenticated = true;

        // Setup token refresh
        this.setupTokenRefresh();

        // Notify change
        this.notifyAuthChange();

        console.log('[AuthManager] Login successful:', data.user.email);

        return { success: true, user: data.user };

      } else {
        console.error('[AuthManager] Login failed:', data.error);
        return { success: false, error: data.error || 'Login failed' };
      }

    } catch (error) {
      console.error('[AuthManager] Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };

    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Signup with email and password
   */
  async signup(email, password, name) {
    try {
      this.state.isLoading = true;

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after signup
        return await this.login(email, password, true);

      } else {
        console.error('[AuthManager] Signup failed:', data.error);
        return { success: false, error: data.error || 'Signup failed' };
      }

    } catch (error) {
      console.error('[AuthManager] Signup error:', error);
      return { success: false, error: 'Network error. Please try again.' };

    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Logout
   * Safety Council: Clear all session data
   */
  async logout() {
    try {
      // Call logout endpoint
      if (this.state.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.state.token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Clear token
      await this.clearToken();

      // Clear state
      this.state.user = null;
      this.state.token = null;
      this.state.isAuthenticated = false;

      // Stop token refresh
      if (this.tokenRefreshInterval) {
        clearInterval(this.tokenRefreshInterval);
        this.tokenRefreshInterval = null;
      }

      // Notify change
      this.notifyAuthChange();

      console.log('[AuthManager] Logout successful');

    } catch (error) {
      console.error('[AuthManager] Logout error:', error);
    }
  }

  /**
   * OAuth login (Google, Facebook)
   * Customer Council: Seamless OAuth flow
   */
  async loginWithOAuth(provider) {
    try {
      // Get OAuth URL from backend
      const response = await fetch(`/api/auth/oauth/${provider}`, {
        method: 'GET'
      });

      const data = await response.json();

      if (response.ok && data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'OAuth initialization failed');
      }

    } catch (error) {
      console.error('[AuthManager] OAuth login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code, state) {
    try {
      const response = await fetch('/api/auth/oauth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, state })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        await this.storeToken(data.token, true);

        // Update state
        this.state.user = data.user;
        this.state.token = data.token;
        this.state.isAuthenticated = true;

        // Setup token refresh
        this.setupTokenRefresh();

        // Notify change
        this.notifyAuthChange();

        return { success: true, user: data.user };

      } else {
        return { success: false, error: data.error || 'OAuth callback failed' };
      }

    } catch (error) {
      console.error('[AuthManager] OAuth callback error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: 'Password reset email sent' };
      } else {
        return { success: false, error: data.error || 'Request failed' };
      }

    } catch (error) {
      console.error('[AuthManager] Password reset request error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: 'Password reset successful' };
      } else {
        return { success: false, error: data.error || 'Reset failed' };
      }

    } catch (error) {
      console.error('[AuthManager] Password reset error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  /**
   * Refresh token
   * Platform Council: Auto token refresh before expiry
   */
  async refreshToken() {
    try {
      if (!this.state.token) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.state.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Update token
        await this.storeToken(data.token, true);
        this.state.token = data.token;

        console.log('[AuthManager] Token refreshed');
        return true;

      } else {
        // Refresh failed, logout
        await this.logout();
        return false;
      }

    } catch (error) {
      console.error('[AuthManager] Token refresh error:', error);
      return false;
    }
  }

  /**
   * Setup automatic token refresh
   * Platform Council: Refresh token before expiry
   */
  setupTokenRefresh() {
    // Clear existing interval
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    // Refresh token every 50 minutes (assuming 60 min expiry)
    this.tokenRefreshInterval = setInterval(() => {
      this.refreshToken();
    }, 50 * 60 * 1000);
  }

  /**
   * Store token
   * Safety Council: Secure storage (IndexedDB + localStorage fallback)
   */
  async storeToken(token, persistent = false) {
    try {
      // Primary: IndexedDB (more secure)
      if (window.appCore && window.appCore.db) {
        await window.appCore.db.setToken(token);
      }

      // Fallback: localStorage (for compatibility)
      if (persistent) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }

      this.state.token = token;

    } catch (error) {
      console.error('[AuthManager] Store token error:', error);
    }
  }

  /**
   * Get stored token
   */
  async getStoredToken() {
    try {
      // Try IndexedDB first
      if (window.appCore && window.appCore.db) {
        const token = await window.appCore.db.getToken();
        if (token) return token;
      }

      // Fallback to sessionStorage
      let token = sessionStorage.getItem('auth_token');
      if (token) return token;

      // Fallback to localStorage
      token = localStorage.getItem('auth_token');
      if (token) return token;

      return null;

    } catch (error) {
      console.error('[AuthManager] Get token error:', error);
      return null;
    }
  }

  /**
   * Clear token
   */
  async clearToken() {
    try {
      // Clear from IndexedDB
      if (window.appCore && window.appCore.db) {
        await window.appCore.db.clearToken();
      }

      // Clear from storage
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');

      this.state.token = null;

    } catch (error) {
      console.error('[AuthManager] Clear token error:', error);
    }
  }

  /**
   * Check if user has required tier
   */
  hasRequiredTier(requiredTier) {
    if (!this.state.user) return false;

    const tiers = ['free', 'pro', 'enterprise'];
    const userTierIndex = tiers.indexOf(this.state.user.tier);
    const requiredTierIndex = tiers.indexOf(requiredTier);

    return userTierIndex >= requiredTierIndex;
  }

  /**
   * Notify auth change
   */
  notifyAuthChange() {
    if (this.onAuthChange) {
      this.onAuthChange({
        user: this.state.user,
        isAuthenticated: this.state.isAuthenticated
      });
    }
  }

  /**
   * Get current user
   */
  getUser() {
    return this.state.user;
  }

  /**
   * Get auth token
   */
  getToken() {
    return this.state.token;
  }

  /**
   * Is authenticated
   */
  isAuthenticated() {
    return this.state.isAuthenticated;
  }
}

/**
 * Auth UI Components
 * Customer Council: Delightful, accessible UI
 */
class AuthUI {
  constructor(authManager) {
    this.authManager = authManager;
  }

  /**
   * Show login modal
   */
  showLoginModal(message = null) {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay"></div>
      <div class="auth-modal-content">
        <button class="auth-modal-close">✕</button>

        <div class="auth-modal-header">
          <h2 class="auth-modal-title">Welcome Back!</h2>
          ${message ? `<p class="auth-modal-message">${message}</p>` : ''}
        </div>

        <div class="auth-modal-body">
          <!-- Social Login -->
          <div class="auth-social">
            <button class="auth-social-btn google" data-provider="google">
              <span class="auth-social-icon">🔴</span>
              Continue with Google
            </button>
            <button class="auth-social-btn facebook" data-provider="facebook">
              <span class="auth-social-icon">🔵</span>
              Continue with Facebook
            </button>
          </div>

          <div class="auth-divider">
            <span>or</span>
          </div>

          <!-- Email Login Form -->
          <form class="auth-form" id="loginForm">
            <div class="auth-form-group">
              <label for="loginEmail">Email</label>
              <input
                type="email"
                id="loginEmail"
                name="email"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="auth-form-group">
              <label for="loginPassword">Password</label>
              <input
                type="password"
                id="loginPassword"
                name="password"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
            </div>

            <div class="auth-form-options">
              <label class="auth-checkbox">
                <input type="checkbox" name="rememberMe" id="rememberMe" />
                <span>Remember me</span>
              </label>
              <a href="#" class="auth-link" id="forgotPasswordLink">Forgot password?</a>
            </div>

            <button type="submit" class="auth-submit-btn" id="loginSubmitBtn">
              Login
            </button>

            <div class="auth-error" id="loginError"></div>
          </form>

          <!-- Switch to Signup -->
          <div class="auth-switch">
            Don't have an account?
            <a href="#" class="auth-link" id="switchToSignup">Sign up</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    this.setupLoginModalListeners(modal);

    // Animate in
    setTimeout(() => modal.classList.add('show'), 10);

    return modal;
  }

  /**
   * Setup login modal listeners
   */
  setupLoginModalListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('.auth-modal-close');
    const overlay = modal.querySelector('.auth-modal-overlay');

    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Social login buttons
    const socialBtns = modal.querySelectorAll('.auth-social-btn');
    socialBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const provider = btn.dataset.provider;
        await this.authManager.loginWithOAuth(provider);
      });
    });

    // Login form
    const loginForm = modal.querySelector('#loginForm');
    const loginError = modal.querySelector('#loginError');
    const submitBtn = modal.querySelector('#loginSubmitBtn');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear error
      loginError.textContent = '';

      // Get form data
      const formData = new FormData(loginForm);
      const email = formData.get('email');
      const password = formData.get('password');
      const rememberMe = formData.get('rememberMe') === 'on';

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      // Attempt login
      const result = await this.authManager.login(email, password, rememberMe);

      if (result.success) {
        closeModal();
        // Reload page or update UI
        window.location.reload();
      } else {
        loginError.textContent = result.error;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });

    // Forgot password link
    const forgotPasswordLink = modal.querySelector('#forgotPasswordLink');
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      this.showPasswordResetModal();
    });

    // Switch to signup
    const switchToSignup = modal.querySelector('#switchToSignup');
    switchToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      this.showSignupModal();
    });
  }

  /**
   * Show signup modal
   */
  showSignupModal(message = null) {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay"></div>
      <div class="auth-modal-content">
        <button class="auth-modal-close">✕</button>

        <div class="auth-modal-header">
          <h2 class="auth-modal-title">Create Account</h2>
          ${message ? `<p class="auth-modal-message">${message}</p>` : ''}
        </div>

        <div class="auth-modal-body">
          <!-- Social Signup -->
          <div class="auth-social">
            <button class="auth-social-btn google" data-provider="google">
              <span class="auth-social-icon">🔴</span>
              Continue with Google
            </button>
            <button class="auth-social-btn facebook" data-provider="facebook">
              <span class="auth-social-icon">🔵</span>
              Continue with Facebook
            </button>
          </div>

          <div class="auth-divider">
            <span>or</span>
          </div>

          <!-- Email Signup Form -->
          <form class="auth-form" id="signupForm">
            <div class="auth-form-group">
              <label for="signupName">Name</label>
              <input
                type="text"
                id="signupName"
                name="name"
                placeholder="Your name"
                required
                autocomplete="name"
              />
            </div>

            <div class="auth-form-group">
              <label for="signupEmail">Email</label>
              <input
                type="email"
                id="signupEmail"
                name="email"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="auth-form-group">
              <label for="signupPassword">Password</label>
              <input
                type="password"
                id="signupPassword"
                name="password"
                placeholder="••••••••"
                required
                autocomplete="new-password"
                minlength="8"
              />
              <small class="auth-form-hint">At least 8 characters</small>
            </div>

            <!-- Age Verification (COPPA Compliance) -->
            <div class="auth-form-group auth-checkbox-group">
              <label class="auth-checkbox-label">
                <input
                  type="checkbox"
                  id="ageVerification"
                  name="ageVerification"
                  required
                />
                <span>I confirm I am 13 years or older</span>
              </label>
              <small class="auth-form-hint">Required for account creation (COPPA compliance)</small>
            </div>

            <button type="submit" class="auth-submit-btn" id="signupSubmitBtn">
              Create Account
            </button>

            <div class="auth-error" id="signupError"></div>

            <p class="auth-terms">
              By signing up, you agree to our
              <a href="/terms.html" target="_blank">Terms of Service</a>
              and
              <a href="/privacy.html" target="_blank">Privacy Policy</a>
            </p>
          </form>

          <!-- Switch to Login -->
          <div class="auth-switch">
            Already have an account?
            <a href="#" class="auth-link" id="switchToLogin">Login</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    this.setupSignupModalListeners(modal);

    // Animate in
    setTimeout(() => modal.classList.add('show'), 10);

    return modal;
  }

  /**
   * Setup signup modal listeners
   */
  setupSignupModalListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('.auth-modal-close');
    const overlay = modal.querySelector('.auth-modal-overlay');

    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Social signup buttons
    const socialBtns = modal.querySelectorAll('.auth-social-btn');
    socialBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const provider = btn.dataset.provider;
        await this.authManager.loginWithOAuth(provider);
      });
    });

    // Signup form
    const signupForm = modal.querySelector('#signupForm');
    const signupError = modal.querySelector('#signupError');
    const submitBtn = modal.querySelector('#signupSubmitBtn');

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear error
      signupError.textContent = '';

      // Get form data
      const formData = new FormData(signupForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const password = formData.get('password');

      // Validate password
      if (password.length < 8) {
        signupError.textContent = 'Password must be at least 8 characters';
        return;
      }

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      // Attempt signup
      const result = await this.authManager.signup(email, password, name);

      if (result.success) {
        closeModal();
        // Reload page or update UI
        window.location.reload();
      } else {
        signupError.textContent = result.error;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });

    // Switch to login
    const switchToLogin = modal.querySelector('#switchToLogin');
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      this.showLoginModal();
    });
  }

  /**
   * Show password reset modal
   */
  showPasswordResetModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay"></div>
      <div class="auth-modal-content">
        <button class="auth-modal-close">✕</button>

        <div class="auth-modal-header">
          <h2 class="auth-modal-title">Reset Password</h2>
          <p class="auth-modal-message">Enter your email to receive reset instructions</p>
        </div>

        <div class="auth-modal-body">
          <form class="auth-form" id="passwordResetForm">
            <div class="auth-form-group">
              <label for="resetEmail">Email</label>
              <input
                type="email"
                id="resetEmail"
                name="email"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>

            <button type="submit" class="auth-submit-btn" id="resetSubmitBtn">
              Send Reset Link
            </button>

            <div class="auth-error" id="resetError"></div>
            <div class="auth-success" id="resetSuccess"></div>
          </form>

          <div class="auth-switch">
            <a href="#" class="auth-link" id="backToLogin">Back to login</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    const closeBtn = modal.querySelector('.auth-modal-close');
    const overlay = modal.querySelector('.auth-modal-overlay');

    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Password reset form
    const resetForm = modal.querySelector('#passwordResetForm');
    const resetError = modal.querySelector('#resetError');
    const resetSuccess = modal.querySelector('#resetSuccess');
    const submitBtn = modal.querySelector('#resetSubmitBtn');

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear messages
      resetError.textContent = '';
      resetSuccess.textContent = '';

      // Get email
      const formData = new FormData(resetForm);
      const email = formData.get('email');

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      // Request reset
      const result = await this.authManager.requestPasswordReset(email);

      if (result.success) {
        resetSuccess.textContent = 'Reset link sent! Check your email.';
        resetForm.reset();
      } else {
        resetError.textContent = result.error;
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    });

    // Back to login
    const backToLogin = modal.querySelector('#backToLogin');
    backToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      this.showLoginModal();
    });

    // Animate in
    setTimeout(() => modal.classList.add('show'), 10);

    return modal;
  }
}

// Export as globals
window.AuthManager = AuthManager;
window.AuthUI = AuthUI;

console.log('[auth.js] Loaded successfully');
