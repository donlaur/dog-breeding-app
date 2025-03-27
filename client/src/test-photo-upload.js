/**
 * Test script for photo upload functionality
 * 
 * This file can be run in the browser console to test photo uploads
 * without relying on the UI components.
 * 
 * To use this:
 * 1. Open your browser's developer console
 * 2. Copy and paste the entire contents of this file
 * 3. Call the testPhotoUpload() function
 */

// Import fetch polyfill for older browsers if needed
if (!window.fetch) {
  console.error('Fetch API not available');
}

/**
 * Test the photo upload functionality
 * This function will try to upload a small test image to verify the endpoints are working
 */
function testPhotoUpload() {
  console.log('Starting photo upload test...');

  // Create a small test image (1x1 pixel transparent PNG)
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  // Convert base64 to blob
  const byteString = atob(base64Image);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'image/png' });
  const testFile = new File([blob], 'test-image.png', { type: 'image/png' });

  // Create FormData with test parameters
  const formData = new FormData();
  formData.append('file', testFile);
  formData.append('entity_type', 'dog');
  formData.append('entity_id', '1');
  formData.append('caption', 'Test upload');
  formData.append('is_cover', 'false');
  formData.append('order', '0');

  // Get auth token if available
  const token = localStorage.getItem('token') || '';

  // Options for fetch request
  const fetchOptions = {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };

  // Test endpoints to try
  const endpoints = [
    '/api/photos/cloudinary',
    '/api/photos',
    '/api/uploads',
    'http://localhost:5000/api/photos/cloudinary',
    'http://localhost:5000/api/photos',
    'http://localhost:5000/api/uploads'
  ];

  console.log('Will try these endpoints:', endpoints);

  // Try each endpoint
  const testEndpoint = async (endpoint) => {
    console.log(`Testing endpoint: ${endpoint}`);
    try {
      const response = await fetch(endpoint, fetchOptions);
      const status = response.status;
      console.log(`Response status: ${status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('SUCCESS! Response data:', data);
        return { success: true, endpoint, data };
      } else {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read response text';
        }
        console.error(`Endpoint ${endpoint} returned ${status}: ${errorText}`);
        return { success: false, endpoint, status, error: errorText };
      }
    } catch (error) {
      console.error(`Error with endpoint ${endpoint}:`, error);
      return { success: false, endpoint, error: error.message };
    }
  };

  // Test all endpoints and collect results
  Promise.all(endpoints.map(testEndpoint))
    .then(results => {
      console.log('------- TEST RESULTS -------');
      const successfulEndpoints = results.filter(r => r.success);
      
      if (successfulEndpoints.length > 0) {
        console.log(`✅ PASS: ${successfulEndpoints.length} endpoints worked:`);
        successfulEndpoints.forEach(r => console.log(`- ${r.endpoint}`));
        console.log('Working data example:', successfulEndpoints[0].data);
      } else {
        console.log('❌ FAIL: No endpoints worked');
      }

      console.log('Detailed results:', results);
      console.log('----------------------------');
      
      return results;
    });
}

console.log('Photo upload test script loaded. Call testPhotoUpload() to run the test.');

// Export for module usage
if (typeof module !== 'undefined') {
  module.exports = { testPhotoUpload };
}