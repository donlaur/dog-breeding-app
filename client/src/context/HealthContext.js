import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';

// Create the Health context
const HealthContext = createContext();

// Context hook for easy use
export const useHealth = () => useContext(HealthContext);

// Provider component
export const HealthContextProvider = ({ children }) => {
  // State for various health records
  const [vaccinations, setVaccinations] = useState([]);
  const [medications, setMedications] = useState([]);
  const [healthEvents, setHealthEvents] = useState([]);
  const [vetVisits, setVetVisits] = useState([]);
  const [loading, setLoading] = useState({
    vaccinations: false,
    medications: false,
    healthEvents: false,
    vetVisits: false
  });
  const [error, setError] = useState({
    vaccinations: null,
    medications: null,
    healthEvents: null,
    vetVisits: null
  });
  
  // Fetch all health data for a specific dog
  const fetchDogHealthData = async (dogId) => {
    if (!dogId) return;
    
    // Reset error state
    setError({
      vaccinations: null,
      medications: null,
      healthEvents: null,
      vetVisits: null
    });
    
    // Fetch vaccinations
    await fetchVaccinations(dogId);
    
    // Fetch medications
    await fetchMedications(dogId);
    
    // Fetch health events
    await fetchHealthEvents(dogId);
    
    // Fetch vet visits
    await fetchVetVisits(dogId);
  };
  
  // Fetch vaccinations for a dog
  const fetchVaccinations = async (dogId) => {
    setLoading(prev => ({ ...prev, vaccinations: true }));
    try {
      const data = await apiGet(`/vaccinations?dog_id=eq.${dogId}`);
      debugLog('Fetched vaccinations:', data);
      setVaccinations(data);
    } catch (error) {
      debugError('Error fetching vaccinations:', error);
      setError(prev => ({ 
        ...prev, 
        vaccinations: 'Failed to load vaccination records' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, vaccinations: false }));
    }
  };
  
  // Fetch medications for a dog
  const fetchMedications = async (dogId) => {
    setLoading(prev => ({ ...prev, medications: true }));
    try {
      const data = await apiGet(`/medications?dog_id=eq.${dogId}`);
      debugLog('Fetched medications:', data);
      setMedications(data);
    } catch (error) {
      debugError('Error fetching medications:', error);
      setError(prev => ({ 
        ...prev, 
        medications: 'Failed to load medication records' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, medications: false }));
    }
  };
  
  // Fetch health events for a dog
  const fetchHealthEvents = async (dogId) => {
    setLoading(prev => ({ ...prev, healthEvents: true }));
    try {
      const data = await apiGet(`/health_events?dog_id=eq.${dogId}`);
      debugLog('Fetched health events:', data);
      setHealthEvents(data);
    } catch (error) {
      debugError('Error fetching health events:', error);
      setError(prev => ({ 
        ...prev, 
        healthEvents: 'Failed to load health event records' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, healthEvents: false }));
    }
  };
  
  // Fetch vet visits for a dog
  const fetchVetVisits = async (dogId) => {
    setLoading(prev => ({ ...prev, vetVisits: true }));
    try {
      const data = await apiGet(`/vet_visits?dog_id=eq.${dogId}`);
      debugLog('Fetched vet visits:', data);
      setVetVisits(data);
    } catch (error) {
      debugError('Error fetching vet visits:', error);
      setError(prev => ({ 
        ...prev, 
        vetVisits: 'Failed to load vet visit records' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, vetVisits: false }));
    }
  };
  
  // Add a new vaccination
  const addVaccination = async (vaccinationData) => {
    try {
      // Remove any non-schema fields
      const dataToSend = { ...vaccinationData };
      delete dataToSend.dog_name;
      
      const response = await apiPost('/vaccinations', dataToSend);
      debugLog('Added vaccination:', response);
      
      // Update local state with new data
      setVaccinations(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (error) {
      debugError('Error adding vaccination:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add vaccination record' 
      };
    }
  };
  
  // Update a vaccination
  const updateVaccination = async (id, vaccinationData) => {
    try {
      // Remove any non-schema fields
      const dataToSend = { ...vaccinationData };
      delete dataToSend.dog_name;
      
      const response = await apiPut(`/vaccinations?id=eq.${id}`, dataToSend);
      debugLog('Updated vaccination:', response);
      
      // Update local state
      setVaccinations(prev => 
        prev.map(item => item.id === id ? { ...item, ...response } : item)
      );
      return { success: true, data: response };
    } catch (error) {
      debugError('Error updating vaccination:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update vaccination record' 
      };
    }
  };
  
  // Delete a vaccination
  const deleteVaccination = async (id) => {
    try {
      await apiDelete(`/vaccinations?id=eq.${id}`);
      debugLog('Deleted vaccination with ID:', id);
      
      // Update local state
      setVaccinations(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (error) {
      debugError('Error deleting vaccination:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete vaccination record' 
      };
    }
  };
  
  // Add a new medication
  const addMedication = async (medicationData) => {
    try {
      // Remove any non-schema fields
      const dataToSend = { ...medicationData };
      delete dataToSend.dog_name;
      
      const response = await apiPost('/medications', dataToSend);
      debugLog('Added medication:', response);
      
      // Update local state with new data
      setMedications(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (error) {
      debugError('Error adding medication:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add medication record' 
      };
    }
  };
  
  // Update a medication
  const updateMedication = async (id, medicationData) => {
    try {
      // Remove any non-schema fields
      const dataToSend = { ...medicationData };
      delete dataToSend.dog_name;
      
      const response = await apiPut(`/medications?id=eq.${id}`, dataToSend);
      debugLog('Updated medication:', response);
      
      // Update local state
      setMedications(prev => 
        prev.map(item => item.id === id ? { ...item, ...response } : item)
      );
      return { success: true, data: response };
    } catch (error) {
      debugError('Error updating medication:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update medication record' 
      };
    }
  };
  
  // Delete a medication
  const deleteMedication = async (id) => {
    try {
      await apiDelete(`/medications?id=eq.${id}`);
      debugLog('Deleted medication with ID:', id);
      
      // Update local state
      setMedications(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (error) {
      debugError('Error deleting medication:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete medication record' 
      };
    }
  };
  
  // Add a new health event
  const addHealthEvent = async (eventData) => {
    try {
      // Remove any non-schema fields
      const dataToSend = { ...eventData };
      delete dataToSend.dog_name;
      
      const response = await apiPost('/health_events', dataToSend);
      debugLog('Added health event:', response);
      
      // Update local state with new data
      setHealthEvents(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (error) {
      debugError('Error adding health event:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add health event record' 
      };
    }
  };
  
  // Update a health event
  const updateHealthEvent = async (id, eventData) => {
    try {
      // Remove any non-schema fields
      const dataToSend = { ...eventData };
      delete dataToSend.dog_name;
      
      const response = await apiPut(`/health_events?id=eq.${id}`, dataToSend);
      debugLog('Updated health event:', response);
      
      // Update local state
      setHealthEvents(prev => 
        prev.map(item => item.id === id ? { ...item, ...response } : item)
      );
      return { success: true, data: response };
    } catch (error) {
      debugError('Error updating health event:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update health event record' 
      };
    }
  };
  
  // Delete a health event
  const deleteHealthEvent = async (id) => {
    try {
      await apiDelete(`/health_events?id=eq.${id}`);
      debugLog('Deleted health event with ID:', id);
      
      // Update local state
      setHealthEvents(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (error) {
      debugError('Error deleting health event:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete health event record' 
      };
    }
  };
  
  // Add a new vet visit
  const addVetVisit = async (visitData) => {
    try {
      // Remove any non-schema fields
      const dataToSend = { ...visitData };
      delete dataToSend.dog_name;
      delete dataToSend.vet_name;
      
      const response = await apiPost('/vet_visits', dataToSend);
      debugLog('Added vet visit:', response);
      
      // Update local state with new data
      setVetVisits(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (error) {
      debugError('Error adding vet visit:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add vet visit record' 
      };
    }
  };
  
  // Update a vet visit
  const updateVetVisit = async (id, visitData) => {
    try {
      // Remove any non-schema fields
      const dataToSend = { ...visitData };
      delete dataToSend.dog_name;
      delete dataToSend.vet_name;
      
      const response = await apiPut(`/vet_visits?id=eq.${id}`, dataToSend);
      debugLog('Updated vet visit:', response);
      
      // Update local state
      setVetVisits(prev => 
        prev.map(item => item.id === id ? { ...item, ...response } : item)
      );
      return { success: true, data: response };
    } catch (error) {
      debugError('Error updating vet visit:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update vet visit record' 
      };
    }
  };
  
  // Delete a vet visit
  const deleteVetVisit = async (id) => {
    try {
      await apiDelete(`/vet_visits?id=eq.${id}`);
      debugLog('Deleted vet visit with ID:', id);
      
      // Update local state
      setVetVisits(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (error) {
      debugError('Error deleting vet visit:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete vet visit record' 
      };
    }
  };
  
  // Context value
  const contextValue = {
    // Data
    vaccinations,
    medications,
    healthEvents,
    vetVisits,
    
    // Loading states
    loading,
    
    // Error states
    error,
    
    // Data fetching functions
    fetchDogHealthData,
    fetchVaccinations,
    fetchMedications,
    fetchHealthEvents,
    fetchVetVisits,
    
    // CRUD operations for vaccinations
    addVaccination,
    updateVaccination,
    deleteVaccination,
    
    // CRUD operations for medications
    addMedication,
    updateMedication,
    deleteMedication,
    
    // CRUD operations for health events
    addHealthEvent,
    updateHealthEvent,
    deleteHealthEvent,
    
    // CRUD operations for vet visits
    addVetVisit,
    updateVetVisit,
    deleteVetVisit
  };
  
  return (
    <HealthContext.Provider value={contextValue}>
      {children}
    </HealthContext.Provider>
  );
};

// Define PropTypes for HealthContextProvider
HealthContextProvider.propTypes = {
  children: PropTypes.node.isRequired
};
