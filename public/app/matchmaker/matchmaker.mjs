/**
 * Matchmaker - 5-Question Laptop Wizard
 * AI Bradaa - Enhances existing HTML structure
 *
 * Existing HTML Elements (DO NOT REPLACE):
 * - .matchmaker-header (title + subtitle)
 * - .progress-bar with 5 steps
 * - #questionContainer (empty - populate here)
 * - #resultsContainer (empty - populate here)
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Matchmaker {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.answers = {};

    // Question definitions
    this.questions = [
      {
        id: 'budget',
        title: "What's your budget range?",
        type: 'buttons',
        options: [
          { value: 'under_3k', label: 'Under RM3,000', icon: '💰' },
          { value: '3k_5k', label: 'RM3,000 - RM5,000', icon: '💵' },
          { value: '5k_8k', label: 'RM5,000 - RM8,000', icon: '💸' },
          { value: 'above_8k', label: 'Above RM8,000', icon: '🤑' }
        ]
      },
      {
        id: 'use_case',
        title: 'What will you use it for?',
        subtitle: 'Select all that apply',
        type: 'multi-select',
        options: [
          { value: 'work', label: 'Work & Productivity', icon: '💼' },
          { value: 'gaming', label: 'Gaming', icon: '🎮' },
          { value: 'creative', label: 'Creative Work', icon: '🎨' },
          { value: 'coding', label: 'Software Development', icon: '💻' },
          { value: 'student', label: 'Student / General', icon: '📚' }
        ]
      },
      {
        id: 'specs',
        title: 'Any specific requirements?',
        subtitle: 'Optional - select if important',
        type: 'checkboxes',
        options: [
          { value: 'dedicated_gpu', label: 'Dedicated Graphics', icon: '🖥️' },
          { value: 'long_battery', label: 'Long Battery Life (>8hrs)', icon: '🔋' },
          { value: 'lightweight', label: 'Lightweight (<2kg)', icon: '⚖️' },
          { value: 'touchscreen', label: 'Touchscreen Display', icon: '👆' },
          { value: 'high_refresh', label: 'High Refresh Rate', icon: '⚡' }
        ]
      },
      {
        id: 'priorities',
        title: 'What matters most to you?',
        subtitle: 'Drag to reorder by priority',
        type: 'ranking',
        options: [
          { value: 'performance', label: 'Performance', icon: '🚀' },
          { value: 'portability', label: 'Portability', icon: '🎒' },
          { value: 'battery', label: 'Battery Life', icon: '🔋' },
          { value: 'display', label: 'Display Quality', icon: '📺' },
          { value: 'build', label: 'Build Quality', icon: '🏗️' }
        ]
      },
      {
        id: 'preferences',
        title: 'Any brand or OS preferences?',
        type: 'select',
        options: [
          { value: 'no_pref', label: 'No Preference - Best match!' },
          { value: 'apple', label: 'Apple (macOS)' },
          { value: 'windows', label: 'Windows (Any Brand)' },
          { value: 'gaming_brands', label: 'Gaming Brands (ROG, MSI, Alienware)' },
          { value: 'business', label: 'Business-Class (ThinkPad, Latitude)' }
        ]
      }
    ];
  }

  init() {
    // Get existing containers (don't create new ones!)
    this.questionContainer = document.getElementById('questionContainer');
    this.resultsContainer = document.getElementById('resultsContainer');
    this.progressSteps = document.querySelectorAll('.progress-step');

    if (!this.questionContainer || !this.resultsContainer) {
      console.error('Required containers not found!');
      return;
    }

    // Initialize first question
    this.renderQuestion();
    this.updateProgressBar();
  }

  renderQuestion() {
    const question = this.questions[this.currentStep - 1];

    // Clear container and populate with question UI
    this.questionContainer.innerHTML = `
      <div class="question-content">
        <h2 class="question-title">${question.title}</h2>
        ${question.subtitle ? `<p class="question-subtitle">${question.subtitle}</p>` : ''}

        <div class="question-options">
          ${this.renderOptions(question)}
        </div>

        <div class="question-navigation">
          ${this.currentStep > 1 ? `
            <button class="btn btn-secondary" id="prevBtn">
              ← Previous
            </button>
          ` : '<div></div>'}

          <button class="btn btn-primary" id="nextBtn" ${this.isStepComplete(question.id) ? '' : 'disabled'}>
            ${this.currentStep === this.totalSteps ? 'Find Matches 🎯' : 'Next →'}
          </button>
        </div>
      </div>
    `;

    this.attachQuestionListeners(question);
  }

  renderOptions(question) {
    switch (question.type) {
      case 'buttons':
        return this.renderButtonOptions(question);
      case 'multi-select':
        return this.renderMultiSelectOptions(question);
      case 'checkboxes':
        return this.renderCheckboxOptions(question);
      case 'ranking':
        return this.renderRankingOptions(question);
      case 'select':
        return this.renderSelectOptions(question);
      default:
        return '';
    }
  }

  renderButtonOptions(question) {
    const selected = this.answers[question.id];
    return `
      <div class="options-grid">
        ${question.options.map(opt => `
          <button class="option-btn ${selected === opt.value ? 'selected' : ''}"
                  data-option="${opt.value}">
            <span class="option-icon">${opt.icon}</span>
            <span class="option-label">${opt.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  renderMultiSelectOptions(question) {
    const selected = this.answers[question.id] || [];
    return `
      <div class="options-grid multi-select">
        ${question.options.map(opt => `
          <button class="option-btn ${selected.includes(opt.value) ? 'selected' : ''}"
                  data-option="${opt.value}">
            <span class="option-icon">${opt.icon}</span>
            <span class="option-label">${opt.label}</span>
            ${selected.includes(opt.value) ? '<span class="checkmark">✓</span>' : ''}
          </button>
        `).join('')}
      </div>
    `;
  }

  renderCheckboxOptions(question) {
    const selected = this.answers[question.id] || [];
    return `
      <div class="options-list">
        ${question.options.map(opt => `
          <label class="checkbox-option">
            <input type="checkbox" value="${opt.value}"
                   ${selected.includes(opt.value) ? 'checked' : ''}>
            <span class="checkbox-icon">${opt.icon}</span>
            <span class="checkbox-label">${opt.label}</span>
            <span class="checkbox-mark"></span>
          </label>
        `).join('')}
      </div>
    `;
  }

  renderRankingOptions(question) {
    const ranking = this.answers[question.id] || question.options.map(o => o.value);
    const orderedOptions = ranking.map(val => question.options.find(o => o.value === val));

    return `
      <ul class="ranking-list" id="rankingList">
        ${orderedOptions.map((opt, index) => `
          <li class="ranking-item" draggable="true" data-value="${opt.value}">
            <span class="ranking-number">${index + 1}</span>
            <span class="ranking-icon">${opt.icon}</span>
            <span class="ranking-label">${opt.label}</span>
            <span class="drag-handle">⋮⋮</span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  renderSelectOptions(question) {
    const selected = this.answers[question.id];
    return `
      <select class="select-dropdown" id="preferenceSelect">
        <option value="">-- Choose One --</option>
        ${question.options.map(opt => `
          <option value="${opt.value}" ${selected === opt.value ? 'selected' : ''}>
            ${opt.label}
          </option>
        `).join('')}
      </select>
    `;
  }

  attachQuestionListeners(question) {
    // Button options
    if (question.type === 'buttons') {
      document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.answers[question.id] = btn.dataset.option;
          this.renderQuestion();
          this.updateProgressBar();
        });
      });
    }

    // Multi-select options
    if (question.type === 'multi-select') {
      document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!this.answers[question.id]) this.answers[question.id] = [];
          const value = btn.dataset.option;
          const index = this.answers[question.id].indexOf(value);

          if (index > -1) {
            this.answers[question.id].splice(index, 1);
          } else {
            this.answers[question.id].push(value);
          }

          this.renderQuestion();
          this.updateProgressBar();
        });
      });
    }

    // Checkbox options
    if (question.type === 'checkboxes') {
      document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          if (!this.answers[question.id]) this.answers[question.id] = [];
          const value = checkbox.value;
          const index = this.answers[question.id].indexOf(value);

          if (checkbox.checked && index === -1) {
            this.answers[question.id].push(value);
          } else if (!checkbox.checked && index > -1) {
            this.answers[question.id].splice(index, 1);
          }

          this.updateNextButton();
        });
      });
    }

    // Ranking (drag and drop)
    if (question.type === 'ranking') {
      this.setupDragAndDrop(question);
      if (!this.answers[question.id]) {
        this.answers[question.id] = question.options.map(o => o.value);
      }
    }

    // Select dropdown
    if (question.type === 'select') {
      const select = document.getElementById('preferenceSelect');
      select?.addEventListener('change', () => {
        this.answers[question.id] = select.value;
        this.updateNextButton();
      });
    }

    // Navigation buttons
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    nextBtn?.addEventListener('click', () => this.nextStep());
    prevBtn?.addEventListener('click', () => this.prevStep());
  }

  setupDragAndDrop(question) {
    const list = document.getElementById('rankingList');
    if (!list) return;

    const items = list.querySelectorAll('.ranking-item');
    let draggedItem = null;

    items.forEach(item => {
      item.addEventListener('dragstart', () => {
        draggedItem = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        this.updateRankingOrder(question);
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(list, e.clientY);
        if (afterElement == null) {
          list.appendChild(draggedItem);
        } else {
          list.insertBefore(draggedItem, afterElement);
        }
      });
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ranking-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  updateRankingOrder(question) {
    const list = document.getElementById('rankingList');
    const items = list?.querySelectorAll('.ranking-item');
    if (!items) return;

    this.answers[question.id] = Array.from(items).map(item => item.dataset.value);

    // Update numbers
    items.forEach((item, index) => {
      const numberSpan = item.querySelector('.ranking-number');
      if (numberSpan) numberSpan.textContent = index + 1;
    });
  }

  updateProgressBar() {
    // Update existing progress bar (don't recreate!)
    this.progressSteps.forEach((step, index) => {
      if (index < this.currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  updateNextButton() {
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
      const question = this.questions[this.currentStep - 1];
      nextBtn.disabled = !this.isStepComplete(question.id);
    }
  }

  isStepComplete(questionId) {
    const answer = this.answers[questionId];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderQuestion();
      this.updateProgressBar();
    } else {
      // Final step - get recommendations
      this.getRecommendations();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderQuestion();
      this.updateProgressBar();
    }
  }

  async getRecommendations() {
    // Show loading in question container
    this.questionContainer.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Finding your perfect matches...</p>
        <p class="loading-subtitle">Analyzing with AI Bradaa's 84-mentor system</p>
      </div>
    `;

    try {
      const response = await apiClient.getRecommendations(this.answers);

      // Hide question container, show results
      this.questionContainer.style.display = 'none';
      this.resultsContainer.style.display = 'block';

      this.renderResults(response.data.recommendations || []);

      // Save to history
      await storage.addHistory({
        type: 'matchmaker',
        answers: this.answers,
        timestamp: Date.now()
      });

    } catch (error) {
      this.questionContainer.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary" id="retryBtn">Try Again</button>
        </div>
      `;

      document.getElementById('retryBtn')?.addEventListener('click', () => {
        this.currentStep = 1;
        this.questionContainer.style.display = 'block';
        this.resultsContainer.style.display = 'none';
        this.renderQuestion();
        this.updateProgressBar();
      });
    }
  }

  renderResults(recommendations) {
    this.resultsContainer.innerHTML = `
      <div class="results-header">
        <h2>🎯 Your Perfect Matches</h2>
        <p>Based on your preferences, here are the top 3 laptops we recommend:</p>
      </div>

      <div class="results-grid">
        ${recommendations.slice(0, 3).map((laptop, index) => `
          <div class="result-card">
            <div class="result-rank">#${index + 1}</div>
            <div class="result-image">
              <img src="${laptop.image || '/assets/default-laptop.png'}"
                   alt="${laptop.brand} ${laptop.model}" loading="lazy">
            </div>
            <div class="result-content">
              <h3>${laptop.brand} ${laptop.model}</h3>
              <p class="result-tagline">${laptop.tagline || ''}</p>

              <div class="result-specs">
                <span>💻 ${laptop.processor || laptop.cpu?.gen || 'N/A'}</span>
                <span>🧠 ${laptop.ram || laptop.ram?.gb || 0}GB</span>
                <span>💾 ${laptop.storage || laptop.storage?.gb || 0}GB</span>
                ${laptop.gpu || laptop.gpu?.chip ? `<span>🎮 ${laptop.gpu?.chip || laptop.gpu}</span>` : ''}
              </div>

              <div class="result-match">
                <span class="match-label">Match Score:</span>
                <span class="match-score">${laptop.matchScore || 85}%</span>
              </div>

              <div class="result-price">
                <span class="price-label">Best Price:</span>
                <span class="price-value">RM${this.formatPrice(laptop.price_myr || laptop.price || 0)}</span>
              </div>

              <div class="result-actions">
                <a href="/out/${laptop.id}" class="btn btn-primary" target="_blank">
                  View Offer
                </a>
                <button class="btn btn-secondary compare-btn" data-id="${laptop.id}">
                  Compare
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="results-footer">
        <button class="btn btn-secondary" id="startOverBtn">Start Over</button>
        <button class="btn btn-primary" id="exploreAllBtn">See All Laptops</button>
      </div>
    `;

    // Attach result button listeners
    document.getElementById('startOverBtn')?.addEventListener('click', () => {
      this.currentStep = 1;
      this.answers = {};
      this.questionContainer.style.display = 'block';
      this.resultsContainer.style.display = 'none';
      this.renderQuestion();
      this.updateProgressBar();
    });

    document.getElementById('exploreAllBtn')?.addEventListener('click', () => {
      window.parent.postMessage({ type: 'navigate', section: 'explorer' }, '*');
    });

    document.querySelectorAll('.compare-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.parent.postMessage({
          type: 'navigate',
          section: 'versus',
          laptopId: btn.dataset.id
        }, '*');
      });
    });
  }

  formatPrice(price) {
    if (!price) return '0';
    return price.toLocaleString('en-MY');
  }
}

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const matchmaker = new Matchmaker();
    matchmaker.init();
  });
} else {
  const matchmaker = new Matchmaker();
  matchmaker.init();
}
