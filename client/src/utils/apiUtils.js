import { API_URL, debugLog, debugError } from '../config';
import { showError } from './notifications';

// Using the existing formatApiUrl instead of declaring a new one

/* eslint-disable no-restricted-syntax */
// This file is exempt from the fetch call restriction since it defines the API utilities

// Non-schema fields that should be removed before sending to the server
const NON_SCHEMA_FIELDS = [
  'dam_name',
  'sire_name',
  'breed_name',
  'dam_info',
  'sire_info',
  'breed_info',
  'created_at',
  'updated_at',
  'cover_photo_preview'
];

/**
 * Sanitizes data before sending it to the API by removing non-schema fields
 * @param {Object} data - The data object to sanitize
 * @param {Array<string>} additionalFieldsToRemove - Optional additional fields to remove
 * @returns {Object} - The sanitized data object
 */
export const sanitizeApiData = (data, additionalFieldsToRemove = []) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Create a copy to avoid mutating the original
  const sanitizedData = { ...data };
  
  // Remove all non-schema fields
  const fieldsToRemove = [...NON_SCHEMA_FIELDS, ...additionalFieldsToRemove];
  
  fieldsToRemove.forEach(field => {
    if (field in sanitizedData) {
      delete sanitizedData[field];
      debugLog(`Removed non-schema field: ${field}`);
    }
  });
  
  return sanitizedData;
};

/**
 * Debug tool to check auth token status
 * This function can be called from the console: checkAuthToken()
 */
export const checkAuthToken = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('⚠️ NO AUTH TOKEN FOUND IN LOCALSTORAGE');
    return false;
  }
  
  try {
    // Check token format (simple check, not full validation)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('⚠️ INVALID TOKEN FORMAT (not a valid JWT)');
      return false;
    }
    
    // Try to decode payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp) {
      const expiryDate = new Date(payload.exp * 1000);
      const now = new Date();
      
      if (expiryDate < now) {
        console.error(`⚠️ TOKEN EXPIRED at ${expiryDate.toLocaleString()}`);
        return false;
      } else {
        console.log(`✅ Token valid until ${expiryDate.toLocaleString()}`);
      }
    }
    
    console.log('Token payload:', payload);
    return true;
  } catch (e) {
    console.error('⚠️ ERROR PARSING TOKEN:', e);
    return false;
  }
};

/**
 * Format API URL
 * @param {string} endpoint - API endpoint
 * @return {string} - Formatted URL
 */
