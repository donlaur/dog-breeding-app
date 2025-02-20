// src/pages/dogs/ManageDogs.js
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog } from "../../config";
import DogContext from "../../context/DogContext";
import "../../styles/ManageDogs.css";

const ManageDogs = () => {
  const { dogs, setDogs } = useContext(DogContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/dogs`)
      .then((res) => res.json())
      .then((data) => {
        debugLog("All dogs from API:", data);
        const adultDogs = data.filter((dog) => !dog.litter_id);
        debugLog("Filtered adult dogs:", adultDogs);
        setDogs(adultDogs);
      })
      .catch((error) => console.error("Error fetching dogs:", error));
  }, [setDogs]);

  return (
    <div className="dogs-container">
      <h2 className="page-title">Manage Adult Dogs</h2>
      <div className="filter-group">
        <button onClick={() => navigate("/dashboard/dogs/add")} className="add-dog-btn">
          + Add Dog
        </button>
      </div>
      <div className="dog-grid">
        {dogs.length === 0 ? (
          <p>No adult dogs found. Try adding one.</p>
        ) : (
          dogs.map((dog) => (
            <div key={dog.id} className="dog-card" onClick={() => navigate(`/dashboard/dogs/edit/${dog.id}`)}>
              {dog.cover_photo ? (
                <img src={dog.cover_photo} alt={dog.registered_name} className="dog-image" />
              ) : (
                <p>No Photo</p>
              )}
              <h3>{dog.registered_name}</h3>
              <p>{dog.gender} - {dog.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageDogs;
