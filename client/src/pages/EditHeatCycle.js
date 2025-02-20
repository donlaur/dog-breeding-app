// src/pages/EditHeatCycle.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, debugLog } from "../config";
import HeatCycleForm from "../components/HeatCycleForm";

const EditHeatCycle = () => {
  const { cycleId } = useParams();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/heat-cycles/${cycleId}`)
      .then((res) => res.json())
      .then((data) => {
        debugLog("Fetched heat cycle:", data);
        setCycle(data);
      })
      .catch((error) => console.error("Error fetching heat cycle:", error));
  }, [cycleId]);

  const handleSave = (updatedCycle) => {
    fetch(`${API_URL}/heat-cycles/${cycleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCycle),
    })
      .then((res) => res.json())
      .then((data) => {
        debugLog("Updated heat cycle:", data);
        navigate("/dashboard/heat-cycles");
      })
      .catch((error) => console.error("Error updating heat cycle:", error));
  };

  if (!cycle) {
    return <p>Loading heat cycle data...</p>;
  }

  return (
    <div>
      <h2>Edit Heat Cycle</h2>
      <HeatCycleForm onSave={handleSave} initialData={cycle} />
    </div>
  );
};

export default EditHeatCycle;
