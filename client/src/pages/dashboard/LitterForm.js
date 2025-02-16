// src/pages/LitterForm.js (or wherever you prefer to store it)
import React, { useState } from "react";
import "./LitterForm.css"; // optional styling

const LitterForm = ({ onSave }) => {
  const [litter, setLitter] = useState({
    program_id: "",
    breed_id: "",
    sire_id: "",
    dam_id: "",
    birth_date: "",
    num_puppies: "",
  });

  const handleChange = (e) => {
    setLitter({ ...litter, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(litter);
    // Reset the form
    setLitter({
      program_id: "",
      breed_id: "",
      sire_id: "",
      dam_id: "",
      birth_date: "",
      num_puppies: "",
    });
  };

  return (
    <div className="litter-form-container">
      <h2>Add New Litter</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Program ID</label>
          <input
            type="text"
            name="program_id"
            value={litter.program_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Breed ID</label>
          <input
            type="text"
            name="breed_id"
            value={litter.breed_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Sire ID</label>
          <input
            type="text"
            name="sire_id"
            value={litter.sire_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Dam ID</label>
          <input
            type="text"
            name="dam_id"
            value={litter.dam_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Birth Date</label>
          <input
            type="date"
            name="birth_date"
            value={litter.birth_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Number of Puppies</label>
          <input
            type="number"
            name="num_puppies"
            value={litter.num_puppies}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Add Litter</button>
      </form>
    </div>
  );
};

export default LitterForm;
