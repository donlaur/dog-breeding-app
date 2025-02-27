import { formatApiUrl } from '../../utils/apiUtils';

// Ensure upload URLs have trailing slashes
const uploadUrl = formatApiUrl('uploads');

// Or if you have a custom file upload function:
const uploadFile = async (file, type = 'image') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(formatApiUrl('uploads'), {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
        // Don't set Content-Type here as FormData sets it with boundary
      },
      body: formData
    });
    
    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}; 