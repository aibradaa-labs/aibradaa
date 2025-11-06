/**
 * Modal Component
 * Reusable modal dialog
 */

export class Modal {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.size = options.size || 'medium'; // small, medium, large, fullscreen
    this.closeOnOverlay = options.closeOnOverlay !== false;
    this.closeOnEsc = options.closeOnEsc !== false;
    this.showCloseButton = options.showCloseButton !== false;
    this.actions = options.actions || [];
    this.onClose = options.onClose || (() => {});

    this.element = null;
    this.isOpen = false;
  }

  /**
   * Render modal element
   */
  render() {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    if (this.closeOnOverlay) {
      overlay.addEventListener('click', () => this.close());
    }

    // Modal container
    const modal = document.createElement('div');
    modal.className = `modal modal-${this.size}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');

    // Prevent clicks on modal from closing
    modal.addEventListener('click', (e) => e.stopPropagation());

    // Header
    if (this.title || this.showCloseButton) {
      const header = document.createElement('div');
      header.className = 'modal-header';

      if (this.title) {
        const title = document.createElement('h2');
        title.id = 'modal-title';
        title.className = 'modal-title';
        title.textContent = this.title;
        header.appendChild(title);
      }

      if (this.showCloseButton) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close modal');
        closeBtn.addEventListener('click', () => this.close());
        header.appendChild(closeBtn);
      }

      modal.appendChild(header);
    }

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';

    if (typeof this.content === 'string') {
      body.innerHTML = this.content;
    } else if (this.content instanceof HTMLElement) {
      body.appendChild(this.content);
    }

    modal.appendChild(body);

    // Footer (actions)
    if (this.actions.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'modal-footer';

      this.actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `modal-action-btn modal-action-${action.variant || 'secondary'}`;
        btn.textContent = action.text;
        btn.addEventListener('click', () => {
          if (action.onClick) {
            action.onClick();
          }
          if (action.closeOnClick !== false) {
            this.close();
          }
        });
        footer.appendChild(btn);
      });

      modal.appendChild(footer);
    }

    overlay.appendChild(modal);

    this.element = overlay;
    return overlay;
  }

  /**
   * Open modal
   */
  open() {
    if (this.isOpen) return;

    if (!this.element) {
      this.render();
    }

    document.body.appendChild(this.element);
    document.body.style.overflow = 'hidden'; // Prevent body scroll

    // Fade in
    requestAnimationFrame(() => {
      this.element.classList.add('modal-open');
    });

    // ESC key handler
    if (this.closeOnEsc) {
      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      };
      document.addEventListener('keydown', this.escHandler);
    }

    // Focus management
    const modal = this.element.querySelector('.modal');
    modal.focus();

    this.isOpen = true;
  }

  /**
   * Close modal
   */
  close() {
    if (!this.isOpen) return;

    // Fade out
    this.element.classList.remove('modal-open');

    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      document.body.style.overflow = ''; // Restore body scroll

      // Remove ESC handler
      if (this.escHandler) {
        document.removeEventListener('keydown', this.escHandler);
        this.escHandler = null;
      }

      this.isOpen = false;
      this.onClose();
    }, 300); // Match CSS transition duration
  }

  /**
   * Update content
   */
  setContent(content) {
    this.content = content;

    if (this.element) {
      const body = this.element.querySelector('.modal-body');
      if (body) {
        body.innerHTML = '';
        if (typeof content === 'string') {
          body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          body.appendChild(content);
        }
      }
    }
  }

  /**
   * Update title
   */
  setTitle(title) {
    this.title = title;

    if (this.element) {
      const titleEl = this.element.querySelector('.modal-title');
      if (titleEl) {
        titleEl.textContent = title;
      }
    }
  }

  /**
   * Destroy modal
   */
  destroy() {
    this.close();
    this.element = null;
  }
}

/**
 * Show simple alert modal
 */
export function showAlert(options) {
  const modal = new Modal({
    title: options.title || 'Alert',
    content: options.message || '',
    size: 'small',
    actions: [
      {
        text: options.buttonText || 'OK',
        variant: 'primary',
        onClick: options.onConfirm,
      },
    ],
  });

  modal.open();
  return modal;
}

/**
 * Show confirm modal
 */
export function showConfirm(options) {
  return new Promise((resolve) => {
    const modal = new Modal({
      title: options.title || 'Confirm',
      content: options.message || '',
      size: 'small',
      actions: [
        {
          text: options.cancelText || 'Cancel',
          variant: 'secondary',
          onClick: () => resolve(false),
        },
        {
          text: options.confirmText || 'Confirm',
          variant: options.danger ? 'danger' : 'primary',
          onClick: () => resolve(true),
        },
      ],
    });

    modal.open();
  });
}

export default Modal;
