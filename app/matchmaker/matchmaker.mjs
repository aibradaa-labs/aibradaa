/**
 * Matchmaker Module
 * 5-question wizard to match users with 3 perfect laptops
 */

import { apiClient } from '../shared/utils/api.mjs';
import { formatPrice } from '../shared/utils/formatters.mjs';

export class Matchmaker {
  constructor() {
    this.questions = [
      {
        id: 'budget',
        text: 'What\'s your budget?',
        type: 'range',
        options: [
          { value: '0-3000', label: 'Under RM 3,000' },
          { value: '3000-5000', label: 'RM 3,000 - 5,000' },
          { value: '5000-8000', label: 'RM 5,000 - 8,000' },
          { value: '8000-15000', label: 'RM 8,000 - 15,000' },
          { value: '15000+', label: 'Above RM 15,000' },
        ],
      },
      {
        id: 'use_case',
        text: 'What will you use it for?',
        type: 'multi-select',
        options: [
          { value: 'work', label: 'Work & Productivity' },
          { value: 'gaming', label: 'Gaming' },
          { value: 'creative', label: 'Creative Work (Photo/Video)' },
          { value: 'student', label: 'School/University' },
          { value: 'casual', label: 'Browsing & Entertainment' },
        ],
      },
      {
        id: 'portability',
        text: 'Do you need to carry it around?',
        type: 'single-select',
        options: [
          { value: 'very', label: 'Yes, daily commute' },
          { value: 'sometimes', label: 'Sometimes, occasional travel' },
          { value: 'no', label: 'No, stays at one place' },
        ],
      },
      {
        id: 'specs_priority',
        text: 'What matters most to you?',
        type: 'single-select',
        options: [
          { value: 'performance', label: 'Raw performance' },
          { value: 'battery', label: 'Long battery life' },
          { value: 'display', label: 'Display quality' },
          { value: 'portability', label: 'Light & thin' },
          { value: 'value', label: 'Best value for money' },
        ],
      },
      {
        id: 'brand_preference',
        text: 'Any brand preferences?',
        type: 'multi-select',
        options: [
          { value: 'apple', label: 'Apple' },
          { value: 'asus', label: 'ASUS' },
          { value: 'dell', label: 'Dell' },
          { value: 'hp', label: 'HP' },
          { value: 'lenovo', label: 'Lenovo' },
          { value: 'msi', label: 'MSI' },
          { value: 'any', label: 'No preference' },
        ],
      },
    ];

    this.currentStep = 0;
    this.answers = {};
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    return this.questions[this.currentStep];
  }

  /**
   * Answer current question and move to next
   */
  answer(value) {
    const question = this.getCurrentQuestion();
    if (!question) {
      throw new Error('No current question');
    }

    this.answers[question.id] = value;
    this.currentStep++;

    return {
      completed: this.isComplete(),
      nextQuestion: this.getCurrentQuestion(),
    };
  }

  /**
   * Go back to previous question
   */
  back() {
    if (this.currentStep > 0) {
      this.currentStep--;
      return this.getCurrentQuestion();
    }
    return null;
  }

  /**
   * Check if wizard is complete
   */
  isComplete() {
    return this.currentStep >= this.questions.length;
  }

  /**
   * Get all answers
   */
  getAnswers() {
    return this.answers;
  }

  /**
   * Get progress percentage
   */
  getProgress() {
    return Math.round((this.currentStep / this.questions.length) * 100);
  }

  /**
   * Submit answers and get recommendations
   */
  async submit() {
    if (!this.isComplete()) {
      throw new Error('Wizard not complete');
    }

    try {
      const response = await apiClient.post('/api/matchmaker/recommend', {
        answers: this.answers,
      });

      return response.data.recommendations || [];
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  /**
   * Reset wizard
   */
  reset() {
    this.currentStep = 0;
    this.answers = {};
  }
}

/**
 * Process answers locally (fallback if API fails)
 */
export function processAnswersLocally(answers, laptops) {
  // Parse budget range
  const [minBudget, maxBudget] = parseBudgetRange(answers.budget);

  // Filter by budget
  let matches = laptops.filter((laptop) => {
    const price = laptop.price;
    return price >= minBudget && price <= maxBudget;
  });

  // Score each laptop
  matches = matches.map((laptop) => {
    let score = 0;

    // Use case scoring
    const useCases = Array.isArray(answers.use_case) ? answers.use_case : [answers.use_case];
    useCases.forEach((useCase) => {
      if (useCase === 'gaming' && laptop.specs.gpu?.includes('RTX')) score += 10;
      if (useCase === 'creative' && laptop.specs.ram >= 16) score += 10;
      if (useCase === 'work' && laptop.specs.cpu?.includes('i7') || laptop.specs.cpu?.includes('Ryzen 7')) score += 8;
      if (useCase === 'student' && laptop.price < 4000) score += 10;
    });

    // Portability scoring
    if (answers.portability === 'very' && laptop.weight < 1.5) score += 15;
    if (answers.portability === 'sometimes' && laptop.weight < 2.0) score += 10;

    // Specs priority scoring
    if (answers.specs_priority === 'performance' && laptop.performanceScore > 80) score += 15;
    if (answers.specs_priority === 'battery' && laptop.batteryLife > 10) score += 15;
    if (answers.specs_priority === 'display' && laptop.display?.resolution >= '1920x1080') score += 10;
    if (answers.specs_priority === 'value' && laptop.valueScore > 8) score += 15;

    // Brand preference
    const brands = Array.isArray(answers.brand_preference) ? answers.brand_preference : [answers.brand_preference];
    if (!brands.includes('any')) {
      const laptopBrand = laptop.brand.toLowerCase();
      if (brands.includes(laptopBrand)) score += 10;
    }

    return { ...laptop, matchScore: score };
  });

  // Sort by score and return top 3
  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches.slice(0, 3);
}

/**
 * Parse budget range string
 */
function parseBudgetRange(budgetStr) {
  const ranges = {
    '0-3000': [0, 3000],
    '3000-5000': [3000, 5000],
    '5000-8000': [5000, 8000],
    '8000-15000': [8000, 15000],
    '15000+': [15000, 99999],
  };

  return ranges[budgetStr] || [0, 99999];
}

export default Matchmaker;