export const formatApiUrl = (endpoint) => {
  // Remove leading/trailing slashes
  endpoint = endpoint.replace(/^\/+|\/+$/g, '');
  
  // Fix duplicate /api/ paths 
  const cleanEndpoint = endpoint.startsWith('api/') 
    ? endpoint.replace(/^api\//, '') 
    : endpoint;
    
  // Add leading slash to API_URL if it doesn't have one
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  
  // Build and clean the URL - remove any double slashes except in http://
  const url = `${baseUrl}/${cleanEndpoint}`.replace(/([^:])\/+/g, '$1/');
  
  // Log warning if we still have duplicate /api/ paths
  if (url.includes('/api/api/')) {
    debugLog(`⚠️ Warning: URL still contains duplicate API paths: ${url}`);
  }
  
  return url;
};

/**
 * Validates an ID to ensure it's not undefined or invalid
 * @param {any} id - The ID to validate
 * @return {boolean} - Whether the ID is valid
 */
const isValidId = (id) => {
  return id !== undefined && id !== null && id !== 'undefined' && id !== 'null' && id !== '';
};

/**
 * Makes consistent API calls with proper authorization
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Default headers
  let defaultHeaders = {
    'Authorization': token ? `Bearer ${token}` : ''
  };
  
  // Only add Content-Type for JSON requests, not for FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  // Debug the token being sent
  if (token) {
    debugLog(`Using token for request: ${token.substring(0, 10)}...`);
  }
  
  // Log if we're handling FormData
  if (isFormData) {
    debugLog(`Making FormData request to ${endpoint} with ${options.body.get('file')?.name || 'unknown file'}`);
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  return fetch(formatApiUrl(endpoint), config);
};

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiGet = async (endpoint, options = {}) => {
  // Check if this endpoint is known to be missing (from our apiErrorFix.js)
  if (window.missingEndpoints && window.missingEndpoints.has(endpoint)) {
    debugLog(`Skipping call to known missing endpoint: ${endpoint}`);
    return {
      ok: false, 
      status: 404,
      error: 'API endpoint not available',
      data: null
    };
  }
  
  try {
    const url = formatApiUrl(endpoint);
    debugLog(`Making API GET request to: ${url} (from endpoint: ${endpoint})`);
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      ...options
    });
    
    if (!response.ok) {
      debugError(`API GET Error (/${endpoint}): ${response.status}`);
      
      // If endpoint not found, add it to the missing endpoints list
      if (response.status === 404 && window.missingEndpoints) {
        window.missingEndpoints.add(endpoint);
        debugLog(`Added ${endpoint} to missing endpoints list`);
      }
      
      return { 
        ok: false, 
        status: response.status,
        error: `HTTP error! status: ${response.status}`, 
        data: null 
      };
    }
    
    try {
      const data = await response.json();
      return { ok: true, status: response.status, data: data, error: null };
    } catch (parseError) {
      debugError(`API Error parsing JSON (/${endpoint}):`, parseError);
      return { 
        ok: false, 
        error: 'Invalid JSON response', 
        data: null 
      };
    }
  } catch (error) {
    debugError(`API Error (${endpoint}):`, error);
    return { 
      ok: false, 
      error: error.message || 'Network request failed', 
      data: null 
    };
  }
};

/**
 * Fetch a litter by ID
 * @param {number|string} litterId - ID of the litter to fetch
 * @return {Promise<Object>} - Litter data or error
 */
export const getLitter = async (litterId) => {
  if (!isValidId(litterId)) {
    const error = `Invalid litter ID: ${litterId}`;
    debugError(error);
    return { ok: false, error, data: null };
  }
  
  return apiGet(`litters/${litterId}`);
};

/**
 * Fetch puppies for a litter
 * @param {number|string} litterId - ID of the litter
 * @return {Promise<Object>} - Puppies data or error
 */
export const getLitterPuppies = async (litterId) => {
  if (!isValidId(litterId)) {
    const error = `Invalid litter ID: ${litterId}`;
    debugError(error);
    return { ok: false, error, data: [] };
  }
  
  try {
    debugLog(`Fetching puppies for litter ID: ${litterId}`);
    const result = await apiGet(`litters/${litterId}/puppies`);
    
    if (!result.ok) {
      // Try a fallback if the first endpoint fails
      debugLog(`Primary endpoint failed, trying fallback...`);
      
      // Try getting all puppies and filter by litter_id
      const allPuppiesResult = await apiGet('puppies');
      if (allPuppiesResult.ok && Array.isArray(allPuppiesResult.data)) {
        const filteredPuppies = allPuppiesResult.data.filter(
          puppy => puppy.litter_id === litterId || puppy.litter_id === Number(litterId)
        );
        
        debugLog(`Found ${filteredPuppies.length} puppies for litter ${litterId} using fallback`);
        return { ok: true, data: filteredPuppies, error: null };
      }
    }
    
    return result;
  } catch (err) {
    debugError(`Error in getLitterPuppies: ${err.message}`);
    return { ok: false, error: err.message, data: [] };
  }
};

/**
 * Fetch photos for a litter
 * @param {number|string} litterId - ID of the litter
 * @return {Promise<Object>} - Photos data or error
 */
export const getLitterPhotos = async (litterId) => {
  if (!isValidId(litterId)) {
    const error = `Invalid litter ID: ${litterId}`;
    debugError(error);
    return { ok: false, error, data: [] };
  }
  
  try {
    // Try the standard photos endpoint first
    debugLog(`Fetching photos for litter ID: ${litterId}`);
    const result = await apiGet(`photos/litter/${litterId}`);
    
    if (result.ok) {
      return result;
    }
    
    // If that fails, create an empty array as fallback
    debugLog(`No photos found for litter ${litterId}, returning empty array`);
    return { 
      ok: true, 
      data: [], 
      error: null
    };
  } catch (err) {
    debugError(`Error in getLitterPhotos: ${err.message}`);
    return { ok: false, error: err.message, data: [] };
  }
};

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} data - Data to send
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiPost = async (endpoint, data, options = {}) => {
  // Detect if the endpoint contains an undefined ID
  if (endpoint.includes('undefined') || endpoint.includes('null')) {
    const error = `Invalid API call: Endpoint contains undefined or null ID: ${endpoint}`;
    debugError(error);
    showError(`API Error: Invalid ID in request`);
    return { ok: false, error, data: null };
  }
  
  try {
    const url = formatApiUrl(endpoint);
    debugLog(`POST ${url}`);
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(sanitizeApiData(data)),
      ...options,
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      debugError('Error parsing JSON response:', error);
      return { 
        ok: false, 
        error: 'Invalid JSON response', 
        data: null 
      };
    }
    
    if (!response.ok) {
      debugError(`API Error (${endpoint}): ${response.status}`, responseData);
      return { 
        ok: false, 
        error: responseData.error || `HTTP error ${response.status}`, 
        data: responseData 
      };
    }
    
    return { ok: true, data: responseData };
  } catch (error) {
    debugError(`API Error (${endpoint}):`, error);
    return { ok: false, error: error.message, data: null };
  }
};

