/**
 * API Request Interceptors
 * 
 * This utility installs global interceptors to catch problematic API calls
 * before they happen and provide helpful debugging information.
 */
import { debugError } from '../config';
import { showError } from './notifications';

// Track if an interceptor is already installed to prevent duplicates
let interceptorInstalled = false;

// Track recent errors to prevent showing multiple notifications for the same issue
const recentErrors = new Set();
const ERROR_THROTTLE_MS = 2000; // Don't show duplicate errors within 2 seconds

/**
 * Safely shows an error without duplicating notifications
 * @param {string} message - Error message to show
 */
const safeShowError = (message) => {
  const errorKey = message.slice(0, 50); // Use first 50 chars as key
  
  if (!recentErrors.has(errorKey)) {
    recentErrors.add(errorKey);
    showError(message);
    
    // Remove from recent errors after delay
    setTimeout(() => {
      recentErrors.delete(errorKey);
    }, ERROR_THROTTLE_MS);
  }
};

/**
 * Sets up a global fetch interceptor to prevent requests with undefined in the URL
 * and provide helpful debugging information
 */
export const setupFetchInterceptor = () => {
  // Don't install multiple times
  if (interceptorInstalled) {
    debugError('Fetch interceptor already installed');
    return () => {};
  }
  
  const originalFetch = window.fetch;
  interceptorInstalled = true;
  
  window.fetch = function(url, options) {
    try {
      // Only intercept API calls to prevent interfering with other fetches
      if (typeof url === 'string' && url.includes('/api/')) {
        // Only block truly problematic patterns
        if (url.includes('/api/undefined') || url.includes('/api/null')) {
          // Log detailed error with stack trace
          debugError('⚠️ INTERCEPTED API CALL WITH INVALID URL:', url);
          const stack = new Error().stack;
          debugError('Call stack:', stack);
          
          // Show user-friendly error
          safeShowError('Invalid API request prevented');
          
          // Return a mock rejected promise instead of making the actual call
          return Promise.reject(new Error(`API call blocked: URL contains invalid path - ${url}`));
        }
      }
      
      // If check passes, proceed with original fetch
      return originalFetch.apply(this, arguments);
    } catch (error) {
      debugError('Error in fetch interceptor:', error);
      // Still allow the request if our interceptor fails
      return originalFetch.apply(this, arguments);
    }
  };
  
  return () => {
    // Return cleanup function to restore original fetch
    if (interceptorInstalled) {
      window.fetch = originalFetch;
      interceptorInstalled = false;
    }
  };
};

/**
 * Installs all API interceptors
 */
export const installInterceptors = () => {
  try {
    const cleanup = setupFetchInterceptor();
    return cleanup;
  } catch (error) {
    debugError('Error installing interceptors:', error);
    return () => {}; // Return no-op cleanup function
  }
}; 