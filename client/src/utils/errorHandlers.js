// errorHandlers.js - Utility functions for handling common API errors
import { debugLog, debugError } from '../config';

/**
 * Creates a fallback dashboard data object when the health dashboard API is unavailable
 * @returns {Object} Default dashboard data structure
 */
export const createFallbackHealthDashboard = () => {
  debugLog('Using fallback health dashboard data');
  return {
    recentHealthRecords: [],
    upcomingVaccinations: [],
    healthStats: {
      totalRecords: 0,
      vaccinations: 0,
      medications: 0,
      conditions: 0
    }
  };
};

/**
 * Handles API errors for components that need to continue functioning
 * even when an API endpoint is unavailable
 * @param {Error} error - The error that occurred
 * @param {string} endpoint - The API endpoint that failed
 * @param {Function} setErrorState - Function to set error state if needed
 * @returns {boolean} True if the error was handled, false otherwise
 */
export const handleApiEndpointMissing = (error, endpoint, setErrorState = null) => {
  // Check if this is a 404 error (endpoint not found)
  if (error && error.message && error.message.includes('404')) {
    debugLog(`API endpoint not available: ${endpoint}, using fallback data`);
    if (setErrorState) {
      setErrorState(`API endpoint not available: ${endpoint}`);
    }
    return true;
  }
  
  // Not a 404 error, log it as a real error
  debugError(`API error for ${endpoint}:`, error);
  if (setErrorState) {
    setErrorState(error.message || 'Unknown API error');
  }
  return false;
};
