import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiDelete, sanitizeApiData } from '../utils/apiUtils';
import { debugLog, debugError } from '../config';

const useApi = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic fetch function using apiUtils - memoized with useCallback
  const fetchWithAuth = useCallback(async (endpoint, method, data = null, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      debugLog(`API call to ${endpoint}`, { method, data, ...options });
      
      let response;
      
      // Use the appropriate API utility function based on the HTTP method
      switch (method.toUpperCase()) {
        case 'GET': {
          response = await apiGet(endpoint, options);
          break;
        }
        case 'POST': {
          // Sanitize data before sending to prevent non-schema fields errors
          const sanitizedData = data ? sanitizeApiData(data) : {};
          response = await apiPost(endpoint, sanitizedData, options);
          break;
        }
        case 'PUT': {
          // Sanitize data before sending to prevent non-schema fields errors
          const sanitizedData = data ? sanitizeApiData(data) : {};
          response = await apiPut(endpoint, sanitizedData, options);
          break;
        }
        case 'DELETE': {
          response = await apiDelete(endpoint, options);
          break;
        }
        default: {
          throw new Error(`Unsupported HTTP method: ${method}`);
        }
      }
      
      return response;
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
    return fetchWithAuth(endpoint, 'GET', null, options);
  }, [fetchWithAuth]);
  
  const post = useCallback((endpoint, data, options = {}) => {
    return fetchWithAuth(endpoint, 'POST', data, options);
  }, [fetchWithAuth]);
  
  const put = useCallback((endpoint, data, options = {}) => {
    return fetchWithAuth(endpoint, 'PUT', data, options);
  }, [fetchWithAuth]);
  
  const remove = useCallback((endpoint, options = {}) => {
    return fetchWithAuth(endpoint, 'DELETE', null, options);
  }, [fetchWithAuth]);

  // Additional specialized API calls
  const getFullDogData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all dogs with their related data
      const dogsResponse = await apiGet('/dogs?select=*,breed_info:breeds(*),dam_info:dog_relations!dam_id(*),sire_info:dog_relations!sire_id(*)');
      
      if (!dogsResponse.ok) {
        throw new Error(dogsResponse.error || 'Failed to fetch dogs data');
      }
      
      return dogsResponse.data;
    } catch (error) {
      debugError('Error fetching full dog data:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLitterWithRelated = useCallback(async (litterId) => {
    try {
      setLoading(true);
      
      // Fetch litter with related data
      const litterResponse = await apiGet(`/litters?id=eq.${litterId}&select=*,dam_info:dogs!dam_id(*),sire_info:dogs!sire_id(*),breed_info:breeds(*),puppies:puppies(*)&limit=1`);
      
      if (!litterResponse.ok || !litterResponse.data.length) {
        throw new Error(litterResponse.error || 'Litter not found');
      }
      
      return litterResponse.data[0];
    } catch (error) {
      debugError(`Error fetching litter with ID ${litterId}:`, error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: remove, // Renamed to avoid JS reserved word
    getFullDogData,
    getLitterWithRelated,
    clearError: () => setError(null)
  };
};

export default useApi;
