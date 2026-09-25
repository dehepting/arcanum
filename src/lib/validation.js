/**
 * Input Validation Utilities
 *
 * Client-side validation for forms and user input
 */

/**
 * Validates an entity name
 *
 * @param {string} name - The name to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateEntityName(name) {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length > 200) {
    return { valid: false, error: 'Name must be less than 200 characters' };
  }

  return { valid: true, error: null };
}

/**
 * Validates a description
 *
 * @param {string} description - The description to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateDescription(description, options = {}) {
  const { maxLength = 5000, required = false } = options;

  if (required && (!description || !description.trim())) {
    return { valid: false, error: 'Description is required' };
  }

  if (description && description.length > maxLength) {
    return { valid: false, error: `Description must be less than ${maxLength} characters` };
  }

  return { valid: true, error: null };
}

/**
 * Validates coordinates (latitude/longitude)
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateCoordinates(lat, lng) {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return { valid: false, error: 'Coordinates are required' };
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true, error: null };
}

/**
 * Validates a date string
 *
 * @param {string} dateStr - Date string to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateDate(dateStr, options = {}) {
  const { required = false, allowBC = true } = options;

  if (!dateStr || !dateStr.trim()) {
    if (required) {
      return { valid: false, error: 'Date is required' };
    }
    return { valid: true, error: null };
  }

  // Check for BC/BCE dates if not allowed
  if (!allowBC && (dateStr.includes('BC') || dateStr.includes('BCE'))) {
    return { valid: false, error: 'BC/BCE dates are not allowed' };
  }

  // Basic validation - more specific validation can be added based on format
  if (dateStr.length > 100) {
    return { valid: false, error: 'Date string is too long' };
  }

  return { valid: true, error: null };
}

/**
 * Sanitizes user input to prevent XSS
 *
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates a file upload
 *
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateFileUpload(file, options = {}) {
  const { maxSizeMB = 100, allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'] } =
    options;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates an email address (basic validation)
 *
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, error: null };
}

/**
 * Validates a URL
 *
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateURL(url, options = {}) {
  const { required = false } = options;

  if (!url || !url.trim()) {
    if (required) {
      return { valid: false, error: 'URL is required' };
    }
    return { valid: true, error: null };
  }

  try {
    new URL(url);
    return { valid: true, error: null };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
