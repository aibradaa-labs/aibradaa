/**
 * Laptop Card Component
 * Reusable laptop display card with consistent styling
 */

import { formatCurrency } from '../utils/helpers.js';
import { getDB } from '../utils/db.js';

export class LaptopCard {
  /**
   * Create a laptop card element
   * @param {Object} laptop - Laptop data
   * @param {Object} options - Display options
   */
  static async create(laptop, options = {}) {
    const {
      showFavorite = true,
      showCompare = true,
      showSpecs = true,
      variant = 'default', // default, compact, detailed
      onView = null,
      onCompare = null,
      onFavorite = null
    } = options;

    const card = document.createElement('div');
    card.className = this.getCardClasses(variant);
    card.dataset.laptopId = laptop.id;

    // Check if favorited
    const db = await getDB();
    const isFavorited = await db.isFavorite(laptop.id);

    // Build card HTML
    card.innerHTML = `
      <div class="relative">
        ${laptop.badge ? `<span class="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">${laptop.badge}</span>` : ''}
        ${showFavorite ? `<button class="favorite-btn absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors" data-favorited="${isFavorited}">
          ${isFavorited ? '❤️' : '🤍'}
        </button>` : ''}
        <img
          src="${laptop.image || '/images/placeholder-laptop.jpg'}"
          alt="${laptop.brand} ${laptop.model}"
          class="w-full h-48 object-cover rounded-t-lg"
          loading="lazy"
        >
      </div>

      <div class="p-4 flex-1 flex flex-col">
        <!-- Brand & Model -->
        <div class="mb-3">
          <p class="text-sm text-gray-500 font-medium">${laptop.brand}</p>
          <h3 class="text-lg font-bold text-gray-900 line-clamp-2">${laptop.model}</h3>
        </div>

        <!-- Price & Score -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-2xl font-bold text-indigo-600">${formatCurrency(laptop.price_MYR)}</p>
            ${laptop.originalPrice ? `<p class="text-sm text-gray-400 line-through">${formatCurrency(laptop.originalPrice)}</p>` : ''}
          </div>
          ${laptop.score_composite ? `
            <div class="flex items-center gap-1">
              <span class="text-2xl font-bold">${laptop.score_composite}</span>
              <div class="flex flex-col text-xs text-gray-500">
                <span>/100</span>
              </div>
            </div>
          ` : ''}
        </div>

        ${showSpecs && variant !== 'compact' ? this.renderSpecs(laptop) : ''}

        <!-- Tags/Features -->
        ${laptop.tags ? `
          <div class="flex flex-wrap gap-2 mb-4">
            ${laptop.tags.slice(0, 3).map(tag => `
              <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">${tag}</span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="mt-auto flex gap-2">
          <button class="view-btn flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            View Details
          </button>
          ${showCompare ? `
            <button class="compare-btn bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Compare
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners(card, laptop, {
      onView,
      onCompare,
      onFavorite: async (laptopId, currentState) => {
        const db = await getDB();
        if (currentState) {
          await db.removeFavorite(laptopId);
          return false;
        } else {
          await db.addFavorite(laptopId);
          return true;
        }
      }
    });

    return card;
  }

  /**
   * Get CSS classes based on variant
   */
  static getCardClasses(variant) {
    const baseClasses = 'bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden';

    switch (variant) {
      case 'compact':
        return `${baseClasses} max-w-sm`;
      case 'detailed':
        return `${baseClasses} max-w-md`;
      default:
        return baseClasses;
    }
  }

  /**
   * Render specs section
   */
  static renderSpecs(laptop) {
    const specs = [];

    if (laptop.cpu?.gen) {
      specs.push({ icon: '🖥️', label: 'CPU', value: laptop.cpu.gen });
    }
    if (laptop.ram?.gb) {
      specs.push({ icon: '💾', label: 'RAM', value: `${laptop.ram.gb}GB` });
    }
    if (laptop.storage?.gb) {
      specs.push({ icon: '💿', label: 'Storage', value: `${laptop.storage.gb}GB` });
    }
    if (laptop.display?.size) {
      specs.push({ icon: '📺', label: 'Display', value: laptop.display.size });
    }
    if (laptop.gpu?.model) {
      specs.push({ icon: '🎮', label: 'GPU', value: laptop.gpu.model });
    }

    if (specs.length === 0) return '';

    return `
      <div class="space-y-2 mb-4">
        ${specs.slice(0, 4).map(spec => `
          <div class="flex items-center gap-2 text-sm">
            <span class="text-lg">${spec.icon}</span>
            <span class="text-gray-500">${spec.label}:</span>
            <span class="font-medium text-gray-900">${spec.value}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Attach event listeners to card elements
   */
  static attachEventListeners(card, laptop, callbacks) {
    const { onView, onCompare, onFavorite } = callbacks;

    // View button
    const viewBtn = card.querySelector('.view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        if (onView) {
          onView(laptop);
        } else {
          window.location.href = `/laptop/${laptop.id}`;
        }
      });
    }

    // Compare button
    const compareBtn = card.querySelector('.compare-btn');
    if (compareBtn) {
      compareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onCompare) {
          onCompare(laptop);
        } else {
          // Add to comparison state
          const event = new CustomEvent('laptop-compare', { detail: laptop });
          window.dispatchEvent(event);
        }
      });
    }

    // Favorite button
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        const isFavorited = favoriteBtn.dataset.favorited === 'true';
        const newState = await onFavorite(laptop.id, isFavorited);

        // Update button state
        favoriteBtn.dataset.favorited = newState;
        favoriteBtn.innerHTML = newState ? '❤️' : '🤍';

        // Show toast
        const event = new CustomEvent('show-toast', {
          detail: {
            message: newState ? 'Added to favorites' : 'Removed from favorites',
            type: 'success'
          }
        });
        window.dispatchEvent(event);
      });
    }
  }

  /**
   * Create a skeleton loader card
   */
  static createSkeleton() {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden animate-pulse';

    card.innerHTML = `
      <div class="w-full h-48 bg-gray-300"></div>
      <div class="p-4">
        <div class="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div class="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div class="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div class="space-y-2 mb-4">
          <div class="h-4 bg-gray-300 rounded"></div>
          <div class="h-4 bg-gray-300 rounded"></div>
          <div class="h-4 bg-gray-300 rounded"></div>
        </div>
        <div class="h-10 bg-gray-300 rounded"></div>
      </div>
    `;

    return card;
  }

  /**
   * Create multiple skeleton cards
   */
  static createSkeletons(count = 3) {
    return Array.from({ length: count }, () => this.createSkeleton());
  }
}

export default LaptopCard;
