export const getPhotoUrl = (photoPath) => {
    if (!photoPath) return '/default-dog.jpg';
    
    // If it's already a full URL, return it
    if (photoPath.startsWith('http')) return photoPath;
    
    // Construct the Supabase storage URL
    return `https://rezchuvoipnekcbbwlis.supabase.co/storage/v1/object/public/uploads/${photoPath}`;
}; 