// lazyLoadContext.js - Utility for lazy loading context data based on route
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { debugLog } from '../config';

/**
 * Hook to determine if a specific context should load data based on the current route
 * @param {Array} relevantRoutes - Array of route patterns where this context is relevant
 * @returns {boolean} - Whether the context should load data
 */
export const useShouldLoadContext = (relevantRoutes = []) => {
  const location = useLocation();
  const [shouldLoad, setShouldLoad] = useState(false);
  
  useEffect(() => {
    // Check if current path matches any of the relevant routes
    const currentPath = location.pathname;
    const isRelevantRoute = relevantRoutes.some(route => {
      // Convert route pattern to regex
      // e.g., '/dashboard/health' becomes /^\/dashboard\/health(\/.*)?$/
      const pattern = new RegExp(`^${route.replace(/\//g, '\\/').replace(/\*/g, '.*')}(\\/.*)?$`);
      return pattern.test(currentPath);
    });
    
    setShouldLoad(isRelevantRoute);
    
    if (isRelevantRoute) {
      debugLog(`Loading context data for route: ${currentPath}`);
    } else {
      debugLog(`Skipping context data for route: ${currentPath} (not relevant)`);
    }
  }, [location.pathname, relevantRoutes]);
  
  return shouldLoad;
};
