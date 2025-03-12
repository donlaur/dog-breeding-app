// notificationPatch.js - Utility to patch notification API calls
import { API_URL, debugLog, debugError } from '../config';

// Keep track of missing API endpoints to avoid repeated calls
const missingEndpoints = new Set();

/**
 * Patches fetch to prevent repeated calls to missing API endpoints
 * This helps reduce console errors when certain API endpoints are not available
 */
export const installNotificationPatch = () => {
  debugLog('Installing notification API patch');
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Replace fetch with our patched version
  window.fetch = async function(url, options) {
    // Only intercept API calls
    if (typeof url === 'string' && url.includes(API_URL)) {
      // Check if this is a call to a known missing endpoint
      const endpoint = url.replace(`${API_URL}/`, '');
      
      if (missingEndpoints.has(endpoint)) {
        debugLog(`Skipping call to known missing endpoint: ${endpoint}`);
        
        // Return a mock 404 response
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found (Intercepted)',
          json: () => Promise.resolve([])
        });
      }
      
      // Make the actual fetch call
      try {
        const response = await originalFetch(url, options);
        
        // If we get a 404, remember this endpoint is missing
        if (response.status === 404) {
          debugLog(`Adding ${endpoint} to missing endpoints list`);
          missingEndpoints.add(endpoint);
        }
        
        return response;
      } catch (error) {
        debugError(`Error fetching ${url}:`, error);
        
        // Add to missing endpoints if there was a network error
        missingEndpoints.add(endpoint);
        
        // Re-throw the error
        throw error;
      }
    }
    
    // For non-API calls, use the original fetch
    return originalFetch(url, options);
  };
  
  // Return a function to uninstall the patch
  return () => {
    window.fetch = originalFetch;
    debugLog('Notification API patch uninstalled');
  };
};

/**
 * Checks if an API endpoint is already known to be missing
 * @param {string} endpoint - API endpoint to check
 * @returns {boolean} - Whether the endpoint is known to be missing
 */
export const isEndpointMissing = (endpoint) => {
  return missingEndpoints.has(endpoint);
};

/**
 * Manually marks an endpoint as missing to prevent future calls
 * @param {string} endpoint - API endpoint to mark as missing
 */
export const markEndpointAsMissing = (endpoint) => {
  debugLog(`Manually marking ${endpoint} as missing`);
  missingEndpoints.add(endpoint);
};
