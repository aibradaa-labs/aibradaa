/**
 * Shared UI Components
 * Reusable components for consistent UI
 */

export class Card {
  static create({ title, content, footer, className = '' }) {
    const card = document.createElement('div');
    card.className = `bg-white rounded-lg shadow-md p-6 ${className}`;

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'text-xl font-bold mb-4';
      titleEl.textContent = title;
      card.appendChild(titleEl);
    }

    if (content) {
      const contentEl = document.createElement('div');
      contentEl.className = 'text-gray-600 mb-4';
      if (typeof content === 'string') {
        contentEl.textContent = content;
      } else {
        contentEl.appendChild(content);
      }
      card.appendChild(contentEl);
    }

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'border-t pt-4 mt-4';
      if (typeof footer === 'string') {
        footerEl.textContent = footer;
      } else {
        footerEl.appendChild(footer);
      }
      card.appendChild(footerEl);
    }

    return card;
  }
}

export class Button {
  static create({ text, onClick, variant = 'primary', size = 'md', disabled = false }) {
    const button = document.createElement('button');

    const baseClasses = 'font-semibold rounded-lg transition-all duration-200';
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    };
    const variantClasses = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
      secondary: 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-gray-50',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent text-indigo-600 hover:bg-indigo-50'
    };

    button.className = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
    button.textContent = text;
    button.disabled = disabled;

    if (disabled) {
      button.className += ' opacity-50 cursor-not-allowed';
    }

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    return button;
  }
}

export class Modal {
  static create({ title, content, onClose }) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between p-6 border-b';

    const titleEl = document.createElement('h2');
    titleEl.className = 'text-2xl font-bold';
    titleEl.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-500 hover:text-gray-700';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => {
      overlay.remove();
      if (onClose) onClose();
    };

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'p-6';
    if (typeof content === 'string') {
      body.textContent = content;
    } else {
      body.appendChild(content);
    }

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onClose) onClose();
      }
    };

    return overlay;
  }

  static show(options) {
    const modal = Modal.create(options);
    document.body.appendChild(modal);
    return modal;
  }
}

export class Toast {
  static show({ message, type = 'info', duration = 3000 }) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 z-50 animate-slide-up';

    const typeClasses = {
      info: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };

    const inner = document.createElement('div');
    inner.className = `${typeClasses[type]} text-white px-6 py-4 rounded-lg shadow-lg max-w-sm`;
    inner.textContent = message;

    toast.appendChild(inner);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  }
}

export class Loader {
  static create({ size = 'md', text = '' }) {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center';

    const spinner = document.createElement('div');
    const sizeClasses = {
      sm: 'w-8 h-8 border-2',
      md: 'w-12 h-12 border-4',
      lg: 'w-16 h-16 border-4'
    };
    spinner.className = `${sizeClasses[size]} border-indigo-600 border-t-transparent rounded-full animate-spin`;

    container.appendChild(spinner);

    if (text) {
      const textEl = document.createElement('p');
      textEl.className = 'mt-4 text-gray-600 font-medium';
      textEl.textContent = text;
      container.appendChild(textEl);
    }

    return container;
  }

  static show({ text = 'Loading...' } = {}) {
    const overlay = document.createElement('div');
    overlay.id = 'global-loader';
    overlay.className = 'fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center';
    overlay.appendChild(Loader.create({ size: 'lg', text }));
    document.body.appendChild(overlay);
    return overlay;
  }

  static hide() {
    document.getElementById('global-loader')?.remove();
  }
}

export class Badge {
  static create({ text, variant = 'default' }) {
    const badge = document.createElement('span');

    const variantClasses = {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-indigo-100 text-indigo-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800'
    };

    badge.className = `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]}`;
    badge.textContent = text;

    return badge;
  }
}
