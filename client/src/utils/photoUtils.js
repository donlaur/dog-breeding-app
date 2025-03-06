import { formatApiUrl } from './apiUtils';

// Default images for different entity types
const DEFAULT_IMAGES = {
  DOG: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?q=80&w=2487',
  PUPPY: 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=2564',
  LITTER: 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=2564',
  FALLBACK: '/default-dog.jpg'
};

/**
 * Get a valid photo URL with appropriate fallbacks
 * @param {string} photoPath - The path or URL to the photo
 * @param {string} entityType - The type of entity (DOG, PUPPY, LITTER)
 * @returns {string} A valid photo URL or appropriate default
 */
export const getPhotoUrl = (photoPath, entityType = 'DOG') => {
    // If no photo path provided, return appropriate default based on entity type
    if (!photoPath) {
        return DEFAULT_IMAGES[entityType] || DEFAULT_IMAGES.FALLBACK;
    }
    
    // If it's already a full URL, return it
    if (photoPath.startsWith('http')) return photoPath;
    
    // If it's a path from our API, use formatApiUrl
    if (photoPath.startsWith('/uploads/') || photoPath.startsWith('uploads/')) {
        return formatApiUrl(photoPath);
    }
    
    // Construct the Supabase storage URL for legacy paths
    return `https://rezchuvoipnekcbbwlis.supabase.co/storage/v1/object/public/uploads/${photoPath}`;
};

/**
 * Create an onError handler for images that sets a fallback source
 * @param {string} entityType - The type of entity (DOG, PUPPY, LITTER)
 * @returns {Function} An onError handler function
 */
export const handleImageError = (entityType = 'DOG') => {
    return (event) => {
        event.target.src = DEFAULT_IMAGES[entityType] || DEFAULT_IMAGES.FALLBACK;
        event.target.onerror = null; // Prevent infinite loops if the fallback also fails
    };
};

// Export the defaults for direct use
export const DEFAULT_DOG_IMAGE = DEFAULT_IMAGES.DOG;
export const DEFAULT_PUPPY_IMAGE = DEFAULT_IMAGES.PUPPY;
export const DEFAULT_LITTER_IMAGE = DEFAULT_IMAGES.LITTER; 