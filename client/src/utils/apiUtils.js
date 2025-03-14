import { API_URL, debugLog, debugError } from '../config';
import { showError } from './notifications';

/* eslint-disable no-restricted-syntax */
// This file is exempt from the fetch call restriction since it defines the API utilities

// Non-schema fields that should be removed before sending to the server
const NON_SCHEMA_FIELDS = [
  'dam_name',
  'sire_name',
  'breed_name',
  'dam_info',
  'sire_info',
  'breed_info',
  'created_at',
  'updated_at',
  'cover_photo_preview'
];

/**
 * Sanitizes data before sending it to the API by removing non-schema fields
 * @param {Object} data - The data object to sanitize
 * @param {Array<string>} additionalFieldsToRemove - Optional additional fields to remove
 * @returns {Object} - The sanitized data object
 */
export const sanitizeApiData = (data, additionalFieldsToRemove = []) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Create a copy to avoid mutating the original
  const sanitizedData = { ...data };
  
  // Remove all non-schema fields
  const fieldsToRemove = [...NON_SCHEMA_FIELDS, ...additionalFieldsToRemove];
  
  fieldsToRemove.forEach(field => {
    if (field in sanitizedData) {
      delete sanitizedData[field];
      debugLog(`Removed non-schema field: ${field}`);
    }
  });
  
  return sanitizedData;
};

/**
 * Debug tool to check auth token status
 * This function can be called from the console: checkAuthToken()
 */
export const checkAuthToken = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('⚠️ NO AUTH TOKEN FOUND IN LOCALSTORAGE');
    return false;
  }
  
  try {
    // Check token format (simple check, not full validation)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('⚠️ INVALID TOKEN FORMAT (not a valid JWT)');
      return false;
    }
    
    // Try to decode payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp) {
      const expiryDate = new Date(payload.exp * 1000);
      const now = new Date();
      
      if (expiryDate < now) {
        console.error(`⚠️ TOKEN EXPIRED at ${expiryDate.toLocaleString()}`);
        return false;
      } else {
        console.log(`✅ Token valid until ${expiryDate.toLocaleString()}`);
      }
    }
    
    console.log('Token payload:', payload);
    return true;
  } catch (e) {
    console.error('⚠️ ERROR PARSING TOKEN:', e);
    return false;
  }
};

/**
 * Format API URL
 * @param {string} endpoint - API endpoint
 * @return {string} - Formatted URL
 */
export const formatApiUrl = (endpoint) => {
  // Use API_URL from config instead of hardcoding the path
  return `${API_URL}/${endpoint.replace(/^\/+/, '')}`;
};

/**
 * Validates an ID to ensure it's not undefined or invalid
 * @param {any} id - The ID to validate
 * @return {boolean} - Whether the ID is valid
 */
const isValidId = (id) => {
  return id !== undefined && id !== null && id !== 'undefined' && id !== 'null' && id !== '';
};

/**
 * Makes consistent API calls with proper authorization
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  // Debug the token being sent
  if (token) {
    debugLog(`Using token for request: ${token.substring(0, 10)}...`);
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  return fetch(formatApiUrl(endpoint), config);
};

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiGet = async (endpoint, options = {}) => {
  // Check if this endpoint is known to be missing (from our apiErrorFix.js)
  if (window.missingEndpoints && window.missingEndpoints.has(endpoint)) {
    debugLog(`Skipping call to known missing endpoint: ${endpoint}`);
    return {
      ok: false, 
      status: 404,
      error: 'API endpoint not available',
      data: null
    };
  }
  
  try {
    const url = formatApiUrl(endpoint);
    debugLog(`Making API GET request to: ${url}`);
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      ...options
    });
    
    if (!response.ok) {
      debugError(`API GET Error (/${endpoint}): ${response.status}`);
      
      // If endpoint not found, add it to the missing endpoints list
      if (response.status === 404 && window.missingEndpoints) {
        window.missingEndpoints.add(endpoint);
        debugLog(`Added ${endpoint} to missing endpoints list`);
      }
      
      return { 
        ok: false, 
        status: response.status,
        error: `HTTP error! status: ${response.status}`, 
        data: null 
      };
    }
    
    try {
      const data = await response.json();
      return { ok: true, status: response.status, data: data, error: null };
    } catch (parseError) {
      debugError(`API Error parsing JSON (/${endpoint}):`, parseError);
      return { 
        ok: false, 
        error: 'Invalid JSON response', 
        data: null 
      };
    }
  } catch (error) {
    debugError(`API Error (${endpoint}):`, error);
    return { 
      ok: false, 
      error: error.message || 'Network request failed', 
      data: null 
    };
  }
};

/**
 * Fetch a litter by ID
 * @param {number|string} litterId - ID of the litter to fetch
 * @return {Promise<Object>} - Litter data or error
 */
export const getLitter = async (litterId) => {
  if (!isValidId(litterId)) {
    const error = `Invalid litter ID: ${litterId}`;
    debugError(error);
    return { ok: false, error, data: null };
  }
  
  return apiGet(`litters/${litterId}`);
};

/**
 * Fetch puppies for a litter
 * @param {number|string} litterId - ID of the litter
 * @return {Promise<Object>} - Puppies data or error
 */
