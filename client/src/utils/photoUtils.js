import { formatApiUrl } from './apiUtils';
import { API_URL } from '../config';

// Default images for different entity types
const DEFAULT_IMAGES = {
  DOG: '/images/dog-paw-print.svg',      // Dog paw for missing dog photos
  PUPPY: '/images/dog-paw-print.svg',    // Dog paw for missing puppy photos
  LITTER: '/images/dog-paw-print.svg',   // Dog paw for missing litter photos
  FALLBACK: '/images/dog-paw-print.svg'  // Generic paw print fallback
};

// Cache for failed image URLs to prevent repeated attempts
const FAILED_URLS = new Set();

/**
 * Get a valid photo URL with appropriate fallbacks
 * @param {string} photoPath - The path or URL to the photo
 * @param {string} entityType - The type of entity (DOG, PUPPY, LITTER)
 * @returns {string} A valid photo URL or appropriate default
 */
export const getPhotoUrl = (photoPath, entityType = 'DOG') => {
    // If no photo path provided, return appropriate default
    if (!photoPath) {
        return DEFAULT_IMAGES[entityType] || DEFAULT_IMAGES.FALLBACK;
    }
    
    // Check if this URL has already failed - avoid retrying
    if (FAILED_URLS.has(photoPath)) {
        return DEFAULT_IMAGES[entityType] || DEFAULT_IMAGES.FALLBACK;
    }
    
    // If it's already a full URL, return it
    if (photoPath.startsWith('http')) return photoPath;
    
    // If it points to a static image in the public folder, return it directly
    if (photoPath.startsWith('/images/')) return photoPath;
    
    // If it's a path from our API
    if (photoPath.startsWith('/uploads/') || photoPath.startsWith('uploads/')) {
        // Clean up the path by removing any leading slashes
        const cleanPath = photoPath.replace(/^\/+/, '');
        
        // First try direct API URL (most likely to work)
        return `${API_URL}/uploads/${cleanPath.replace('uploads/', '')}`;
    }
    
    // Return the path as-is if nothing else matched
    return photoPath;
};

/**
 * Create an onError handler for images that sets a fallback source
 * @param {string} entityType - The type of entity (DOG, PUPPY, LITTER)
 * @returns {Function} An onError handler function
 */
