/**
 * Matchmaker App Logic
 * Handles questionnaire flow and recommendation generation
 */

import { ApiClient } from '../utils/apiClient.js';
import { Toast, Loader } from '../components/ui.js';
import { LaptopCard } from '../components/laptop-card.js';
import { getAnalytics } from '../utils/analytics.js';
import { FunnelTracker } from '../utils/analytics.js';

export class MatchmakerApp {
  constructor() {
    this.api = new ApiClient();
    this.analytics = getAnalytics();
    this.currentStep = 0;
    this.answers = {};
    this.questions = this.getQuestions();
    this.funnel = new FunnelTracker('matchmaker', [
      'budget',
      'usage',
      'portability',
      'preferences',
      'results'
    ]);

    this.init();
  }

  /**
   * Initialize app
   */
  init() {
    this.renderQuestion();
    this.attachEventListeners();

    // Track page view
    if (this.analytics) {
      this.analytics.pageView('/sections/matchmaker.html');
    }
  }

  /**
   * Define questionnaire flow
   */
  getQuestions() {
    return [
      {
        id: 'budget',
        title: 'What\'s your budget?',
        description: 'Let us know how much you\'re looking to spend (in MYR)',
        type: 'range',
        required: true,
        options: {
          min: 2000,
          max: 15000,
          step: 500,
          default: 5000,
          unit: 'MYR',
          labels: {
            2000: 'Budget\nRM 2,000',
            5000: 'Mid-Range\nRM 5,000',
            10000: 'Premium\nRM 10,000',
            15000: 'High-End\nRM 15,000'
          }
        }
      },
      {
        id: 'usage',
        title: 'How will you use your laptop?',
        description: 'Select all that apply - we\'ll find the perfect match!',
        type: 'multiple',
        required: true,
        options: [
          { value: 'work', label: '💼 Work & Productivity', description: 'Office apps, emails, documents' },
          { value: 'creative', label: '🎨 Creative Work', description: 'Photo/video editing, design' },
          { value: 'gaming', label: '🎮 Gaming', description: 'Play latest games smoothly' },
          { value: 'programming', label: '💻 Programming', description: 'Coding, development, VMs' },
          { value: 'student', label: '📚 Study', description: 'Online classes, research, notes' },
          { value: 'entertainment', label: '🎬 Entertainment', description: 'Netflix, YouTube, browsing' }
        ]
      },
      {
        id: 'portability',
        title: 'How portable should it be?',
        description: 'Think about where you\'ll use it most',
        type: 'single',
        required: true,
        options: [
          {
            value: 'ultra',
            label: '🎒 Ultra Portable',
            description: 'Under 1.3kg, slim design. Perfect for daily commutes.',
            icon: '🪶'
          },
          {
            value: 'portable',
            label: '👜 Portable',
            description: '1.3-1.8kg. Good balance of portability and performance.',
            icon: '⚖️'
          },
          {
            value: 'desktop_replacement',
            label: '🏠 Desktop Replacement',
            description: 'Over 1.8kg. Maximum performance, mostly stationary use.',
            icon: '🔌'
          }
        ]
      },
      {
        id: 'screen_size',
        title: 'Preferred screen size?',
        description: 'Larger screens are better for productivity but less portable',
        type: 'single',
        required: true,
        options: [
          { value: '13', label: '13-14"', description: 'Compact and portable' },
          { value: '15', label: '15-16"', description: 'Good balance (most popular)' },
          { value: '17', label: '17"+', description: 'Maximum screen real estate' },
          { value: 'no_preference', label: 'No preference', description: 'Show me all sizes' }
        ]
      },
      {
        id: 'preferences',
        title: 'Any specific preferences?',
        description: 'Optional - but helps us narrow it down!',
        type: 'checkboxes',
        required: false,
        options: [
          { value: 'touchscreen', label: '👆 Touchscreen' },
          { value: '2in1', label: '🔄 2-in-1 Convertible' },
          { value: 'dedicated_gpu', label: '🎮 Dedicated Graphics Card' },
          { value: 'long_battery', label: '🔋 Long Battery Life (8+ hours)' },
          { value: 'backlit_keyboard', label: '⌨️ Backlit Keyboard' },
          { value: 'fingerprint', label: '👆 Fingerprint Reader' },
          { value: 'thunderbolt', label: '⚡ Thunderbolt Port' }
        ]
      },
      {
        id: 'brand',
        title: 'Any brand preferences?',
        description: 'Optional - we\'ll consider all brands by default',
        type: 'checkboxes',
        required: false,
        options: [
          { value: 'apple', label: '🍎 Apple' },
          { value: 'dell', label: 'Dell' },
          { value: 'hp', label: 'HP' },
          { value: 'lenovo', label: 'Lenovo' },
          { value: 'asus', label: 'ASUS' },
          { value: 'acer', label: 'Acer' },
          { value: 'msi', label: 'MSI' },
          { value: 'microsoft', label: 'Microsoft' }
        ]
      }
    ];
  }