/**
 * Make a PUT request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} data - Data to send
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiPut = async (endpoint, data, options = {}) => {
  // Detect if the endpoint contains an undefined ID
  if (endpoint.includes('undefined') || endpoint.includes('null')) {
    const error = `Invalid API call: Endpoint contains undefined or null ID: ${endpoint}`;
    debugError(error);
    showError(`API Error: Invalid ID in request`);
    return { ok: false, error, data: null };
  }
  
  try {
    const url = formatApiUrl(endpoint);
    debugLog(`PUT ${url}`);
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...(options.headers || {})
      },
      body: JSON.stringify(sanitizeApiData(data)),
      ...options,
    });
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    // Try to parse response as JSON if it has JSON content type
    if (contentType && contentType.indexOf('application/json') !== -1) {
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        responseData = { error: 'Invalid JSON response' };
      }
    } else {
      // For non-JSON responses, get the text
      try {
        responseData = { message: await response.text() };
      } catch (e) {
        responseData = { message: 'No response body' };
      }
    }
    
    if (!response.ok) {
      debugError(`API PUT Error (${url}): ${response.status}`, responseData);
    }
    
    // Create a standard response object
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      error: !response.ok ? (responseData.error || responseData.message || response.statusText) : null
    };
  } catch (error) {
    debugError(`Network error in apiPut to ${endpoint}:`, error);
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      data: null,
      error: error.message || 'Network request failed'
    };
  }
};

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiDelete = async (endpoint, options = {}) => {
  // Similar validation as in other methods
  if (endpoint.includes('undefined') || endpoint.includes('null')) {
    const error = `Invalid API call: Endpoint contains undefined or null ID: ${endpoint}`;
    debugError(error);
    showError(`API Error: Invalid ID in request`);
    return { ok: false, error, data: null };
  }
  
  try {
    const url = formatApiUrl(endpoint);
    debugLog(`DELETE ${url}`);
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...(options.headers || {})
      },
      ...options,
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      debugError('Error parsing JSON response:', error);
      return { 
        ok: false, 
        error: 'Invalid JSON response', 
        data: null 
      };
    }
    
    if (!response.ok) {
      debugError(`API DELETE Error (${url}): ${response.status}`, responseData);
      return { 
        ok: false, 
        error: responseData.error || `HTTP error ${response.status}`, 
        data: responseData 
      };
    }
    
    return { ok: true, data: responseData };
  } catch (error) {
    debugError(`API Error (${endpoint}):`, error);
    return { ok: false, error: error.message, data: null };
  }
};

export const addPuppyToLitter = async (litterId, puppyData) => {
  if (!litterId) {
    console.error('Invalid litter ID provided to addPuppyToLitter');
    return { 
      ok: false, 
      error: 'Missing or invalid litter ID', 
      data: null 
    };
  }

  // Create a clean copy of the data
  const cleanData = { ...puppyData };
  
  // Ensure litter_id is properly formatted and included
  cleanData.litter_id = parseInt(litterId);
  
  // Handle numeric fields properly - convert empty strings to null
  const numericFields = ['weight_at_birth', 'price', 'deposit'];
  for (const field of numericFields) {
    if (field in cleanData) {
      if (cleanData[field] === '' || cleanData[field] === undefined) {
        cleanData[field] = null;
      } else if (typeof cleanData[field] === 'string') {
        const num = parseFloat(cleanData[field]);
        if (!isNaN(num)) {
          cleanData[field] = num;
        } else {
          cleanData[field] = null;
        }
      }
    }
  }

  console.log(`Adding puppy to litter ${litterId} with clean data:`, cleanData);
  return apiPost(`litters/${litterId}/puppies`, cleanData);
};

/**
 * Upload a file to the API
 * @param {File} file - The file to upload
 * @param {string} type - The type of file (image, document, etc.)
 * @param {Object} options - Additional fetch options
 * @return {Promise<Object>} - Response data or error
 */
