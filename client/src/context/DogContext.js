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

  // Add this comprehensive dog loading function to your context
  const loadFullDogData = useCallback(async () => {
    console.log("Loading complete dog data for program...");
    setLoading(true);
    
    try {
      // Make a single API call to get all dogs with full details
      const response = await apiGet('dogs/full');
      
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
  }, [apiGet, setDogs, setError, setLoading]);

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

  const value = {
    dogs,
    puppies,
    adultDogs,
    litters,
    breeds,
    loading,
    error,
    refreshDogs,
    refreshLitters: refreshDogs,
    refreshBreeds: refreshDogs,
    addDog,
    updateDog,
    deleteDog,
    addLitter,
    updateLitter,
    deleteLitter,
    getDogById
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
