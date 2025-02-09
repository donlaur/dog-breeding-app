import React, { createContext, useState, useEffect } from 'react';

const DogContext = createContext();

export const DogProvider = ({ children }) => {
  const [dogs, setDogs] = useState([]);
  const [breeds, setBreeds] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/dogs')
      .then((response) => response.json())
      .then((data) => setDogs(data))
      .catch((error) => console.error('Error fetching dogs:', error));

    fetch('http://127.0.0.1:5000/api/breeds')
      .then((response) => response.json())
      .then((data) => setBreeds(data))
      .catch((error) => console.error('Error fetching breeds:', error));
  }, []);

  return (
    <DogContext.Provider value={{ dogs, setDogs, breeds }}>
      {children}
    </DogContext.Provider>
  );
};

export default DogContext;
