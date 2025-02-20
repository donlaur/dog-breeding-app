import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// If you have a DogContext, you could import and use it here instead of fetching
// import { useContext } from "react";
// import DogContext from "../../context/DogContext";
import "./Litters.css";

const Litters = () => {
  const navigate = useNavigate();
  
  // Litter & dog data
  const [litters, setLitters] = useState([]);
  const [dogsMap, setDogsMap] = useState({}); // Maps dog.id -> dog object
  
  useEffect(() => {
    // 1) Fetch all litters
    fetch("http://127.0.0.1:5000/api/litters")
      .then((res) => res.json())
      .then((data) => {
        setLitters(data);
      })
      .catch((err) => console.error("Error fetching litters:", err));

    // 2) Fetch dogs so we can look up sire/dam names
    fetch("http://127.0.0.1:5000/api/dogs")
      .then((res) => res.json())
      .then((dogsData) => {
        // Build a map: { 1: {id:1, registered_name:"..."}, 2: {...}, ... }
        const map = {};
        dogsData.forEach((dog) => {
          map[dog.id] = dog;
        });
        setDogsMap(map);
      })
      .catch((err) => console.error("Error fetching dogs for litters:", err));
  }, []);

  // Format birth date as mm/dd/yyyy for display
  const formatDate = (isoDateString) => {
    if (!isoDateString) return "";
    const dateObj = new Date(isoDateString);
    // toLocaleDateString('en-US') → "06/11/2023"
    return dateObj.toLocaleDateString("en-US");
  };

  return (
    <div className="litters-container">
      <h2 className="page-title">Manage Litters</h2>

      {/* Centered add-litter button, like the dog page */}
      <div className="filter-group">
      <button onClick={() => navigate("/dashboard/litters/add")} className="add-litter-btn">
      + Add Litter
      </button>
      </div>

      {/* Grid of litter cards */}
      <div className="litter-grid">
        {litters.length === 0 ? (
          <p>No litters found. Try adding one.</p>
        ) : (
          litters.map((litter) => {
            // Lookup sire/dam from dogsMap
            const sireDog = dogsMap[litter.sire_id];
            const damDog = dogsMap[litter.dam_id];

            return (
              <div
                key={litter.id}
                className="litter-card"
                // You could allow editing on click:
                // onClick={() => navigate(`/dashboard/litters/edit/${litter.id}`)}
              >
                <p>
                  <strong>Birthdate:</strong> {formatDate(litter.birth_date)}
                </p>
                <p>
                  <strong>Sire:</strong>{" "}
                  {sireDog ? sireDog.registered_name : litter.sire_id}
                </p>
                <p>
                  <strong>Dam:</strong>{" "}
                  {damDog ? damDog.registered_name : litter.dam_id}
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

export default Litters;
