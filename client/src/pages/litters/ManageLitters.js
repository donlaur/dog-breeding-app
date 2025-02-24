// src/pages/litters/ManageLitters.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import "../../styles/Litters.css";

const ManageLitters = () => {
  const navigate = useNavigate();
  const [litters, setLitters] = useState([]);
  const [dogsMap, setDogsMap] = useState({}); // Maps dog.id -> dog object

  useEffect(() => {
    // Fetch litters
    fetch(`${API_URL}/litters/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Litters data received:", data);
        setLitters(data);
      })
      .catch((err) => {
        debugError("Error fetching litters:", err);
        debugError("Error details:", err.message);
      });

    // Fetch dogs for litter details
    fetch(`${API_URL}/dogs/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((dogsData) => {
        debugLog("Dogs data for litters received:", dogsData);
        const map = {};
        dogsData.forEach((dog) => {
          map[dog.id] = dog;
        });
        setDogsMap(map);
      })
      .catch((err) => {
        debugError("Error fetching dogs for litters:", err);
        debugError("Error details:", err.message);
      });
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
                <h3>{litter.litter_name}</h3>
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
                  <strong>Price:</strong> ${litter.price}
                </p>
                <p>
                  <strong>Deposit:</strong> ${litter.deposit}
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
