import { API_URL } from '../config';

/**
 * Returns a properly formatted image URL
 * 
 * @param {string|object} photoUrl - The photo URL or object containing the URL
 * @returns {string|null} The formatted image URL or null if not available
 */
export const getImageUrl = (photoUrl) => {
  if (!photoUrl) return null;
  
  try {
    // Handle various photo fields that might be in the API response
    const url = photoUrl.url || photoUrl; // Handle if photo is an object
    
    // If it's already a full URL, use it as is
    if (typeof url === 'string' && url.startsWith('http')) {
      return url;
    }
    
    // Otherwise, construct the full URL
    if (typeof url === 'string') {
      return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    return null;
  } catch (err) {
    console.error("Error processing image URL:", err);
    return null;
  }
};

/**
 * Returns gender icon and color
 * 
 * @param {string} gender - The gender ('Male' or 'Female')
 * @returns {Object} Object containing icon and color
 */
export const getGenderDisplay = (gender) => {
  if (!gender) return { icon: '', color: '#757575' };
  
  try {
    return gender === 'Male' ? 
      { icon: '♂', color: '#1976d2' } : 
      { icon: '♀', color: '#d32f2f' };
  } catch (err) {
    console.error("Error processing gender:", err);
    return { icon: '', color: '#757575' };
  }
}; 