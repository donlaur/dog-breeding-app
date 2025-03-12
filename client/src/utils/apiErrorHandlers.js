// apiErrorHandlers.js - Utility functions for handling API errors
import { API_URL, debugLog, debugError } from '../config';

/**
 * Checks if an API endpoint is available by making a HEAD request
 * @param {string} endpoint - API endpoint to check
 * @returns {Promise<boolean>} - Whether the endpoint is available
 */
export const checkApiEndpointAvailable = async (endpoint) => {
  try {
    const url = `${API_URL}/${endpoint}`;
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.ok;
  } catch (error) {
    debugError(`Error checking API endpoint ${endpoint}:`, error);
    return false;
  }
};

/**
 * Handles API errors in a consistent way
 * @param {Error} error - The error that occurred
 * @param {string} context - Context where the error occurred
 * @param {Function} setErrorState - Function to set error state
 * @returns {Object} - Standardized error response
 */
export const handleApiError = (error, context, setErrorState = null) => {
  const errorResponse = {
    success: false,
    error: error.message || 'Unknown error',
    status: error.status || 500,
    context
  };
  
  debugError(`API error in ${context}:`, error);
  
  if (setErrorState) {
    setErrorState(errorResponse.error);
  }
  
  return errorResponse;
};

/**
 * Creates a standardized API response object
 * @param {boolean} success - Whether the API call was successful
 * @param {*} data - Response data
 * @param {string} error - Error message if any
 * @returns {Object} - Standardized response object
 */
export const createApiResponse = (success, data = null, error = null) => {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString()
  };
};
