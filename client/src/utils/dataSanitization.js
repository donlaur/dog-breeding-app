/**
 * Utility functions for sanitizing data before sending to the API.
 * This helps prevent errors caused by sending non-schema fields to the server.
 */

import { debugLog } from '../config';

/**
 * Sanitizes health-related data by removing non-schema fields before sending to the API
 * @param {Object} data - The data object to sanitize
 * @returns {Object|null} - The sanitized data object or null if input was null/undefined
 */
export const sanitizeHealthData = (data) => {
  if (!data) return null;
  
  // Create a copy of the data to avoid modifying the original
  const sanitizedData = { ...data };
  
  // List of common non-schema fields that should be removed before sending to the API
  const nonSchemaFields = [
    'dam_name', 'sire_name', 'breed_name', 
    'dam_info', 'sire_info', 'breed_info', 
    'dog_name', 'puppy_name', 'owner_name', 
    'created_by_name', 'updated_by_name',
    'dog_info', 'puppy_info', 'owner_info'
  ];
  
  // Remove non-schema fields
  nonSchemaFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(sanitizedData, field)) {
      delete sanitizedData[field];
      debugLog(`Sanitized data: removed non-schema field '${field}'`);
    }
  });
  
  return sanitizedData;
};

/**
 * Sanitizes dog-related data by removing non-schema fields before sending to the API
 * @param {Object} data - The data object to sanitize
 * @returns {Object|null} - The sanitized data object or null if input was null/undefined
 */
export const sanitizeDogData = (data) => {
  if (!data) return null;
  
  // Create a copy of the data to avoid modifying the original
  const sanitizedData = { ...data };
  
  // List of common non-schema fields for dogs that should be removed before sending to the API
  const nonSchemaFields = [
    'breed_name', 'breed_info', 
    'dam_name', 'dam_info', 
    'sire_name', 'sire_info',
    'owner_name', 'owner_info',
    'litter_info',
    'created_by_name', 'updated_by_name'
  ];
  
  // Remove non-schema fields
  nonSchemaFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(sanitizedData, field)) {
      delete sanitizedData[field];
      debugLog(`Sanitized dog data: removed non-schema field '${field}'`);
    }
  });
  
  return sanitizedData;
};

/**
 * Generic data sanitization function that can be used for any type of data
 * @param {Object} data - The data object to sanitize
 * @param {Array<string>} fieldsToRemove - Array of field names to remove
 * @returns {Object|null} - The sanitized data object or null if input was null/undefined
 */
export const sanitizeData = (data, fieldsToRemove = []) => {
  if (!data) return null;
  
  // Create a copy of the data to avoid modifying the original
  const sanitizedData = { ...data };
  
  // Default fields to remove (common across all types)
  const defaultFieldsToRemove = [
    'created_by_name', 'updated_by_name',
    'created_at', 'updated_at' // These are typically managed by the database
  ];
  
  // Combine default fields with specific fields to remove
  const allFieldsToRemove = [...defaultFieldsToRemove, ...fieldsToRemove];
  
  // Remove specified fields
  allFieldsToRemove.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(sanitizedData, field)) {
      delete sanitizedData[field];
      debugLog(`Sanitized data: removed field '${field}'`);
    }
  });
  
  return sanitizedData;
};
