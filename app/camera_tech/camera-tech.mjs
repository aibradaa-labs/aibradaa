/**
 * Camera Tech Module - Professional Coming Soon Page
 * Webcam & microphone analysis feature (Phase 2 - Q2 2025)
 *
 * ARCHITECTURE: Professional placeholder with roadmap
 * - Beautiful coming soon UI with feature preview
 * - Email waitlist signup
 * - ETA countdown
 * - Feature roadmap with 5 planned capabilities
 * - One Piece v4.0 personality integration
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class CameraTech {
  constructor() {
    this.isComingSoon = true;
    this.releaseDate = new Date('2025-06-01'); // Q2 2025
    this.waitlistCount = 0;

    // DOM references
    this.container = null;
    this.countdownEl = null;
    this.waitlistForm = null;
    this.countdownInterval = null;
  }

  /**
   * Initialize Camera Tech module
   */
  async init() {
    // Get or create container
    this.container = document.getElementById('cameraTechContainer') || this.createContainer();

    // Load waitlist count
    await this.loadWaitlistCount();

    // Render coming soon page
    this.renderComingSoon();

    // Start countdown
    this.startCountdown();

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Create container element if it doesn't exist
   */
  createContainer() {
    const container = document.createElement('div');
    container.id = 'cameraTechContainer';
    container.className = 'camera-tech-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Load waitlist count from backend
   */
  async loadWaitlistCount() {
    try {
      const response = await apiClient.get('/waitlist/camera-tech/count');
      this.waitlistCount = response.data.count || 0;
    } catch (error) {
      console.warn('Failed to load waitlist count:', error);
      this.waitlistCount = 0;
    }
  }

  /**
   * Render professional coming soon page
   */
  renderComingSoon() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="camera-tech-coming-soon">
        <!-- Hero Section -->
        <div class="coming-soon-hero">
          <div class="hero-icon">📸</div>
          <h1 class="hero-title">Camera Tech</h1>
          <p class="hero-subtitle">
            Webcam & Microphone Analysis
          </p>
          <div class="hero-badge">Coming Q2 2025</div>
        </div>

        <!-- Countdown Timer -->
        <div class="countdown-section">
          <h3>Launching In</h3>
          <div class="countdown-timer" id="countdownTimer">
            <div class="countdown-item">
              <span class="countdown-value" id="daysValue">--</span>
              <span class="countdown-label">Days</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-value" id="hoursValue">--</span>
              <span class="countdown-label">Hours</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-value" id="minutesValue">--</span>
              <span class="countdown-label">Minutes</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-value" id="secondsValue">--</span>
              <span class="countdown-label">Seconds</span>
            </div>
          </div>
        </div>

        <!-- Feature Roadmap -->
        <div class="features-roadmap">
          <h2>Planned Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎥</div>
              <h3>Webcam Database</h3>
              <p>Detailed specs for laptop webcams including sensor type, resolution, and field of view</p>
              <span class="feature-status">Planned</span>
            </div>

            <div class="feature-card">
              <div class="feature-icon">⭐</div>
              <h3>DxOMark Integration</h3>
              <p>Professional camera quality scores from industry-leading benchmark</p>
              <span class="feature-status">Planned</span>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🌙</div>
              <h3>Low-Light Performance</h3>
              <p>Real-world testing data for webcams in various lighting conditions</p>
              <span class="feature-status">Planned</span>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🎤</div>
              <h3>Microphone Analysis</h3>
              <p>Audio quality ratings and noise cancellation effectiveness testing</p>
              <span class="feature-status">Planned</span>
            </div>

            <div class="feature-card">
              <div class="feature-icon">💼</div>
              <h3>Video Conf Rankings</h3>
              <p>Best laptops for Zoom, Teams, Meet, and other video conferencing platforms</p>
              <span class="feature-status">Planned</span>
            </div>
          </div>
        </div>

        <!-- Preview Screenshots -->
        <div class="preview-section">
          <h2>What to Expect</h2>
          <div class="preview-grid">
            <div class="preview-item">
              <div class="preview-placeholder">
                <span class="preview-icon">📊</span>
                <p>Detailed comparison charts</p>
              </div>
            </div>
            <div class="preview-item">
              <div class="preview-placeholder">
                <span class="preview-icon">📈</span>
                <p>Performance benchmarks</p>
              </div>
            </div>
            <div class="preview-item">
              <div class="preview-placeholder">
                <span class="preview-icon">🎯</span>
                <p>Smart recommendations</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Waitlist Signup -->
        <div class="waitlist-section">
          <h2>Join the Waitlist</h2>
          <p class="waitlist-subtitle">
            Be the first to know when Camera Tech launches. Get early access and exclusive beta testing opportunities!
          </p>

          <form class="waitlist-form" id="waitlistForm">
            <div class="form-group">
              <input
                type="email"
                id="waitlistEmail"
                class="waitlist-input"
                placeholder="your@email.com"
                required
                autocomplete="email"
              />
              <button type="submit" class="waitlist-btn">
                <span class="btn-text">Notify Me</span>
                <span class="btn-icon">🔔</span>
              </button>
            </div>
            <p class="waitlist-privacy">
              We'll only email you about Camera Tech launch. No spam, promise lah! 🇲🇾
            </p>
          </form>

          <div class="waitlist-stats">
            <div class="stat-item">
              <span class="stat-value" id="waitlistCount">${this.formatNumber(this.waitlistCount)}</span>
              <span class="stat-label">people on waitlist</span>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-list">
            <details class="faq-item">
              <summary>When will Camera Tech be available?</summary>
              <p>We're targeting Q2 2025 (around June). Join the waitlist to get notified when we launch!</p>
            </details>

            <details class="faq-item">
              <summary>Will this be a free feature?</summary>
              <p>Camera Tech will be included in Pro and Ultimate tiers. Free users will have limited access to basic webcam specs.</p>
            </details>

            <details class="faq-item">
              <summary>How will you test webcams and microphones?</summary>
              <p>We'll use standardized testing equipment in controlled environments, plus partner with DxOMark for professional benchmarks.</p>
            </details>

            <details class="faq-item">
              <summary>Can I help beta test?</summary>
              <p>Absolutely! Waitlist subscribers will get priority access to our beta testing program.</p>
            </details>

            <details class="faq-item">
              <summary>Will historical models be included?</summary>
              <p>Initially we'll focus on current (2023-2025) models, then gradually expand to popular older laptops based on user requests.</p>
            </details>
          </div>
        </div>

        <!-- Back to Home -->
        <div class="back-section">
          <a href="/" class="back-btn">← Back to AI Bradaa</a>
        </div>
      </div>
    `;

    // Success message container (hidden by default)
    const successMsg = document.createElement('div');
    successMsg.id = 'waitlistSuccess';
    successMsg.className = 'waitlist-success';
    successMsg.style.display = 'none';
    this.container.appendChild(successMsg);
  }

  /**
   * Start countdown timer
   */
  startCountdown() {
    const daysEl = document.getElementById('daysValue');
    const hoursEl = document.getElementById('hoursValue');
    const minutesEl = document.getElementById('minutesValue');
    const secondsEl = document.getElementById('secondsValue');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = this.releaseDate.getTime() - now;

      if (distance < 0) {
        // Countdown finished
        clearInterval(this.countdownInterval);
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
    };

    // Update immediately
    updateCountdown();

    // Update every second
    this.countdownInterval = setInterval(updateCountdown, 1000);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const form = document.getElementById('waitlistForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleWaitlistSignup();
    });
  }

  /**
   * Handle waitlist signup
   */
  async handleWaitlistSignup() {
    const emailInput = document.getElementById('waitlistEmail');
    const email = emailInput?.value.trim();

    if (!email || !this.isValidEmail(email)) {
      this.showNotification('Please enter a valid email address', 'error');
      return;
    }

    try {
      // Disable form
      const submitBtn = document.querySelector('.waitlist-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = 'Joining...';
      }

      // Submit to backend
      await apiClient.post('/waitlist/camera-tech', {
        email,
        feature: 'camera-tech',
        timestamp: Date.now()
      });

      // Update count
      this.waitlistCount++;
      const countEl = document.getElementById('waitlistCount');
      if (countEl) {
        countEl.textContent = this.formatNumber(this.waitlistCount);
      }

      // Save to local storage
      await storage.setCache('camera_tech_waitlist', { email, joined: true }, 31536000000); // 1 year

      // Show success
      this.showSuccess(email);

      // Reset form
      if (emailInput) emailInput.value = '';

    } catch (error) {
      console.error('Waitlist signup failed:', error);

      if (error.status === 409) {
        this.showNotification('You\'re already on the waitlist! 👍', 'info');
      } else {
        this.showNotification('Wah, something went wrong lah! Please try again.', 'error');
      }

    } finally {
      // Re-enable form
      const submitBtn = document.querySelector('.waitlist-btn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Notify Me';
      }
    }
  }

  /**
   * Show success message
   */
  showSuccess(email) {
    const successMsg = document.getElementById('waitlistSuccess');
    if (!successMsg) return;

    successMsg.innerHTML = `
      <div class="success-content">
        <div class="success-icon">🎉</div>
        <h3>Welcome Aboard, Nakama!</h3>
        <p>
          You're on the list! We'll email <strong>${email}</strong> when Camera Tech launches in Q2 2025.
        </p>
        <p class="success-note">
          Keep an eye on your inbox for beta testing invites and exclusive updates!
        </p>
        <button class="success-close" id="closeSuccess">Got it!</button>
      </div>
    `;

    successMsg.style.display = 'flex';

    // Close button
    document.getElementById('closeSuccess')?.addEventListener('click', () => {
      successMsg.style.display = 'none';
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 10000);
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Format number with commas
   */
  formatNumber(num) {
    return num.toLocaleString('en-MY');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `camera-tech-notification camera-tech-notification-${type}`;
    notification.textContent = message;

    const bgColors = {
      success: '#00F0FF',
      error: '#D83F87',
      warning: '#FFD700',
      info: '#A8B2CC'
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${bgColors[type] || bgColors.info};
      color: #0D1117;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // ===== Legacy API Methods (for backwards compatibility) =====

  /**
   * Load cameras (not available yet)
   */
  async loadCameras() {
    return this.getRoadmap();
  }

  /**
   * Get camera specs for a laptop (not available yet)
   */
  async getCameraSpecs(laptopId) {
    return {
      message: 'Camera specs coming Q2 2025!',
      laptopId,
      placeholder: {
        sensor: 'TBD',
        resolution: 'TBD',
        fps: 'TBD',
        lowLightScore: 'TBD',
        micQuality: 'TBD',
      },
      eta: 'Q2 2025',
      joinWaitlist: '/camera-tech'
    };
  }

  /**
   * Compare cameras (not available yet)
   */
  async compareCameras(laptopIds) {
    return {
      message: 'Camera comparison coming in Q2 2025!',
      laptops: laptopIds,
      eta: 'Q2 2025',
      joinWaitlist: '/camera-tech'
    };
  }

  /**
   * Get DxOMark score (not available yet)
   */
  async getDxOMarkScore(laptopId) {
    return {
      message: 'DxOMark integration coming Q2 2025!',
      score: null,
      laptopId,
      joinWaitlist: '/camera-tech'
    };
  }

  /**
   * Get best for video conferencing (not available yet)
   */
  async getBestForVideoConf(limit = 10) {
    return {
      message: 'Video conferencing rankings coming Q2 2025!',
      features: [
        '1080p+ webcam rankings',
        'Noise-cancelling mic ratings',
        'Background blur support',
        'Wide-angle lens comparisons',
      ],
      joinWaitlist: '/camera-tech'
    };
  }

  /**
   * Check if feature is available
   */
  isFeatureAvailable() {
    return !this.isComingSoon;
  }

  /**
   * Get roadmap information
   */
  getRoadmap() {
    return {
      phase: 'Phase 2',
      eta: 'Q2 2025',
      releaseDate: this.releaseDate.toISOString(),
      daysUntilLaunch: Math.ceil((this.releaseDate - new Date()) / (1000 * 60 * 60 * 24)),
      features: [
        {
          name: 'Webcam Sensor Database',
          description: 'Detailed specs for all laptop webcams including sensor type, resolution, FPS, and FOV',
          status: 'planned',
          priority: 'high'
        },
        {
          name: 'DxOMark Integration',
          description: 'Professional camera quality scores from industry-leading benchmark',
          status: 'planned',
          priority: 'high'
        },
        {
          name: 'Low-Light Performance Testing',
          description: 'Real-world low-light performance data tested in standardized conditions',
          status: 'planned',
          priority: 'medium'
        },
        {
          name: 'Microphone Quality Analysis',
          description: 'Audio quality ratings and noise cancellation effectiveness testing',
          status: 'planned',
          priority: 'medium'
        },
        {
          name: 'Video Conferencing Optimization',
          description: 'Best laptops ranked for Zoom, Teams, Meet, and other platforms',
          status: 'planned',
          priority: 'low'
        },
      ],
      waitlistCount: this.waitlistCount,
      joinWaitlist: '/camera-tech',
      requestEarlyAccess: 'Sign up for our waitlist for early access and beta testing opportunities'
    };
  }
}

export default CameraTech;
