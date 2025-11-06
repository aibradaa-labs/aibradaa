/**
 * Thinking v1 Prototype
 * Visual indicator for AI thinking/processing
 */

/**
 * Thinking animation
 */
export class ThinkingAnimation {
  constructor(container, options = {}) {
    this.container = container;
    this.type = options.type || 'dots'; // 'dots', 'typing', 'shimmer', 'thought-line'
    this.text = options.text || 'Thinking';
    this.speed = options.speed || 'normal'; // 'slow', 'normal', 'fast'

    this.element = null;
    this.animationInterval = null;
  }

  /**
   * Start animation
   */
  start() {
    if (this.animationInterval) return;

    this.element = this.createElement();
    this.container.appendChild(this.element);

    this.startAnimation();
  }

  /**
   * Stop animation
   */
  stop() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Create animation element
   */
  createElement() {
    const el = document.createElement('div');
    el.className = `thinking-animation thinking-${this.type}`;

    switch (this.type) {
      case 'dots':
        el.innerHTML = this.createDots();
        break;
      case 'typing':
        el.innerHTML = this.createTyping();
        break;
      case 'shimmer':
        el.innerHTML = this.createShimmer();
        break;
      case 'thought-line':
        el.innerHTML = this.createThoughtLine();
        break;
      default:
        el.innerHTML = this.createDots();
    }

    return el;
  }

  /**
   * Create dots animation HTML
   */
  createDots() {
    return `
      <span class="thinking-text">${this.text}</span>
      <span class="thinking-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </span>
    `;
  }

  /**
   * Create typing animation HTML
   */
  createTyping() {
    return `
      <span class="thinking-text">${this.text}</span>
      <span class="thinking-cursor">|</span>
    `;
  }

  /**
   * Create shimmer animation HTML
   */
  createShimmer() {
    return `
      <div class="shimmer-box">
        <div class="shimmer-line shimmer-line-long"></div>
        <div class="shimmer-line shimmer-line-medium"></div>
        <div class="shimmer-line shimmer-line-short"></div>
      </div>
    `;
  }

  /**
   * Create thought line animation HTML
   */
  createThoughtLine() {
    return `
      <div class="thought-line-container">
        <div class="thought-line"></div>
        <span class="thought-text">${this.text}</span>
      </div>
    `;
  }

  /**
   * Start CSS animation
   */
  startAnimation() {
    // Most animations are CSS-based
    // This method can add JS-based animations if needed

    if (this.type === 'typing') {
      this.animateTyping();
    }
  }

  /**
   * Animate typing effect
   */
  animateTyping() {
    const cursor = this.element.querySelector('.thinking-cursor');
    if (!cursor) return;

    let visible = true;

    this.animationInterval = setInterval(() => {
      cursor.style.opacity = visible ? '1' : '0';
      visible = !visible;
    }, 500);
  }

  /**
   * Update text
   */
  setText(text) {
    this.text = text;

    if (this.element) {
      const textEl = this.element.querySelector('.thinking-text, .thought-text');
      if (textEl) {
        textEl.textContent = text;
      }
    }
  }

  /**
   * Change animation type
   */
  setType(type) {
    this.stop();
    this.type = type;
    this.start();
  }
}

/**
 * Show thinking indicator
 */
export function showThinking(container, options = {}) {
  const animation = new ThinkingAnimation(container, options);
  animation.start();
  return animation;
}

/**
 * Hide thinking indicator
 */
export function hideThinking(animation) {
  if (animation) {
    animation.stop();
  }
}

export default ThinkingAnimation;
