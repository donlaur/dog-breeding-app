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
  const [isInitialized, setIsInitialized] = useState(false);
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

  // Update loadFullDogData to use the correct API endpoint path
  const loadFullDogData = useCallback(async () => {
    console.log("Loading complete dog data for program...");
    setLoading(true);
    
    try {
      // Update the API path to match the server route structure
      const response = await fetch(`${API_URL}/dogs/full`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        }
      });
      
      if (response.ok) {
        const fullDogsData = await response.json();
        console.log(`Loaded ${fullDogsData.length} dogs with complete details`);
        
        // Store in context
        setDogs(fullDogsData);
        
        // Also cache each dog for quick lookup
        fullDogsData.forEach(dog => {
          try {
            // Cache by ID
            localStorage.setItem(`dog_${dog.id}`, JSON.stringify(dog));
            
            // Cache by name variations for URL matching
            if (dog.call_name) {
              // Standard name
              localStorage.setItem(`dog_name_${dog.call_name.toLowerCase()}`, JSON.stringify(dog));
              
              // Hyphenated version (for slug URLs)
              const hyphenVersion = dog.call_name.toLowerCase().replace(/\s+/g, '-');
              localStorage.setItem(`dog_name_${hyphenVersion}`, JSON.stringify(dog));
              
              // URL encoded version
              const encodedVersion = encodeURIComponent(dog.call_name.toLowerCase());
              localStorage.setItem(`dog_name_${encodedVersion}`, JSON.stringify(dog));
            }
          } catch (e) {
            console.error("Error caching dog:", e);
          }
        });
        
        setError(null);
        return fullDogsData;
      } else {
        console.error("Failed to fetch full dog data:", response.status);
        setError("Failed to load complete dog data. Please try again.");
        return [];
      }
    } catch (err) {
      console.error("Error loading full dog data:", err);
      setError("Error connecting to server. Please check your connection.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [API_URL, auth?.token, setDogs, setError, setLoading]);

  // Replace your existing refreshDogs with this
  const refreshDogs = useCallback(() => {
    return loadFullDogData();
  }, [loadFullDogData]);

  // Update getDogById to work with the full data
  const getDogById = useCallback((id) => {
    console.log(`Looking up dog with ID: ${id}`);
    
    if (!id) return null;
    
    // First check local cache - fastest
    try {
      const cachedData = localStorage.getItem(`dog_${id}`);
      if (cachedData) {
        const cachedDog = JSON.parse(cachedData);
        console.log("Found dog in cache:", cachedDog);
        return cachedDog;
      }
    } catch (e) {
      console.error("Error reading from cache:", e);
    }
    
    // Then check URL slug/name variations
    const urlPath = window.location.pathname.toLowerCase();
    const pathSegments = urlPath.split('/');
    let possibleNameSegment = '';
    
    // Extract possible name from URL
    pathSegments.forEach(segment => {
      if (segment && segment.length > 2 && !/^dashboard$/i.test(segment) && 
          !/^dogs$/i.test(segment) && !/^\d+$/.test(segment)) {
        possibleNameSegment = segment;
      }
    });
    
    if (possibleNameSegment) {
      // Try various formats of the name
      try {
        const formats = [
          possibleNameSegment,
          possibleNameSegment.replace(/-/g, ' '),
          possibleNameSegment.replace(/%20/g, ' ')
        ];
        
        for (const format of formats) {
          const cachedByName = localStorage.getItem(`dog_name_${format}`);
          if (cachedByName) {
            const dogByName = JSON.parse(cachedByName);
            console.log(`Found dog by name format "${format}":`, dogByName);
            return dogByName;
          }
        }
      } catch (e) {
        console.error("Error checking name cache:", e);
      }
    }
    
    // If not in cache, check context memory
    if (dogs && dogs.length > 0) {
      // First try exact ID match
      const exactMatch = dogs.find(d => String(d.id) === String(id));
      if (exactMatch) return exactMatch;
      
      // Then try name matching if we have a name segment
      if (possibleNameSegment) {
        // Try various name formats
        const nameFormats = [
          possibleNameSegment,
          possibleNameSegment.replace(/-/g, ' '),
          possibleNameSegment.replace(/%20/g, ' ')
        ];
        
        for (const format of nameFormats) {
          // Exact name match
          const nameMatch = dogs.find(d => 
            d.call_name && d.call_name.toLowerCase() === format.toLowerCase()
          );
          
          if (nameMatch) return nameMatch;
          
          // Partial name match
          const partialMatch = dogs.find(d => 
            d.call_name && d.call_name.toLowerCase().includes(format.toLowerCase())
          );
          
          if (partialMatch) return partialMatch;
        }
      }
    }
    
    // If still not found, trigger a refresh and try again
    // This would typically only happen on initial page load
    if (!loadStatus.current.refreshAttempted) {
      loadStatus.current.refreshAttempted = true;
      console.log("Dog not found in cache or memory, triggering refresh");
      
      // We return a promise here to allow the caller to await the refresh
      return new Promise(async (resolve) => {
        await loadFullDogData();
        
        // After refresh, try the lookup again
        if (dogs && dogs.length > 0) {
          // ID match
          const refreshedMatch = dogs.find(d => String(d.id) === String(id));
          if (refreshedMatch) {
            console.log("Found dog after refresh:", refreshedMatch);
            resolve(refreshedMatch);
            return;
          }
          
          // Name match if we have a name segment
          if (possibleNameSegment) {
            const nameFormats = [
              possibleNameSegment,
              possibleNameSegment.replace(/-/g, ' '),
              possibleNameSegment.replace(/%20/g, ' ')
            ];
            
            for (const format of nameFormats) {
              const nameMatch = dogs.find(d => 
                d.call_name && (
                  d.call_name.toLowerCase() === format.toLowerCase() ||
                  d.call_name.toLowerCase().includes(format.toLowerCase())
                )
              );
              
              if (nameMatch) {
                console.log("Found dog by name after refresh:", nameMatch);
                resolve(nameMatch);
                return;
              }
            }
          }
        }
        
        // Last resort fallback
        console.log("Dog not found after refresh, using fallback");
        resolve({
          id: id,
          call_name: possibleNameSegment
            ? possibleNameSegment.replace(/-|%20/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            : `Dog ${id}`,
          _isFallbackObject: true
        });
      });
    }
    
    // Return a fallback if all else fails and we've already tried refreshing
    return {
      id: id,
      call_name: possibleNameSegment
        ? possibleNameSegment.replace(/-|%20/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : `Dog ${id}`,
      _isFallbackObject: true
    };
  }, [dogs, loadFullDogData]);

  // Add this to your context initialization
  const loadStatus = useRef({
    refreshAttempted: false
  });

  // Add these missing functions
  const addDog = useCallback(async (dogData) => {
    console.log("Adding new dog:", dogData);
    setLoading(true);
    
    try {
      const response = await apiPost('dogs', dogData);
      
      if (response.ok) {
        const newDog = await response.json();
        console.log("Successfully added dog:", newDog);
        
        // Update dogs array with the new dog
        setDogs(prevDogs => [...prevDogs, newDog]);
        
        // Cache the new dog
        try {
          localStorage.setItem(`dog_${newDog.id}`, JSON.stringify(newDog));
          if (newDog.call_name) {
            localStorage.setItem(`dog_name_${newDog.call_name.toLowerCase()}`, JSON.stringify(newDog));
          }
        } catch (e) {
          console.error("Error caching new dog:", e);
        }
        
        setError(null);
        return newDog;
      } else {
        console.error("Failed to add dog:", response.status);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Failed to add dog. Please try again.";
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      console.error("Error adding dog:", err);
      setError("Error connecting to server. Please check your connection.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiPost, setDogs, setError, setLoading]);

  const updateDog = useCallback(async (id, dogData) => {
    console.log(`Updating dog ${id}:`, dogData);
    setLoading(true);
    
    try {
      // Make sure we're using the correct API URL format
      const response = await fetch(`${API_URL}/dogs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify(dogData)
      });
      
      if (response.ok) {
        const updatedDog = await response.json();
        console.log("Successfully updated dog:", updatedDog);
        
        // Update dogs array with the updated dog
        setDogs(prevDogs => 
          prevDogs.map(dog => dog.id === id ? updatedDog : dog)
        );
        
        // Update cache
        try {
          localStorage.setItem(`dog_${id}`, JSON.stringify(updatedDog));
          if (updatedDog.call_name) {
            localStorage.setItem(`dog_name_${updatedDog.call_name.toLowerCase()}`, JSON.stringify(updatedDog));
            
            // Update cached versions with different name formats
            const hyphenVersion = updatedDog.call_name.toLowerCase().replace(/\s+/g, '-');
            localStorage.setItem(`dog_name_${hyphenVersion}`, JSON.stringify(updatedDog));
            
            const encodedVersion = encodeURIComponent(updatedDog.call_name.toLowerCase());
            localStorage.setItem(`dog_name_${encodedVersion}`, JSON.stringify(updatedDog));
          }
        } catch (e) {
          console.error("Error updating dog cache:", e);
        }
        
        setError(null);
        return updatedDog;
      } else {
        console.error("Failed to update dog:", response.status);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Failed to update dog. Please try again.";
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      console.error("Error updating dog:", err);
      setError("Error connecting to server. Please check your connection.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [API_URL, auth?.token, setDogs, setError, setLoading]);

  const deleteDog = useCallback(async (id) => {
    console.log(`Deleting dog ${id}`);
    setLoading(true);
    
    try {
      const response = await apiDelete(`dogs/${id}`);
      
      if (response.ok) {
        console.log(`Successfully deleted dog ${id}`);
        
        // Remove from dogs array
        setDogs(prevDogs => prevDogs.filter(dog => dog.id !== id));
        
        // Remove from cache
        try {
          localStorage.removeItem(`dog_${id}`);
          // We can't easily remove by name since we don't have the dog object anymore
        } catch (e) {
          console.error("Error removing dog from cache:", e);
        }
        
        setError(null);
        return true;
      } else {
        console.error("Failed to delete dog:", response.status);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Failed to delete dog. Please try again.";
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      console.error("Error deleting dog:", err);
      setError("Error connecting to server. Please check your connection.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiDelete, setDogs, setError, setLoading]);

  // Litter functions
  const addLitter = useCallback(async (litterData) => {
    console.log("Adding new litter:", litterData);
    setLoading(true);
    
    try {
      const response = await apiPost('litters', litterData);
      
      if (response.ok) {
        const newLitter = await response.json();
        console.log("Successfully added litter:", newLitter);
        
        // You might need to update some state here depending on your app structure
        
        setError(null);
        return newLitter;
      } else {
        console.error("Failed to add litter:", response.status);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Failed to add litter. Please try again.";
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      console.error("Error adding litter:", err);
      setError("Error connecting to server. Please check your connection.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiPost, setError, setLoading]);

  const updateLitter = useCallback(async (id, litterData) => {
    console.log(`Updating litter ${id}:`, litterData);
    setLoading(true);
    
    try {
      const response = await apiPut(`litters/${id}`, litterData);
      
      if (response.ok) {
        const updatedLitter = await response.json();
        console.log("Successfully updated litter:", updatedLitter);
        
        // You might need to update some state here depending on your app structure
        
        setError(null);
        return updatedLitter;
      } else {
        console.error("Failed to update litter:", response.status);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Failed to update litter. Please try again.";
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      console.error("Error updating litter:", err);
      setError("Error connecting to server. Please check your connection.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiPut, setError, setLoading]);

  const deleteLitter = useCallback(async (id) => {
    console.log(`Deleting litter ${id}`);
    setLoading(true);
    
    try {
      const response = await apiDelete(`litters/${id}`);
      
      if (response.ok) {
        console.log(`Successfully deleted litter ${id}`);
        
        // You might need to update some state here depending on your app structure
        
        setError(null);
        return true;
      } else {
        console.error("Failed to delete litter:", response.status);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Failed to delete litter. Please try again.";
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      console.error("Error deleting litter:", err);
      setError("Error connecting to server. Please check your connection.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiDelete, setError, setLoading]);

  const value = {
    dogs,
    puppies,
    adultDogs,
    litters,
    breeds,
    loading,
    error,
    isInitialized,
    refreshDogs,
    refreshLitters: refreshDogs,
    refreshBreeds: refreshDogs,
    addDog,
    updateDog,
    deleteDog,
    addLitter,
    updateLitter,
    deleteLitter,
    getDogById,
    loadFullDogData
  };

  return (
    <DogContext.Provider value={value}>
      {children}
    </DogContext.Provider>
  );
}

export function useDog() {
  const context = useContext(DogContext);
  if (!context) {
    throw new Error('useDog must be used within a DogProvider');
  }
  return context;
}

export default DogContext;
