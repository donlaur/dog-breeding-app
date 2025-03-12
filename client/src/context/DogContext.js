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
  const [breeds, setBreeds] = useState([]);
  
  // Debug effect to log whenever puppies state changes
  useEffect(() => {
    debugLog('Puppies state changed:', puppies);
    debugLog('Puppies count in state:', puppies.length);
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
  const initialLoadRef = useRef(false);
  
  // Track retry attempts to prevent infinite retries
  const retryAttempts = useRef(0);
  const MAX_RETRIES = 2;

  // Cache expiration time (15 minutes - increased for better performance)
  const CACHE_EXPIRATION = 15 * 60 * 1000; 
  
  // LocalStorage keys for persistent caching
  const STORAGE_KEYS = {
    DOGS: 'breeder_app_dogs_cache',
    LITTERS: 'breeder_app_litters_cache',
    PUPPIES: 'breeder_app_puppies_cache',
    TIMESTAMP: 'breeder_app_cache_timestamp'
  };

  // Get adult dogs (is_adult === true)
  const adultDogs = dogs.filter(dog => dog.is_adult === true);

  // Get puppies (from the puppies table)
  const actualPuppies = puppies;

  // Add a loading state flag specifically for dogs to prevent render loops
  const [dogsLoading, setDogsLoading] = useState(false);
  const [littersLoading, setLittersLoading] = useState(false);

  // Load cached data from localStorage on component mount
  useEffect(() => {
    try {
      // Get timestamp first to check validity
      const storedTimestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
      
      if (storedTimestamp) {
        const timestamp = parseInt(storedTimestamp, 10);
        // Check if cache is still valid
        if ((Date.now() - timestamp) < CACHE_EXPIRATION) {
          console.log('Loading data from localStorage cache');
          
          // Set the timestamp in component state
          setDataTimestamp(timestamp);
          
          // Load dogs
          const cachedDogs = localStorage.getItem(STORAGE_KEYS.DOGS);
          if (cachedDogs) {
            try {
              const parsedDogs = JSON.parse(cachedDogs);
              if (Array.isArray(parsedDogs)) {
                setDogs(parsedDogs);
                console.log(`Loaded ${parsedDogs.length} dogs from cache`);
              }
            } catch (e) {
              console.error('Error parsing cached dogs:', e);
            }
          }
          
          // Load litters
          const cachedLitters = localStorage.getItem(STORAGE_KEYS.LITTERS);
          if (cachedLitters) {
            try {
              const parsedLitters = JSON.parse(cachedLitters);
              if (Array.isArray(parsedLitters)) {
                setLitters(parsedLitters);
                console.log(`Loaded ${parsedLitters.length} litters from cache`);
              }
            } catch (e) {
              console.error('Error parsing cached litters:', e);
            }
          }
          
          // Load puppies
          const cachedPuppies = localStorage.getItem(STORAGE_KEYS.PUPPIES);
          if (cachedPuppies) {
            try {
              const parsedPuppies = JSON.parse(cachedPuppies);
              if (Array.isArray(parsedPuppies)) {
                setPuppies(parsedPuppies);
                console.log(`Loaded ${parsedPuppies.length} puppies from cache`);
              }
            } catch (e) {
              console.error('Error parsing cached puppies:', e);
            }
          }
          
          // Mark initial load as complete
          initialLoadRef.current = true;
        } else {
          console.log('Cache expired, will load fresh data');
          // Clear expired cache
          localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
          localStorage.removeItem(STORAGE_KEYS.DOGS);
          localStorage.removeItem(STORAGE_KEYS.LITTERS);
          localStorage.removeItem(STORAGE_KEYS.PUPPIES);
        }
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, []);

  // Function to save current data to localStorage
  const saveToLocalStorage = () => {
    try {
      // Only cache if we have data
      if (dogs.length || litters.length || puppies.length) {
        // Save the current timestamp
        const timestamp = Date.now();
        localStorage.setItem(STORAGE_KEYS.TIMESTAMP, timestamp.toString());
        
        // Save dogs
        if (dogs.length) {
          localStorage.setItem(STORAGE_KEYS.DOGS, JSON.stringify(dogs));
        }
        
        // Save litters
        if (litters.length) {
          localStorage.setItem(STORAGE_KEYS.LITTERS, JSON.stringify(litters));
        }
        
        // Save puppies
        if (puppies.length) {
          localStorage.setItem(STORAGE_KEYS.PUPPIES, JSON.stringify(puppies));
        }
        
        console.log('Saved data to localStorage cache');
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };

  // Function to check if cache is valid
  const isCacheValid = () => {
    if (!dataTimestamp) return false;
    return (Date.now() - dataTimestamp) < CACHE_EXPIRATION;
  };

  // Modify refreshData to use separate functions for each data type and accept options
  const refreshData = useCallback(async (forceRefresh = false, options = {}) => {
    // Default options
    const { includeLitters = false } = options;
    
    // If already loading, don't start another request
    if (loading && !forceRefresh) {
      debugLog('Already loading data, skipping refresh');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Fetch data with more robust error handling
    try {
      // Create promises but don't await them yet - specify exact endpoints without trailing slashes
      pendingRequests.current.dogs = apiGet('dogs');
      
      // Only fetch litters if specifically requested
      if (includeLitters) {
        debugLog('Including litters in data refresh');
        pendingRequests.current.litters = apiGet('litters');
      } else {
        debugLog('Skipping litters in data refresh');
      }
      
      // Handle dogs
      let dogsData = [];
      try {
        const dogsResponse = await pendingRequests.current.dogs;
        if (dogsResponse && dogsResponse.ok) {
          dogsData = dogsResponse.data || [];
          setDogs(dogsData);
        } else {
          debugError('Failed to load dogs:', dogsResponse?.error || 'Unknown error');
        }
      } catch (err) {
        debugError('Error fetching dogs:', err);
      }
      
      // Handle litters - only if requested
      if (includeLitters && pendingRequests.current.litters) {
        try {
          const littersResponse = await pendingRequests.current.litters;
          if (littersResponse && littersResponse.ok) {
            setLitters(littersResponse.data || []);
          } else {
            debugError('Failed to load litters:', littersResponse?.error || 'Unknown error');
            // If litters fail, just set empty array and continue
            setLitters([]);
          }
        } catch (err) {
          debugError('Error fetching litters:', err);
          setLitters([]);
        }
      }

      // If we got here, consider the data load complete even if some requests failed
      // This prevents infinite retries when some endpoints aren't available
      initialLoadRef.current = true;
      const timestamp = Date.now();
      setDataTimestamp(timestamp);
      
      // Save data to localStorage for persistent caching
      saveToLocalStorage();
      
      // Reset retry counter on any successful load
      if (dogsData.length > 0) {
        retryAttempts.current = 0;
      }
    } catch (err) {
      debugError('Global error in refreshData:', err);
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
  }, []); // No dependencies to prevent recreation on each render

  // Add a separate function to load puppies only when needed
  const loadPuppies = useCallback(async (forceRefresh = false) => {
    // Check if we already have puppies data and not forcing refresh
    if (puppies.length > 0 && !forceRefresh) {
      debugLog('Using existing puppies data');
      return puppies;
    }
    
    // Check if there's already a pending request
    if (pendingRequests.current.puppies) {
      debugLog('Puppies request already in progress');
      try {
        const response = await pendingRequests.current.puppies;
        return response.data || [];
      } catch (err) {
        debugError('Error in pending puppies request:', err);
        return [];
      }
    }
    
    debugLog('FETCHING PUPPIES FROM API...');
    try {
      pendingRequests.current.puppies = apiGet('puppies');
      const puppiesResponse = await pendingRequests.current.puppies;
      
      if (puppiesResponse && puppiesResponse.ok) {
        const puppiesData = puppiesResponse.data || [];
        debugLog('SUCCESS: Puppies API response with', puppiesData.length, 'puppies');
        
        // Update state with the new array
        setPuppies(puppiesData);
        
        // Update localStorage cache
        localStorage.setItem(STORAGE_KEYS.PUPPIES, JSON.stringify(puppiesData));
        
        return puppiesData;
      } else {
        debugError('Failed to load puppies:', puppiesResponse?.error || 'Unknown error');
        return [];
      }
    } catch (err) {
      debugError('Error fetching puppies:', err);
      return [];
    } finally {
      pendingRequests.current.puppies = null;
    }
  }, [puppies]);

  // Load data on initial mount - only once, but always force a refresh
  useEffect(() => {
    const loadInitialData = async () => {
      // Skip if we've already loaded data to prevent multiple calls
      if (initialLoadRef.current) {
        debugLog('Initial data already loaded, skipping');
        return;
      }
      
      // Mark as loaded before making the request
      initialLoadRef.current = true;
      
      // Slight delay to prevent UI flash
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force refresh data always, bypassing cache - only load dogs initially
      refreshData(true, { includeLitters: false });
      debugLog("Forced data refresh on component mount - dogs only");
    };
    
    loadInitialData();
  }, []); // Empty dependency array - only run once on mount
  
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

  // Add specific refresh functions for different data types
  const refreshDogs = useCallback((forceRefresh = false, options = {}) => {
    debugLog('Refreshing dogs with options:', options);
    return refreshData(forceRefresh, options);
  }, [refreshData]);
  
  const refreshLitters = useCallback((forceRefresh = false) => {
    debugLog('Refreshing litters');
    return refreshData(forceRefresh, { includeLitters: true });
  }, [refreshData]);

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

  // Inside the DogProvider component
  useEffect(() => {
    // Add debug logging to see if breeds are being loaded
    console.log("DogContext: Loading breeds...");
    
    const fetchBreeds = async () => {
      try {
        console.log("DogContext: Fetching breeds from API");
        const response = await fetch(`${API_URL}/breeds`);
        
        if (!response.ok) {
          throw new Error(`Error fetching breeds: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("DogContext: Breeds loaded successfully:", data);
        setBreeds(data);
      } catch (error) {
        console.error("Error fetching breeds:", error);
        // Initialize with empty array to prevent undefined
        setBreeds([]);
      }
    };
    
    fetchBreeds();
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
    loadPuppies,
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
    fetchLitterPuppies,
    breeds
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
