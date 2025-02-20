// src/pages/litters/LitterDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, debugLog } from "../../config";
import "../../styles/LitterDetails.css";

const LitterDetails = () => {
  const { litterId } = useParams();
  const [litter, setLitter] = useState(null);
  const navigate = useNavigate();

  // Fetch the litter details on mount
  useEffect(() => {
    fetch(`${API_URL}/litters/${litterId}`)
      .then((res) => res.json())
      .then((data) => {
        debugLog("Fetched litter details:", data);
        // If data is an array, take the first element; otherwise, use data directly.
        if (Array.isArray(data)) {
          setLitter(data[0]);
        } else {
          setLitter(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching litter:", error);
      });
  }, [litterId]);

  // Navigate to the Add Puppy form
  const handleAddPuppy = () => {
    navigate(`/dashboard/litters/${litterId}/add-puppy`);
  };

  // NEW: Navigate to the Edit Litter page
  const handleEditLitter = () => {
    navigate(`/dashboard/litters/edit/${litterId}`);
  };

  if (!litter) {
    return <p>Loading litter details...</p>;
  }

  return (
    <div className="litter-details-container">
      <h2>Litter: {litter.litter_name}</h2>
      <p>Birth Date: {litter.birth_date}</p>
      <p>Notes: {litter.notes}</p>

      {/* The new "Edit Litter" button */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={handleEditLitter} style={{ marginRight: "10px" }}>
          Edit Litter
        </button>
        <button onClick={handleAddPuppy}>Add Puppy</button>
      </div>

      <h3>Puppies in this Litter</h3>
      {litter.puppies && litter.puppies.length > 0 ? (
        <ul>
          {litter.puppies.map((puppy) => (
            <li key={puppy.id}>{puppy.registered_name}</li>
          ))}
        </ul>
      ) : (
        <p>No puppies yet.</p>
      )}
    </div>
  );
};

export default LitterDetails;