export const getLitterPuppies = async (litterId) => {
  if (!isValidId(litterId)) {
    const error = `Invalid litter ID: ${litterId}`;
    debugError(error);
    return { ok: false, error, data: [] };
  }
  
  return apiGet(`litters/${litterId}/puppies`);
};

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} data - Data to send
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiPost = async (endpoint, data, options = {}) => {
  // Detect if the endpoint contains an undefined ID
  if (endpoint.includes('undefined') || endpoint.includes('null')) {
    const error = `Invalid API call: Endpoint contains undefined or null ID: ${endpoint}`;
    debugError(error);
    showError(`API Error: Invalid ID in request`);
    return { ok: false, error, data: null };
  }
  
  try {
    const url = formatApiUrl(endpoint);
    debugLog(`POST ${url}`);
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(sanitizeApiData(data)),
      ...options,
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      debugError('Error parsing JSON response:', error);
      return { 
        ok: false, 
        error: 'Invalid JSON response', 
        data: null 
      };
    }
    
    if (!response.ok) {
      debugError(`API Error (${endpoint}): ${response.status}`, responseData);
      return { 
        ok: false, 
        error: responseData.error || `HTTP error ${response.status}`, 
        data: responseData 
      };
    }
    
    return { ok: true, data: responseData };
  } catch (error) {
    debugError(`API Error (${endpoint}):`, error);
    return { ok: false, error: error.message, data: null };
  }
};

/**
 * Make a PUT request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} data - Data to send
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiPut = async (endpoint, data, options = {}) => {
  // Detect if the endpoint contains an undefined ID
  if (endpoint.includes('undefined') || endpoint.includes('null')) {
    const error = `Invalid API call: Endpoint contains undefined or null ID: ${endpoint}`;
    debugError(error);
    showError(`API Error: Invalid ID in request`);
    return { ok: false, error, data: null };
  }
  
  try {
    const url = formatApiUrl(endpoint);
    debugLog(`PUT ${url}`);
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...(options.headers || {})
      },
      body: JSON.stringify(sanitizeApiData(data)),
      ...options,
    });
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    // Try to parse response as JSON if it has JSON content type
    if (contentType && contentType.indexOf('application/json') !== -1) {
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        responseData = { error: 'Invalid JSON response' };
      }
    } else {
      // For non-JSON responses, get the text
      try {
        responseData = { message: await response.text() };
      } catch (e) {
        responseData = { message: 'No response body' };
      }
    }
    
    if (!response.ok) {
      debugError(`API PUT Error (${url}): ${response.status}`, responseData);
    }
    
    // Create a standard response object
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      error: !response.ok ? (responseData.error || responseData.message || response.statusText) : null
    };
  } catch (error) {
    debugError(`Network error in apiPut to ${endpoint}:`, error);
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      data: null,
      error: error.message || 'Network request failed'
    };
  }
};

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiDelete = async (endpoint, options = {}) => {
  // Similar validation as in other methods
  if (endpoint.includes('undefined') || endpoint.includes('null')) {
    const error = `Invalid API call: Endpoint contains undefined or null ID: ${endpoint}`;
    debugError(error);
    showError(`API Error: Invalid ID in request`);
    return { ok: false, error, data: null };
  }
  
  try {
    const url = formatApiUrl(endpoint);
    debugLog(`DELETE ${url}`);
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...(options.headers || {})
      },
      ...options,
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      debugError('Error parsing JSON response:', error);
      return { 
        ok: false, 
        error: 'Invalid JSON response', 
        data: null 
      };
    }
    
    if (!response.ok) {
      debugError(`API DELETE Error (${url}): ${response.status}`, responseData);
      return { 
        ok: false, 
        error: responseData.error || `HTTP error ${response.status}`, 
        data: responseData 
      };
    }
    
    return { ok: true, data: responseData };
  } catch (error) {
    debugError(`API Error (${endpoint}):`, error);
    return { ok: false, error: error.message, data: null };
  }
};

export const addPuppyToLitter = async (litterId, puppyData) => {
  if (!litterId) {
    console.error('Invalid litter ID provided to addPuppyToLitter');
    return { 
      ok: false, 
      error: 'Missing or invalid litter ID', 
      data: null 
    };
  }

  // Create a clean copy of the data
  const cleanData = { ...puppyData };
  
  // Ensure litter_id is properly formatted and included
  cleanData.litter_id = parseInt(litterId);
  
  // Handle numeric fields properly - convert empty strings to null
  const numericFields = ['weight_at_birth', 'price', 'deposit'];
  for (const field of numericFields) {
    if (field in cleanData) {
      if (cleanData[field] === '' || cleanData[field] === undefined) {
        cleanData[field] = null;
      } else if (typeof cleanData[field] === 'string') {
        const num = parseFloat(cleanData[field]);
        if (!isNaN(num)) {
          cleanData[field] = num;
        } else {
          cleanData[field] = null;
        }
      }
    }
  }

  console.log(`Adding puppy to litter ${litterId} with clean data:`, cleanData);
  return apiPost(`litters/${litterId}/puppies`, cleanData);
};