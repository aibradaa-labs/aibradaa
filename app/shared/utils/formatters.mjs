/**
 * Formatters
 * Utility functions for formatting data
 */

/**
 * Format price in MYR
 */
export function formatPrice(price, options = {}) {
  const { includeCurrency = true, decimals = 0 } = options;

  if (price === null || price === undefined) {
    return 'N/A';
  }

  const formatted = new Intl.NumberFormat('en-MY', {
    style: includeCurrency ? 'currency' : 'decimal',
    currency: 'MYR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);

  return formatted;
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('en-MY').format(num);
}

/**
 * Format date
 */
export function formatDate(date, style = 'short') {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const styles = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    relative: null, // Special handling below
  };

  if (style === 'relative') {
    return formatRelativeDate(dateObj);
  }

  return new Intl.DateTimeFormat('en-MY', styles[style] || styles.short).format(dateObj);
}

/**
 * Format relative date (e.g., "2 hours ago")
 */
function formatRelativeDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;
  return formatDate(date, 'short');
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 0) {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 50, suffix = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format duration (seconds to human-readable)
 */
export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default {
  formatPrice,
  formatNumber,
  formatDate,
  formatFileSize,
  formatPercentage,
  truncate,
  formatDuration,
};
