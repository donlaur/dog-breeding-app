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
export const apiGet = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const url = formatApiUrl(endpoint);
    
    // Using a simpler, more compatible fetch configuration
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers
      },
      // Using mode: 'cors' instead of credentials: 'include' for better compatibility
      mode: 'cors',
      ...options
    });
    
    // For 204 No Content responses
    if (response.status === 204) {
      return { ok: true, data: null };
    }
    
    // Try to parse JSON, but don't fail if there's no content
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
    
    if (!response.ok) {
      console.error(`API Error (${response.status}):`, data);
      return { 
        ok: false, 
        status: response.status,
        error: data?.message || 'An error occurred while fetching data'
      };
    }
    
    return { ok: true, data };
  } catch (error) {
    console.error('API Request failed:', error);
    return { 
      ok: false, 
      error: error.message || 'Network request failed'
    };
  }
};

// POST with compatible CORS configuration
export const apiPost = async (endpoint, data, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const url = formatApiUrl(endpoint);
    
    const response = await fetch(url, {
      method: 'POST',
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
        error: responseData?.message || 'An error occurred while saving data'
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