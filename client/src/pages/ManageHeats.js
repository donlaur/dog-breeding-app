import React, { useState, useEffect } from 'react';
import { API_URL, debugLog, debugError } from "../config";
import { apiGet } from "../utils/apiUtils";

const ManageHeats = () => {
  const [heats, setHeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeats = async () => {
      try {
        debugLog("Fetching heats...");
        const response = await apiGet('heats');
        
        if (response.ok) {
          debugLog("Heats received:", response.data);
          setHeats(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch heats");
        }
      } catch (err) {
        debugError("Error fetching heats:", err);
        debugError("Error details:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHeats();
  }, []);

  return (
    <div className="manage-heats">
      <h2>Heats</h2>
      {loading && <p>Loading heats...</p>}
      {error && <p className="error">Error: {error}</p>}
      {/* Rest of your component */}
    </div>
  );
};

export default ManageHeats;