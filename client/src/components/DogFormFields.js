// src/components/DogFormFields.js
import React from "react";

const DogFormFields = ({ dog, setDog, breeds }) => {
  const handleChange = (e) => {
    setDog({ ...dog, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDog({
        ...dog,
        cover_photo_file: file,
        cover_photo_preview: URL.createObjectURL(file),
      });
    }
  };

  return (
    <>
      {/* Cover Photo Section */}
      <div className="cover-photo-section">
        {dog.cover_photo_preview ? (
          <img src={dog.cover_photo_preview} alt="Dog Cover" className="cover-photo" />
        ) : dog.cover_photo ? (
          <img src={dog.cover_photo} alt="Dog Cover" className="cover-photo" />
        ) : (
          <div className="cover-photo-placeholder">No Photo</div>
        )}
        <label className="replace-photo-btn">
          Replace Photo
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>
      </div>

      {/* Registered Name */}
      <div className="form-group">
        <label>Registered Name</label>
        <input
          type="text"
          name="registered_name"
          value={dog.registered_name || ""}
          onChange={handleChange}
          required
        />
      </div>

      {/* Call Name */}
      <div className="form-group">
        <label>Call Name</label>
        <input
          type="text"
          name="call_name"
          value={dog.call_name || ""}
          onChange={handleChange}
          required
        />
      </div>

      {/* Breed */}
      <div className="form-group">
        <label>Breed</label>
        <select name="breed_id" value={dog.breed_id || ""} onChange={handleChange} required>
          <option value="">Select Breed</option>
          {breeds.map((breed) => (
            <option key={breed.id} value={breed.id}>
              {breed.name}
            </option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div className="form-group">
        <label>Gender</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="gender"
              value="Male"
              checked={dog.gender === "Male"}
              onChange={handleChange}
            />
            Male
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="Female"
              checked={dog.gender === "Female"}
              onChange={handleChange}
            />
            Female
          </label>
        </div>
      </div>

      {/* Birth Date */}
      <div className="form-group">
        <label>Birth Date</label>
        <input
          type="date"
          name="birth_date"
          value={dog.birth_date || ""}
          onChange={handleChange}
          required
        />
      </div>

      {/* Status */}
      <div className="form-group">
        <label>Status</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="status"
              value="Active"
              checked={dog.status === "Active"}
              onChange={handleChange}
            />
            Active
          </label>
          <label>
            <input
              type="radio"
              name="status"
              value="Retired"
              checked={dog.status === "Retired"}
              onChange={handleChange}
            />
            Retired
          </label>
          <label>
            <input
              type="radio"
              name="status"
              value="Upcoming"
              checked={dog.status === "Upcoming"}
              onChange={handleChange}
            />
            Upcoming
          </label>
        </div>
      </div>

      {/* Additional Fields */}
      <div className="form-group">
        <label>Color</label>
        <input type="text" name="color" value={dog.color || ""} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Weight (lbs)</label>
        <input type="number" name="weight" value={dog.weight || ""} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Microchip</label>
        <input type="text" name="microchip" value={dog.microchip || ""} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea name="notes" value={dog.notes || ""} onChange={handleChange}></textarea>
      </div>
    </>
  );
};

export default DogFormFields;
