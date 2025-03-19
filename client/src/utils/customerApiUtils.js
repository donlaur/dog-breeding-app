import { apiGet, apiPost, apiPut, apiDelete } from './apiUtils';
import { debugLog, debugError } from '../config';

// Customer API utilities
export const fetchCustomers = async (params = {}) => {
  try {
    let url = 'customers';
    
    // Add optional query parameters if provided
    const queryParams = [];
    if (params.leadStatus) queryParams.push(`lead_status=${params.leadStatus}`);
    if (params.leadSource) queryParams.push(`lead_source=${params.leadSource}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    try {
      const response = await apiGet(url);
      return response;
    } catch (apiError) {
      // If API call fails, get from localStorage as fallback
      debugError('API error, using localStorage fallback:', apiError);
      
      // Get customers from localStorage
      let customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Apply filters if specified
      if (params.leadStatus) {
        customers = customers.filter(customer => 
          customer.lead_status === params.leadStatus
        );
      }
      
      if (params.leadSource) {
        customers = customers.filter(customer => 
          customer.lead_source === params.leadSource
        );
      }
      
      return {
        success: true,
        data: customers,
        message: "Customers fetched from local storage"
      };
    }
  } catch (error) {
    debugError('Error fetching customers:', error);
    throw error;
  }
};

export const fetchRecentLeads = async (days = 30) => {
  try {
    try {
      const response = await apiGet(`customers/recent_leads?days=${days}`);
      return response;
    } catch (apiError) {
      // If API call fails, get from localStorage as fallback
      debugError('API error, using localStorage fallback for recent leads:', apiError);
      
      // Get customers from localStorage
      let customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Filter customers created in the last 'days' days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentCustomers = customers.filter(customer => {
        const customerDate = new Date(customer.created_at);
        return customerDate >= cutoffDate;
      });
      
      return {
        success: true,
        data: recentCustomers,
        message: "Recent leads fetched from local storage"
      };
    }
  } catch (error) {
    debugError('Error fetching recent leads:', error);
    throw error;
  }
};

export const fetchCustomerById = async (customerId) => {
  try {
    try {
      const response = await apiGet(`customers/${customerId}`);
      return response;
    } catch (apiError) {
      // If API call fails, get from localStorage as fallback
      debugError('API error, using localStorage fallback for customer details:', apiError);
      
      // Get customers from localStorage
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Find the customer by ID
      const customer = customers.find(c => c.id == customerId);
      
      if (customer) {
        return {
          success: true,
          data: customer,
          message: "Customer fetched from local storage"
        };
      } else {
        throw new Error(`Customer with ID ${customerId} not found in local storage`);
      }
    }
  } catch (error) {
    debugError(`Error fetching customer ${customerId}:`, error);
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  try {
    // Sanitize data before sending to API
    const sanitizedData = sanitizeCustomerData(customerData);
    
    // Format the lead_status field if present
    if (sanitizedData.lead_status) {
      // Convert spaces to underscores and lowercase everything for API standardization
      sanitizedData.lead_status = sanitizedData.lead_status
        .toLowerCase()
        .replace(/\s+/g, '_');
    }
    
    try {
      const response = await apiPost('customers', sanitizedData);
      
      // If we get a raw response without 'success' property, transform it to our expected format
      if (response && !('success' in response) && response.data) {
        return {
          success: true,
          data: response.data,
          message: "Customer created successfully"
        };
      }
      
      return response;
    } catch (apiError) {
      // If API call fails, store in localStorage as fallback
      debugError('API error, using localStorage fallback:', apiError);
      
      // Get existing customers or initialize empty array
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Create new customer with ID
      const newCustomer = {
        ...sanitizedData,
        id: existingCustomers.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to existing customers and save back to localStorage
      existingCustomers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(existingCustomers));
      
      return {
        success: true,
        data: newCustomer,
        message: "Customer created successfully (local storage mode)"
      };
    }
  } catch (error) {
    debugError('Error creating customer:', error);
    throw error;
  }
};

export const updateCustomer = async (customerId, customerData) => {
  try {
    // Sanitize data before sending to API
    const sanitizedData = sanitizeCustomerData(customerData);
    
    // Format the lead_status field if present
    if (sanitizedData.lead_status) {
      // Convert spaces to underscores and lowercase everything for API standardization
      sanitizedData.lead_status = sanitizedData.lead_status
        .toLowerCase()
        .replace(/\s+/g, '_');
    }
    
    try {
      const response = await apiPut(`customers/${customerId}`, sanitizedData);
      
      // If we get a raw response without 'success' property, transform it to our expected format
      if (response && !('success' in response) && response.data) {
        return {
          success: true,
          data: response.data,
          message: "Customer updated successfully"
        };
      }
      
      return response;
    } catch (apiError) {
      // If API call fails, update in localStorage as fallback
      debugError('API error, using localStorage fallback for update:', apiError);
      
      // Get customers from localStorage
      let customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Find and update customer
      const customerIndex = customers.findIndex(c => c.id == customerId);
      
      if (customerIndex !== -1) {
        // Update customer with new data
        customers[customerIndex] = {
          ...customers[customerIndex],
          ...sanitizedData,
          updated_at: new Date().toISOString()
        };
        
        // Save back to localStorage
        localStorage.setItem('customers', JSON.stringify(customers));
        
        return {
          success: true,
          data: customers[customerIndex],
          message: "Customer updated successfully (local storage mode)"
        };
      } else {
        throw new Error(`Customer with ID ${customerId} not found in local storage`);
      }
    }
  } catch (error) {
    debugError(`Error updating customer ${customerId}:`, error);
    throw error;
  }
};

export const deleteCustomer = async (customerId) => {
  try {
    try {
      const response = await apiDelete(`customers/${customerId}`);
      return response;
    } catch (apiError) {
      // If API call fails, delete from localStorage as fallback
      debugError('API error, using localStorage fallback for delete:', apiError);
      
      // Get customers from localStorage
      let customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Filter out the customer to delete
      const newCustomers = customers.filter(c => c.id != customerId);
      
      // Save back to localStorage
      localStorage.setItem('customers', JSON.stringify(newCustomers));
      
      return {
        success: true,
        message: "Customer deleted successfully (local storage mode)"
      };
    }
  } catch (error) {
    debugError(`Error deleting customer ${customerId}:`, error);
    throw error;
  }
};

// Customer Communications API utilities
export const fetchCustomerCommunications = async (customerId) => {
  try {
    const response = await apiGet(`customers/${customerId}/communications`);
    return response;
  } catch (error) {
    debugError(`Error fetching communications for customer ${customerId}:`, error);
    throw error;
  }
};

export const createCommunication = async (customerId, communicationData) => {
  try {
    // Sanitize data before sending to API
    const sanitizedData = sanitizeCommunicationData(communicationData);
    
    const response = await apiPost(`customers/${customerId}/communications`, sanitizedData);
    return response;
  } catch (error) {
    debugError(`Error creating communication for customer ${customerId}:`, error);
    throw error;
  }
};

export const updateCommunication = async (communicationId, communicationData) => {
  try {
    // Sanitize data before sending to API
    const sanitizedData = sanitizeCommunicationData(communicationData);
    
    const response = await apiPut(`customers/communications/${communicationId}`, sanitizedData);
    return response;
  } catch (error) {
    debugError(`Error updating communication ${communicationId}:`, error);
    throw error;
  }
};

export const deleteCommunication = async (communicationId) => {
  try {
    const response = await apiDelete(`customers/communications/${communicationId}`);
    return response;
  } catch (error) {
    debugError(`Error deleting communication ${communicationId}:`, error);
    throw error;
  }
};

export const fetchFollowupsDue = async (days = 7) => {
  try {
    // Return mock data for now since the endpoint doesn't exist yet
    return {
      success: true,
      data: [
        { 
          id: 1, 
          customer_id: 1,
          customer_name: 'Sarah Thompson',
          communication_type: 'email',
          subject: 'Puppy Waitlist Update',
          follow_up_date: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
          notes: 'Follow up about waitlist position'
        },
        {
          id: 2,
          customer_id: 2,
          customer_name: 'Michael Johnson',
          communication_type: 'phone',
          subject: 'Vaccination Schedule',
          follow_up_date: new Date(Date.now() + 5*24*60*60*1000).toISOString(),
          notes: 'Discuss next round of vaccinations'
        }
      ]
    };
    
    // When the endpoint is implemented, use this instead:
    // const response = await apiGet(`customers/communications/upcoming?days=${days}`);
    // return response;
  } catch (error) {
    debugError('Error fetching followups due:', error);
    throw error;
  }
};

// Customer Contracts API utilities
export const fetchCustomerContracts = async (customerId) => {
  try {
    const response = await apiGet(`customers/${customerId}/contracts`);
    return response;
  } catch (error) {
    debugError(`Error fetching contracts for customer ${customerId}:`, error);
    throw error;
  }
};

export const createContract = async (customerId, contractData) => {
  try {
    // Sanitize data before sending to API
    const sanitizedData = sanitizeContractData(contractData);
    
    const response = await apiPost(`customers/${customerId}/contracts`, sanitizedData);
    return response;
  } catch (error) {
    debugError(`Error creating contract for customer ${customerId}:`, error);
    throw error;
  }
};

export const updateContract = async (contractId, contractData) => {
  try {
    // Sanitize data before sending to API
    const sanitizedData = sanitizeContractData(contractData);
    
    const response = await apiPut(`customers/contracts/${contractId}`, sanitizedData);
    return response;
  } catch (error) {
    debugError(`Error updating contract ${contractId}:`, error);
    throw error;
  }
};

export const deleteContract = async (contractId) => {
  try {
    const response = await apiDelete(`customers/contracts/${contractId}`);
    return response;
  } catch (error) {
    debugError(`Error deleting contract ${contractId}:`, error);
    throw error;
  }
};

export const signContract = async (contractId, signingDate = null) => {
  try {
    const data = signingDate ? { signing_date: signingDate } : {};
    const response = await apiPut(`customers/contracts/${contractId}/sign`, data);
    return response;
  } catch (error) {
    debugError(`Error signing contract ${contractId}:`, error);
    throw error;
  }
};

export const updatePaymentStatus = async (contractId, paymentStatus, paymentMethod = null, paymentDetails = null) => {
  try {
    const data = {
      payment_status: paymentStatus
    };
    
    if (paymentMethod) data.payment_method = paymentMethod;
    if (paymentDetails) data.payment_details = paymentDetails;
    
    const response = await apiPut(`customers/contracts/${contractId}/payment`, data);
    return response;
  } catch (error) {
    debugError(`Error updating payment status for contract ${contractId}:`, error);
    throw error;
  }
};

// Data sanitization functions
const sanitizeCustomerData = (data) => {
  // Create a copy of the data object
  const sanitizedData = { ...data };
  
  // Fields to remove before sending to API (fields that don't exist in the database schema)
  const fieldsToRemove = [
    'id', 
    'created_at', 
    'updated_at',
    'full_address',  // Computed field if it exists
    'customer_puppies',  // Related entities
    'communications',  // Related entities
    'contracts'  // Related entities
  ];
  
  // Remove non-schema fields
  fieldsToRemove.forEach(field => {
    if (field in sanitizedData) {
      delete sanitizedData[field];
    }
  });
  
  return sanitizedData;
};

const sanitizeCommunicationData = (data) => {
  // Create a copy of the data object
  const sanitizedData = { ...data };
  
  // Fields to remove before sending to API
  const fieldsToRemove = [
    'id', 
    'created_at', 
    'updated_at',
    'customer_name',  // Computed field if it exists
    'formatted_date'  // Computed field if it exists
  ];
  
  // Remove non-schema fields
  fieldsToRemove.forEach(field => {
    if (field in sanitizedData) {
      delete sanitizedData[field];
    }
  });
  
  return sanitizedData;
};

const sanitizeContractData = (data) => {
  // Create a copy of the data object
  const sanitizedData = { ...data };
  
  // Fields to remove before sending to API
  const fieldsToRemove = [
    'id', 
    'created_at', 
    'updated_at',
    'customer_name',  // Computed field if it exists
    'puppy_name',  // Computed field if it exists
    'formatted_date',  // Computed field if it exists
    'formatted_status'  // Computed field if it exists
  ];
  
  // Remove non-schema fields
  fieldsToRemove.forEach(field => {
    if (field in sanitizedData) {
      delete sanitizedData[field];
    }
  });
  
  return sanitizedData;
};
