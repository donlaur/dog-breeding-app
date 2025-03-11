import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { formatISO } from 'date-fns';

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

  // Helper function for authenticated API calls
  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      };
      
      const response = await fetch(`/api/leads/${endpoint}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching from /api/leads/${endpoint}:`, error);
      throw error;
    }
  }, [isAuthenticated, getToken]);

  // Dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('dashboard');
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching lead dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Leads
  const fetchLeads = useCallback(async (status = null, type = null, source = null) => {
    try {
      setIsLoading(true);
      let endpoint = '';
      const params = [];
      
      if (status) params.push(`status=${status}`);
      if (type) params.push(`type=${type}`);
      if (source) params.push(`source=${source}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.success) {
        setLeads(response.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const fetchLead = useCallback(async (leadId) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`${leadId}`);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error(`Error fetching lead ${leadId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const createLead = useCallback(async (leadData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (leadData.inquiry_date && leadData.inquiry_date instanceof Date) {
        leadData.inquiry_date = formatISO(leadData.inquiry_date);
      }
      
      const response = await fetchWithAuth('', {
        method: 'POST',
        body: JSON.stringify(leadData)
      });
      
      if (response.success) {
        // Update local state
        setLeads(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error creating lead:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const updateLead = useCallback(async (leadId, leadData) => {
    try {
      setIsLoading(true);
      // Ensure date is in ISO format
      if (leadData.inquiry_date && leadData.inquiry_date instanceof Date) {
        leadData.inquiry_date = formatISO(leadData.inquiry_date);
      }
      
      const response = await fetchWithAuth(`${leadId}`, {
        method: 'PUT',
        body: JSON.stringify(leadData)
      });
      
      if (response.success) {
        // Update local state
        setLeads(prev => 
          prev.map(lead => lead.id === leadId ? response.data : lead)
        );
        return response.data;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error updating lead:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  const deleteLead = useCallback(async (leadId) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`${leadId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Update local state
        setLeads(prev => prev.filter(lead => lead.id !== leadId));
        return true;
      }
    } catch (error) {
      setError(error.message);
      console.error('Error deleting lead:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Lead Types, Statuses, and Sources
  const fetchLeadMetadata = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch in parallel
      const [typesResponse, statusesResponse, sourcesResponse] = await Promise.all([
        fetchWithAuth('types'),
        fetchWithAuth('statuses'),
        fetchWithAuth('sources')
      ]);
      
      if (typesResponse.success) {
        setLeadTypes(typesResponse.data);
      }
      
      if (statusesResponse.success) {
        setLeadStatuses(statusesResponse.data);
      }
      
      if (sourcesResponse.success) {
        setLeadSources(sourcesResponse.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching lead metadata:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Fetch initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchLeadMetadata();
    }
  }, [isAuthenticated, fetchDashboardData, fetchLeadMetadata]);

  // Context value
  const contextValue = {
    // Data states
    leads,
    leadTypes,
    leadStatuses,
    leadSources,
    dashboardData,
    
    // Status
    isLoading,
    error,
    
    // Dashboard functions
    fetchDashboardData,
    
    // Lead CRUD operations
    fetchLeads,
    fetchLead,
    createLead,
    updateLead,
    deleteLead,
    
    // Metadata
    fetchLeadMetadata
  };

  return (
    <LeadContext.Provider value={contextValue}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLead = () => useContext(LeadContext);