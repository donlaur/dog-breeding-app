import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useDog } from './DogContext';
import { formatISO } from 'date-fns';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';
import PropTypes from 'prop-types';

export const HealthContext = createContext();

export const HealthContextProvider = ({ children }) => {
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

  // API Helper function
  const healthApi = useCallback(async (endpoint, method = 'GET', data = null) => {
    if (!isAuthenticated) {
      debugError('API call attempted while not authenticated');
      throw new Error('User not authenticated');
    }
    
    const sanitizeData = (data) => {
      if (!data) return null;
      
      // Create a copy of the data to avoid modifying the original
      const sanitizedData = { ...data };
      
      // List of common non-schema fields that should be removed before sending to the API
      const nonSchemaFields = [
        'dam_name', 'sire_name', 'breed_name', 
        'dam_info', 'sire_info', 'breed_info', 
        'dog_name', 'puppy_name', 'owner_name', 
        'created_by_name', 'updated_by_name'
      ];
      
      // Remove non-schema fields
      nonSchemaFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(sanitizedData, field)) {
          delete sanitizedData[field];
        }
      });
      
      return sanitizedData;
    };
    
    try {
      // Sanitize data before sending to the API
      const sanitizedData = sanitizeData(data);
      debugLog(`Making ${method} request to health/${endpoint}`, sanitizedData || {});
      
      // Determine which API utility function to use based on the method
      switch (method.toUpperCase()) {
        case 'GET':
          return await apiGet(`health/${endpoint}`);
        case 'POST':
          return await apiPost(`health/${endpoint}`, sanitizedData);
        case 'PUT':
          return await apiPut(`health/${endpoint}`, sanitizedData);
        case 'DELETE':
          return await apiDelete(`health/${endpoint}`);
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      debugError(`API Error (${method} health/${endpoint}):`, error);
      throw error;
    }
  }, [apiGet, apiPost, apiPut, apiDelete, isAuthenticated]);

  // Helper function for authenticated API calls (for backward compatibility)
  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    try {
      const { method = 'GET', body = null } = options;
      
      debugLog('Using fetchWithAuth (deprecated) for endpoint:', endpoint);
      return await healthApi(endpoint, method, body);
    } catch (error) {
      debugError('Error in fetchWithAuth:', error);
      throw error;
    }
  }, [healthApi]);

  // Dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Fetching health dashboard data');
      try {
        const response = await healthApi('dashboard');
        
        if (response && response.ok) {
          debugLog('Dashboard data received:', response.data);
          setDashboardData(response.data);
          debugLog('Dashboard data updated successfully');
        } else {
          // Provide fallback data when the response is invalid
          debugError('Invalid dashboard response:', response?.error || 'Unknown error');
          setDashboardData({
            upcoming_vaccinations: { count: 0, items: [] },
            active_medications: { count: 0, items: [] },
            active_conditions: { count: 0, items: [] },
            recent_records: { count: 0, items: [] }
          });
        }
      } catch (error) {
        debugError('Error fetching health dashboard:', error);
        // Provide fallback data when the API endpoint is not available
        setDashboardData({
          upcoming_vaccinations: { count: 0, items: [] },
          active_medications: { count: 0, items: [] },
          active_conditions: { count: 0, items: [] },
          recent_records: { count: 0, items: [] }
        });
      }
    } catch (error) {
      setError(error.message);
      debugError('Error in fetchDashboardData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  // Health Records
  const fetchHealthRecords = useCallback(async (dogId = null, puppyId = null, recordType = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = 'records';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      if (recordType) params.push(`record_type=${recordType}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      debugLog(`Fetching health records with params: ${params.join(', ') || 'none'}`);
      const response = await healthApi(endpoint);
      
      if (response && response.ok) {
        setHealthRecords(response.data || []);
        debugLog(`Retrieved ${response.data ? response.data.length : 0} health records`);
      } else {
        debugError('Error fetching health records:', response?.error || 'Unknown error');
        setHealthRecords([]);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching health records:', error);
      setHealthRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const createHealthRecord = useCallback(async (recordData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure date is in ISO format
      if (recordData.record_date && recordData.record_date instanceof Date) {
        recordData.record_date = formatISO(recordData.record_date);
      }
      
      debugLog('Creating health record:', recordData);
      const data = await healthApi('records', 'POST', recordData);
      
      if (data) {
        // Update local state
        setHealthRecords(prev => [data, ...prev]);
        debugLog('Health record created successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error creating health record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const updateHealthRecord = useCallback(async (recordId, recordData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure date is in ISO format
      if (recordData.record_date && recordData.record_date instanceof Date) {
        recordData.record_date = formatISO(recordData.record_date);
      }
      
      debugLog(`Updating health record ${recordId}:`, recordData);
      const data = await healthApi(`records/${recordId}`, 'PUT', recordData);
      
      if (data) {
        // Update local state
        setHealthRecords(prev => 
          prev.map(record => record.id === recordId ? data : record)
        );
        debugLog('Health record updated successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error updating health record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const deleteHealthRecord = useCallback(async (recordId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Deleting health record ${recordId}`);
      const data = await healthApi(`records/${recordId}`, 'DELETE');
      
      // For DELETE operations, we just need to know it was successful
      // Update local state
      setHealthRecords(prev => prev.filter(record => record.id !== recordId));
      debugLog('Health record deleted successfully');
      return true;
    } catch (error) {
      setError(error.message);
      debugError('Error deleting health record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  // Vaccinations
  const fetchVaccinations = useCallback(async (dogId = null, puppyId = null, upcoming = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = 'vaccinations';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      if (upcoming) params.push('upcoming=true');
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      debugLog(`Fetching vaccinations with params: ${params.join(', ') || 'none'}`);
      const response = await healthApi(endpoint);
      
      if (response && response.ok) {
        setVaccinations(response.data || []);
        debugLog(`Retrieved ${response.data ? response.data.length : 0} vaccinations`);
      } else {
        debugError('Error fetching vaccinations:', response?.error || 'Unknown error');
        setVaccinations([]);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching vaccinations:', error);
      setVaccinations([]);
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const createVaccination = useCallback(async (vaccinationData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure dates are in ISO format
      const dateFields = ['administration_date', 'expiration_date', 'next_due_date'];
      for (const field of dateFields) {
        if (vaccinationData[field] && vaccinationData[field] instanceof Date) {
          vaccinationData[field] = formatISO(vaccinationData[field]);
        }
      }
      
      debugLog('Creating vaccination record:', vaccinationData);
      const data = await healthApi('vaccinations', 'POST', vaccinationData);
      
      if (data) {
        // Update local state
        setVaccinations(prev => [data, ...prev]);
        debugLog('Vaccination record created successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error creating vaccination record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const updateVaccination = useCallback(async (vaccinationId, vaccinationData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure dates are in ISO format
      const dateFields = ['administration_date', 'expiration_date', 'next_due_date'];
      for (const field of dateFields) {
        if (vaccinationData[field] && vaccinationData[field] instanceof Date) {
          vaccinationData[field] = formatISO(vaccinationData[field]);
        }
      }
      
      debugLog(`Updating vaccination record ${vaccinationId}:`, vaccinationData);
      const data = await healthApi(`vaccinations/${vaccinationId}`, 'PUT', vaccinationData);
      
      if (data) {
        // Update local state
        setVaccinations(prev => 
          prev.map(vaccination => vaccination.id === vaccinationId ? data : vaccination)
        );
        debugLog('Vaccination record updated successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error updating vaccination record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const deleteVaccination = useCallback(async (vaccinationId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Deleting vaccination record ${vaccinationId}`);
      await healthApi(`vaccinations/${vaccinationId}`, 'DELETE');
      
      // Update local state
      setVaccinations(prev => prev.filter(vaccination => vaccination.id !== vaccinationId));
      debugLog('Vaccination record deleted successfully');
      return true;
    } catch (error) {
      setError(error.message);
      debugError('Error deleting vaccination record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  // Weight Records
  const fetchWeightRecords = useCallback(async (dogId = null, puppyId = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = 'weights';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      debugLog(`Fetching weight records with params: ${params.join(', ') || 'none'}`);
      const data = await healthApi(endpoint);
      
      if (data) {
        setWeightRecords(data);
        debugLog(`Retrieved ${data.length} weight records`);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching weight records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const createWeightRecord = useCallback(async (weightData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure date is in ISO format
      if (weightData.measurement_date && weightData.measurement_date instanceof Date) {
        weightData.measurement_date = formatISO(weightData.measurement_date);
      }
      
      debugLog('Creating weight record:', weightData);
      const data = await healthApi('weights', 'POST', weightData);
      
      if (data) {
        // Update local state
        setWeightRecords(prev => [data, ...prev]);
        debugLog('Weight record created successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error creating weight record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const updateWeightRecord = useCallback(async (recordId, weightData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure date is in ISO format
      if (weightData.measurement_date && weightData.measurement_date instanceof Date) {
        weightData.measurement_date = formatISO(weightData.measurement_date);
      }
      
      debugLog(`Updating weight record ${recordId}:`, weightData);
      const data = await healthApi(`weights/${recordId}`, 'PUT', weightData);
      
      if (data) {
        // Update local state
        setWeightRecords(prev => 
          prev.map(record => record.id === recordId ? data : record)
        );
        debugLog('Weight record updated successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error updating weight record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const deleteWeightRecord = useCallback(async (recordId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Deleting weight record ${recordId}`);
      await healthApi(`weights/${recordId}`, 'DELETE');
      
      // Update local state
      setWeightRecords(prev => prev.filter(record => record.id !== recordId));
      debugLog('Weight record deleted successfully');
      return true;
    } catch (error) {
      setError(error.message);
      debugError('Error deleting weight record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  // Medication Records
  const fetchMedicationRecords = useCallback(async (dogId = null, puppyId = null, activeOnly = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = 'medications';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      if (activeOnly) params.push('active_only=true');
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      debugLog(`Fetching medication records with params: ${params.join(', ') || 'none'}`);
      const response = await healthApi(endpoint);
      
      if (response && response.ok) {
        setMedicationRecords(response.data || []);
        debugLog(`Retrieved ${response.data ? response.data.length : 0} medication records`);
      } else {
        debugError('Error fetching medication records:', response?.error || 'Unknown error');
        setMedicationRecords([]);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching medication records:', error);
      setMedicationRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const createMedicationRecord = useCallback(async (medicationData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure dates are in ISO format
      const dateFields = ['start_date', 'end_date'];
      for (const field of dateFields) {
        if (medicationData[field] && medicationData[field] instanceof Date) {
          medicationData[field] = formatISO(medicationData[field]);
        }
      }
      
      debugLog('Creating medication record:', medicationData);
      const data = await healthApi('medications', 'POST', medicationData);
      
      if (data) {
        // Update local state
        setMedicationRecords(prev => [data, ...prev]);
        debugLog('Medication record created successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error creating medication record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const updateMedicationRecord = useCallback(async (recordId, medicationData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure dates are in ISO format
      const dateFields = ['start_date', 'end_date'];
      for (const field of dateFields) {
        if (medicationData[field] && medicationData[field] instanceof Date) {
          medicationData[field] = formatISO(medicationData[field]);
        }
      }
      
      debugLog(`Updating medication record ${recordId}:`, medicationData);
      const data = await healthApi(`medications/${recordId}`, 'PUT', medicationData);
      
      if (data) {
        // Update local state
        setMedicationRecords(prev => 
          prev.map(record => record.id === recordId ? data : record)
        );
        debugLog('Medication record updated successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error updating medication record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const deleteMedicationRecord = useCallback(async (recordId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Deleting medication record ${recordId}`);
      await healthApi(`medications/${recordId}`, 'DELETE');
      
      // Update local state
      setMedicationRecords(prev => prev.filter(record => record.id !== recordId));
      debugLog('Medication record deleted successfully');
      return true;
    } catch (error) {
      setError(error.message);
      debugError('Error deleting medication record:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  // Health Conditions
  const fetchHealthConditions = useCallback(async (dogId = null, puppyId = null, activeOnly = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = 'conditions';
      const params = [];
      
      if (dogId) params.push(`dog_id=${dogId}`);
      if (puppyId) params.push(`puppy_id=${puppyId}`);
      if (activeOnly) params.push('active_only=true');
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      debugLog(`Fetching health conditions with params: ${params.join(', ') || 'none'}`);
      const response = await healthApi(endpoint);
      
      if (response && response.ok) {
        setHealthConditions(response.data || []);
        debugLog(`Retrieved ${response.data ? response.data.length : 0} health conditions`);
      } else {
        debugError('Error fetching health conditions:', response?.error || 'Unknown error');
        setHealthConditions([]);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching health conditions:', error);
      setHealthConditions([]);
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const createHealthCondition = useCallback(async (conditionData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure dates are in ISO format
      const dateFields = ['diagnosis_date', 'resolved_date'];
      for (const field of dateFields) {
        if (conditionData[field] && conditionData[field] instanceof Date) {
          conditionData[field] = formatISO(conditionData[field]);
        }
      }
      
      debugLog('Creating health condition:', conditionData);
      const data = await healthApi('conditions', 'POST', conditionData);
      
      if (data) {
        // Update local state
        setHealthConditions(prev => [data, ...prev]);
        debugLog('Health condition created successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error creating health condition:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const updateHealthCondition = useCallback(async (conditionId, conditionData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure dates are in ISO format
      const dateFields = ['diagnosis_date', 'resolved_date'];
      for (const field of dateFields) {
        if (conditionData[field] && conditionData[field] instanceof Date) {
          conditionData[field] = formatISO(conditionData[field]);
        }
      }
      
      debugLog(`Updating health condition ${conditionId}:`, conditionData);
      const data = await healthApi(`conditions/${conditionId}`, 'PUT', conditionData);
      
      if (data) {
        // Update local state
        setHealthConditions(prev => 
          prev.map(condition => condition.id === conditionId ? data : condition)
        );
        debugLog('Health condition updated successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error updating health condition:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const deleteHealthCondition = useCallback(async (conditionId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Deleting health condition ${conditionId}`);
      await healthApi(`conditions/${conditionId}`, 'DELETE');
      
      // Update local state
      setHealthConditions(prev => prev.filter(condition => condition.id !== conditionId));
      debugLog('Health condition deleted successfully');
      return true;
    } catch (error) {
      setError(error.message);
      debugError('Error deleting health condition:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  // Condition Templates
  const fetchConditionTemplates = useCallback(async (breedId = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = 'condition-templates';
      if (breedId) {
        endpoint += `?breed_id=${breedId}`;
      }
      
      debugLog(`Fetching condition templates${breedId ? ` for breed ${breedId}` : ''}`);
      const data = await healthApi(endpoint);
      
      if (data) {
        setConditionTemplates(data);
        debugLog(`Retrieved ${data.length} condition templates`);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching condition templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const createConditionTemplate = useCallback(async (templateData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Creating condition template:', templateData);
      const data = await healthApi('condition-templates', 'POST', templateData);
      
      if (data) {
        // Update local state
        setConditionTemplates(prev => [data, ...prev]);
        debugLog('Condition template created successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error creating condition template:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const updateConditionTemplate = useCallback(async (templateId, templateData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Updating condition template ${templateId}:`, templateData);
      const data = await healthApi(`condition-templates/${templateId}`, 'PUT', templateData);
      
      if (data) {
        // Update local state
        setConditionTemplates(prev => 
          prev.map(template => template.id === templateId ? data : template)
        );
        debugLog('Condition template updated successfully');
        return data;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error updating condition template:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  const deleteConditionTemplate = useCallback(async (templateId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog(`Deleting condition template ${templateId}`);
      await healthApi(`condition-templates/${templateId}`, 'DELETE');
      
      // Update local state
      setConditionTemplates(prev => prev.filter(template => template.id !== templateId));
      debugLog('Condition template deleted successfully');
      return true;
    } catch (error) {
      setError(error.message);
      debugError('Error deleting condition template:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [healthApi]);

  // Fetch initial dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Animal helper functions
  const getAnimalById = useCallback(async (animalId, animalType) => {
    if (!animalId || !animalType) {
      debugError('Invalid parameters for getAnimalById');
      return null;
    }
    
    try {
      debugLog(`Getting ${animalType} with ID ${animalId}`);
      
      if (animalType === 'dog') {
        const data = await healthApi(`animals/dog/${animalId}`);
        debugLog(`Retrieved dog data for ID ${animalId}`);
        return data;
      } else if (animalType === 'puppy') {
        const data = await healthApi(`animals/puppy/${animalId}`);
        debugLog(`Retrieved puppy data for ID ${animalId}`);
        return data;
      } else {
        debugError(`Invalid animal type: ${animalType}`);
        return null;
      }
    } catch (error) {
      debugError(`Error getting ${animalType} with ID ${animalId}:`, error);
      return null;
    }
  }, [healthApi]);

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
    updateConditionTemplate,
    deleteConditionTemplate,
    
    // Helper functions
    getAnimalById
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

export const useHealth = () => useContext(HealthContext);