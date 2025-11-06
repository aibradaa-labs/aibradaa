/**
 * Deck v2 Prototype
 * Stackable card interface for AI responses
 */

/**
 * Deck card types
 */
export const CardTypes = {
  ANSWER: 'answer',
  WHY_HOW: 'why-how',
  TRADEOFFS: 'tradeoffs',
  STEPS: 'steps',
  OFFER: 'offer',
  RISK: 'risk',
  SOURCES: 'sources',
  NEXT: 'next',
};

/**
 * Deck v2 class
 */
export class Deck {
  constructor(container, options = {}) {
    this.container = container;
    this.cards = [];
    this.currentIndex = 0;
    this.onCardChange = options.onCardChange || (() => {});
    this.onExport = options.onExport || (() => {});
  }

  /**
   * Load cards into deck
   */
  load(cards) {
    this.cards = cards.map((card, index) => ({
      ...card,
      index,
      pinned: false,
    }));

    this.render();
  }

  /**
   * Render deck
   */
  render() {
    this.container.innerHTML = '';

    const deckEl = document.createElement('div');
    deckEl.className = 'deck-container';

    // Create card stack
    this.cards.forEach((card, index) => {
      const cardEl = this.createCardElement(card, index);
      deckEl.appendChild(cardEl);
    });

    // Add navigation
    const nav = this.createNavigation();
    deckEl.appendChild(nav);

    this.container.appendChild(deckEl);
  }

  /**
   * Create card element
   */
  createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = `deck-card deck-card-${card.type}`;
    cardEl.dataset.index = index;

    // Calculate card position (stacked effect)
    const offset = Math.min(index * 10, 50);
    cardEl.style.transform = `translateY(${offset}px) scale(${1 - index * 0.02})`;
    cardEl.style.zIndex = 100 - index;

    // Mark as current
    if (index === this.currentIndex) {
      cardEl.classList.add('deck-card-current');
    }

    // Card header
    const header = document.createElement('div');
    header.className = 'deck-card-header';

    const title = document.createElement('h3');
    title.textContent = card.title;
    header.appendChild(title);

    // Pin button
    const pinBtn = document.createElement('button');
    pinBtn.className = 'deck-card-pin-btn';
    pinBtn.innerHTML = card.pinned ? '📌' : '📍';
    pinBtn.onclick = () => this.togglePin(index);
    header.appendChild(pinBtn);

    cardEl.appendChild(header);

    // Card content
    const content = document.createElement('div');
    content.className = 'deck-card-content';
    content.innerHTML = this.formatContent(card.content, card.type);
    cardEl.appendChild(content);

    // Card footer (metadata)
    if (card.metadata) {
      const footer = document.createElement('div');
      footer.className = 'deck-card-footer';
      footer.innerHTML = this.formatMetadata(card.metadata);
      cardEl.appendChild(footer);
    }

    // Click to expand
    cardEl.onclick = () => this.goToCard(index);

