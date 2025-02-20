// src/pages/litters/ManageLitters.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog } from "../../config";
import "../../styles/Litters.css";

const ManageLitters = () => {
  const navigate = useNavigate();
  const [litters, setLitters] = useState([]);
  const [dogsMap, setDogsMap] = useState({}); // Maps dog.id -> dog object

  useEffect(() => {
    fetch(`${API_URL}/litters`)
      .then((res) => res.json())
      .then((data) => {
        debugLog("Fetched litters:", data);
        setLitters(data);
      })
      .catch((err) => console.error("Error fetching litters:", err));

    fetch(`${API_URL}/dogs`)
      .then((res) => res.json())
      .then((dogsData) => {
        const map = {};
        dogsData.forEach((dog) => {
          map[dog.id] = dog;
        });
        debugLog("Fetched dogs for litters:", map);
        setDogsMap(map);
      })
      .catch((err) => console.error("Error fetching dogs for litters:", err));
  }, []);

  // Format date as mm/dd/yyyy
  const formatDate = (isoDateString) => {
    if (!isoDateString) return "";
    const dateObj = new Date(isoDateString);
    return dateObj.toLocaleDateString("en-US");
  };

  return (
    <div className="litters-container">
      <h2 className="page-title">Manage Litters</h2>
      <div className="filter-group">
        <button onClick={() => navigate("/dashboard/litters/add")} className="add-litter-btn">
          + Add Litter
        </button>
      </div>
      <div className="litter-grid">
        {litters.length === 0 ? (
          <p>No litters found. Try adding one.</p>
        ) : (
          litters.map((litter) => {
            // Lookup sire/dam names from dogsMap
            const sireDog = dogsMap[litter.sire_id];
            const damDog = dogsMap[litter.dam_id];

            return (
              <div
                key={litter.id}
                className="litter-card"
                onClick={() => navigate(`/dashboard/litters/${litter.id}`)}
              >
                <p>
                  <strong>Birthdate:</strong> {formatDate(litter.birth_date)}
                </p>
                <p>
                  <strong>Sire:</strong> {sireDog ? sireDog.registered_name : "None"}
                </p>
                <p>
                  <strong>Dam:</strong> {damDog ? damDog.registered_name : "None"}
                </p>
                <p>
                  <strong>Puppies:</strong> {litter.num_puppies}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManageLitters;