export const apiUpload = async (file, type = 'image', options = {}) => {
  const endpoint = 'uploads';
  
  try {
    debugLog(`Uploading ${type} file: ${file.name}`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    // Don't set Content-Type in headers as FormData sets it with boundary
    const uploadOptions = {
      method: 'POST',
      body: formData,
      ...options,
      headers: {
        // Only set Authorization header, no Content-Type for FormData
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        ...options.headers
      }
    };
    
    // Don't include Content-Type in headers for FormData
    const response = await apiRequest(endpoint, uploadOptions);
    
    if (!response.ok) {
      debugError('File upload failed:', response);
      
      // Show error notification
      if (response.error) {
        showError(`Upload failed: ${response.error}`);
      } else {
        showError('File upload failed. Please try again.');
      }
      
      return {
        ok: false,
        status: response.status,
        error: response.error || 'Upload failed',
      };
    }
    
    debugLog('Upload successful:', response.data);
    return {
      ok: true,
      status: response.status || 200,
      data: response.data
    };
  } catch (error) {
    debugError('Error in file upload:', error);
    showError('File upload failed. Please try again.');
    
    return {
      ok: false,
      error: error.message || 'Unknown error',
    };
  }
};

/**
 * Specialized function for uploading photos with entity information
 * This function now uses only the dogs/upload endpoint which is the only available one
 * @param {File} file - The photo file to upload
 * @param {string} entityType - The type of entity (dog, puppy, litter)
 * @param {string|number} entityId - ID of the entity
 * @param {Object} options - Additional options (caption, isCover, etc)
 * @returns {Promise<Object>} - Response with photo data
 */
export const apiUploadPhoto = async (file, entityType, entityId, options = {}) => {
  debugLog(`Starting photo upload for ${entityType} #${entityId}`);
  
  try {
    if (!file) {
      throw new Error('Missing required parameter: file');
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Add entity information as metadata
    if (entityType) formData.append('entity_type', entityType);
    if (entityId) formData.append('entity_id', entityId.toString());
    
    // Add optional fields
    if (options.caption) formData.append('caption', options.caption);
    if (options.isCover !== undefined) formData.append('is_cover', options.isCover ? 'true' : 'false');
    if (options.order !== undefined) formData.append('order', options.order.toString());
    
    debugLog('FormData contains:', Array.from(formData.keys()));
    
    // Use only the dogs/upload endpoint
    const endpoint = 'dogs/upload';
    debugLog(`Uploading to ${endpoint} endpoint`);
    
    const uploadOptions = {
      method: 'POST',
      body: formData
    };
    
    try {
      const response = await apiRequest(endpoint, uploadOptions);
      
      // Check for a successful response
      if (!response.ok) {
        const errorText = await response.text();
        debugError(`Upload to ${endpoint} failed with status: ${response.status} - ${errorText}`);
        throw new Error(`Upload failed with status ${response.status}`);
      }
      
      // Parse the response
      const responseData = await response.json();
      debugLog(`Upload succeeded to ${endpoint}:`, responseData);
      
      // Normalize the response structure
      const normalizedData = {
        url: responseData.file_url || responseData.absolute_url,
        id: responseData.id || Date.now().toString(),
        original_filename: responseData.original_filename || file.name,
        entity_type: entityType,
        entity_id: entityId
      };
      
      return {
        success: true,
        photo: normalizedData,
        endpoint: endpoint
      };
    } catch (err) {
      debugError(`Error during upload to ${endpoint}:`, err);
      throw err;
    }
  } catch (error) {
    debugError('Photo upload failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown upload error',
      photo: null
    };
  }
};