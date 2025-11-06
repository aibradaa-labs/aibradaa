/**
 * Toast Component
 * Non-intrusive notification system
 */

export class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.maxToasts = 5;
    this.defaultDuration = 4000;
  }

  /**
   * Initialize toast container
   */
  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  /**
   * Show toast notification
   */
  show(options) {
    this.init();

    const toast = new Toast({
      message: options.message || '',
      type: options.type || 'info', // success, error, warning, info
      duration: options.duration || this.defaultDuration,
      action: options.action || null,
      onClose: () => this.removeToast(toast),
    });

    // Remove oldest if at max
    if (this.toasts.length >= this.maxToasts) {
      this.toasts[0].close();
    }

    this.toasts.push(toast);
    this.container.appendChild(toast.render());

    // Auto-dismiss
    if (toast.duration > 0) {
      toast.autoDismissTimer = setTimeout(() => {
        toast.close();
      }, toast.duration);
    }

    return toast;
  }

  /**
   * Show success toast
   */
  success(message, options = {}) {
    return this.show({ ...options, message, type: 'success' });
  }

  /**
   * Show error toast
   */
  error(message, options = {}) {
    return this.show({ ...options, message, type: 'error', duration: options.duration || 6000 });
  }

  /**
   * Show warning toast
   */
  warning(message, options = {}) {
    return this.show({ ...options, message, type: 'warning' });
  }

  /**
   * Show info toast
   */
  info(message, options = {}) {
    return this.show({ ...options, message, type: 'info' });
  }

  /**
   * Remove toast from manager
   */
  removeToast(toast) {
    const index = this.toasts.indexOf(toast);
    if (index > -1) {
      this.toasts.splice(index, 1);
    }
  }

  /**
   * Clear all toasts
   */
  clearAll() {
    this.toasts.forEach(toast => toast.close());
    this.toasts = [];
  }
}

export class Toast {
  constructor(options = {}) {
    this.message = options.message || '';
    this.type = options.type || 'info';
    this.duration = options.duration || 4000;
    this.action = options.action || null; // { text: 'Undo', onClick: fn }
    this.onClose = options.onClose || (() => {});

    this.element = null;
    this.autoDismissTimer = null;
    this.isClosing = false;
  }

  /**
   * Render toast element
   */
  render() {
    const toast = document.createElement('div');
    toast.className = `toast toast-${this.type}`;
    toast.setAttribute('role', 'alert');

    // Icon
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.innerHTML = this.getIcon();
    toast.appendChild(icon);

    // Message
    const message = document.createElement('div');
    message.className = 'toast-message';
    message.textContent = this.message;
    toast.appendChild(message);

    // Action button (optional)
    if (this.action) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-action-btn';
      actionBtn.textContent = this.action.text;
      actionBtn.addEventListener('click', () => {
        if (this.action.onClick) {
          this.action.onClick();
        }
        this.close();
      });
      toast.appendChild(actionBtn);
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', () => this.close());
    toast.appendChild(closeBtn);

    // Pause auto-dismiss on hover
    toast.addEventListener('mouseenter', () => {
      if (this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = null;
      }
    });

    toast.addEventListener('mouseleave', () => {
      if (this.duration > 0 && !this.isClosing) {
        this.autoDismissTimer = setTimeout(() => {
          this.close();
        }, 2000); // Resume with 2s delay
      }
    });

    // Slide in animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    this.element = toast;
    return toast;
  }

  /**
   * Get icon for toast type
   */
  getIcon() {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[this.type] || icons.info;
  }

  /**
   * Close toast
   */
  close() {
    if (this.isClosing) return;
    this.isClosing = true;

    // Clear auto-dismiss timer
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    // Slide out animation
    if (this.element) {
      this.element.classList.remove('toast-show');
      this.element.classList.add('toast-hide');

      setTimeout(() => {
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.onClose();
      }, 300); // Match CSS transition
    }
  }
}

// Global toast manager instance
export const toast = new ToastManager();

export default toast;
