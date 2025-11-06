/**
 * Button Component
 * Reusable button with various styles and states
 */

export class Button {
  constructor(options = {}) {
    this.text = options.text || 'Button';
    this.variant = options.variant || 'primary'; // primary, secondary, ghost, danger
    this.size = options.size || 'medium'; // small, medium, large
    this.disabled = options.disabled || false;
    this.loading = options.loading || false;
    this.icon = options.icon || null;
    this.onClick = options.onClick || (() => {});
    this.className = options.className || '';

    this.element = null;
  }

  /**
   * Render button element
   */
  render() {
    const button = document.createElement('button');
    button.className = this.getClassNames();
    button.disabled = this.disabled || this.loading;
    button.setAttribute('type', 'button');

    // Add loading spinner if loading
    if (this.loading) {
      const spinner = document.createElement('span');
      spinner.className = 'button-spinner';
      spinner.innerHTML = '&#8226;&#8226;&#8226;'; // Loading dots
      button.appendChild(spinner);
    }

    // Add icon if provided
    if (this.icon && !this.loading) {
      const icon = document.createElement('span');
      icon.className = 'button-icon';
      icon.innerHTML = this.icon;
      button.appendChild(icon);
    }

    // Add text
    const text = document.createElement('span');
    text.className = 'button-text';
    text.textContent = this.text;
    button.appendChild(text);

    // Add click handler
    button.addEventListener('click', (e) => {
      if (!this.disabled && !this.loading) {
        this.onClick(e);
      }
    });

    this.element = button;
    return button;
  }

  /**
   * Get CSS class names
   */
  getClassNames() {
    const classes = ['ai-button', `ai-button-${this.variant}`, `ai-button-${this.size}`];

    if (this.disabled) classes.push('ai-button-disabled');
    if (this.loading) classes.push('ai-button-loading');
    if (this.className) classes.push(this.className);

    return classes.join(' ');
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.loading = loading;
    if (this.element) {
      this.element.className = this.getClassNames();
      this.element.disabled = this.disabled || this.loading;
      this.updateContent();
    }
  }

  /**
   * Set disabled state
   */
  setDisabled(disabled) {
    this.disabled = disabled;
    if (this.element) {
      this.element.className = this.getClassNames();
      this.element.disabled = this.disabled || this.loading;
    }
  }

  /**
   * Set text
   */
  setText(text) {
    this.text = text;
    if (this.element) {
      this.updateContent();
    }
  }

  /**
   * Update button content
   */
  updateContent() {
    if (!this.element) return;

    this.element.innerHTML = '';

    if (this.loading) {
      const spinner = document.createElement('span');
      spinner.className = 'button-spinner';
      spinner.innerHTML = '&#8226;&#8226;&#8226;';
      this.element.appendChild(spinner);
    }

    if (this.icon && !this.loading) {
      const icon = document.createElement('span');
      icon.className = 'button-icon';
      icon.innerHTML = this.icon;
      this.element.appendChild(icon);
    }

    const text = document.createElement('span');
    text.className = 'button-text';
    text.textContent = this.text;
    this.element.appendChild(text);
  }

  /**
   * Destroy button
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * Create button helper function
 */
export function createButton(options) {
  const button = new Button(options);
  return button.render();
}

export default Button;
