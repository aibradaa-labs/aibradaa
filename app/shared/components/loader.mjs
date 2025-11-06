/**
 * Loader Component
 * Loading indicators and skeleton screens
 */

export class Loader {
  constructor(options = {}) {
    this.type = options.type || 'spinner'; // spinner, dots, skeleton, progress
    this.size = options.size || 'medium'; // small, medium, large
    this.text = options.text || '';
    this.overlay = options.overlay || false;
    this.fullscreen = options.fullscreen || false;

    this.element = null;
  }

  /**
   * Render loader element
   */
  render() {
    const loader = document.createElement('div');
    loader.className = this.getClassNames();

    if (this.overlay || this.fullscreen) {
      const overlay = document.createElement('div');
      overlay.className = 'loader-overlay';
      if (this.fullscreen) {
        overlay.classList.add('loader-fullscreen');
      }

      const content = document.createElement('div');
      content.className = 'loader-content';
      content.appendChild(this.renderLoaderElement());

      if (this.text) {
        const text = document.createElement('div');
        text.className = 'loader-text';
        text.textContent = this.text;
        content.appendChild(text);
      }

      overlay.appendChild(content);
      loader.appendChild(overlay);
    } else {
      loader.appendChild(this.renderLoaderElement());

      if (this.text) {
        const text = document.createElement('div');
        text.className = 'loader-text';
        text.textContent = this.text;
        loader.appendChild(text);
      }
    }

    this.element = loader;
    return loader;
  }

  /**
   * Render specific loader type
   */
  renderLoaderElement() {
    switch (this.type) {
      case 'spinner':
        return this.renderSpinner();
      case 'dots':
        return this.renderDots();
      case 'progress':
        return this.renderProgress();
      case 'skeleton':
        return this.renderSkeleton();
      default:
        return this.renderSpinner();
    }
  }

  /**
   * Render spinner loader
   */
  renderSpinner() {
    const spinner = document.createElement('div');
    spinner.className = `loader-spinner loader-spinner-${this.size}`;
    spinner.innerHTML = '<div class="spinner-circle"></div>';
    return spinner;
  }

  /**
   * Render dots loader
   */
  renderDots() {
    const dots = document.createElement('div');
    dots.className = `loader-dots loader-dots-${this.size}`;
    dots.innerHTML = '<span></span><span></span><span></span>';
    return dots;
  }

  /**
   * Render progress bar
   */
  renderProgress() {
    const progress = document.createElement('div');
    progress.className = `loader-progress loader-progress-${this.size}`;
    progress.innerHTML = '<div class="progress-bar"></div>';
    return progress;
  }

  /**
   * Render skeleton loader
   */
  renderSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = `loader-skeleton loader-skeleton-${this.size}`;
    skeleton.innerHTML = `
      <div class="skeleton-line skeleton-line-full"></div>
      <div class="skeleton-line skeleton-line-full"></div>
      <div class="skeleton-line skeleton-line-half"></div>
    `;
    return skeleton;
  }

  /**
   * Get CSS class names
   */
  getClassNames() {
    const classes = ['loader', `loader-${this.type}`, `loader-${this.size}`];
    if (this.overlay) classes.push('loader-with-overlay');
    if (this.fullscreen) classes.push('loader-fullscreen');
    return classes.join(' ');
  }

  /**
   * Show loader
   */
  show(container) {
    if (!this.element) {
      this.render();
    }

    if (container) {
      container.appendChild(this.element);
    } else {
      document.body.appendChild(this.element);
    }
  }

  /**
   * Hide loader
   */
  hide() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  /**
   * Destroy loader
   */
  destroy() {
    this.hide();
    this.element = null;
  }
}

/**
 * Show fullscreen loader
 */
export function showLoader(text = 'Loading...') {
  const loader = new Loader({
    type: 'spinner',
    size: 'large',
    text,
    fullscreen: true,
  });

  loader.show();
  return loader;
}

/**
 * Create skeleton loader for cards
 */
export function createSkeletonCard() {
  const skeleton = document.createElement('div');
  skeleton.className = 'skeleton-card';
  skeleton.innerHTML = `
    <div class="skeleton-image"></div>
    <div class="skeleton-body">
      <div class="skeleton-line skeleton-line-full"></div>
      <div class="skeleton-line skeleton-line-full"></div>
      <div class="skeleton-line skeleton-line-half"></div>
    </div>
  `;
  return skeleton;
}

export default Loader;
