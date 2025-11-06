/**
 * Card Component
 * Holographic card for displaying laptop info
 */

import { formatPrice } from '../utils/formatters.mjs';

export class Card {
  constructor(options = {}) {
    this.laptop = options.laptop || {};
    this.variant = options.variant || 'default'; // default, compact, detailed
    this.interactive = options.interactive !== false;
    this.onClickcompare = options.onClick || (() => {});
    this.onCompare = options.onCompare || null;
    this.onFavorite = options.onFavorite || null;

    this.element = null;
  }

  /**
   * Render card element
   */
  render() {
    const card = document.createElement('div');
    card.className = this.getClassNames();
    card.setAttribute('data-laptop-id', this.laptop.id);

    // Holographic effect overlay
    const holo = document.createElement('div');
    holo.className = 'card-holo-effect';
    card.appendChild(holo);

    // Card content
    const content = document.createElement('div');
    content.className = 'card-content';

    // Header (image + brand badge)
    const header = this.renderHeader();
    content.appendChild(header);

    // Body (specs)
    const body = this.renderBody();
    content.appendChild(body);

    // Footer (price + actions)
    const footer = this.renderFooter();
    content.appendChild(footer);

    card.appendChild(content);

    // Click handler
    if (this.interactive) {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.card-action-btn')) {
          this.onClick(this.laptop);
        }
      });

      // Holographic effect on mouse move
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        holo.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(216, 63, 135, 0.3), rgba(0, 240, 255, 0.3))`;
      });

      card.addEventListener('mouseleave', () => {
        holo.style.background = '';
      });
    }

    this.element = card;
    return card;
  }

  /**
   * Render card header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'card-header';

    // Image
    const img = document.createElement('img');
    img.src = this.laptop.image || '/assets/placeholder-laptop.png';
    img.alt = `${this.laptop.brand} ${this.laptop.model}`;
    img.className = 'card-image';
    img.loading = 'lazy';
    header.appendChild(img);

    // Brand badge
    const badge = document.createElement('div');
    badge.className = 'card-badge';
    badge.textContent = this.laptop.brand;
    header.appendChild(badge);

    // Rank badge (if top 10)
    if (this.laptop.rank && this.laptop.rank <= 10) {
      const rankBadge = document.createElement('div');
      rankBadge.className = 'card-rank-badge';
      rankBadge.textContent = `#${this.laptop.rank}`;
      header.appendChild(rankBadge);
    }

    return header;
  }

  /**
   * Render card body
   */
  renderBody() {
    const body = document.createElement('div');
    body.className = 'card-body';

    // Title
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = this.laptop.model;
    body.appendChild(title);

    // Specs (vary by variant)
    if (this.variant === 'detailed') {
      body.appendChild(this.renderDetailedSpecs());
    } else {
      body.appendChild(this.renderCompactSpecs());
    }

    // Tags
    if (this.laptop.tags && this.laptop.tags.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'card-tags';
      this.laptop.tags.slice(0, 3).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'card-tag';
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
      });
      body.appendChild(tags);
    }

    return body;
  }

  /**
   * Render compact specs
   */
  renderCompactSpecs() {
    const specs = document.createElement('div');
    specs.className = 'card-specs-compact';

    const items = [
      { icon: '🖥️', value: this.laptop.specs?.cpu || 'N/A' },
      { icon: '🎮', value: this.laptop.specs?.gpu || 'Integrated' },
      { icon: '💾', value: `${this.laptop.specs?.ram || 0}GB RAM` },
      { icon: '📦', value: `${this.laptop.specs?.storage || 0}GB` },
    ];

    items.forEach(item => {
      const specItem = document.createElement('div');
      specItem.className = 'card-spec-item';
      specItem.innerHTML = `<span class="spec-icon">${item.icon}</span> <span class="spec-value">${item.value}</span>`;
      specs.appendChild(specItem);
    });

    return specs;
  }

  /**
   * Render detailed specs
   */
  renderDetailedSpecs() {
    const specs = document.createElement('div');
    specs.className = 'card-specs-detailed';

    const details = [
      { label: 'Processor', value: this.laptop.specs?.cpu },
      { label: 'Graphics', value: this.laptop.specs?.gpu },
      { label: 'Memory', value: `${this.laptop.specs?.ram}GB RAM` },
      { label: 'Storage', value: `${this.laptop.specs?.storage}GB ${this.laptop.specs?.storageType || ''}` },
      { label: 'Display', value: `${this.laptop.specs?.displaySize}" ${this.laptop.specs?.resolution || ''}` },
      { label: 'Weight', value: `${this.laptop.specs?.weight}kg` },
      { label: 'Battery', value: `${this.laptop.specs?.batteryLife}h` },
    ];

    details.forEach(detail => {
      if (detail.value && detail.value !== 'undefined' && detail.value !== 'nullnull') {
        const row = document.createElement('div');
        row.className = 'card-spec-row';
        row.innerHTML = `<span class="spec-label">${detail.label}:</span> <span class="spec-value">${detail.value}</span>`;
        specs.appendChild(row);
      }
    });

    return specs;
  }

  /**
   * Render card footer
   */
  renderFooter() {
    const footer = document.createElement('div');
    footer.className = 'card-footer';

    // Price
    const price = document.createElement('div');
    price.className = 'card-price';
    price.textContent = formatPrice(this.laptop.price);
    footer.appendChild(price);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    // Compare button
    if (this.onCompare) {
      const compareBtn = document.createElement('button');
      compareBtn.className = 'card-action-btn card-compare-btn';
      compareBtn.innerHTML = '⚖️';
      compareBtn.title = 'Compare';
      compareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onCompare(this.laptop);
      });
      actions.appendChild(compareBtn);
    }

    // Favorite button
    if (this.onFavorite) {
      const favBtn = document.createElement('button');
      favBtn.className = 'card-action-btn card-favorite-btn';
      favBtn.innerHTML = '❤️';
      favBtn.title = 'Add to favorites';
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onFavorite(this.laptop);
        favBtn.classList.toggle('favorited');
      });
      actions.appendChild(favBtn);
    }

    footer.appendChild(actions);

    return footer;
  }

  /**
   * Get CSS class names
   */
  getClassNames() {
    const classes = ['ai-card', `ai-card-${this.variant}`];
    if (this.interactive) classes.push('ai-card-interactive');
    return classes.join(' ');
  }

  /**
   * Update laptop data
   */
  update(laptop) {
    this.laptop = laptop;
    if (this.element) {
      const newCard = this.render();
      this.element.replaceWith(newCard);
    }
  }

  /**
   * Destroy card
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * Create card helper function
 */
export function createCard(options) {
  const card = new Card(options);
  return card.render();
}

export default Card;
