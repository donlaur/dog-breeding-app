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
  const [puppies, setPuppies] = useState([]);
  const [loading, setLoading] = useState(false);  // Start with false to prevent immediate loading state
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
      // Create promises but don't await them yet
      pendingRequests.current.dogs = apiGet('dogs');
      pendingRequests.current.litters = apiGet('litters');
      pendingRequests.current.puppies = apiGet('puppies');
      
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
        const puppiesResponse = await pendingRequests.current.puppies;
        if (puppiesResponse && puppiesResponse.ok) {
          setPuppies(puppiesResponse.data || []);
        } else {
          console.error('Failed to load puppies:', puppiesResponse?.error || 'Unknown error');
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
  
  // Load data on initial mount - only once
  useEffect(() => {
    const loadInitialData = async () => {
      if (!initialLoadComplete.current) {
        // Slight delay to prevent UI flash
        await new Promise(resolve => setTimeout(resolve, 100));
        refreshData();
      }
    };
    
    loadInitialData();
  }, [refreshData]);
  
  // Get a specific dog by ID
  const getDog = (id) => {
    return dogs.find(dog => dog.id && dog.id.toString() === id?.toString()) || null;
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

  // Single-purpose refresh functions that don't trigger full refresh
  const refreshDogs = async () => {
    try {
      const response = await apiGet('dogs');
      if (response && response.ok) {
        setDogs(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
    }
  };

  const refreshLitters = async (force = false) => {
    if (loading && !force) return;
    
    try {
      setLoading(true);
      const response = await apiGet('litters');
      
      if (!response.ok) {
        throw new Error('Failed to fetch litters');
      }
      
      debugLog('Litters loaded:', response.data);
      setLitters(response.data || []);
    } catch (error) {
      debugError('Error fetching litters:', error);
      setError('Failed to load litters');
    } finally {
      setLoading(false);
    }
  };

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

  // Value to provide in context
  const value = {
    dogs,
    puppies: actualPuppies,
    adultDogs,
    litters,
    loading,
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

  return <DogContext.Provider value={value}>{children}</DogContext.Provider>;
};

export const useDog = () => {
  const context = useContext(DogContext);
  if (!context) {
    throw new Error('useDog must be used within a DogProvider');
  }
  return context;
};

export default DogContext;