    return cardEl;
  }

  /**
   * Format card content based on type
   */
  formatContent(content, type) {
    switch (type) {
      case CardTypes.ANSWER:
        return `<p class="card-answer">${content}</p>`;

      case CardTypes.TRADEOFFS:
        return this.formatTradeoffs(content);

      case CardTypes.STEPS:
        return this.formatSteps(content);

      case CardTypes.OFFER:
        return this.formatOffer(content);

      case CardTypes.SOURCES:
        return this.formatSources(content);

      default:
        return `<p>${content}</p>`;
    }
  }

  /**
   * Format tradeoffs
   */
  formatTradeoffs(content) {
    if (typeof content === 'string') {
      return `<p>${content}</p>`;
    }

    const { pros = [], cons = [] } = content;

    let html = '<div class="tradeoffs">';

    if (pros.length > 0) {
      html += '<div class="tradeoffs-pros"><h4>Pros</h4><ul>';
      pros.forEach(pro => {
        html += `<li class="pro-item">✓ ${pro}</li>`;
      });
      html += '</ul></div>';
    }

    if (cons.length > 0) {
      html += '<div class="tradeoffs-cons"><h4>Cons</h4><ul>';
      cons.forEach(con => {
        html += `<li class="con-item">✗ ${con}</li>`;
      });
      html += '</ul></div>';
    }

    html += '</div>';

    return html;
  }

  /**
   * Format steps
   */
  formatSteps(content) {
    if (typeof content === 'string') {
      return `<p>${content}</p>`;
    }

    if (Array.isArray(content)) {
      let html = '<ol class="steps-list">';
      content.forEach(step => {
        html += `<li class="step-item">${step}</li>`;
      });
      html += '</ol>';
      return html;
    }

    return `<p>${JSON.stringify(content)}</p>`;
  }

  /**
   * Format offer
   */
  formatOffer(content) {
    if (typeof content === 'string') {
      return `<p>${content}</p>`;
    }

    const { laptop, price, link } = content;

    return `
      <div class="offer-card">
        <h4>${laptop}</h4>
        <p class="offer-price">${price}</p>
        ${link ? `<a href="${link}" class="offer-link" target="_blank">View Offer</a>` : ''}
      </div>
    `;
  }

  /**
   * Format sources
   */
  formatSources(content) {
    if (typeof content === 'string') {
      return `<p>${content}</p>`;
    }

    if (Array.isArray(content)) {
      let html = '<ul class="sources-list">';
      content.forEach(source => {
        html += `<li class="source-item">
          <a href="${source.url}" target="_blank">${source.title}</a>
          ${source.date ? `<span class="source-date">${source.date}</span>` : ''}
        </li>`;
      });
      html += '</ul>';
      return html;
    }

    return `<p>${JSON.stringify(content)}</p>`;
  }

  /**
   * Format metadata
   */
  formatMetadata(metadata) {
    const { model, tokens, timestamp } = metadata;

    let html = '<div class="card-metadata">';

    if (model) {
      html += `<span class="metadata-item">Model: ${model}</span>`;
    }

    if (tokens) {
      html += `<span class="metadata-item">Tokens: ${tokens}</span>`;
    }

    if (timestamp) {
      html += `<span class="metadata-item">Generated: ${new Date(timestamp).toLocaleTimeString()}</span>`;
    }

    html += '</div>';

    return html;
  }

  /**
   * Create navigation
   */
  createNavigation() {
    const nav = document.createElement('div');
    nav.className = 'deck-navigation';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'deck-nav-btn deck-nav-prev';
    prevBtn.textContent = '← Previous';
    prevBtn.onclick = () => this.previous();
    prevBtn.disabled = this.currentIndex === 0;
    nav.appendChild(prevBtn);

    // Card indicator
    const indicator = document.createElement('span');
    indicator.className = 'deck-indicator';
    indicator.textContent = `${this.currentIndex + 1} / ${this.cards.length}`;
    nav.appendChild(indicator);

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'deck-nav-btn deck-nav-next';
    nextBtn.textContent = 'Next →';
    nextBtn.onclick = () => this.next();
    nextBtn.disabled = this.currentIndex === this.cards.length - 1;
    nav.appendChild(nextBtn);

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'deck-nav-btn deck-export-btn';
    exportBtn.textContent = 'Export';
    exportBtn.onclick = () => this.export();
    nav.appendChild(exportBtn);

    return nav;
  }

  /**
   * Navigate to specific card
   */
  goToCard(index) {
    if (index < 0 || index >= this.cards.length) return;

    this.currentIndex = index;
    this.render();
    this.onCardChange(this.cards[index], index);
  }

  /**
   * Go to next card
   */
  next() {
    if (this.currentIndex < this.cards.length - 1) {
      this.goToCard(this.currentIndex + 1);
    }
  }

  /**
   * Go to previous card
   */
  previous() {
    if (this.currentIndex > 0) {
      this.goToCard(this.currentIndex - 1);
    }
  }

  /**
   * Toggle pin on card
   */
  togglePin(index) {
    this.cards[index].pinned = !this.cards[index].pinned;
    this.render();
  }

  /**
   * Export deck
   */
  export(format = 'md') {
    this.onExport(this.cards, format);
  }

  /**
   * Get current card
   */
  getCurrentCard() {
    return this.cards[this.currentIndex];
  }

  /**
   * Get all cards
   */
  getAllCards() {
    return this.cards;
  }
}

export default Deck;
