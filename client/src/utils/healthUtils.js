// healthUtils.js - Utility functions for health-related operations
import { API_URL, debugLog, debugError } from '../config';
import { apiGet } from './apiUtils';

/**
 * Fallback data for health dashboard when the API is unavailable
 */
export const FALLBACK_DASHBOARD_DATA = {
  recentHealthRecords: [],
  upcomingVaccinations: [],
  healthStats: {
    totalRecords: 0,
    vaccinations: 0,
    medications: 0,
    conditions: 0
  }
};

/**
 * Fetches health dashboard data with proper error handling
 * @returns {Promise<Object>} Dashboard data or fallback data
 */
export const fetchHealthDashboard = async () => {
  try {
    debugLog('Fetching health dashboard data');
    const response = await apiGet('health/dashboard');
    
    if (response && response.success) {
      return { success: true, data: response.data };
    }
    
    // If we get here, there was an issue with the response
    debugLog('Health dashboard API returned unsuccessful response, using fallback data');
    return { success: false, data: FALLBACK_DASHBOARD_DATA, error: 'API returned unsuccessful response' };
  } catch (error) {
    // Handle 404 errors (endpoint not found)
    if (error.message && error.message.includes('404')) {
      debugLog('Health dashboard API not available (404), using fallback data');
      return { success: false, data: FALLBACK_DASHBOARD_DATA, error: 'API endpoint not available' };
    }
    
    // Handle other errors
    debugError('Error fetching health dashboard:', error);
    return { success: false, data: FALLBACK_DASHBOARD_DATA, error: error.message || 'Unknown error' };
  }
};

/**
 * Fetches health records for a specific dog with proper error handling
 * @param {number|string} dogId - ID of the dog
 * @returns {Promise<Object>} Health records or empty array
 */
export const fetchDogHealthRecords = async (dogId) => {
  if (!dogId) {
    debugError('fetchDogHealthRecords called without dogId');
    return { success: false, data: [], error: 'No dog ID provided' };
  }
  
  try {
    debugLog(`Fetching health records for dog ${dogId}`);
    const response = await apiGet(`dogs/${dogId}/health`);
    
    if (response && response.success) {
      return { success: true, data: response.data };
    }
    
    // If we get here, there was an issue with the response
    debugLog(`Dog health API for dog ${dogId} returned unsuccessful response, using empty array`);
    return { success: false, data: [], error: 'API returned unsuccessful response' };
  } catch (error) {
    // Handle 404 errors (endpoint not found)
    if (error.message && error.message.includes('404')) {
      debugLog(`Dog health API for dog ${dogId} not available (404), using empty array`);
      return { success: false, data: [], error: 'API endpoint not available' };
    }
    
    // Handle other errors
    debugError(`Error fetching health records for dog ${dogId}:`, error);
    return { success: false, data: [], error: error.message || 'Unknown error' };
  }
};
