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
  
  // For development with proxy, use relative URL
  return `/api/${cleanEndpoint}`;
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
export const apiGet = async (endpoint, options = {}) => {
  // Detect if the endpoint contains an undefined ID
  if (endpoint.includes('undefined') || endpoint.includes('null')) {
    const error = `Invalid API call: Endpoint contains undefined or null ID: ${endpoint}`;
    debugError(error);
    showError(`API Error: Invalid ID in request`);
    return { ok: false, error, data: null };
  }
  
  try {
    debugLog(`GET ${API_URL}/${endpoint}`);
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'GET',
      ...options,
    });
    
    // Try to parse JSON, but handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (error) {
        debugError('Error parsing JSON response:', error);
        return { 
          ok: false, 
          status: response.status,
          error: 'Invalid JSON response', 
          data: null 
        };
      }
    } else {
      // Handle non-JSON response
      const text = await response.text();
      debugError('Non-JSON response:', text);
      return { 
        ok: false, 
        status: response.status,
        error: 'Unexpected response format', 
        data: text 
      };
    }
    
    if (!response.ok) {
      return { 
        ok: false, 
        status: response.status,
        error: data.error || `HTTP error ${response.status}`, 
        data 
      };
    }
    
    return { ok: true, status: response.status, data };
  } catch (error) {
    debugError(`API Error (${endpoint}):`, error);
    return { ok: false, error: error.message, data: null };
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
    const response = await fetch(`${API_URL}/${endpoint}`, {
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
export const apiPut = async (endpoint, data, options = {}) => {
  // Similar validation as in apiPost
  if (endpoint.includes('undefined') || endpoint.includes('null')) {
    const error = `Invalid API call: Endpoint contains undefined or null ID: ${endpoint}`;
    debugError(error);
    showError(`API Error: Invalid ID in request`);
    return { ok: false, error, data: null };
  }
  
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'PUT',
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
    const response = await fetch(`${API_URL}/${endpoint}`, {
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
  return apiPost(`litters/${litterId}/puppies`, puppyData);
};