import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { formatISO } from 'date-fns';
import { apiGet, apiPost, apiPut, apiDelete, sanitizeApiData } from '../utils/apiUtils';
import { API_URL, debugLog, debugError } from '../config';

export const LeadContext = createContext();

export const LeadProvider = ({ children }) => {
  const { isAuthenticated, getToken } = useAuth();
  
  // State for leads
  const [leads, setLeads] = useState([]);
  const [leadTypes, setLeadTypes] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    new_leads: { count: 0, items: [] },
    hot_leads: { count: 0, items: [] },
    pending_followups: { count: 0, items: [] }
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use API utility functions for API calls
  const leadsApi = useCallback(async (endpoint, method = 'GET', data = null) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      const fullEndpoint = `leads/${endpoint}`;
      debugLog(`Making ${method} request to ${fullEndpoint}`, data);
      
      let response;
      
      switch (method) {
        case 'GET': {
          response = await apiGet(fullEndpoint);
          break;
        }
        case 'POST': {
          // Sanitize data to prevent non-schema fields errors
          const sanitizedData = data ? sanitizeApiData(data) : {};
          response = await apiPost(fullEndpoint, sanitizedData);
          break;
        }
        case 'PUT': {
          // Sanitize data to prevent non-schema fields errors
          const sanitizedData = data ? sanitizeApiData(data) : {};
          response = await apiPut(fullEndpoint, sanitizedData);
          break;
        }
        case 'DELETE': {
          response = await apiDelete(fullEndpoint);
          break;
        }
        default: {
          throw new Error(`Unsupported HTTP method: ${method}`);
        }
      }
      
      if (!response.ok) {
        throw new Error(response.error || 'API request failed');
      }
      
      return response.data;
    } catch (error) {
      debugError(`Error in leadsApi for ${endpoint}:`, error);
      throw error;
    }
  }, [isAuthenticated]);

  // Dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Fetching leads dashboard data');
      const data = await leadsApi('dashboard');
      
      if (data) {
        setDashboardData(data);
        debugLog('Dashboard data updated successfully');
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching lead dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leadsApi]);

  // Leads
  const fetchLeads = useCallback(async (status = null, type = null, source = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = '';
      const params = [];
      
      if (status) params.push(`status=${status}`);
      if (type) params.push(`type=${type}`);
      if (source) params.push(`source=${source}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      debugLog(`Fetching leads with params: ${params.join(', ') || 'none'}`);
      const data = await leadsApi(endpoint);
      
      if (data) {
        setLeads(data);
        debugLog(`Retrieved ${data.length} leads`);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leadsApi]);

  const fetchLead = useCallback(async (leadId) => {
    try {
      setIsLoading(true);
      const response = await leadsApi(`${leadId}`);
      
      if (response) {
        return response;
      }
    } catch (error) {
      setError(error.message);
      debugError(`Error fetching lead ${leadId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [leadsApi]);

  const createLead = useCallback(async (leadData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (leadData.inquiry_date && leadData.inquiry_date instanceof Date) {
        leadData.inquiry_date = formatISO(leadData.inquiry_date);
      }
      
      const response = await leadsApi('', 'POST', leadData);
      
      if (response) {
        // Update local state
        setLeads(prev => [response, ...prev]);
        return response;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error creating lead:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [leadsApi]);

  const updateLead = useCallback(async (leadId, leadData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (leadData.inquiry_date && leadData.inquiry_date instanceof Date) {
        leadData.inquiry_date = formatISO(leadData.inquiry_date);
      }
      
      const response = await leadsApi(`${leadId}`, 'PUT', leadData);
      
      if (response) {
        // Update local state
        setLeads(prev => 
          prev.map(lead => lead.id === leadId ? response : lead)
        );
        return response;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error updating lead:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [leadsApi]);

  const deleteLead = useCallback(async (leadId) => {
    try {
      setIsLoading(true);
      const response = await leadsApi(`${leadId}`, 'DELETE');
      
      if (response) {
        // Update local state
        setLeads(prev => prev.filter(lead => lead.id !== leadId));
        return true;
      }
    } catch (error) {
      setError(error.message);
      debugError('Error deleting lead:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [leadsApi]);

  // Lead Types, Statuses, and Sources
  const fetchLeadMetadata = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch in parallel
      const [typesResponse, statusesResponse, sourcesResponse] = await Promise.all([
        leadsApi('types'),
        leadsApi('statuses'),
        leadsApi('sources')
      ]);
      
      if (typesResponse) {
        setLeadTypes(typesResponse);
      }
      
      if (statusesResponse) {
        setLeadStatuses(statusesResponse);
      }
      
      if (sourcesResponse) {
        setLeadSources(sourcesResponse);
      }
    } catch (error) {
      setError(error.message);
      debugError('Error fetching lead metadata:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leadsApi]);

  // Fetch initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchLeadMetadata();
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchLeadMetadata, fetchDashboardData]);

  // Context value
  const contextValue = {
    // Data
    leads,
    leadTypes,
    leadStatuses,
    leadSources,
    dashboardData,
    
    // Loading and error states
    isLoading,
    error,
    
    // Functions
    fetchLeads,
    fetchLead,
    createLead,
    updateLead,
    deleteLead,
    fetchDashboardData,
    fetchLeadMetadata
  };
  
  return (
    <LeadContext.Provider value={contextValue}>
      {children}
    </LeadContext.Provider>
  );
};

// Custom hook for easy context usage
export const useLead = () => useContext(LeadContext);