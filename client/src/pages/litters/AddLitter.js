import React, { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import { debugLog, debugError } from '../../utils/logger';

const AddLitter: React.FC = () => {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch breeds for dropdown
  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/breeds`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        debugLog("Fetched breeds:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          setBreeds(data);
        } else {
          debugLog("No breeds found or invalid data format");
          setError("No breeds found. Please add breeds first.");
        }
      } catch (error) {
        debugError("Error fetching breeds:", error);
        setError("Failed to load breeds. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBreeds();
  }, []);

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default AddLitter; 