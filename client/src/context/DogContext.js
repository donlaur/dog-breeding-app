// src/context/DogContext.js
import React, { createContext, useState, useEffect } from 'react';
import { API_URL, debugLog } from '../config';

const DogContext = createContext();

export const DogProvider = ({ children }) => {
  const [dogs, setDogs] = useState([]);
  const [breeds, setBreeds] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/dogs`)
      .then((response) => response.json())
      .then((data) => {
        debugLog("Fetched dogs:", data);
        setDogs(data);
      })
      .catch((error) => console.error('Error fetching dogs:', error));

    fetch(`${API_URL}/breeds`)
      .then((response) => response.json())
      .then((data) => {
        debugLog("Fetched breeds:", data);
        setBreeds(data);
      })
      .catch((error) => console.error('Error fetching breeds:', error));
  }, []);

  return (
    <DogContext.Provider value={{ dogs, setDogs, breeds }}>
      {children}
    </DogContext.Provider>
  );
};

export default DogContext;