export const handleImageError = (entityType = 'DOG') => {
    return (event) => {
        // Get the original source that failed
        const originalSrc = event.target.src;
        
        // Don't retry loading this URL again in the future
        FAILED_URLS.add(originalSrc);
        
        // First try the default from public/images directory
        const defaultImage = DEFAULT_IMAGES[entityType] || DEFAULT_IMAGES.FALLBACK;
        
        // Log but only in development
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Image load failed: ${originalSrc}, using default: ${defaultImage}`);
        }
        
        // Use default image
        event.target.src = defaultImage;
        
        // If the default image also fails, use inline SVG data
        event.target.onerror = () => {
            // Simple paw print SVG as data URL - guaranteed to work
            event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjY2NjY2NjIiBkPSJNMjU2LDQ4QzE0MS4xLDQ4LDQ4LDE0MS4xLDQ4LDI1NnM5My4xLDIwOCwyMDgsMjA4czIwOC05My4xLDIwOC0yMDhTMzcwLjksNDgsMjU2LDQ4eiBNMjMzLjIsMzA3LjZjLTMwLjEsMzQuNCwzLDU1LjQsNDYuOCwxNS45YzE0LjctMTMuMiwzOS41LTI0LjEsNjAuNC0xMS4yYzE0LDguNiwxOS45LDM0LjUsMTEuOSw0OS40Yy0xMS4yLDIwLjgtNzAuMSw0MC42LTg2LjEsNDEuMWMtNzkuMSwyLjItMTA3LjItNjcuMS05OS43LTEyMC43YzMuNS0yNS4xLDE4LjUtNDYuNiw0Mi41LTUyLjNjMjEuOS01LjIsNDUuMiwzLjQsNTkuOSwyNS4yaDAuMWMxMS42LDE3LjIsNi4zLDQzLjEtMTIuMSw1MUMyNDEuMiwzMTMuNSwyMzguMSwzMDQuOSwyMzMuMiwzMDcuNnogTTM0OC4yLDIyNGMtMTAuNS0yLjYtNjEuNi01LjYtNjEuNi01LjZsMTUuOC01My41YzU2LjgsMC43LDQxLjgsNjIuMSw0MS44LDYyLjFIMzQ4LjJ6IE0xNjUuMSwxNzYuOWMtMjMuMi03LjctOS42LTM3LjIsMjYuOC00MS42YzE5LjQtMi4zLDQzLjQsMi41LDU2LjMsMTkuMWMxLDAuOCw0LjEsMy41LDQuMSwzLjVzLTEyLjEsOS4xLTIxLjUsMTIuNWMtOS44LDMuNS0yMi41LDQuMS0zMC42LDEuOUMxOTAuMywxNjkuMiwxNzQuNiwxODAuNiwxNjUuMSwxNzYuOXogTTIxMiwxMzkuMWMtMjQuMy05LTEzLjctMzguOSwyMy44LTQ3LjFjMTkuOS00LjMsNDUtMi4yLDYwLjUsMTIuOWMxLjEsMC44LDUuMiwzLjQsNS4yLDMuNHMtMTAuNiwxMC40LTIwLjgsMTQuNmMtMTAuNiw0LjMtMjQuMSw2LTMyLjUsNC4zQzIzOC45LDEyNS4yLDIyMi4xLDE0Mi45LDIxMiwxMzkuMXogTTE0Mi44LDIyOC43YzAtMTIuOCwzMS43LTI0LjUsMzEuNy0yNC41bDI1LDQ5LjdjLTQ0LDM2LjEtNTYuNy0yNC41LTU2LjctMjQuNVYyMjguN3oiLz48L3N2Zz4=';
            event.target.onerror = null; // prevent further loops
        };
    };
};

/**
 * Check if an image exists before trying to load it
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} - True if image exists, false otherwise
 */
export const checkImageExists = async (url) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
};

/**
 * Upload a photo to the server using FormData and proper API utilities
 * This function handles all the complexities of photo uploads
 * @param {FormData} formData - FormData object containing file and metadata
 * @returns {Promise<object>} - Object with success status and photo data
 */
export const uploadPhoto = async (formData) => {
  // Import the API utilities dynamically to avoid circular dependencies
  const { apiRequest, formatApiUrl } = await import('./apiUtils');

  // Create a proper options object for the upload request
  const uploadOptions = {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header as browser automatically sets it with the boundary
  };

  // Log that we're starting the upload process
  console.log('Starting photo upload with enhanced FormData upload utility');
  console.log('FormData contains:', 
    Array.from(formData.keys()).map(key => ({ key, type: typeof formData.get(key) }))
  );

  // Try only the dogs/upload endpoint since it's the only one available
  try {
    // Check if we have a 'file' field
    if (formData.has('file')) {
      // The server endpoint accepts either 'file' or 'photo'
      console.log('Form data contains "file" field');
    } else {
      console.log('WARNING: Form data does not contain "file" field');
    }
    
    const dogsUploadEndpoint = 'dogs/upload';
    console.log(`Attempting upload to dogs/upload endpoint: ${dogsUploadEndpoint}`);
    
    // Send the upload request
    const response = await apiRequest(dogsUploadEndpoint, uploadOptions);
    
    // If successful, return the result
    if (response.ok) {
      const photoData = await response.json();
      console.log('Upload succeeded with dogs/upload endpoint!', photoData);
      
      // Normalize the response format
      const normalizedData = {
        url: photoData.file_url || photoData.absolute_url,
        original_filename: photoData.original_filename || '',
        id: photoData.id || Date.now().toString()
      };
      
      return { success: true, photo: normalizedData };
    }
    
    // If the upload failed, throw an error
    const errorText = await response.text();
    console.error(`Upload to ${dogsUploadEndpoint} failed: ${response.status} - ${errorText}`);
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    
  } catch (error) {
    console.error('Photo upload failed with error:', error);
    // Return a standardized error response
    return { 
      success: false, 
      error: error.message || 'Unknown upload error',
      photo: null
    };
  }
};

// Export the defaults for direct use
export const DEFAULT_DOG_IMAGE = DEFAULT_IMAGES.DOG;
export const DEFAULT_PUPPY_IMAGE = DEFAULT_IMAGES.PUPPY;
export const DEFAULT_LITTER_IMAGE = DEFAULT_IMAGES.LITTER;