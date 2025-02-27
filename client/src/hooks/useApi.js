const getFullDogData = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/dogs/full`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Handle error responses
      const errorData = await response.json();
      console.error('API Error:', errorData);
      return { ok: false, error: errorData };
    }
    
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error('API Error:', error);
    return { ok: false, error: { message: error.message } };
  }
};

return {
  // ... existing functions
  getFullDogData
}; 