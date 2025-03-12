// pageUtils.js - Utility functions for page-related operations
import { API_URL, debugLog, debugError } from '../config';
import { apiGet } from './apiUtils';

/**
 * Fetches pages with proper error handling
 * @returns {Promise<Object>} Pages data or empty array
 */
export const fetchPages = async () => {
  try {
    debugLog('Fetching pages');
    const response = await apiGet('pages');
    
    if (response && response.success) {
      return { success: true, data: response.data };
    }
    
    // If we get here, there was an issue with the response
    debugLog('Pages API returned unsuccessful response, using empty array');
    return { success: false, data: [], error: 'API returned unsuccessful response' };
  } catch (error) {
    // Handle 404 errors (endpoint not found)
    if (error.message && error.message.includes('404')) {
      debugLog('Pages API not available (404), using empty array');
      return { success: false, data: [], error: 'API endpoint not available' };
    }
    
    // Handle other errors
    debugError('Error fetching pages:', error);
    return { success: false, data: [], error: error.message || 'Unknown error' };
  }
};

/**
 * Fetches a specific page by ID with proper error handling
 * @param {number|string} pageId - ID of the page
 * @returns {Promise<Object>} Page data or null
 */
export const fetchPageById = async (pageId) => {
  if (!pageId) {
    debugError('fetchPageById called without pageId');
    return { success: false, data: null, error: 'No page ID provided' };
  }
  
  try {
    debugLog(`Fetching page ${pageId}`);
    const response = await apiGet(`pages/${pageId}`);
    
    if (response && response.success) {
      return { success: true, data: response.data };
    }
    
    // If we get here, there was an issue with the response
    debugLog(`Page API for page ${pageId} returned unsuccessful response, using null`);
    return { success: false, data: null, error: 'API returned unsuccessful response' };
  } catch (error) {
    // Handle 404 errors (endpoint not found)
    if (error.message && error.message.includes('404')) {
      debugLog(`Page API for page ${pageId} not available (404), using null`);
      return { success: false, data: null, error: 'API endpoint not available' };
    }
    
    // Handle other errors
    debugError(`Error fetching page ${pageId}:`, error);
    return { success: false, data: null, error: error.message || 'Unknown error' };
  }
};
