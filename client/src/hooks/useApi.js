import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const useApi = () => {
  const { token } = useAuth();
  const apiBaseUrl = API_URL || '/api';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic fetch function - memoized with useCallback
  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${apiBaseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, token]);
  
  // HTTP methods
  const get = useCallback((endpoint) => fetchWithAuth(endpoint, { method: 'GET' }), [fetchWithAuth]);
  
  const post = useCallback((endpoint, data) => 
    fetchWithAuth(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }), [fetchWithAuth]);
  
  const put = useCallback((endpoint, data) => 
    fetchWithAuth(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }), [fetchWithAuth]);
  
  const remove = useCallback((endpoint) => 
    fetchWithAuth(endpoint, { method: 'DELETE' }), [fetchWithAuth]);
  
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
    get,
    post,
    put,
    remove,
    getFullDogData
  };
};

export { useApi };