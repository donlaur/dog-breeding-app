import { formatApiUrl, apiUpload } from '../../utils/apiUtils';
import { debugLog, debugError } from '../../config';

// Ensure upload URLs have trailing slashes
const uploadUrl = formatApiUrl('uploads');

// File upload function using the API utility
const uploadFile = async (file, type = 'image') => {
  try {
    debugLog(`Uploading ${type} file:`, file.name);
    const response = await apiUpload(file, type);
    
    if (response.ok) {
      return response.data;
    } else {
      throw new Error(response.error || 'Upload failed');
    }
  } catch (error) {
    debugError('Error uploading file:', error);
    throw error;
  }
};