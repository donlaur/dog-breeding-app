// src/pages/ManageHeatCycles.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../config";
import "../styles/ManageHeatCycles.css";

const ManageHeatCycles = () => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    debugLog("Fetching heat cycles...");
    fetch(`${API_URL}/heat-cycles`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Heat cycles received:", data);
        setCycles(data);
      })
      .catch((err) => {
        debugError("Error fetching heat cycles:", err);
        debugError("Error details:", err.message);
      });
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
