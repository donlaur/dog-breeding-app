import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiPut, apiDelete, sanitizeApiData } from '../utils/apiUtils';

const useApi = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic fetch function using apiUtils - memoized with useCallback
  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      debugLog(`API call to ${endpoint}`, options);
      
      let response;
      const method = options.method?.toUpperCase() || 'GET';
      
      // Use the appropriate API utility function based on the HTTP method
      switch (method) {
        case 'GET':
          response = await apiGet(endpoint, options);
          break;
        case 'POST':
          // Sanitize data before sending to prevent non-schema fields errors
          const postData = options.body ? sanitizeApiData(
            typeof options.body === 'string' ? JSON.parse(options.body) : options.body
          ) : {};
          response = await apiPost(endpoint, postData, options);
          break;
        case 'PUT':
          // Sanitize data before sending to prevent non-schema fields errors
          const putData = options.body ? sanitizeApiData(
            typeof options.body === 'string' ? JSON.parse(options.body) : options.body
          ) : {};
          response = await apiPut(endpoint, putData, options);
          break;
        case 'DELETE':
          response = await apiDelete(endpoint, options);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      if (!response.ok) {
        throw new Error(response.error || `API request to ${endpoint} failed`);
      }
      
      return response.data;
    } catch (err) {
      debugError(`API error in useApi hook for ${endpoint}:`, err);
      setError(err.message || 'An unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Convenience methods for common HTTP verbs
  const get = useCallback((endpoint, options = {}) => {
    return fetchWithAuth(endpoint, { ...options, method: 'GET' });
  }, [fetchWithAuth]);
  
  const post = useCallback((endpoint, data, options = {}) => {
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'POST',
      body: data
    });
  }, [fetchWithAuth]);
  
  const put = useCallback((endpoint, data, options = {}) => {
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'PUT',
      body: data
    });
  }, [fetchWithAuth]);
  
  const remove = useCallback((endpoint, options = {}) => {
    return fetchWithAuth(endpoint, { ...options, method: 'DELETE' });
  }, [fetchWithAuth]);

  // Additional specialized API calls
  const getFullDogData = useCallback(async () => {
    try {
      return await get('/dogs/full');
    } catch (error) {
      console.error('API Error:', error);
      return { ok: false, error: { message: error.message } };
    }
  }, [get]);

  return {
    loading,
    error,
    fetchWithAuth,
    get,
    post,
    put,
    remove,
    getFullDogData
  };
};

export { useApi };