  /**
   * Render current question
   */
  renderQuestion() {
    const question = this.questions[this.currentStep];
    const container = document.getElementById('question-container');

    if (!container) return;

    // Update progress
    this.updateProgress();

    // Clear container
    container.innerHTML = '';

    // Create question card
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto';

    card.innerHTML = `
      <div class="mb-6">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">${question.title}</h2>
        <p class="text-gray-600">${question.description}</p>
      </div>

      <div id="question-input" class="mb-8">
        ${this.renderInput(question)}
      </div>

      <div class="flex gap-4">
        ${this.currentStep > 0 ? `
          <button id="back-btn" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            ← Back
          </button>
        ` : ''}
        <button id="next-btn" class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${!this.isQuestionAnswered() ? 'disabled' : ''}>
          ${this.currentStep < this.questions.length - 1 ? 'Next →' : 'Get Recommendations 🎯'}
        </button>
      </div>
    `;

    container.appendChild(card);

    // Attach input event listeners
    this.attachInputListeners();
  }

  /**
   * Render input based on question type
   */
  renderInput(question) {
    switch (question.type) {
      case 'range':
        return this.renderRangeInput(question);
      case 'single':
        return this.renderRadioInput(question);
      case 'multiple':
      case 'checkboxes':
        return this.renderCheckboxInput(question);
      default:
        return '';
    }
  }

