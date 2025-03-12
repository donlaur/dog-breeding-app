// src/context/DogContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';

// Create context
const DogContext = createContext();

// Provider component
export const DogProvider = ({ children }) => {
  // State for dogs
  const [dogs, setDogs] = useState([]);
  const [dogsLoading, setDogsLoading] = useState(false);
  const [dogsError, setDogsError] = useState(null);
  
  // State for litters
  const [litters, setLitters] = useState([]);
  const [littersLoading, setLittersLoading] = useState(false);
  const [littersError, setLittersError] = useState(null);
  
  // State for puppies
  const [puppies, setPuppies] = useState([]);
  const [puppiesLoading, setPuppiesLoading] = useState(false);
  const [puppiesError, setPuppiesError] = useState(null);
  
  // State for breeds
  const [breeds, setBreeds] = useState([]);
  const [breedsLoading, setBreedsLoading] = useState(false);
  const [breedsError, setBreedsError] = useState(null);
  
  // Global loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for tracking state between renders
  const initialLoadRef = useRef(false);
  const pendingRequests = useRef({
    dogs: null,
    litters: null,
    puppies: null
  });
  
  // Function to fetch data from API
  const fetchDataFromApi = useCallback(async (options = {}) => {
    const { includeLitters = false } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create promises but don't await them yet
      pendingRequests.current.dogs = apiGet('dogs');
      
      if (includeLitters) {
        debugLog('Including litters in data refresh');
        pendingRequests.current.litters = apiGet('litters');
      }
      
      // Now await all the pending requests
      const results = await Promise.allSettled(
        Object.values(pendingRequests.current).filter(Boolean)
      );
      
      // Process results
      let hasErrors = false;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const response = result.value;
          
          if (response && response.ok) {
            // Determine which state to update based on the request
            if (index === 0) { // Dogs
              setDogs(response.data || []);
              setDogsLoading(false);
              setDogsError(null);
            } else if (index === 1 && includeLitters) { // Litters
              setLitters(response.data || []);
              setLittersLoading(false);
              setLittersError(null);
            }
          } else {
            hasErrors = true;
            const errorMsg = response?.error || 'Unknown error occurred';
            
            if (index === 0) { // Dogs
              setDogsError(errorMsg);
              setDogsLoading(false);
            } else if (index === 1 && includeLitters) { // Litters
              setLittersError(errorMsg);
              setLittersLoading(false);
            }
          }
        } else {
          hasErrors = true;
          const errorMsg = result.reason?.message || 'Request failed';
          
          if (index === 0) { // Dogs
            setDogsError(errorMsg);
            setDogsLoading(false);
          } else if (index === 1 && includeLitters) { // Litters
            setLittersError(errorMsg);
            setLittersLoading(false);
          }
        }
      });
      
      if (hasErrors) {
        setError('Some data failed to load. Please check the console for details.');
      }
      
      // Reset pending requests
      pendingRequests.current = {
        dogs: null,
        litters: null,
        puppies: null
      };
      
      // Mark as initialized
      initialLoadRef.current = true;
    } catch (error) {
      debugError('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Function to refresh data
  const refreshData = useCallback(async (forceRefresh = false, options = {}) => {
    // If already loading, don't start another request
    if (loading && !forceRefresh) {
      debugLog('Already loading data, skipping refresh');
      return;
    }
    
    await fetchDataFromApi(options);
  }, [loading, fetchDataFromApi]);

  // Add specific refresh functions for different data types
  const refreshDogs = useCallback((forceRefresh = false, options = {}) => {
    debugLog('Refreshing dogs with options:', options);
    return refreshData(forceRefresh, options);
  }, [refreshData]);
  
  const refreshLitters = useCallback((forceRefresh = false) => {
    debugLog('Refreshing litters with forceRefresh:', forceRefresh);
    return refreshData(forceRefresh, { includeLitters: true });
  }, [refreshData]);
  
  // Function to refresh breeds
  const refreshBreeds = useCallback(async () => {
    debugLog('Refreshing breeds');
    setBreedsLoading(true);
    setBreedsError(null);
    
    try {
      const response = await apiGet('breeds');
      if (response && response.ok) {
        debugLog('Breeds fetched successfully:', response.data);
        setBreeds(response.data || []);
      } else {
        throw new Error(response?.error || 'Failed to fetch breeds');
      }
    } catch (error) {
      debugError('Error fetching breeds:', error);
      setBreedsError(error.message);
    } finally {
      setBreedsLoading(false);
    }
  }, []);

  // Load data on initial mount - SINGLE useEffect for initialization
  useEffect(() => {
    const initializeData = async () => {
      // Only fetch if we haven't loaded data yet
      if (!initialLoadRef.current) {
        await refreshData(true);
        // Also fetch breeds on initial load
        await refreshBreeds();
      }
    };
    
    initializeData();
  }, [refreshData, refreshBreeds]);

  // Add dog
  const addDog = async (dogData) => {
    try {
      const response = await apiPost('dogs', dogData);
      if (response && response.ok) {
        // Add new dog to state
        setDogs(prevDogs => [...prevDogs, response.data]);
        return { success: true, data: response.data };
      } else {
        throw new Error(response?.error || 'Failed to add dog');
      }
    } catch (error) {
      debugError('Error adding dog:', error);
      return { success: false, error: error.message };
    }
  };

  // Update dog
  const updateDog = async (dogId, dogData) => {
    try {
      const response = await apiPut(`dogs/${dogId}`, dogData);
      if (response && response.ok) {
        // Update dog in state
        setDogs(prevDogs => 
          prevDogs.map(dog => 
            dog.id === dogId ? { ...dog, ...response.data } : dog
          )
        );
        return { success: true, data: response.data };
      } else {
        throw new Error(response?.error || 'Failed to update dog');
      }
    } catch (error) {
      debugError('Error updating dog:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete dog
  const deleteDog = async (dogId) => {
    try {
      const response = await apiDelete(`dogs/${dogId}`);
      if (response && response.ok) {
        // Remove dog from state
        setDogs(prevDogs => prevDogs.filter(dog => dog.id !== dogId));
        return { success: true };
      } else {
        throw new Error(response?.error || 'Failed to delete dog');
      }
    } catch (error) {
      debugError('Error deleting dog:', error);
      return { success: false, error: error.message };
    }
  };

  // Add litter
  const addLitter = async (litterData) => {
    try {
      const response = await apiPost('litters', litterData);
      if (response && response.ok) {
        // Add new litter to state
        setLitters(prevLitters => [...prevLitters, response.data]);
        return { success: true, data: response.data };
      } else {
        throw new Error(response?.error || 'Failed to add litter');
      }
    } catch (error) {
      debugError('Error adding litter:', error);
      return { success: false, error: error.message };
    }
  };

  // Update litter
  const updateLitter = async (litterId, litterData) => {
    try {
      const response = await apiPut(`litters/${litterId}`, litterData);
      if (response && response.ok) {
        // Update litter in state
        setLitters(prevLitters => 
          prevLitters.map(litter => 
            litter.id === litterId ? { ...litter, ...response.data } : litter
          )
        );
        return { success: true, data: response.data };
      } else {
        throw new Error(response?.error || 'Failed to update litter');
      }
    } catch (error) {
      debugError('Error updating litter:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete litter
  const deleteLitter = async (litterId) => {
    try {
      const response = await apiDelete(`litters/${litterId}`);
      if (response && response.ok) {
        // Remove litter from state
        setLitters(prevLitters => prevLitters.filter(litter => litter.id !== litterId));
        return { success: true };
      } else {
        throw new Error(response?.error || 'Failed to delete litter');
      }
    } catch (error) {
      debugError('Error deleting litter:', error);
      return { success: false, error: error.message };
    }
  };

  // Get dog by ID
  const getDogById = (dogId) => {
    return dogs.find(dog => dog.id === dogId);
  };

  // Get litter by ID
  const getLitterById = (litterId) => {
    return litters.find(litter => litter.id === litterId);
  };

  // Get litter with API call
  const getLitter = async (litterId) => {
    try {
      const response = await apiGet(`litters/${litterId}`);
      if (response && response.ok && response.data) {
        // Update the litter in our state if it exists
        setLitters(prevLitters => {
          const exists = prevLitters.some(litter => litter.id === parseInt(litterId));
          if (exists) {
            return prevLitters.map(litter => 
              litter.id === parseInt(litterId) ? response.data : litter
            );
          } else {
            return [...prevLitters, response.data];
          }
        });
        return response.data;
      } else {
        throw new Error(response?.error || 'Failed to fetch litter');
      }
    } catch (error) {
      debugError('Error fetching litter:', error);
      throw error;
    }
  };

  // Get puppies for litter
  const getPuppiesForLitter = async (litterId) => {
    try {
      const response = await apiGet(`litters/${litterId}/puppies`);
      if (response && response.ok) {
        return response.data || [];
      } else {
        throw new Error(response?.error || 'Failed to fetch puppies for litter');
      }
    } catch (error) {
      debugError('Error fetching puppies for litter:', error);
      return [];
    }
  };

  // Context value
  const contextValue = {
    // Dogs
    dogs,
    dogsLoading,
    dogsError,
    refreshDogs,
    addDog,
    updateDog,
    deleteDog,
    getDogById,
    
    // Litters
    litters,
    littersLoading,
    littersError,
    refreshLitters,
    addLitter,
    updateLitter,
    deleteLitter,
    getLitterById,
    getLitter,
    
    // Puppies
    puppies,
    puppiesLoading,
    puppiesError,
    getPuppiesForLitter,
    
    // Breeds
    breeds,
    breedsLoading,
    breedsError,
    refreshBreeds,
    
    // Global
    loading,
    error,
    refreshData
  };

  return (
    <DogContext.Provider value={contextValue}>
      {children}
    </DogContext.Provider>
  );
};

// Custom hook for using the context
export const useDog = () => {
  const context = useContext(DogContext);
  if (!context) {
    throw new Error('useDog must be used within a DogProvider');
  }
  return context;
};

export default DogContext;
