// src/pages/ManageHeatCycles.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "../styles/ManageHeatCycles.css";

const ManageHeatCycles = () => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/heat-cycles`)
      .then((res) => res.json())
      .then((data) => setCycles(data))
      .catch((err) => console.error("Error fetching heat cycles:", err));
  }, []);

  return (
    <div className="heat-cycles-container">
      <h2>Manage Heat Cycles</h2>
      <button onClick={() => navigate("/dashboard/heat-cycles/add")}>
        + Add Heat Cycle
      </button>
      <div className="cycles-grid">
        {cycles.length === 0 ? (
          <p>No heat cycles recorded.</p>
        ) : (
          cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="cycle-card"
              onClick={() => navigate(`/dashboard/heat-cycles/edit/${cycle.id}`)}
            >
              <p><strong>Dog ID:</strong> {cycle.dog_id}</p>
              <p><strong>Start:</strong> {cycle.start_date}</p>
              <p><strong>End:</strong> {cycle.end_date}</p>
              <p><strong>Mating:</strong> {cycle.mating_date}</p>
              <p><strong>Expected Whelp:</strong> {cycle.expected_whelp_date}</p>
              <p><strong>Actual Whelp:</strong> {cycle.actual_whelp_date}</p>
              <p><strong>Notes:</strong> {cycle.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageHeatCycles;
