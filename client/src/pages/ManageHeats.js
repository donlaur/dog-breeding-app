import React, { useState, useEffect } from 'react';
import { API_URL, debugLog, debugError } from "../config";

const ManageHeats = () => {
  const [heats, setHeats] = useState([]);

  useEffect(() => {
    debugLog("Fetching heats...");
    fetch(`${API_URL}/heats`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Heats received:", data);
        setHeats(data);
      })
      .catch((err) => {
        debugError("Error fetching heats:", err);
        debugError("Error details:", err.message);
      });
  }, []);

  return (
    <div className="manage-heats">
      <h2>Heats</h2>
      {/* Rest of your component */}
    </div>
  );
};

export default ManageHeats; 