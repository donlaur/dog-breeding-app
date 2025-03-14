/**
 * Utility functions for input sanitization and validation
 */

/**
 * Sanitizes user input text to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeUserInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates file type against allowed types
 * @param {File} file - File object to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types (e.g., 'image/jpeg')
 * @returns {boolean} - Whether the file type is valid
 */
export const validateFileType = (file, allowedTypes = []) => {
  if (!file || !file.type) {
    return false;
  }
  
  if (allowedTypes.length === 0) {
    return true;
  }
  
  return allowedTypes.some(type => {
    // Handle wildcards like 'image/*'
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return file.type.startsWith(`${category}/`);
    }
    return file.type === type;
  });
};

/**
 * Validates file size against maximum size
 * @param {File} file - File object to validate
 * @param {number} maxSizeBytes - Maximum file size in bytes
 * @returns {boolean} - Whether the file size is valid
 */
export const validateFileSize = (file, maxSizeBytes) => {
  if (!file) {
    return false;
  }
  
  return file.size <= maxSizeBytes;
};

/**
 * Validates text length is within constraints
 * @param {string} text - Text to validate
 * @param {number} maxLength - Maximum allowed characters
 * @returns {boolean} - Whether the text length is valid
 */
export const validateTextLength = (text, maxLength) => {
  if (!text || typeof text !== 'string') {
    return true; // Empty is valid
  }
  
  return text.length <= maxLength;
};

/**
 * Helper to format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size with units
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
};
