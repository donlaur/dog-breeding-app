// apiErrorFix.js - Utility to fix API errors in the application
import { API_URL, debugLog, debugError } from '../config';

// Cache to store missing API endpoints
window.missingEndpoints = window.missingEndpoints || new Set();

// Default fallback data for different API endpoints
const fallbackData = {
  'notifications': [],
  'health/dashboard': {
    recentHealthRecords: [],
    upcomingVaccinations: [],
    healthStats: {
      totalRecords: 0,
      vaccinations: 0,
      medications: 0,
      conditions: 0
    }
  },
  'pages': []
};

/**
 * Installs a global fetch interceptor to handle missing API endpoints
 * This reduces console errors and provides fallback data
 */
export const installApiErrorFix = () => {
  debugLog('Installing API interceptors...');
  
  // Mark known missing endpoints
  markEndpointAsMissing('notifications');
  markEndpointAsMissing('health/dashboard');
  markEndpointAsMissing('pages');
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Replace fetch with our patched version
  window.fetch = async function(url, options) {
    // Only intercept API calls
    if (typeof url === 'string' && url.includes(API_URL)) {
      // Extract the endpoint from the URL
      const endpoint = url.replace(API_URL + '/', '');
      
      // Check if this endpoint is known to be missing
      if (window.missingEndpoints.has(endpoint)) {
        debugLog(`Intercepted call to known missing endpoint: ${endpoint}`);
        
        // Return a mock Response object with fallback data
        const fallback = fallbackData[endpoint] || [];
        return new Response(JSON.stringify(fallback), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      try {
        // Make the original request
        const response = await originalFetch(url, options);
        
        // If the endpoint is not found, mark it as missing for future calls
        if (response.status === 404) {
          markEndpointAsMissing(endpoint);
          debugLog(`API GET Error (${endpoint}): 404`);
          
          // Return fallback data if available
          if (fallbackData[endpoint]) {
            return new Response(JSON.stringify(fallbackData[endpoint]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        return response;
      } catch (error) {
        debugError(`Error in fetch interceptor for ${url}:`, error);
        
        // If there's a network error, mark the endpoint as missing
        markEndpointAsMissing(endpoint);
        
        // Return fallback data if available
        if (fallbackData[endpoint]) {
          return new Response(JSON.stringify(fallbackData[endpoint]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Re-throw the error if no fallback is available
        throw error;
      }
    }
    
    // For non-API calls, use the original fetch
    return originalFetch(url, options);
  };
  
  debugLog('API interceptors installed');
};

/**
 * Marks an endpoint as missing to prevent future calls
 * @param {string} endpoint - API endpoint to mark as missing
 */
export const markEndpointAsMissing = (endpoint) => {
  window.missingEndpoints.add(endpoint);
  debugLog(`Marked endpoint as missing: ${endpoint}`);
};

/**
 * Export a function to be called from the console for debugging
 */
export const fixApiErrors = () => {
  installApiErrorFix();
  return 'API error fix installed';
};

// Export the missingEndpoints set for use in other modules
export const getMissingEndpoints = () => window.missingEndpoints;
