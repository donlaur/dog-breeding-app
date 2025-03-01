import { API_URL } from '../config';

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

// GET request with proper error handling
export const apiGet = async (endpoint) => {
  try {
    const response = await fetch(`/api/${endpoint}`);
    const data = await response.json();
    return { ok: response.ok, data, status: response.status };
  } catch (error) {
    console.error('API Error:', error);
    return { ok: false, error: error.message };
  }
};

// POST with compatible CORS configuration
export const apiPost = async (endpoint, data) => {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    return { ok: response.ok, data: responseData, status: response.status };
  } catch (error) {
    console.error('API Error:', error);
    return { ok: false, error: error.message };
  }
};

// PUT with compatible CORS configuration
export const apiPut = async (endpoint, data, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const url = formatApiUrl(endpoint);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers
      },
      body: JSON.stringify(data),
      // Remove mode: 'cors' when using proxy
      ...options
    });
    
    // Try to parse JSON, but don't fail if there's no content
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = null;
    }
    
    if (!response.ok) {
      console.error(`API Error (${response.status}):`, responseData);
      return { 
        ok: false, 
        status: response.status,
        error: responseData?.message || 'An error occurred while updating data'
      };
    }
    
    return { ok: true, data: responseData };
  } catch (error) {
    console.error('API Request failed:', error);
    return { 
      ok: false, 
      error: error.message || 'Network request failed'
    };
  }
};

// DELETE with compatible CORS configuration
export const apiDelete = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const url = formatApiUrl(endpoint);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers
      },
      // Remove mode: 'cors' when using proxy
      ...options
    });
    
    // Try to parse JSON, but don't fail if there's no content
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = null;
    }
    
    if (!response.ok) {
      console.error(`API Error (${response.status}):`, responseData);
      return { 
        ok: false, 
        status: response.status,
        error: responseData?.message || 'An error occurred while deleting data'
      };
    }
    
    return { ok: true, data: responseData };
  } catch (error) {
    console.error('API Request failed:', error);
    return { 
      ok: false, 
      error: error.message || 'Network request failed'
    };
  }
};

export const getLitterPuppies = async (litterId) => {
  return apiGet(`litters/${litterId}/puppies`);
};

export const addPuppyToLitter = async (litterId, puppyData) => {
  return apiPost(`litters/${litterId}/puppies`, puppyData);
};