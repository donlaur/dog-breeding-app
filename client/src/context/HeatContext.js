import React, { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

export const HeatContext = createContext();

export const HeatProvider = ({ children }) => {
  const [heats, setHeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHeats = async () => {
    try {
      const response = await fetch(`${API_URL}/heats`);
      if (!response.ok) throw new Error('Failed to fetch heats');
      const data = await response.json();
      setHeats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeats();
  }, []);

  return (
    <HeatContext.Provider value={{ heats, loading, error, fetchHeats }}>
      {children}
    </HeatContext.Provider>
  );
}; 