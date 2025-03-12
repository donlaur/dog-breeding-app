// HealthContextWrapper.js - A wrapper for HealthContext that only loads on relevant pages
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HealthContext, HealthProvider } from './HealthContext';
import { debugLog } from '../config';

// Routes where health data is actually needed
const HEALTH_RELEVANT_ROUTES = [
  '/dashboard/health',
  '/dashboard/dogs/*/health',
  '/dashboard/puppies/*/health'
];

export const HealthContextWrapper = ({ children }) => {
  const location = useLocation();
  const [shouldLoadHealth, setShouldLoadHealth] = useState(false);
  
  useEffect(() => {
    // Check if current path matches any of the relevant routes
    const currentPath = location.pathname;
    const isRelevantRoute = HEALTH_RELEVANT_ROUTES.some(route => {
      // Convert route pattern to regex
      const pattern = new RegExp(`^${route.replace(/\//g, '\\/').replace(/\*/g, '.*')}$`);
      return pattern.test(currentPath);
    });
    
    setShouldLoadHealth(isRelevantRoute);
    
    if (!isRelevantRoute) {
      debugLog(`Health context skipped for route: ${currentPath} (not a health-related page)`);
    }
  }, [location.pathname]);
  
  // If this is a health-related page, use the real provider
  if (shouldLoadHealth) {
    return <HealthProvider>{children}</HealthProvider>;
  }
  
  // Otherwise, provide a minimal context that doesn't make API calls
  const minimalContext = {
    healthRecords: [],
    vaccinations: [],
    weightRecords: [],
    medicationRecords: [],
    healthConditions: [],
    conditionTemplates: [],
    dashboardData: {
      upcoming_vaccinations: { count: 0, items: [] },
      active_medications: { count: 0, items: [] },
      active_conditions: { count: 0, items: [] },
      recent_records: { count: 0, items: [] }
    },
    isLoading: false,
    error: null,
    fetchHealthRecords: () => Promise.resolve([]),
    fetchVaccinations: () => Promise.resolve([]),
    fetchMedications: () => Promise.resolve([]),
    fetchConditions: () => Promise.resolve([]),
    fetchDashboardData: () => Promise.resolve({}),
    addHealthRecord: () => Promise.resolve({}),
    updateHealthRecord: () => Promise.resolve({}),
    deleteHealthRecord: () => Promise.resolve(true),
    addVaccination: () => Promise.resolve({}),
    updateVaccination: () => Promise.resolve({}),
    deleteVaccination: () => Promise.resolve(true),
    addMedication: () => Promise.resolve({}),
    updateMedication: () => Promise.resolve({}),
    deleteMedication: () => Promise.resolve(true),
    addCondition: () => Promise.resolve({}),
    updateCondition: () => Promise.resolve({}),
    deleteCondition: () => Promise.resolve(true)
  };
  
  return (
    <HealthContext.Provider value={minimalContext}>
      {children}
    </HealthContext.Provider>
  );
};