  /**
   * Render range slider
   */
  renderRangeInput(question) {
    const value = this.answers[question.id] || question.options.default;

    return `
      <div class="space-y-4">
        <div class="text-center">
          <span class="text-4xl font-bold text-indigo-600">RM ${value.toLocaleString()}</span>
        </div>
        <input
          type="range"
          id="range-input"
          min="${question.options.min}"
          max="${question.options.max}"
          step="${question.options.step}"
          value="${value}"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        >
        <div class="flex justify-between text-sm text-gray-500">
          <span>RM ${question.options.min.toLocaleString()}</span>
          <span>RM ${question.options.max.toLocaleString()}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render radio buttons
   */
  renderRadioInput(question) {
    const selected = this.answers[question.id];

    return `
      <div class="grid grid-cols-1 gap-4">
        ${question.options.map(option => `
          <label class="flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${selected === option.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}">
            <input
              type="radio"
              name="${question.id}"
              value="${option.value}"
              class="mt-1"
              ${selected === option.value ? 'checked' : ''}
            >
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                ${option.icon ? `<span class="text-2xl">${option.icon}</span>` : ''}
                <span class="font-semibold text-gray-900">${option.label}</span>
              </div>
              <p class="text-sm text-gray-600">${option.description}</p>
            </div>
          </label>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render checkboxes
   */
  renderCheckboxInput(question) {
    const selected = this.answers[question.id] || [];

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${question.options.map(option => `
          <label class="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selected.includes(option.value) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}">
            <input
              type="checkbox"
              name="${question.id}"
              value="${option.value}"
              class="mt-1"
              ${selected.includes(option.value) ? 'checked' : ''}
            >
            <div class="flex-1">
              <span class="font-semibold text-gray-900">${option.label}</span>
              ${option.description ? `<p class="text-sm text-gray-600 mt-1">${option.description}</p>` : ''}
            </div>
          </label>
        `).join('')}
      </div>
    `;
  }

  /**
   * Update progress indicator
   */
  updateProgress() {
    const progress = ((this.currentStep + 1) / this.questions.length) * 100;
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `Step ${this.currentStep + 1} of ${this.questions.length}`;
    }
  }

  /**
   * Attach input event listeners
   */
  attachInputListeners() {
    const question = this.questions[this.currentStep];

    // Range input
    const rangeInput = document.getElementById('range-input');
    if (rangeInput) {
      rangeInput.addEventListener('input', (e) => {
        this.answers[question.id] = parseInt(e.target.value);
        // Update display
        const display = document.querySelector('.text-4xl');
        if (display) {
          display.textContent = `RM ${parseInt(e.target.value).toLocaleString()}`;
        }
        this.enableNextButton();
      });
    }

    // Radio inputs
    const radioInputs = document.querySelectorAll(`input[name="${question.id}"][type="radio"]`);
    radioInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.answers[question.id] = e.target.value;
        this.enableNextButton();
        // Re-render to update styling
        this.renderQuestion();
      });
    });

    // Checkbox inputs
    const checkboxInputs = document.querySelectorAll(`input[name="${question.id}"][type="checkbox"]`);
    checkboxInputs.forEach(input => {
      input.addEventListener('change', () => {
        const checked = Array.from(checkboxInputs)
          .filter(cb => cb.checked)
          .map(cb => cb.value);

        this.answers[question.id] = checked;
        this.enableNextButton();
      });
    });
  }

  /**
   * Attach main event listeners
   */
  attachEventListeners() {
    // Use event delegation for dynamically created buttons
    document.addEventListener('click', (e) => {
      if (e.target.id === 'next-btn') {
        this.handleNext();
      } else if (e.target.id === 'back-btn') {
        this.handleBack();
      }
    });
  }

  /**
   * Handle next button
   */
  async handleNext() {
    const question = this.questions[this.currentStep];

    // Track funnel step
    this.funnel.nextStep({ [question.id]: this.answers[question.id] });

    // If last question, get recommendations
    if (this.currentStep === this.questions.length - 1) {
      await this.getRecommendations();
    } else {
      this.currentStep++;
      this.renderQuestion();
    }
  }

  /**
   * Handle back button
   */
  handleBack() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderQuestion();
    }
  }

  /**
   * Check if current question is answered
   */
  isQuestionAnswered() {
    const question = this.questions[this.currentStep];

    if (!question.required) return true;

    const answer = this.answers[question.id];

    if (question.type === 'multiple' || question.type === 'checkboxes') {
      return answer && answer.length > 0;
    }

    return answer != null && answer !== '';
  }

  /**
   * Enable/disable next button
   */
  enableNextButton() {
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.disabled = !this.isQuestionAnswered();
    }
  }

  /**
   * Get recommendations from API
   */
  async getRecommendations() {
    const loader = Loader.show({ text: 'Finding your perfect laptop...' });

    try {
      // Track recommendation request
      if (this.analytics) {
        this.analytics.recommendationRequest(this.answers);
      }

      // Transform answers to match backend API format
      const requestData = {
        budget: this.answers.budget,
        usage: this.answers.usage || [],
        preferences: {
          ...(this.answers.portability && { portability: this.answers.portability }),
          ...(this.answers.screen_size && { screen_size: this.answers.screen_size }),
          ...(this.answers.preferences && { features: this.answers.preferences }),
          ...(this.answers.brand && { brands: this.answers.brand }),
        }
      };

      const data = await this.api.post('/recommendations', requestData);

      // Track funnel complete
      this.funnel.complete({ resultCount: data.recommendations.length });

      // Display results
      this.displayResults(data.recommendations);

    } catch (error) {
      console.error('Failed to get recommendations:', error);

      if (this.analytics) {
        this.analytics.error(error, { context: 'matchmaker_recommendations' });
      }

      Toast.show({
        message: 'Failed to get recommendations. Please try again.',
        type: 'error'
      });

      // Track funnel abandon
      this.funnel.abandon('api_error');
    } finally {
      Loader.hide();
    }
  }

  /**
   * Display recommendation results
   */
  async displayResults(recommendations) {
    const container = document.getElementById('question-container');

    container.innerHTML = `
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Your Perfect Matches! 🎉</h2>
          <p class="text-gray-600 text-lg">We found ${recommendations.length} laptops that match your needs</p>
        </div>

        <div id="results-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Results will be inserted here -->
        </div>

        <div class="mt-8 text-center">
          <button id="restart-btn" class="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
            🔄 Start Over
          </button>
        </div>
      </div>
    `;

    // Render laptop cards
    const resultsGrid = document.getElementById('results-grid');
    for (const laptop of recommendations) {
      const card = await LaptopCard.create(laptop, {
        showFavorite: true,
        showCompare: true,
        showSpecs: true
      });
      resultsGrid.appendChild(card);
    }

    // Restart button
    document.getElementById('restart-btn')?.addEventListener('click', () => {
      this.restart();
    });

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Restart questionnaire
   */
  restart() {
    this.currentStep = 0;
    this.answers = {};
    this.funnel = new FunnelTracker('matchmaker', [
      'budget',
      'usage',
      'portability',
      'preferences',
      'results'
    ]);
    this.renderQuestion();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MatchmakerApp();
  });
} else {
  new MatchmakerApp();
}
