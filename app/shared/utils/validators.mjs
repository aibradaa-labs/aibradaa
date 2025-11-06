/**
 * Validators
 * Form and data validation utilities
 */

/**
 * Validate email address
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;

  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);
}

/**
 * Get password strength score (0-4)
 */
export function getPasswordStrength(password) {
  if (!password) return 0;

  let score = 0;

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  return Math.min(score, 4);
}

/**
 * Validate phone number (Malaysia format)
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;

  // Malaysian phone: 01X-XXXX XXXX or +601X-XXXX XXXX
  const phoneRegex = /^(\+?60|0)1[0-9]-?[0-9]{3,4}\s?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate URL
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate price (positive number)
 */
export function isValidPrice(price) {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && num < 999999;
}

/**
 * Validate required field
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate string length
 */
export function hasMinLength(value, minLength) {
  if (!value || typeof value !== 'string') return false;
  return value.trim().length >= minLength;
}

export function hasMaxLength(value, maxLength) {
  if (!value || typeof value !== 'string') return true; // Empty is valid
  return value.trim().length <= maxLength;
}

/**
 * Validate number range
 */
export function isInRange(value, min, max) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validate array contains value
 */
export function isOneOf(value, options) {
  if (!Array.isArray(options)) return false;
  return options.includes(value);
}

/**
 * Validate object has required keys
 */
export function hasRequiredKeys(obj, keys) {
  if (!obj || typeof obj !== 'object') return false;
  return keys.every(key => key in obj);
}

/**
 * Validate credit card number (Luhn algorithm)
 */
export function isValidCreditCard(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') return false;

  const digits = cardNumber.replace(/\s/g, '').split('').map(Number);

  if (digits.some(isNaN) || digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate Malaysian IC/NRIC
 */
export function isValidMyKad(ic) {
  if (!ic || typeof ic !== 'string') return false;

  // Format: YYMMDD-PB-XXXX
  const icRegex = /^[0-9]{6}-?[0-9]{2}-?[0-9]{4}$/;
  return icRegex.test(ic.replace(/\s/g, ''));
}

/**
 * Validate file size
 */
export function isValidFileSize(file, maxSizeMB) {
  if (!file || !file.size) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function isValidFileType(file, allowedTypes) {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
}

/**
 * Validate date is in future
 */
export function isFutureDate(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Validate date is in past
 */
export function isPastDate(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Validate age (based on birthdate)
 */
export function isMinAge(birthdate, minAge) {
  const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= minAge;
  }

  return age >= minAge;
}

/**
 * Validate form data against schema
 */
export function validateForm(data, schema) {
  const errors = {};

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];
    const fieldErrors = [];

    // Required
    if (rules.required && !isRequired(value)) {
      fieldErrors.push(`${field} is required`);
    }

    // Email
    if (rules.email && value && !isValidEmail(value)) {
      fieldErrors.push(`${field} must be a valid email`);
    }

    // Min length
    if (rules.minLength && value && !hasMinLength(value, rules.minLength)) {
      fieldErrors.push(`${field} must be at least ${rules.minLength} characters`);
    }

    // Max length
    if (rules.maxLength && value && !hasMaxLength(value, rules.maxLength)) {
      fieldErrors.push(`${field} must be at most ${rules.maxLength} characters`);
    }

    // Min/Max value
    if (rules.min !== undefined && value !== undefined && parseFloat(value) < rules.min) {
      fieldErrors.push(`${field} must be at least ${rules.min}`);
    }

    if (rules.max !== undefined && value !== undefined && parseFloat(value) > rules.max) {
      fieldErrors.push(`${field} must be at most ${rules.max}`);
    }

    // Pattern
    if (rules.pattern && value && !rules.pattern.test(value)) {
      fieldErrors.push(`${field} format is invalid`);
    }

    // Custom validator
    if (rules.custom && value) {
      const customError = rules.custom(value, data);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export default {
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
  isValidPhone,
  isValidUrl,
  isValidPrice,
  isRequired,
  hasMinLength,
  hasMaxLength,
  isInRange,
  isOneOf,
  hasRequiredKeys,
  isValidCreditCard,
  isValidMyKad,
  isValidFileSize,
  isValidFileType,
  isFutureDate,
  isPastDate,
  isMinAge,
  validateForm,
};
