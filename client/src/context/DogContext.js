// src/context/DogContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';
import axios from 'axios';

const DogContext = createContext();

export const DogProvider = ({ children }) => {
  const auth = useAuth();
  const [dogs, setDogs] = useState([]);
  const [litters, setLitters] = useState([]);
  const [puppies, setPuppies] = useState([]); // Initialize with empty array
  const [loading, setLoading] = useState(false);  // Start with false to prevent immediate loading state
  
  // Debug effect to log whenever puppies state changes
  useEffect(() => {
    console.log('Puppies state changed:', puppies);
    console.log('Puppies count in state:', puppies.length);
  }, [puppies]);
  const [error, setError] = useState(null);
  const [dataTimestamp, setDataTimestamp] = useState(null);
  
  // Use refs to track in-flight requests and prevent duplicate calls
  const pendingRequests = useRef({
    dogs: null,
    litters: null,
    breeds: null,
    puppies: null
  });
  
  // Add a ref to track if initial load has happened
  const initialLoadComplete = useRef(false);
  
  // Track retry attempts to prevent infinite retries
  const retryAttempts = useRef(0);
  const MAX_RETRIES = 2;

  // Cache expiration time (5 minutes)
  const CACHE_EXPIRATION = 5 * 60 * 1000; 

  // Get adult dogs (is_adult === true)
  const adultDogs = dogs.filter(dog => dog.is_adult === true);

  // Get puppies (from the puppies table)
  const actualPuppies = puppies;

  // Add a loading state flag specifically for dogs to prevent render loops
  const [dogsLoading, setDogsLoading] = useState(false);
  const [littersLoading, setLittersLoading] = useState(false);

  // Function to check if cache is valid
  const isCacheValid = () => {
    if (!dataTimestamp) return false;
    return (Date.now() - dataTimestamp) < CACHE_EXPIRATION;
  };

  // Function to reload all data - significantly modified for better error handling
  const refreshData = useCallback(async (force = false) => {
    // Don't retry if we've reached the maximum retry attempts
    if (retryAttempts.current >= MAX_RETRIES && !force) {
      console.log(`Max retry attempts (${MAX_RETRIES}) reached, giving up`);
      return;
    }
    
    // Prevent duplicate calls if a request is already in progress
    if (pendingRequests.current.dogs || pendingRequests.current.litters) {
      console.log("Data fetch already in progress, skipping duplicate request");
      return;
    }
    
    // Skip if not forced and we've already loaded once with valid cache
    if (!force && initialLoadComplete.current && isCacheValid()) {
      console.log("Using cached data, skipping fetch");
      return;
    }

    // This is a retry attempt
    if (initialLoadComplete.current) {
      retryAttempts.current += 1;
      console.log(`Retry attempt ${retryAttempts.current} of ${MAX_RETRIES}`);
    }
    
    console.log("DogProvider: Loading initial data");
    setLoading(true);
    setError(null);
    
    // Fetch data with more robust error handling
    try {
      // Create promises but don't await them yet - specify exact endpoints without trailing slashes
      pendingRequests.current.dogs = apiGet('dogs');
      pendingRequests.current.litters = apiGet('litters');
      pendingRequests.current.puppies = apiGet('puppies'); // No trailing slash
      
      // Handle dogs
      let dogsData = [];
      try {
        const dogsResponse = await pendingRequests.current.dogs;
        if (dogsResponse && dogsResponse.ok) {
          dogsData = dogsResponse.data || [];
          setDogs(dogsData);
        } else {
          console.error('Failed to load dogs:', dogsResponse?.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching dogs:', err);
      }
      
      // Handle litters - continue even if dogs failed
      try {
        const littersResponse = await pendingRequests.current.litters;
        if (littersResponse && littersResponse.ok) {
          setLitters(littersResponse.data || []);
        } else {
          console.error('Failed to load litters:', littersResponse?.error || 'Unknown error');
          // If litters fail, just set empty array and continue
          setLitters([]);
        }
      } catch (err) {
        console.error('Error fetching litters:', err);
        setLitters([]);
      }
      
      // Handle puppies - continue even if previous requests failed
      try {
        console.log('FETCHING PUPPIES FROM API...');
        const puppiesResponse = await pendingRequests.current.puppies;
        
        if (puppiesResponse && puppiesResponse.ok) {
          const puppiesData = puppiesResponse.data || [];
          console.log('SUCCESS: Puppies API response with', puppiesData.length, 'puppies');
          
          // Directly create a new array from the response data
          const puppiesArray = [...puppiesData];
          console.log('Created new puppies array with', puppiesArray.length, 'items');
          
          // Update state with the new array
          setPuppies(puppiesArray);
          
          // For debugging, manually dispatch an event 
          window.dispatchEvent(new CustomEvent('puppies_loaded', { 
            detail: { count: puppiesArray.length, data: puppiesArray }
          }));
        } else {
          console.error('Failed to load puppies:', puppiesResponse?.error || 'Unknown error', puppiesResponse);
          // If puppies fail, just set empty array and continue
          setPuppies([]);
        }
      } catch (err) {
        console.error('Error fetching puppies:', err);
        setPuppies([]);
      }

      // If we got here, consider the data load complete even if some requests failed
      // This prevents infinite retries when some endpoints aren't available
      initialLoadComplete.current = true;
      setDataTimestamp(Date.now());
      
      // Reset retry counter on any successful load
      if (dogsData.length > 0) {
        retryAttempts.current = 0;
      }
    } catch (err) {
      console.error('Global error in refreshData:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      // Clear loading state and pending requests regardless of success/failure
      setLoading(false);
      pendingRequests.current = {
        dogs: null,
        litters: null,
        breeds: null,
        puppies: null
      };
    }
  }, []);
  
  // Load data on initial mount - only once, but always force a refresh
  useEffect(() => {
    const loadInitialData = async () => {
      // Slight delay to prevent UI flash
      await new Promise(resolve => setTimeout(resolve, 100));
      // Force refresh data always, bypassing cache
      refreshData(true);
      console.log("Forced data refresh on component mount");
    };
    
    loadInitialData();
  }, [refreshData]);
  
  // Get a specific dog by ID
  const getDog = async (dogId) => {
    if (!dogId) {
      debugError('Invalid dog ID provided to getDog:', dogId);
      return null;
    }
    
    try {
      // First check if we already have this dog in our state
      const cachedDog = dogs.find(dog => dog.id === parseInt(dogId, 10));
      if (cachedDog) {
        return cachedDog;
      }
      
      // Otherwise fetch from API
      const response = await fetch(`${API_URL}/dogs/${dogId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dog: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      debugError(`Error fetching dog ${dogId}:`, error);
      return null;
    }
  };
  
  // Get a specific litter by ID with complete data
  const getLitter = useCallback(async (id) => {
    // First try from context
    const contextLitter = litters.find(litter => litter.id && litter.id.toString() === id?.toString());
    
    if (contextLitter) {
      return contextLitter;
    }
    
    // If not in context, fetch fresh data
    try {
      const response = await apiGet(`litters/${id}`);
      if (response && response.ok && response.data) {
        return response.data;
      }
    } catch (err) {
      console.error(`Error fetching litter ${id}:`, err);
    }
    
    return null;
  }, [litters]);
  
  // Get puppies for a specific litter
  const getPuppiesForLitter = useCallback(async (litterId) => {
    if (!litterId) return [];
    
    // First check if we have them in context
    const litterPuppies = puppies.filter(puppy => 
      puppy.litter_id && puppy.litter_id.toString() === litterId.toString()
    );
    
    if (litterPuppies.length > 0) {
      return litterPuppies;
    }
    
    // If not in context, fetch fresh
    try {
      const response = await apiGet(`litters/${litterId}/puppies`);
      if (response && response.ok && response.data) {
        return response.data;
      }
    } catch (err) {
      console.error(`Error fetching puppies for litter ${litterId}:`, err);
    }
    
    return [];
  }, [puppies]);
  
  // Add additional useful methods
  const getPuppy = useCallback(async (id) => {
    if (!id) return null;
    
    // First try from context
    const contextPuppy = puppies.find(puppy => puppy.id && puppy.id.toString() === id.toString());
    
    if (contextPuppy) {
      return contextPuppy;
    }
    
    // If not in context, fetch fresh
    try {
      const response = await apiGet(`puppies/${id}`);
      if (response && response.ok && response.data) {
        return response.data;
      }
    } catch (err) {
      console.error(`Error fetching puppy ${id}:`, err);
    }
    
    return null;
  }, [puppies]);

  // Methods to update data (will call API and update local state)
  const addDog = async (dogData) => {
    try {
      // If there's a file to upload, handle it first
      if (dogData.cover_photo_file) {
        const formData = new FormData();
        formData.append('cover_photo', dogData.cover_photo_file);
        
        // Add all other fields to formData
        Object.keys(dogData).forEach(key => {
          if (key !== 'cover_photo_file' && key !== 'cover_photo_preview') {
            formData.append(key, dogData[key]);
          }
        });
        
        // Use multipart/form-data for file upload
        const response = await fetch(`${API_URL}/dogs/`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to create dog');
        }
        
        const newDog = await response.json();
        setDogs(prev => [...prev, newDog]);
        return newDog;
      } else {
        // No file to upload, just send JSON data
        const response = await fetch(`${API_URL}/dogs/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dogData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create dog');
        }
        
        const newDog = await response.json();
        setDogs(prev => [...prev, newDog]);
        return newDog;
      }
    } catch (error) {
      console.error('Error adding dog:', error);
      throw error;
    }
  };

  const updateDog = (updatedDog) => {
    setDogs(prev => prev.map(dog => 
      dog.id === updatedDog.id ? updatedDog : dog
    ));
  };

  const deleteDog = (dogId) => {
    setDogs(prev => prev.filter(dog => dog.id !== dogId));
  };

  const addLitter = (newLitter) => {
    setLitters(prev => [...prev, newLitter]);
  };

  const updateLitter = (updatedLitter) => {
    setLitters(prev => prev.map(litter => 
      litter.id === updatedLitter.id ? updatedLitter : litter
    ));
  };

  const deleteLitter = (litterId) => {
    setLitters(prev => prev.filter(litter => litter.id !== litterId));
  };

  // Update the refreshDogs function to prevent re-render loops by using a dedicated loading state
  const refreshDogs = async () => {
    // Only proceed if we're not already loading dogs
    if (dogsLoading) {
      return;
    }
    
    setDogsLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch(`${API_URL}/dogs`);
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
        } catch (e) {
          // If parsing failed, use the status text
          throw new Error(response.statusText || `HTTP error ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setDogs(data);
      } else {
        debugError('Unexpected dogs response format:', data);
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      debugError('Error refreshing dogs:', error);
      setError(error.message || 'Failed to load dogs');
    } finally {
      setDogsLoading(false);
    }
  };

  // Similarly update the refreshLitters function
  const refreshLitters = async () => {
    // Only proceed if we're not already loading litters
    if (littersLoading) {
      return;
    }
    
    setLittersLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch(`${API_URL}/litters`);
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
        } catch (e) {
          // If parsing failed, use the status text
          throw new Error(response.statusText || `HTTP error ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setLitters(data);
      } else {
        debugError('Unexpected litters response format:', data);
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      debugError('Error refreshing litters:', error);
      setError(error.message || 'Failed to load litters');
    } finally {
      setLittersLoading(false);
    }
  };

  // Update the useEffect to only fetch data on mount, not on every render
  useEffect(() => {
    // Only fetch if we don't already have data
    if (dogs.length === 0 && !dogsLoading) {
      refreshDogs();
    }
    
    if (litters.length === 0 && !littersLoading) {
      refreshLitters();
    }
  }, []); // Empty dependency array means only run on mount

  // Add proper validation before making litter-related API calls
  const fetchLitter = async (litterId) => {
    // Validate ID before making API call
    if (!litterId || litterId === 'undefined') {
      console.error("Invalid litter ID provided to fetchLitter:", litterId);
      return { error: "Invalid litter ID" };
    }
    
    try {
      const response = await fetch(`${API_URL}/litters/${litterId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching litter:", error);
      return { error: error.message };
    }
  };

  // Similarly, update any other litter-related API calls:
  const fetchLitterPuppies = async (litterId) => {
    // Validate ID before making API call
    if (!litterId || litterId === 'undefined') {
      console.error("Invalid litter ID provided to fetchLitterPuppies:", litterId);
      return { puppies: [], error: "Invalid litter ID" };
    }
    
    // Rest of function...
  };

  // Add debug calls to trace where undefined requests are coming from
  useEffect(() => {
    // Add this debugging to trace where API calls to undefined litters are coming from
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (url.includes('undefined')) {
        debugError('⚠️ Fetch with undefined in URL:', url);
        debugError('⚠️ Call stack:', new Error().stack);
        // Instead of making a failing request, return a rejected promise with helpful error
        return Promise.reject(new Error(`Invalid API call to ${url} - URL contains undefined`));
      }
      return originalFetch.apply(this, arguments);
    };

    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, []);

  // Update the context value to include the new loading states
  const contextValue = {
    dogs,
    puppies: actualPuppies,
    adultDogs,
    litters,
    loading,
    dogsLoading,
    littersLoading,
    error,
    dataTimestamp,
    refreshData,
    getDog,
    getLitter,
    getPuppiesForLitter,
    getPuppy,
    addDog,
    updateDog,
    deleteDog,
    addLitter,
    updateLitter,
    deleteLitter,
    refreshDogs,
    refreshLitters,
    fetchLitter,
    fetchLitterPuppies
  };

  return <DogContext.Provider value={contextValue}>{children}</DogContext.Provider>;
};

export const useDog = () => {
  const context = useContext(DogContext);
  
  if (!context) {
    throw new Error('useDog must be used within a DogProvider');
  }
  
  // Create wrapped versions of API functions that validate IDs
  const safeContext = {
    ...context,
    
    // Override getLitter with a safe version
    getLitter: (litterId) => {
      if (!litterId || litterId === 'undefined' || litterId === 'null') {
        debugError('⚠️ Attempted to call getLitter with invalid ID:', litterId);
        return Promise.resolve({ error: 'Invalid litter ID' });
      }
      return context.getLitter(litterId);
    },
    
    // Override getLitterPuppies with a safe version
    getLitterPuppies: (litterId) => {
      if (!litterId || litterId === 'undefined' || litterId === 'null') {
        debugError('⚠️ Attempted to call getLitterPuppies with invalid ID:', litterId);
        return Promise.resolve({ puppies: [], error: 'Invalid litter ID' });
      }
      return context.getLitterPuppies(litterId);
    },
    
    // Similarly wrap other ID-based functions
    getDog: (dogId) => {
      if (!dogId || dogId === 'undefined' || dogId === 'null') {
        debugError('⚠️ Attempted to call getDog with invalid ID:', dogId);
        return null;
      }
      return context.getDog(dogId);
    }
  };
  
  return safeContext;
};

export default DogContext;
