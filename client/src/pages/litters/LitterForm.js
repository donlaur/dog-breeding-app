// src/pages/litters/LitterForm.js
import React, { useState, useEffect } from "react";
import "../../styles/LitterForm.css";
import { API_URL, debugLog, debugError } from "../../config";

/**
 * LitterForm component
 * 
 * @param {Function} onSave - Callback when user submits the form
 * @param {Object} [initialData] - Optional data to prefill the form (for editing)
 * @param {Array} [breedOptions] - Optional array of breed objects for breed_id selection
 * @param {Array} [sireOptions] - Optional array of dog objects (male) for sire_id selection
 * @param {Array} [damOptions] - Optional array of dog objects (female) for dam_id selection
 */
const LitterForm = ({ onSave, initialData, breedOptions = [], sireOptions = [], damOptions = [] }) => {
  // Local state for all the fields
  const [litter, setLitter] = useState({
    litter_name: "",
    status: "Planned",  // default to "Planned"
    birth_date: "",
    expected_date: "",
    planned_date: "",
    breed_id: "",
    sire_id: "",
    dam_id: "",
    price: "",
    deposit: "",
    extras: "",
    socialization: "",
    cover_photo_file: null,      // actual file object
    cover_photo_preview: null    // preview URL
  });

  // If editing, populate form with initialData
  useEffect(() => {
    if (initialData) {
      debugLog("Initializing litter form with data:", initialData);
      setLitter(initialData);
    }
  }, [initialData]);

  // Generic change handler for text/select inputs
  const handleChange = (e) => {
    setLitter({ ...litter, [e.target.name]: e.target.value });
  };

  // For radio buttons (status)
  const handleStatusChange = (e) => {
    setLitter({ ...litter, status: e.target.value });
  };

  // For file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLitter({
        ...litter,
        cover_photo_file: file,
        cover_photo_preview: URL.createObjectURL(file)
      });
    }
  };

  // Submit the form
  const handleSubmit = (e) => {
    e.preventDefault();
    debugLog("Submitting litter form:", litter);
    onSave(litter);

    // If adding a new litter, you might reset the form. If editing, you might not.
    if (!initialData) {
      setLitter({
        litter_name: "",
        status: "Planned",
        birth_date: "",
        expected_date: "",
        planned_date: "",
        breed_id: "",
        sire_id: "",
        dam_id: "",
        price: "",
        deposit: "",
        extras: "",
        socialization: "",
        cover_photo_file: null,
        cover_photo_preview: null
      });
    }
  };

  return (
    <div className="litter-form-container">
      <form onSubmit={handleSubmit}>
        <h2>{initialData ? "Edit Litter" : "Add New Litter"}</h2>

        {/* Litter Name */}
        <div className="form-group">
          <label>Litter Name</label>
          <input
            type="text"
            name="litter_name"
            value={litter.litter_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Status (Born, Expected, Planned) */}
        <div className="form-group">
          <label>Status</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="status"
                value="Born"
                checked={litter.status === "Born"}
                onChange={handleStatusChange}
              />
              Born
            </label>
            <label>
              <input
                type="radio"
                name="status"
                value="Expected"
                checked={litter.status === "Expected"}
                onChange={handleStatusChange}
              />
              Expected
            </label>
            <label>
              <input
                type="radio"
                name="status"
                value="Planned"
                checked={litter.status === "Planned"}
                onChange={handleStatusChange}
              />
              Planned
            </label>
          </div>
        </div>

        {/* Dates */}
        <div className="form-group">
          <label>Birth Date</label>
          <input
            type="date"
            name="birth_date"
            value={litter.birth_date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Expected Date</label>
          <input
            type="date"
            name="expected_date"
            value={litter.expected_date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Planned Date</label>
          <input
            type="date"
            name="planned_date"
            value={litter.planned_date}
            onChange={handleChange}
          />
        </div>

        {/* Breed */}
        <div className="form-group">
          <label>Breed</label>
          <select name="breed_id" value={litter.breed_id} onChange={handleChange}>
            <option value="">-- Select Breed --</option>
            {breedOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sire (Male) */}
        <div className="form-group">
          <label>Sire (Male)</label>
          <select name="sire_id" value={litter.sire_id} onChange={handleChange}>
            <option value="">-- Select Sire --</option>
            {sireOptions.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.registered_name}
              </option>
            ))}
          </select>
        </div>

        {/* Dam (Female) */}
        <div className="form-group">
          <label>Dam (Female)</label>
          <select name="dam_id" value={litter.dam_id} onChange={handleChange}>
            <option value="">-- Select Dam --</option>
            {damOptions.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.registered_name}
              </option>
            ))}
          </select>
        </div>

        {/* Price & Deposit */}
        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={litter.price}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Deposit</label>
          <input
            type="number"
            step="0.01"
            name="deposit"
            value={litter.deposit}
            onChange={handleChange}
          />
        </div>

        {/* Extras & Socialization */}
        <div className="form-group">
          <label>Extras Included</label>
          <textarea
            name="extras"
            value={litter.extras}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Socialization & Enrichment</label>
          <textarea
            name="socialization"
            value={litter.socialization}
            onChange={handleChange}
          />
        </div>

        {/* Cover Photo */}
        <div className="form-group">
          <label>Cover Photo</label>
          {litter.cover_photo_preview && (
            <img
              src={litter.cover_photo_preview}
              alt="Litter Cover Preview"
              style={{ width: 150, height: 150, objectFit: "cover" }}
            />
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <button type="submit">
          {initialData ? "Save Changes" : "Add Litter"}
        </button>
      </form>
    </div>
  );
};

export default LitterForm;
