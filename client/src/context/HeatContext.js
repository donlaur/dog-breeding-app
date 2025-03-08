import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';

// Create the context
const HeatContext = createContext();

// Provider component
export const HeatProvider = ({ children }) => {
  const [heats, setHeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch heats
  const refreshHeats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('heats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch heats');
      }
      
      const data = await response.json();
      setHeats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching heats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add heat cycle
  const addHeat = async (heatData) => {
    try {
      const response = await apiPost('heats', heatData);
      
      if (!response.ok) {
        throw new Error('Failed to add heat cycle');
      }
      
      const newHeat = await response.json();
      setHeats(prev => [...prev, newHeat]);
      return { heat: newHeat, error: null };
    } catch (err) {
      console.error('Error adding heat cycle:', err);
      return { heat: null, error: err.message };
    }
  };

  // Update heat cycle
  const updateHeat = async (id, heatData) => {
    try {
      const response = await apiPut(`heats/${id}`, heatData);
      
      if (!response.ok) {
        throw new Error('Failed to update heat cycle');
      }
      
      const updatedHeat = await response.json();
      setHeats(prev => prev.map(heat => heat.id === id ? updatedHeat : heat));
      return { heat: updatedHeat, error: null };
    } catch (err) {
      console.error('Error updating heat cycle:', err);
      return { heat: null, error: err.message };
    }
  };

  // Delete heat cycle
  const deleteHeat = async (id) => {
    try {
      const response = await apiDelete(`heats/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete heat cycle');
      }
      
      setHeats(prev => prev.filter(heat => heat.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting heat cycle:', err);
      return { error: err.message };
    }
  };

  return (
    <HeatContext.Provider
      value={{
        heats,
        loading,
        error,
        refreshHeats,
        addHeat,
        updateHeat,
        deleteHeat
      }}
    >
      {children}
    </HeatContext.Provider>
  );
};

// Custom hook to use the context
export const useHeat = () => {
  const context = useContext(HeatContext);
  if (!context) {
    throw new Error('useHeat must be used within a HeatProvider');
  }
  return context;
}; 