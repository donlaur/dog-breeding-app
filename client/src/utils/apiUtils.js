import { API_URL } from '../config';

/**
 * Ensures consistent API URL formatting by adding trailing slashes
 * @param {string} endpoint - API endpoint path
 * @returns {string} Properly formatted endpoint URL
 */
export const formatApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  // Add trailing slash if not present
  const trailingSlash = cleanEndpoint.endsWith('/') ? '' : '/';
  return `${API_URL}/${cleanEndpoint}${trailingSlash}`;
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

// Convenience methods for common HTTP verbs
export const apiGet = (endpoint) => apiRequest(endpoint);

export const apiPost = (endpoint, data) => apiRequest(endpoint, {
  method: 'POST',
  body: JSON.stringify(data)
});

export const apiPut = (endpoint, data) => apiRequest(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const apiDelete = (endpoint) => apiRequest(endpoint, {
  method: 'DELETE'
});