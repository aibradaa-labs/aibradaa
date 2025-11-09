/**
 * Matchmaker Tool - AI-Powered Laptop Matching Wizard
 * AI Bradaa - 5-Step Quiz System
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Matchmaker {
  constructor() {
    this.currentStep = 1;
    this.answers = {};
    this.questions = [
      {
        step: 1,
        id: 'budget',
        question: "What's your budget range?",
        type: 'buttons',
        options: [
          { value: 'under_3k', label: 'Under RM3,000', icon: '💰' },
          { value: '3k_5k', label: 'RM3,000 - RM5,000', icon: '💵' },
          { value: '5k_8k', label: 'RM5,000 - RM8,000', icon: '💸' },
          { value: 'above_8k', label: 'Above RM8,000', icon: '🤑' }
        ]
      },
      {
        step: 2,
        id: 'use_case',
        question: 'What will you use it for?',
        type: 'multi-select',
        options: [
          { value: 'work', label: 'Work & Productivity', icon: '💼' },
          { value: 'gaming', label: 'Gaming', icon: '🎮' },
          { value: 'creative', label: 'Creative Work (Video/Photo)', icon: '🎨' },
          { value: 'coding', label: 'Software Development', icon: '💻' },
          { value: 'student', label: 'Student / General Use', icon: '📚' }
        ]
      },
      {
        step: 3,
        id: 'specs',
        question: 'Any specific requirements?',
        type: 'checkboxes',
        options: [
          { value: 'dedicated_gpu', label: 'Dedicated Graphics Card', icon: '🖥️' },
          { value: 'long_battery', label: 'Long Battery Life (>8hrs)', icon: '🔋' },
          { value: 'lightweight', label: 'Lightweight & Portable (<2kg)', icon: '⚖️' },
          { value: 'touchscreen', label: 'Touchscreen Display', icon: '👆' },
          { value: 'high_refresh', label: 'High Refresh Rate Display', icon: '⚡' }
        ]
      },
      {
        step: 4,
        id: 'priorities',
        question: 'What matters most to you?',
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
        step: 5,
        id: 'preferences',
        question: 'Any brand or OS preferences?',
        type: 'select',
        options: [
          { value: 'no_pref', label: 'No Preference - Just the best match!' },
          { value: 'apple', label: 'Apple (macOS)' },
          { value: 'windows', label: 'Windows (Any Brand)' },
          { value: 'gaming_brands', label: 'Gaming Brands (ASUS ROG, MSI, Alienware)' },
          { value: 'business', label: 'Business-Class (ThinkPad, Dell Latitude)' }
        ]
      }
    ];
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const question = this.questions[this.currentStep - 1];
    const container = document.getElementById('questionContainer');

    container.innerHTML = `
      <div class="question-card fade-in">
        <div class="question-header">
          <h2 class="question-text">${question.question}</h2>
          <p class="question-subtitle">Step ${this.currentStep} of 5</p>
        </div>
        <div class="question-body">
          ${this.renderOptions(question)}
        </div>
        <div class="question-actions">
          ${this.currentStep > 1 ? '<button class="btn btn-secondary" id="prevBtn">← Previous</button>' : ''}
          <button class="btn btn-primary" id="nextBtn" ${!this.answers[question.id] ? 'disabled' : ''}>
            ${this.currentStep === 5 ? 'Find Matches 🎯' : 'Next →'}
          </button>
        </div>
      </div>
    `;

    this.updateProgressBar();
  }

  renderOptions(question) {
    switch (question.type) {
      case 'buttons':
        return this.renderButtons(question);
      case 'multi-select':
        return this.renderMultiSelect(question);
      case 'checkboxes':
        return this.renderCheckboxes(question);
      case 'ranking':
        return this.renderRanking(question);
      case 'select':
        return this.renderSelect(question);
      default:
        return '';
    }
  }

  renderButtons(question) {
    return `
      <div class="options-grid options-buttons">
        ${question.options.map(opt => `
          <button class="option-btn ${this.answers[question.id] === opt.value ? 'selected' : ''}"
                  data-value="${opt.value}">
            <span class="option-icon">${opt.icon}</span>
            <span class="option-label">${opt.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  renderMultiSelect(question) {
    const selectedValues = this.answers[question.id] || [];
    return `
      <div class="options-grid options-multi">
        ${question.options.map(opt => `
          <button class="option-btn ${selectedValues.includes(opt.value) ? 'selected' : ''}"
                  data-value="${opt.value}">
            <span class="option-icon">${opt.icon}</span>
            <span class="option-label">${opt.label}</span>
            ${selectedValues.includes(opt.value) ? '<span class="checkmark">✓</span>' : ''}
          </button>
        `).join('')}
      </div>
      <p class="hint">Select all that apply</p>
    `;
  }

  renderCheckboxes(question) {
    const selectedValues = this.answers[question.id] || [];
    return `
      <div class="options-list">
        ${question.options.map(opt => `
          <label class="checkbox-option ${selectedValues.includes(opt.value) ? 'selected' : ''}">
            <input type="checkbox" value="${opt.value}" ${selectedValues.includes(opt.value) ? 'checked' : ''}>
            <span class="checkbox-icon">${opt.icon}</span>
            <span class="checkbox-label">${opt.label}</span>
            <span class="checkbox-mark"></span>
          </label>
        `).join('')}
      </div>
      <p class="hint">Optional - Select if important to you</p>
    `;
  }

  renderRanking(question) {
    return `
      <div class="options-ranking">
        <p class="hint">Drag to reorder by priority (most important at top)</p>
        <ul class="ranking-list" id="rankingList">
          ${question.options.map((opt, index) => `
            <li class="ranking-item" data-value="${opt.value}" draggable="true">
              <span class="ranking-number">${index + 1}</span>
              <span class="ranking-icon">${opt.icon}</span>
              <span class="ranking-label">${opt.label}</span>
              <span class="drag-handle">⋮⋮</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  renderSelect(question) {
    return `
      <div class="options-select">
        <select class="select-dropdown" id="preferenceSelect">
          <option value="">-- Choose One --</option>
          ${question.options.map(opt => `
            <option value="${opt.value}" ${this.answers[question.id] === opt.value ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  attachEventListeners() {
    const container = document.getElementById('questionContainer');
    const question = this.questions[this.currentStep - 1];

    // Button options
    if (question.type === 'buttons') {
      container.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.answers[question.id] = btn.dataset.value;
          this.render();
          this.attachEventListeners();
        });
      });
    }

    // Multi-select
    if (question.type === 'multi-select') {
      container.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!this.answers[question.id]) this.answers[question.id] = [];
          const value = btn.dataset.value;
          const index = this.answers[question.id].indexOf(value);
          if (index > -1) {
            this.answers[question.id].splice(index, 1);
          } else {
            this.answers[question.id].push(value);
          }
          this.render();
          this.attachEventListeners();
        });
      });
    }

    // Checkboxes
    if (question.type === 'checkboxes') {
      container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
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
      this.setupDragAndDrop();
      this.answers[question.id] = question.options.map(opt => opt.value);
      this.updateNextButton();
    }

    // Select dropdown
    if (question.type === 'select') {
      const select = container.querySelector('#preferenceSelect');
      select.addEventListener('change', () => {
        this.answers[question.id] = select.value;
        this.updateNextButton();
      });
    }

    // Navigation buttons
    const nextBtn = container.querySelector('#nextBtn');
    const prevBtn = container.querySelector('#prevBtn');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }
  }

  setupDragAndDrop() {
    const list = document.getElementById('rankingList');
    const items = list.querySelectorAll('.ranking-item');
    let draggedItem = null;

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        this.updateRankingOrder();
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

  updateRankingOrder() {
    const list = document.getElementById('rankingList');
    const items = list.querySelectorAll('.ranking-item');
    const question = this.questions[this.currentStep - 1];

    this.answers[question.id] = Array.from(items).map(item => item.dataset.value);

    // Update numbers
    items.forEach((item, index) => {
      item.querySelector('.ranking-number').textContent = index + 1;
    });
  }

  updateProgressBar() {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
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
      const hasAnswer = this.answers[question.id] &&
        (Array.isArray(this.answers[question.id]) ? this.answers[question.id].length > 0 : true);
      nextBtn.disabled = !hasAnswer;
    }
  }

  async nextStep() {
    if (this.currentStep < 5) {
      this.currentStep++;
      this.render();
      this.attachEventListeners();
    } else {
      // Final step - get recommendations
      await this.getRecommendations();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
      this.attachEventListeners();
    }
  }

  async getRecommendations() {
    const container = document.getElementById('questionContainer');
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Finding your perfect matches...</p>
        <p class="loading-subtitle">Analyzing 100+ laptops with AI Bradaa's 84-mentor system</p>
      </div>
    `;

    try {
      const response = await apiClient.getRecommendations(this.answers);
      this.displayResults(response.data.recommendations);

      // Save to history
      await storage.addHistory({
        type: 'matchmaker',
        answers: this.answers,
        results: response.data.recommendations
      });
    } catch (error) {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
        </div>
      `;
    }
  }

  displayResults(recommendations) {
    const container = document.getElementById('questionContainer');
    const resultsContainer = document.getElementById('resultsContainer');

    container.style.display = 'none';
    resultsContainer.style.display = 'block';

    resultsContainer.innerHTML = `
      <div class="results-header">
        <h2>🎯 Your Perfect Matches</h2>
        <p>Based on your preferences, here are the top 3 laptops we recommend:</p>
      </div>

      <div class="results-grid">
        ${recommendations.slice(0, 3).map((laptop, index) => `
          <div class="result-card rank-${index + 1}">
            <div class="result-rank">#${index + 1}</div>
            <div class="result-image">
              <img src="${laptop.image || '/assets/default-laptop.png'}" alt="${laptop.brand} ${laptop.model}">
            </div>
            <div class="result-content">
              <h3>${laptop.brand} ${laptop.model}</h3>
              <p class="result-tagline">${laptop.tagline || ''}</p>
              <div class="result-specs">
                <span>💻 ${laptop.processor}</span>
                <span>🧠 ${laptop.ram}</span>
                <span>💾 ${laptop.storage}</span>
                ${laptop.gpu ? `<span>🎮 ${laptop.gpu}</span>` : ''}
              </div>
              <div class="result-match-score">
                <span class="score-label">Match Score:</span>
                <span class="score-value">${laptop.matchScore}%</span>
              </div>
              <div class="result-price">
                <span class="price-label">Best Price:</span>
                <span class="price-value">RM${laptop.price.toLocaleString()}</span>
              </div>
              <div class="result-actions">
                <a href="/out/${laptop.id}" class="btn btn-primary" target="_blank">View Offer</a>
                <button class="btn btn-secondary" onclick="parent.postMessage({type: 'compare', id: '${laptop.id}'}, '*')">
                  Compare
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="results-actions">
        <button class="btn btn-secondary" onclick="location.reload()">Start Over</button>
        <button class="btn btn-primary" onclick="parent.postMessage({type: 'explore'}, '*')">See All Laptops</button>
      </div>
    `;
  }
}
