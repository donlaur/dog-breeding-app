import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiPut, apiDelete, sanitizeApiData } from '../utils/apiUtils';

const useApi = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic fetch function using apiUtils methods - memoized with useCallback
  const fetchWithAuth = useCallback(async (endpoint, method, data = null) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      let sanitizedPostData;
      let sanitizedPutData;
      
      switch (method) {
        case 'GET':
          response = await apiGet(endpoint);
          break;
        case 'POST':
          // Sanitize the data before sending to the server
          sanitizedPostData = sanitizeApiData(data);
          response = await apiPost(endpoint, sanitizedPostData);
          break;
        case 'PUT':
          // Sanitize the data before sending to the server
          sanitizedPutData = sanitizeApiData(data);
          response = await apiPut(endpoint, sanitizedPutData);
          break;
        case 'DELETE':
          response = await apiDelete(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      if (!response.success) {
        throw new Error(response.error || 'API request failed');
      }
      
      return response.data;
    } catch (err) {
      setError(err.message);
      debugError(`API Error (${method} ${endpoint}):`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  // HTTP methods
  const get = useCallback((endpoint) => 
    fetchWithAuth(endpoint, 'GET'), [fetchWithAuth]);
  
  const post = useCallback((endpoint, data) => 
    fetchWithAuth(endpoint, 'POST', data), [fetchWithAuth]);
  
  const put = useCallback((endpoint, data) => 
    fetchWithAuth(endpoint, 'PUT', data), [fetchWithAuth]);
  
  const remove = useCallback((endpoint) => 
    fetchWithAuth(endpoint, 'DELETE'), [fetchWithAuth]);
  
  // Additional specialized API calls
  const getFullDogData = useCallback(async () => {
    try {
      return await get('dogs/full');
    } catch (error) {
      debugError('API Error in getFullDogData:', error);
      return { ok: false, error: { message: error.message } };
    }
  }, [get]);

  return {
    loading,
    error,
    get,
    post,
    put,
    remove,
    getFullDogData
  };
};

export { useApi };