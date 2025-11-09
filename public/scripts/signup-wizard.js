/**
 * Signup Wizard - 4-Step Animated Signup Process
 * AI Bradaa - Phase 6: Enhanced Signup Experience
 *
 * FEATURES:
 * - Step 1: Name + Nickname (for personalized "nakama [nickname]" greeting)
 * - Step 2: Email + Password
 * - Step 3: Age Verification (COPPA compliance)
 * - Step 4: Welcome message with AI Bradaa greeting
 *
 * ANIMATIONS:
 * - Slide transitions between steps
 * - Progress bar with glow effects
 * - Floating particle background
 * - Success confetti animation
 *
 * ACCESSIBILITY:
 * - Keyboard navigation
 * - ARIA labels
 * - Screen reader support
 */

class SignupWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.userData = {
      name: '',
      nickname: '',
      email: '',
      password: '',
      ageVerified: false
    };

    this.init();
  }

  /**
   * Initialize wizard
   */
  init() {
    this.renderWizard();
    this.attachEventListeners();
    this.initializeParticles();
  }

  /**
   * Render wizard HTML
   */
  renderWizard() {
    const container = document.querySelector('.auth-form-container') || document.body;

    const wizardHTML = `
      <div class="signup-wizard" id="signupWizard">
        <!-- Progress Bar -->
        <div class="wizard-progress" role="progressbar" aria-valuenow="${this.currentStep}" aria-valuemin="1" aria-valuemax="${this.totalSteps}">
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 25%"></div>
            <div class="progress-glow" id="progressGlow"></div>
          </div>
          <div class="progress-steps">
            ${this.renderProgressSteps()}
          </div>
        </div>

        <!-- Wizard Content -->
        <div class="wizard-content">
          ${this.renderStep1()}
          ${this.renderStep2()}
          ${this.renderStep3()}
          ${this.renderStep4()}
        </div>

        <!-- Navigation -->
        <div class="wizard-navigation">
          <button type="button" class="wizard-btn wizard-btn-back" id="wizardBack" style="opacity: 0; pointer-events: none;">
            ← Back
          </button>
          <button type="button" class="wizard-btn wizard-btn-next" id="wizardNext">
            Next →
          </button>
        </div>

        <!-- Error Message -->
        <div class="wizard-error" id="wizardError" style="display: none;"></div>
      </div>

      <!-- Particles Canvas -->
      <canvas id="particlesCanvas" class="particles-canvas"></canvas>

      <!-- Success Confetti (hidden initially) -->
      <canvas id="confettiCanvas" class="confetti-canvas" style="display: none;"></canvas>
    `;

    // Check if wizard already exists
    const existingWizard = document.getElementById('signupWizard');
    if (existingWizard) {
      existingWizard.remove();
    }

    container.insertAdjacentHTML('beforeend', wizardHTML);
  }

  /**
   * Render progress steps
   */
  renderProgressSteps() {
    const steps = [
      { number: 1, label: 'Profile' },
      { number: 2, label: 'Credentials' },
      { number: 3, label: 'Verification' },
      { number: 4, label: 'Complete' }
    ];

    return steps.map(step => `
      <div class="progress-step ${step.number === this.currentStep ? 'active' : ''} ${step.number < this.currentStep ? 'completed' : ''}" data-step="${step.number}">
        <div class="step-circle">
          ${step.number < this.currentStep ? '✓' : step.number}
        </div>
        <div class="step-label">${step.label}</div>
      </div>
    `).join('');
  }

  /**
   * Render Step 1: Name + Nickname
   */
  renderStep1() {
    return `
      <div class="wizard-step" id="wizardStep1" data-step="1" style="display: block;">
        <div class="step-header">
          <h2 class="step-title">Let's Get Started!</h2>
          <p class="step-subtitle">Tell us a bit about yourself</p>
        </div>

        <div class="step-body">
          <div class="form-group">
            <label for="wizardName">
              Full Name
              <span class="required">*</span>
            </label>
            <input
              type="text"
              id="wizardName"
              name="name"
              placeholder="e.g., Ahmad bin Abdullah"
              required
              autocomplete="name"
              aria-required="true"
              class="wizard-input"
            />
            <small class="form-hint">Your full name helps us personalize your experience</small>
          </div>

          <div class="form-group">
            <label for="wizardNickname">
              Nickname (Optional)
              <span class="badge badge-optional">Optional</span>
            </label>
            <input
              type="text"
              id="wizardNickname"
              name="nickname"
              placeholder="e.g., Tech Explorer, Gaming Warrior"
              autocomplete="nickname"
              class="wizard-input"
            />
            <small class="form-hint">
              AI Bradaa will greet you as "Yo, [nickname]!"
              <br>
              Leave blank for your first name
            </small>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Step 2: Email + Password
   */
  renderStep2() {
    return `
      <div class="wizard-step" id="wizardStep2" data-step="2" style="display: none;">
        <div class="step-header">
          <h2 class="step-title">Create Your Account</h2>
          <p class="step-subtitle">Your email and password</p>
        </div>

        <div class="step-body">
          <div class="form-group">
            <label for="wizardEmail">
              Email Address
              <span class="required">*</span>
            </label>
            <input
              type="email"
              id="wizardEmail"
              name="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
              aria-required="true"
              class="wizard-input"
            />
            <small class="form-hint">We'll send you laptop deals and updates (you can unsubscribe anytime)</small>
          </div>

          <div class="form-group">
            <label for="wizardPassword">
              Password
              <span class="required">*</span>
            </label>
            <input
              type="password"
              id="wizardPassword"
              name="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
              aria-required="true"
              minlength="8"
              class="wizard-input"
            />
            <small class="form-hint">At least 8 characters with uppercase, lowercase, number, and special character</small>
          </div>

          <div class="password-strength" id="passwordStrength">
            <div class="strength-meter">
              <div class="strength-bar" id="strengthBar"></div>
            </div>
            <div class="strength-label" id="strengthLabel">Password strength: Weak</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Step 3: Age Verification
   */
  renderStep3() {
    return `
      <div class="wizard-step" id="wizardStep3" data-step="3" style="display: none;">
        <div class="step-header">
          <h2 class="step-title">Age Verification</h2>
          <p class="step-subtitle">COPPA Compliance Requirement</p>
        </div>

        <div class="step-body">
          <div class="verification-card">
            <div class="verification-icon">🛡️</div>
            <h3>Why do we ask this?</h3>
            <p>
              We're committed to protecting children's privacy online.
              The Children's Online Privacy Protection Act (COPPA) requires
              us to verify that users are 13 years or older.
            </p>
          </div>

          <div class="form-group-checkbox">
            <label class="checkbox-label-large">
              <input
                type="checkbox"
                id="wizardAgeVerification"
                name="ageVerification"
                required
                aria-required="true"
              />
              <span class="checkbox-text">
                <strong>I confirm I am 13 years or older</strong>
                <small>Required to create an account</small>
              </span>
            </label>
          </div>

          <div class="form-group-checkbox">
            <label class="checkbox-label">
              <input
                type="checkbox"
                id="wizardTerms"
                name="terms"
                required
                aria-required="true"
              />
              <span class="checkbox-text">
                I agree to the <a href="/terms.html" target="_blank" rel="noopener">Terms of Service</a>
                and <a href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>
              </span>
            </label>
          </div>

          <div class="form-group-checkbox">
            <label class="checkbox-label">
              <input
                type="checkbox"
                id="wizardNewsletter"
                name="newsletter"
              />
              <span class="checkbox-text">
                Send me laptop deals, price drops, and tech news
              </span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Step 4: Welcome/Success
   */
  renderStep4() {
    return `
      <div class="wizard-step" id="wizardStep4" data-step="4" style="display: none;">
        <div class="step-header">
          <h2 class="step-title">🎉 Welcome to AI Bradaa!</h2>
          <p class="step-subtitle">Your account is being created...</p>
        </div>

        <div class="step-body">
          <div class="welcome-animation">
            <div class="loading-spinner"></div>
            <p class="loading-text">Setting up your personalized experience...</p>
          </div>

          <div class="welcome-message" id="welcomeMessage" style="display: none;">
            <div class="welcome-avatar">
              <div class="avatar-circle">
                <span class="avatar-text">AI</span>
              </div>
              <div class="avatar-badge">Bradaa</div>
            </div>

            <div class="ai-greeting">
              <p class="greeting-text" id="aiGreeting"></p>
            </div>

            <div class="welcome-features">
              <h3>What's Next?</h3>
              <ul class="features-list">
                <li>
                  <span class="feature-icon">🎯</span>
                  <div class="feature-content">
                    <strong>Take the Matchmaker Quiz</strong>
                    <small>Find your perfect laptop in 5 questions</small>
                  </div>
                </li>
                <li>
                  <span class="feature-icon">🔍</span>
                  <div class="feature-content">
                    <strong>Explore the Laptop Catalog</strong>
                    <small>100+ laptops from top brands in Malaysia</small>
                  </div>
                </li>
                <li>
                  <span class="feature-icon">💬</span>
                  <div class="feature-content">
                    <strong>Chat with AI Bradaa</strong>
                    <small>Get instant answers to all your laptop questions</small>
                  </div>
                </li>
              </ul>
            </div>

            <button type="button" class="wizard-btn wizard-btn-primary wizard-btn-large" id="wizardComplete">
              Let's Go! 🚀
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const nextBtn = document.getElementById('wizardNext');
    const backBtn = document.getElementById('wizardBack');
    const completeBtn = document.getElementById('wizardComplete');

    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.handleNext());
    }

    // Back button
    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleBack());
    }

    // Complete button (step 4)
    if (completeBtn) {
      completeBtn.addEventListener('click', () => this.handleComplete());
    }

    // Password strength meter
    const passwordInput = document.getElementById('wizardPassword');
    if (passwordInput) {
      passwordInput.addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.currentStep < 4) {
        e.preventDefault();
        this.handleNext();
      }
    });
  }

  /**
   * Handle next button click
   */
  async handleNext() {
    const isValid = await this.validateStep(this.currentStep);

    if (!isValid) {
      return;
    }

    // Save current step data
    this.saveStepData(this.currentStep);

    // If on step 3, submit the form
    if (this.currentStep === 3) {
      await this.submitSignup();
      return;
    }

    // Move to next step
    this.currentStep++;
    this.updateWizard();
  }

  /**
   * Handle back button click
   */
  handleBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateWizard();
    }
  }

  /**
   * Handle complete button (redirect to app)
   */
  handleComplete() {
    // Trigger confetti
    this.triggerConfetti();

    // Redirect after 1 second
    setTimeout(() => {
      window.location.href = '/app.html';
    }, 1000);
  }

  /**
   * Validate current step
   */
  async validateStep(step) {
    const errorDiv = document.getElementById('wizardError');
    errorDiv.style.display = 'none';

    if (step === 1) {
      // Validate name
      const nameInput = document.getElementById('wizardName');
      if (!nameInput.value.trim()) {
        this.showError('Please enter your full name');
        nameInput.focus();
        return false;
      }

      return true;
    }

    if (step === 2) {
      // Validate email
      const emailInput = document.getElementById('wizardEmail');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailInput.value.trim()) {
        this.showError('Please enter your email address');
        emailInput.focus();
        return false;
      }

      if (!emailRegex.test(emailInput.value)) {
        this.showError('Please enter a valid email address');
        emailInput.focus();
        return false;
      }

      // Validate password
      const passwordInput = document.getElementById('wizardPassword');
      if (!passwordInput.value) {
        this.showError('Please enter a password');
        passwordInput.focus();
        return false;
      }

      if (passwordInput.value.length < 8) {
        this.showError('Password must be at least 8 characters long');
        passwordInput.focus();
        return false;
      }

      // Check password strength
      const strength = this.calculatePasswordStrength(passwordInput.value);
      if (strength < 2) {
        this.showError('Please use a stronger password (mix of uppercase, lowercase, numbers, and symbols)');
        passwordInput.focus();
        return false;
      }

      return true;
    }

    if (step === 3) {
      // Validate age verification
      const ageCheckbox = document.getElementById('wizardAgeVerification');
      if (!ageCheckbox.checked) {
        this.showError('You must be 13 years or older to create an account');
        ageCheckbox.focus();
        return false;
      }

      // Validate terms
      const termsCheckbox = document.getElementById('wizardTerms');
      if (!termsCheckbox.checked) {
        this.showError('Please agree to the Terms of Service and Privacy Policy');
        termsCheckbox.focus();
        return false;
      }

      return true;
    }

    return true;
  }

  /**
   * Save step data
   */
  saveStepData(step) {
    if (step === 1) {
      this.userData.name = document.getElementById('wizardName').value.trim();
      this.userData.nickname = document.getElementById('wizardNickname').value.trim() || this.userData.name.split(' ')[0];
    }

    if (step === 2) {
      this.userData.email = document.getElementById('wizardEmail').value.trim();
      this.userData.password = document.getElementById('wizardPassword').value;
    }

    if (step === 3) {
      this.userData.ageVerified = document.getElementById('wizardAgeVerification').checked;
      this.userData.newsletter = document.getElementById('wizardNewsletter').checked;
    }
  }

  /**
   * Submit signup
   */
  async submitSignup() {
    const nextBtn = document.getElementById('wizardNext');
    nextBtn.disabled = true;
    nextBtn.textContent = 'Creating account...';

    try {
      // Move to step 4 (loading state)
      this.currentStep = 4;
      this.updateWizard();

      // Simulate API call (replace with actual API)
      const response = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'signup',
          name: this.userData.name,
          nickname: this.userData.nickname,
          email: this.userData.email,
          password: this.userData.password,
          ageVerified: this.userData.ageVerified,
          newsletter: this.userData.newsletter
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const data = await response.json();

      // Store token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      // Show success message
      setTimeout(() => {
        this.showWelcomeMessage();
      }, 1500);

    } catch (error) {
      console.error('[SignupWizard] Signup failed:', error);
      this.showError(error.message || 'Failed to create account. Please try again.');
      this.currentStep = 3;
      this.updateWizard();
      nextBtn.disabled = false;
      nextBtn.textContent = 'Create Account';
    }
  }

  /**
   * Show welcome message (step 4 success state)
   */
  showWelcomeMessage() {
    const loadingAnimation = document.querySelector('.welcome-animation');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const aiGreeting = document.getElementById('aiGreeting');

    // Hide loading
    if (loadingAnimation) {
      loadingAnimation.style.display = 'none';
    }

    // Generate AI greeting
    const greeting = this.generateAIGreeting();
    if (aiGreeting) {
      aiGreeting.textContent = greeting;
    }

    // Show welcome message
    if (welcomeMessage) {
      welcomeMessage.style.display = 'block';
      welcomeMessage.classList.add('fade-in');
    }

    // Trigger confetti
    this.triggerConfetti();
  }

  /**
   * Generate AI Bradaa greeting
   */
  generateAIGreeting() {
    const greetings = [
      `Yo, ${this.userData.nickname}! I'm AI Bradaa, your laptop buddy. Ready to find your perfect laptop lah?`,
      `Hey ${this.userData.nickname}! Welcome to the crew! Let's discover some amazing laptops together!`,
      `Wah, ${this.userData.nickname}! So excited to help you find the best laptop deals in Malaysia!`,
      `Yo ${this.userData.nickname}! I'm here to make your laptop search super easy and fun lah!`
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Update wizard UI
   */
  updateWizard() {
    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    const percentage = (this.currentStep / this.totalSteps) * 100;
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    // Update progress steps
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove('active', 'completed');

      if (stepNumber === this.currentStep) {
        step.classList.add('active');
      } else if (stepNumber < this.currentStep) {
        step.classList.add('completed');
        const circle = step.querySelector('.step-circle');
        if (circle) circle.textContent = '✓';
      }
    });

    // Update step visibility
    document.querySelectorAll('.wizard-step').forEach(step => {
      const stepNum = parseInt(step.dataset.step);
      if (stepNum === this.currentStep) {
        step.style.display = 'block';
        step.classList.add('slide-in');
      } else {
        step.style.display = 'none';
        step.classList.remove('slide-in');
      }
    });

    // Update navigation buttons
    const backBtn = document.getElementById('wizardBack');
    const nextBtn = document.getElementById('wizardNext');

    if (backBtn) {
      if (this.currentStep === 1 || this.currentStep === 4) {
        backBtn.style.opacity = '0';
        backBtn.style.pointerEvents = 'none';
      } else {
        backBtn.style.opacity = '1';
        backBtn.style.pointerEvents = 'auto';
      }
    }

    if (nextBtn) {
      if (this.currentStep === 3) {
        nextBtn.textContent = 'Create Account';
      } else if (this.currentStep === 4) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.textContent = 'Next →';
      }
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.getElementById('wizardError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      errorDiv.classList.add('shake');

      setTimeout(() => {
        errorDiv.classList.remove('shake');
      }, 500);
    }
  }

  /**
   * Update password strength meter
   */
  updatePasswordStrength(password) {
    const strength = this.calculatePasswordStrength(password);
    const strengthBar = document.getElementById('strengthBar');
    const strengthLabel = document.getElementById('strengthLabel');

    const strengths = [
      { label: 'Weak', color: '#ef4444', width: '25%' },
      { label: 'Fair', color: '#f59e0b', width: '50%' },
      { label: 'Good', color: '#10b981', width: '75%' },
      { label: 'Strong', color: '#059669', width: '100%' }
    ];

    const level = strengths[strength];

    if (strengthBar) {
      strengthBar.style.width = level.width;
      strengthBar.style.backgroundColor = level.color;
    }

    if (strengthLabel) {
      strengthLabel.textContent = `Password strength: ${level.label}`;
      strengthLabel.style.color = level.color;
    }
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return Math.min(Math.floor(strength / 2), 3);
  }

  /**
   * Initialize floating particles background
   */
  initializeParticles() {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle configuration
    const particles = [];
    const particleCount = 50;
    const colors = ['#D83F87', '#2F2FA2', '#38BDF8', '#F59E0B'];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    // Animate particles
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      requestAnimationFrame(animate);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  /**
   * Trigger confetti animation
   */
  triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const confettiCount = 100;
    const colors = ['#D83F87', '#2F2FA2', '#38BDF8', '#F59E0B', '#10B981', '#EF4444'];
    const gravity = 0.5;

    // Create confetti
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Animate confetti
    function animateConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let stillVisible = false;

      confetti.forEach(piece => {
        // Update position
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += gravity;
        piece.rotation += piece.rotationSpeed;

        // Check if still visible
        if (piece.y < canvas.height) {
          stillVisible = true;
        }

        // Draw confetti
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();
      });

      if (stillVisible) {
        requestAnimationFrame(animateConfetti);
      } else {
        canvas.style.display = 'none';
      }
    }

    animateConfetti();
  }
}

// Initialize wizard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.signupWizard = new SignupWizard();
  });
} else {
  window.signupWizard = new SignupWizard();
}

console.log('[signup-wizard.js] Loaded successfully');
