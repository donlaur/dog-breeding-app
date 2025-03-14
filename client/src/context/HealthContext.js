import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { useDog } from './DogContext';
import { formatISO } from 'date-fns';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet } from '../utils/apiUtils';

export const HealthContext = createContext();

export const HealthProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { dogs, puppies } = useDog();
  
  // State for different health record types
  const [healthRecords, setHealthRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [medicationRecords, setMedicationRecords] = useState([]);
  const [healthConditions, setHealthConditions] = useState([]);
  const [conditionTemplates, setConditionTemplates] = useState([]);
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    upcoming_vaccinations: { count: 0, items: [] },
    active_medications: { count: 0, items: [] },
    active_conditions: { count: 0, items: [] },
    recent_records: { count: 0, items: [] }
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function for authenticated API calls
  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Use apiGet utility function instead of direct fetch
      const response = await apiGet(`health/${endpoint}`, options);
      
      // Return the response data
      return response;
    } catch (error) {
      debugError(`Error in fetchWithAuth(${endpoint}):`, error);
      throw error;
    }
  }, [isAuthenticated]);

  // Dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      try {
        const response = await fetchWithAuth('dashboard');
        
        // Check if response exists and has data
        if (response && response.data) {
          setDashboardData(response.data);
        } else {
          // Provide fallback data when the response is invalid
          debugLog('Invalid dashboard response, using fallback data');
          setDashboardData({
            recentHealthRecords: [],
            upcomingVaccinations: [],
            healthStats: {
              totalRecords: 0,
              vaccinations: 0,
              medications: 0,
              conditions: 0
            }
          });
        }
      } catch (error) {
        console.error('Error fetching health dashboard:', error);
        // Provide fallback data when the API endpoint is not available
        setDashboardData({
          recentHealthRecords: [],
          upcomingVaccinations: [],
          healthStats: {
            totalRecords: 0,
            vaccinations: 0,
            medications: 0,
            conditions: 0
          }
        });
      }
    } catch (error) {
      setError(error.message);
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Health Records
  const fetchHealthRecords = useCallback(async (dogId = null, puppyId = null, recordType = null) => {
    try {
      setIsLoading(true);
      let endpoint = 'records';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      if (recordType) params.push(`record_type=${recordType}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.success) {
        setHealthRecords(response.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching health records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const createHealthRecord = useCallback(async (recordData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (recordData.record_date && recordData.record_date instanceof Date) {
        recordData.record_date = formatISO(recordData.record_date);
      }
      
      const response = await fetchWithAuth('records', {
        method: 'POST',
        body: JSON.stringify(recordData)
      });
      
      if (response.success) {
        // Update local state
        setHealthRecords(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error creating health record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const updateHealthRecord = useCallback(async (recordId, recordData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (recordData.record_date && recordData.record_date instanceof Date) {
        recordData.record_date = formatISO(recordData.record_date);
      }
      
      const response = await fetchWithAuth(`records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(recordData)
      });
      
      if (response.success) {
        // Update local state
        setHealthRecords(prev => 
          prev.map(record => record.id === recordId ? response.data : record)
        );
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error updating health record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const deleteHealthRecord = useCallback(async (recordId) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`records/${recordId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Update local state
        setHealthRecords(prev => prev.filter(record => record.id !== recordId));
        return true;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error deleting health record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Vaccinations
  const fetchVaccinations = useCallback(async (dogId = null, puppyId = null, upcoming = false) => {
    try {
      setIsLoading(true);
      let endpoint = 'vaccinations';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      if (upcoming) params.push('upcoming=true');
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.success) {
        setVaccinations(response.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching vaccinations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const createVaccination = useCallback(async (vaccinationData) => {
    try {
      setIsLoading(true);
      // Ensure dates are in ISO format
      const dateFields = ['administration_date', 'expiration_date', 'next_due_date'];
      for (const field of dateFields) {
        if (vaccinationData[field] && vaccinationData[field] instanceof Date) {
          vaccinationData[field] = formatISO(vaccinationData[field]);
        }
      }
      
      const response = await fetchWithAuth('vaccinations', {
        method: 'POST',
        body: JSON.stringify(vaccinationData)
      });
      
      if (response.success) {
        // Update local state
        setVaccinations(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error creating vaccination record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const updateVaccination = useCallback(async (vaccinationId, vaccinationData) => {
    try {
      setIsLoading(true);
      // Ensure dates are in ISO format
      const dateFields = ['administration_date', 'expiration_date', 'next_due_date'];
      for (const field of dateFields) {
        if (vaccinationData[field] && vaccinationData[field] instanceof Date) {
          vaccinationData[field] = formatISO(vaccinationData[field]);
        }
      }
      
      const response = await fetchWithAuth(`vaccinations/${vaccinationId}`, {
        method: 'PUT',
        body: JSON.stringify(vaccinationData)
      });
      
      if (response.success) {
        // Update local state
        setVaccinations(prev => 
          prev.map(vaccination => vaccination.id === vaccinationId ? response.data : vaccination)
        );
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error updating vaccination record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const deleteVaccination = useCallback(async (vaccinationId) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`vaccinations/${vaccinationId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Update local state
        setVaccinations(prev => prev.filter(vaccination => vaccination.id !== vaccinationId));
        return true;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error deleting vaccination record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Weight Records
  const fetchWeightRecords = useCallback(async (dogId = null, puppyId = null) => {
    try {
      setIsLoading(true);
      let endpoint = 'weights';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.success) {
        setWeightRecords(response.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching weight records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const createWeightRecord = useCallback(async (weightData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (weightData.measurement_date && weightData.measurement_date instanceof Date) {
        weightData.measurement_date = formatISO(weightData.measurement_date);
      }
      
      const response = await fetchWithAuth('weights', {
        method: 'POST',
        body: JSON.stringify(weightData)
      });
      
      if (response.success) {
        // Update local state
        setWeightRecords(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error creating weight record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const updateWeightRecord = useCallback(async (recordId, weightData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (weightData.measurement_date && weightData.measurement_date instanceof Date) {
        weightData.measurement_date = formatISO(weightData.measurement_date);
      }
      
      const response = await fetchWithAuth(`weights/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(weightData)
      });
      
      if (response.success) {
        // Update local state
        setWeightRecords(prev => 
          prev.map(record => record.id === recordId ? response.data : record)
        );
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error updating weight record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const deleteWeightRecord = useCallback(async (recordId) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`weights/${recordId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Update local state
        setWeightRecords(prev => prev.filter(record => record.id !== recordId));
        return true;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error deleting weight record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Medication Records
  const fetchMedicationRecords = useCallback(async (dogId = null, puppyId = null, activeOnly = false) => {
    try {
      setIsLoading(true);
      let endpoint = 'medications';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      if (activeOnly) params.push('active_only=true');
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.success) {
        setMedicationRecords(response.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching medication records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const createMedicationRecord = useCallback(async (medicationData) => {
    try {
      setIsLoading(true);
      // Ensure dates are in ISO format
      const dateFields = ['administration_date', 'end_date'];
      for (const field of dateFields) {
        if (medicationData[field] && medicationData[field] instanceof Date) {
          medicationData[field] = formatISO(medicationData[field]);
        }
      }
      
      const response = await fetchWithAuth('medications', {
        method: 'POST',
        body: JSON.stringify(medicationData)
      });
      
      if (response.success) {
        // Update local state
        setMedicationRecords(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error creating medication record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const updateMedicationRecord = useCallback(async (recordId, medicationData) => {
    try {
      setIsLoading(true);
      // Ensure dates are in ISO format
      const dateFields = ['administration_date', 'end_date'];
      for (const field of dateFields) {
        if (medicationData[field] && medicationData[field] instanceof Date) {
          medicationData[field] = formatISO(medicationData[field]);
        }
      }
      
      const response = await fetchWithAuth(`medications/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(medicationData)
      });
      
      if (response.success) {
        // Update local state
        setMedicationRecords(prev => 
          prev.map(record => record.id === recordId ? response.data : record)
        );
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error updating medication record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const deleteMedicationRecord = useCallback(async (recordId) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`medications/${recordId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Update local state
        setMedicationRecords(prev => prev.filter(record => record.id !== recordId));
        return true;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error deleting medication record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Health Conditions
  const fetchHealthConditions = useCallback(async (dogId = null, puppyId = null, status = null) => {
    try {
      setIsLoading(true);
      let endpoint = 'conditions';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      if (status) params.push(`status=${status}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.success) {
        setHealthConditions(response.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching health conditions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const createHealthCondition = useCallback(async (conditionData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (conditionData.diagnosis_date && conditionData.diagnosis_date instanceof Date) {
        conditionData.diagnosis_date = formatISO(conditionData.diagnosis_date);
      }
      
      const response = await fetchWithAuth('conditions', {
        method: 'POST',
        body: JSON.stringify(conditionData)
      });
      
      if (response.success) {
        // Update local state
        setHealthConditions(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error creating health condition:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const updateHealthCondition = useCallback(async (conditionId, conditionData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (conditionData.diagnosis_date && conditionData.diagnosis_date instanceof Date) {
        conditionData.diagnosis_date = formatISO(conditionData.diagnosis_date);
      }
      
      const response = await fetchWithAuth(`conditions/${conditionId}`, {
        method: 'PUT',
        body: JSON.stringify(conditionData)
      });
      
      if (response.success) {
        // Update local state
        setHealthConditions(prev => 
          prev.map(condition => condition.id === conditionId ? response.data : condition)
        );
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error updating health condition:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const deleteHealthCondition = useCallback(async (conditionId) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`conditions/${conditionId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Update local state
        setHealthConditions(prev => prev.filter(condition => condition.id !== conditionId));
        return true;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error deleting health condition:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Condition Templates
  const fetchConditionTemplates = useCallback(async (breedId = null) => {
    try {
      setIsLoading(true);
      let endpoint = 'condition-templates';
      if (breedId) {
        endpoint += `?breed_id=${breedId}`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.success) {
        setConditionTemplates(response.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching condition templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const createConditionTemplate = useCallback(async (templateData) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('condition-templates', {
        method: 'POST',
        body: JSON.stringify(templateData)
      });
      
      if (response.success) {
        // Update local state
        setConditionTemplates(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error creating condition template:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Fetch initial dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Helper function to get animal data (dog or puppy)
  const getAnimalById = useCallback((animalId, type) => {
    if (type === 'dog') {
      return dogs.find(dog => dog.id === animalId);
    } else if (type === 'puppy') {
      return puppies.find(puppy => puppy.id === animalId);
    }
    return null;
  }, [dogs, puppies]);

  // Context value
  const contextValue = {
    // Data states
    healthRecords,
    vaccinations,
    weightRecords,
    medicationRecords,
    healthConditions,
    conditionTemplates,
    dashboardData,
    
    // Status
    isLoading,
    error,
    
    // Dashboard functions
    fetchDashboardData,
    
    // Health Records CRUD
    fetchHealthRecords,
    createHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    
    // Vaccinations CRUD
    fetchVaccinations,
    createVaccination,
    updateVaccination,
    deleteVaccination,
    
    // Weight Records CRUD
    fetchWeightRecords,
    createWeightRecord,
    updateWeightRecord,
    deleteWeightRecord,
    
    // Medication Records CRUD
    fetchMedicationRecords,
    createMedicationRecord,
    updateMedicationRecord,
    deleteMedicationRecord,
    
    // Health Conditions CRUD
    fetchHealthConditions,
    createHealthCondition,
    updateHealthCondition,
    deleteHealthCondition,
    
    // Condition Templates
    fetchConditionTemplates,
    createConditionTemplate,
    
    // Helper functions
    getAnimalById
  };

  return (
    <HealthContext.Provider value={contextValue}>
      {children}
    </HealthContext.Provider>
  );
};

HealthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useHealth = () => useContext(HealthContext);