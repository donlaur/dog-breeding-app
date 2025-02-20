// src/pages/dogs/DogForm.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, debugLog } from "../../config";
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
      // Add mode: set default values for a new dog
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

    // Editing mode: if the dog exists in context, normalize numeric fields
    if (editingDog) {
      const normalizedDog = {
        registered_name: editingDog.registered_name || "",
        call_name: editingDog.call_name || "",
        breed_id: normalizeNumericField(editingDog.breed_id),
        gender: editingDog.gender || "",
        birth_date: editingDog.birth_date || "",
        status: editingDog.status || "",
        cover_photo: editingDog.cover_photo || "",
        color: editingDog.color || "",
        weight: normalizeNumericField(editingDog.weight),
        microchip: editingDog.microchip || "",
        notes: editingDog.notes || "",
        sire_id: normalizeNumericField(editingDog.sire_id),
        dam_id: normalizeNumericField(editingDog.dam_id),
        litter_id: normalizeNumericField(editingDog.litter_id)
      };
      debugLog("Editing mode: normalized dog from context:", normalizedDog);
      setDog(normalizedDog);
      setLoading(false);
    } else {
      // Not found in context: fetch by ID from API
      debugLog(`Dog with ID ${id} not found in context, fetching from API...`);
      fetch(`${API_URL}/dogs/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error("Dog not found:", data.error);
            setDog(null);
          } else {
            // Normalize numeric fields for the fetched data
            const normalizedDog = {
              registered_name: data.registered_name || "",
              call_name: data.call_name || "",
              breed_id: normalizeNumericField(data.breed_id),
              gender: data.gender || "",
              birth_date: data.birth_date || "",
              status: data.status || "",
              cover_photo: data.cover_photo || "",
              color: data.color || "",
              weight: normalizeNumericField(data.weight),
              microchip: data.microchip || "",
              notes: data.notes || "",
              sire_id: normalizeNumericField(data.sire_id),
              dam_id: normalizeNumericField(data.dam_id),
              litter_id: normalizeNumericField(data.litter_id)
            };
            debugLog("Fetched and normalized dog:", normalizedDog);
            setDogs((prev) => [...prev, normalizedDog]);
            setDog(normalizedDog);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching dog by ID:", err);
          setDog(null);
          setLoading(false);
        });
    }
  }, [id, dogs, setDogs, editingDog]);

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

  const handleSaveDog = (e) => {
    e.preventDefault();
    const formData = new FormData();
    // Define numeric fields to skip if empty
    const numericFields = ["breed_id", "sire_id", "dam_id", "weight", "litter_id"];
    Object.keys(dog).forEach((key) => {
      let value = dog[key];
      if (numericFields.includes(key)) {
        if (
          value === "" ||
          value === null ||
          (typeof value === "string" && value.toLowerCase() === "null")
        ) {
          return; // Skip appending this field
        }
      }
      formData.append(key, value);
    });

    if (dog.cover_photo_file) {
      formData.append("cover_photo", dog.cover_photo_file);
    }

    debugLog("FormData entries:");
    for (let pair of formData.entries()) {
      debugLog(`${pair[0]}: ${pair[1]}`);
    }

    const apiUrl = id
      ? `${API_URL}/dogs?dog_id=${id}`
      : `${API_URL}/dogs`;

    fetch(apiUrl, {
      method: "POST",
      body: formData
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          console.error("Error saving dog:", err);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (id) {
          setDogs((prev) => prev.map((d) => (d.id === parseInt(id) ? data : d)));
        } else {
          setDogs((prev) => [...prev, data]);
        }
        navigate("/dashboard/dogs");
      })
      .catch((error) => {
        console.error("Error saving dog:", error);
      });
  };

  return (
    <div className="dog-form-container">
      <h2>{id ? "Edit Dog" : "Add New Dog"}</h2>
      <form onSubmit={handleSaveDog}>
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

        <button type="submit">{id ? "Save Changes" : "Add Dog"}</button>
      </form>
    </div>
  );
}

export default DogForm;
