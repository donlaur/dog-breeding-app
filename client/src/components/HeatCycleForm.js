// src/pages/heatcycles/HeatCycleForm.js
import React, { useState, useContext, useEffect } from "react";
import DogContext from "../context/DogContext";

/**
 * HeatCycleForm
 * 
 * @param {Function} onSave  - callback when form is submitted
 * @param {Object}   initialData - optional, if editing
 */
const HeatCycleForm = ({ onSave, initialData }) => {
  const { dogs } = useContext(DogContext);

  // Filter to adult female dogs only.
  // Assumes each dog object has an "is_adult" property set to true if the dog is an adult.
  const femaleDogs = dogs.filter((d) => d.gender === "Female" && d.is_adult);

  // Local form state
  const [cycle, setCycle] = useState({
    dog_id: "",
    start_date: "",
    end_date: "",
    mating_date: "",
    expected_whelp_date: "",
    actual_whelp_date: "",
    notes: "",
  });

  // If editing, populate form with initialData
  useEffect(() => {
    if (initialData) {
      setCycle({ ...cycle, ...initialData });
    }
    // eslint-disable-next-line
  }, [initialData]);

  // Generic change handler
  const handleChange = (e) => {
    setCycle({ ...cycle, [e.target.name]: e.target.value });
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(cycle);
  };

  return (
    <form onSubmit={handleSubmit} className="heat-cycle-form">
      <div className="form-group">
        <label>Dog (Female)</label>
        <select
          name="dog_id"
          value={cycle.dog_id}
          onChange={handleChange}
          required
        >
          <option value="">-- Select Dog --</option>
          {femaleDogs.map((dog) => (
            <option key={dog.id} value={dog.id}>
              {dog.registered_name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Start Date</label>
        <input
          type="date"
          name="start_date"
          value={cycle.start_date}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>End Date</label>
        <input
          type="date"
          name="end_date"
          value={cycle.end_date}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Mating Date</label>
        <input
          type="date"
          name="mating_date"
          value={cycle.mating_date}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Expected Whelp Date</label>
        <input
          type="date"
          name="expected_whelp_date"
          value={cycle.expected_whelp_date}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Actual Whelp Date</label>
        <input
          type="date"
          name="actual_whelp_date"
          value={cycle.actual_whelp_date}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          name="notes"
          value={cycle.notes}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="save-heat-cycle-btn">
        {initialData ? "Save Changes" : "Save Heat Cycle"}
      </button>
    </form>
  );
};

export default HeatCycleForm;
