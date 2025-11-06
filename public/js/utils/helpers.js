/**
 * Utility Functions
 * Common helper functions used throughout the app
 */

// Format currency in MYR
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Format date in Malaysian format
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// Debounce function for input handlers
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll handlers
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Generate unique ID
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Truncate text
export function truncate(text, length = 100) {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

// Sanitize HTML
export function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Check if element is in viewport
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Smooth scroll to element
export function scrollToElement(element, offset = 0) {
  const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({
    top,
    behavior: 'smooth'
  });
}

// Get query parameters
export function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

// Set query parameters
export function setQueryParams(params) {
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    url.searchParams.set(key, params[key]);
  });
  window.history.pushState({}, '', url);
}

// Local storage with expiry
export class Storage {
  static set(key, value, expiryMinutes = null) {
    const item = {
      value,
      expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  static get(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }
}

// Validation helpers
export const Validators = {
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  phone: (phone) => {
    const re = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
    return re.test(phone);
  },

  password: (password) => {
    // Minimum 8 characters, at least one letter and one number
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  },

  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }
};

// Array utilities
export const ArrayUtils = {
  unique: (arr) => [...new Set(arr)],

  chunk: (arr, size) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  },

  shuffle: (arr) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  },

  sortBy: (arr, key) => {
    return [...arr].sort((a, b) => {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    });
  }
};

// Performance monitoring
export function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${(end - start).toFixed(2)}ms`);
  return result;
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Share API
export async function share({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      console.error('Share failed:', err);
      return false;
    }
  }
  return false;
}

// Device detection
export const Device = {
  isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: () => /Android/.test(navigator.userAgent),
  isTouchDevice: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
};
