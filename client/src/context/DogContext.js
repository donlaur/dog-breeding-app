// src/context/DogContext.js
import React, { createContext, useState, useEffect } from 'react';
import { API_URL, debugLog } from '../config';

const DogContext = createContext();

export const DogProvider = ({ children }) => {
  const [dogs, setDogs] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dogs
        const dogsResponse = await fetch(`${API_URL}/dogs`);
        if (!dogsResponse.ok) {
          throw new Error(`Dogs fetch failed: ${dogsResponse.status}`);
        }
        const dogsData = await dogsResponse.json();
        debugLog("Fetched dogs:", dogsData);
        setDogs(dogsData);

        // Fetch breeds
        const breedsResponse = await fetch(`${API_URL}/breeds`);
        if (!breedsResponse.ok) {
          throw new Error(`Breeds fetch failed: ${breedsResponse.status}`);
        }
        const breedsData = await breedsResponse.json();
        debugLog("Fetched breeds:", breedsData);
        setBreeds(breedsData);

      } catch (error) {
        console.error('Error in DogContext:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const value = {
    dogs,
    setDogs,
    breeds,
    loading,
    error
  };

  return (
    <DogContext.Provider value={value}>
      {children}
    </DogContext.Provider>
  );
};

export default DogContext;
