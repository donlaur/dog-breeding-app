// src/context/DogContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { API_URL, debugLog } from '../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';

const DogContext = createContext();

export function DogProvider({ children }) {
  const auth = useAuth();
  const [dogs, setDogs] = useState([]);
  const [litters, setLitters] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState({
    dogs: null,
    litters: null,
    breeds: null
  });
  
  // Use refs to track in-flight requests to prevent duplicate calls
  const pendingRequests = useRef({
    dogs: null,
    litters: null,
    breeds: null
  });

  // Cache expiration time (5 minutes)
  const CACHE_EXPIRATION = 5 * 60 * 1000; 

  // Get puppies (non-adult dogs)
  const puppies = dogs.filter(dog => !dog.is_adult);
  
  // Get adult dogs
  const adultDogs = dogs.filter(dog => dog.is_adult);

  // Function to check if cache is valid
  const isCacheValid = (dataType) => {
    if (!lastFetchTime[dataType]) return false;
    return (Date.now() - lastFetchTime[dataType]) < CACHE_EXPIRATION;
  };

  // Ensure API endpoint has trailing slash
  const getEndpoint = (dataType) => {
    // Make sure we add trailing slash to prevent 308 redirects
    return `${API_URL}/${dataType}/`;
  };

  // Fetch data with caching and deduplication
  const fetchData = useCallback(async (dataType, force = false) => {
    // Skip if cache is valid and not forced
    if (isCacheValid(dataType) && !force) {
      debugLog(`Using cached ${dataType} data`);
      return;
    }
    
    // Skip if a request for this data type is already in progress
    if (pendingRequests.current[dataType]) {
      debugLog(`Request for ${dataType} already in progress, skipping duplicate call`);
      return pendingRequests.current[dataType]; // Return the existing promise
    }

    try {
      setLoading(true);
      debugLog(`Fetching ${dataType} data...`);
      
      // Get headers based on what auth provides
      const headers = auth?.token ? 
        { Authorization: `Bearer ${auth.token}` } : 
        {};
      
      // Create fetch promise and store in pendingRequests
      const fetchPromise = fetch(getEndpoint(dataType), { headers });
      pendingRequests.current[dataType] = fetchPromise;
      
      const response = await fetchPromise;
      
      // Clear the pending request
      pendingRequests.current[dataType] = null;
      
      if (!response.ok) {
        throw new Error(`${dataType} fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      debugLog(`Fetched ${dataType}:`, data);
      
      // Update state based on data type
      if (dataType === 'dogs') setDogs(data);
      else if (dataType === 'litters') setLitters(data);
      else if (dataType === 'breeds') setBreeds(data);
      
      // Update cache timestamp
      setLastFetchTime(prev => ({
        ...prev,
        [dataType]: Date.now()
      }));
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error);
      setError(error.message);
      // Clear the pending request on error too
      pendingRequests.current[dataType] = null;
      return null;
    } finally {
      setLoading(false);
    }
  }, [auth]);

  // Load all data on mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      try {
        // Check if user is authenticated before fetching data
        if (!auth?.token) {
          debugLog("No auth token available, skipping data fetch");
          return;
        }
        
        // Fetch one at a time to avoid overwhelming the server
        await fetchData('dogs');
        await fetchData('litters');
        await fetchData('breeds');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [fetchData, auth?.token]); // Only re-run when auth token changes

  // Refresh functions for each data type
  const refreshDogs = () => fetchData('dogs', true);
  const refreshLitters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('litters');
      
      if (!response.ok) {
        throw new Error('Failed to fetch litters');
      }
      
      const data = await response.json();
      setLitters(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching litters:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  const refreshBreeds = () => fetchData('breeds', true);

  const value = {
    dogs,
    puppies,
    adultDogs,
    litters,
    breeds,
    loading,
    error,
    refreshDogs,
    refreshLitters,
    refreshBreeds
  };

  return (
    <DogContext.Provider value={value}>
      {children}
    </DogContext.Provider>
  );
}

export function useDog() {
  return useContext(DogContext);
}

export default DogContext;
