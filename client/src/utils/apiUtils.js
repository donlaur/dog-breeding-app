import { API_URL, debugLog, debugError } from '../config';
import { showError } from './notifications';

/**
 * Helper to format API URLs consistently
 * @param {string} endpoint - API endpoint path
 * @returns {string} Properly formatted endpoint URL
 */
export const formatApiUrl = (endpoint) => {
  // Remove any leading slash from endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Ensure no trailing slashes for consistency (avoid redirect issues with CORS)
  const noTrailingSlash = cleanEndpoint.endsWith('/') 
    ? cleanEndpoint.slice(0, -1) 
    : cleanEndpoint;
  
  // For development with proxy, use relative URL
  return `/api/${noTrailingSlash}`;
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
export const apiGet = async (endpoint) => {
  try {
    const url = `${API_URL}/${endpoint.replace(/^\/+/, '')}`;
    console.log(`Making API GET request to: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { ok: true, data: data };
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
export const apiPut = async (endpoint, data) => {
  const url = `${API_URL}/${endpoint.replace(/^\/+/, '')}`;
  console.log(`[API] PUT ${url}`, data);
  
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(data)
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
    
    // Create a standard response object
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      error: !response.ok ? (responseData.error || responseData.message || response.statusText) : null
    };
  } catch (error) {
    console.error(`Network error in apiPut to ${url}:`, error);
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
    const response = await fetch(url, {
      method: 'DELETE',
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

  // Ensure litter_id is properly formatted and included in the data
  const dataWithLitterId = {
    ...puppyData,
    litter_id: parseInt(litterId)
  };

  console.log(`Adding puppy to litter ${litterId}:`, dataWithLitterId);
  return apiPost(`litters/${litterId}/puppies`, dataWithLitterId);
};