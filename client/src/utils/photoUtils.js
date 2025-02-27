import { formatApiUrl } from './apiUtils';

export const getPhotoUrl = (photoPath) => {
    if (!photoPath) return '/default-dog.jpg';
    
    // If it's already a full URL, return it
    if (photoPath.startsWith('http')) return photoPath;
    
    // If it's a path from our API, use formatApiUrl
    if (photoPath.startsWith('/uploads/') || photoPath.startsWith('uploads/')) {
        return formatApiUrl(photoPath);
    }
    
    // Construct the Supabase storage URL for legacy paths
    return `https://rezchuvoipnekcbbwlis.supabase.co/storage/v1/object/public/uploads/${photoPath}`;
}; 