// src/pages/AddHeatCycle.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog } from "../config";
import HeatCycleForm from "../components/HeatCycleForm";

const AddHeatCycle = () => {
  const navigate = useNavigate();

  const handleSave = (newCycle) => {
    fetch(`${API_URL}/heat-cycles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCycle),
    })
      .then((res) => res.json())
      .then((data) => {
        debugLog("New heat cycle saved:", data);
        navigate("/dashboard/heat-cycles");
      })
      .catch((error) => console.error("Error saving heat cycle:", error));
  };

  return (
    <div>
      <h2>Add Heat Cycle</h2>
      <HeatCycleForm onSave={handleSave} />
    </div>
  );
};

export default AddHeatCycle;
