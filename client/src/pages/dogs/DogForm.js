// src/pages/dogs/DogForm.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import DogContext from "../../context/DogContext";
import "../../styles/DogForm.css";

// Helper to normalize numeric fields from the API
const normalizeNumericField = (value) => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.toLowerCase() === "null")
  ) {
    return "";
  }
  return value;
};

function DogForm() {
  const { dogs, setDogs, breeds } = useContext(DogContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const editingDog = dogs.find((dog) => dog.id === parseInt(id));
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      debugLog("Initializing new dog form");
      const newDog = {
        registered_name: "",
        call_name: "",
        breed_id: "",
        gender: "",
        birth_date: "",
        status: "",
        cover_photo: "",
        color: "",
        weight: "",
        microchip: "",
        notes: "",
        sire_id: "",
        dam_id: "",
        litter_id: "" // For adult dogs, remains empty
      };
      debugLog("Add mode: new dog state:", newDog);
      setDog(newDog);
      setLoading(false);
      return;
    }

    debugLog("Fetching dog data for editing:", id);
    fetch(`${API_URL}/dogs/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Dog data received for editing:", data);
        setDog(data);
        setLoading(false);
      })
      .catch((err) => {
        debugError("Error fetching dog:", err);
        debugError("Error details:", err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p>Loading dog data...</p>;
  }

  if (!dog) {
    return <p>Dog not found or error loading data.</p>;
  }

  // Optional sire/dam options
  const sireOptions = dogs.filter((d) => d.gender === "Male");
  const damOptions = dogs.filter((d) => d.gender === "Female");

  const handleChange = (e) => {
    setDog({ ...dog, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDog({
        ...dog,
        cover_photo_file: file,
        cover_photo_preview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    debugLog("Submitting dog form:", dog);

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/dogs/${id}` : `${API_URL}/dogs/`;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dog),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Dog saved successfully:", data);
        if (id) {
          setDogs((prev) => prev.map((d) => (d.id === parseInt(id) ? data : d)));
        } else {
          setDogs((prev) => [...prev, data]);
        }
        navigate("/dashboard/dogs");
      })
      .catch((err) => {
        debugError("Error saving dog:", err);
        debugError("Error details:", err.message);
      });
  };

  return (
    <div className="dog-form-container">
      {/* Back Button */}
      <button onClick={() => navigate("/dashboard/dogs")} className="back-button">
        &larr; Back to Manage Dogs
      </button>
      <h2>{id ? "Edit Dog" : "Add New Dog"}</h2>
      <form onSubmit={handleSubmit}>
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

        <div className="form-group">
          <label>Registered Name</label>
          <input type="text" name="registered_name" value={dog.registered_name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Call Name</label>
          <input type="text" name="call_name" value={dog.call_name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Breed</label>
          <select name="breed_id" value={dog.breed_id || ""} onChange={handleChange} required>
            <option value="">Select Breed</option>
            {breeds.map((breed) => (
              <option key={breed.id} value={breed.id}>{breed.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Gender</label>
          <div className="radio-group">
            <label>
              <input type="radio" name="gender" value="Male" checked={dog.gender === "Male"} onChange={handleChange} />
              Male
            </label>
            <label>
              <input type="radio" name="gender" value="Female" checked={dog.gender === "Female"} onChange={handleChange} />
              Female
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Birth Date</label>
          <input type="date" name="birth_date" value={dog.birth_date} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Status</label>
          <div className="radio-group">
            <label>
              <input type="radio" name="status" value="Active" checked={dog.status === "Active"} onChange={handleChange} />
              Active
            </label>
            <label>
              <input type="radio" name="status" value="Retired" checked={dog.status === "Retired"} onChange={handleChange} />
              Retired
            </label>
            <label>
              <input type="radio" name="status" value="Upcoming" checked={dog.status === "Upcoming"} onChange={handleChange} />
              Upcoming
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Sire (Father)</label>
          <select name="sire_id" value={dog.sire_id} onChange={handleChange}>
            <option value="">None</option>
            {sireOptions.map((sire) => (
              <option key={sire.id} value={sire.id}>{sire.registered_name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Dam (Mother)</label>
          <select name="dam_id" value={dog.dam_id} onChange={handleChange}>
            <option value="">None</option>
            {damOptions.map((dam) => (
              <option key={dam.id} value={dam.id}>{dam.registered_name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Color</label>
          <input type="text" name="color" value={dog.color} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Weight (lbs)</label>
          <input type="number" name="weight" value={dog.weight} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Microchip</label>
          <input type="text" name="microchip" value={dog.microchip} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={dog.notes} onChange={handleChange}></textarea>
        </div>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="is_adult"
              checked={dog.is_adult === true}
              onChange={(e) =>
                setDog({ ...dog, is_adult: e.target.checked })
              }
            />
            Adult (in breeding program)
          </label>
        </div>

        <button type="submit">{id ? "Save Changes" : "Add Dog"}</button>
      </form>
    </div>
  );
}

export default DogForm;
