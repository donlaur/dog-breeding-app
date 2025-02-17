import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DogContext from "../../context/DogContext";
import "./DogForm.css";

const DogForm = () => {
  const { dogs, setDogs, breeds } = useContext(DogContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const editingDog = dogs.find((dog) => dog.id === parseInt(id));

  // Separate male/female for sire/dam
  const sireOptions = dogs.filter((d) => d.gender === "Male");
  const damOptions = dogs.filter((d) => d.gender === "Female");

  // Local state
  const [dog, setDog] = useState({
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
  });

  useEffect(() => {
    if (editingDog) {
      setDog({
        registered_name: editingDog.registered_name || "",
        call_name: editingDog.call_name || "",
        breed_id: editingDog.breed_id || "",
        gender: editingDog.gender || "",
        birth_date: editingDog.birth_date || "",
        status: editingDog.status || "",
        cover_photo: editingDog.cover_photo || "",
        color: editingDog.color || "",
        weight: editingDog.weight || "",     // if numeric in DB, might come back as string or null
        microchip: editingDog.microchip || "",
        notes: editingDog.notes || "",
        sire_id: editingDog.sire_id || "",   // blank if not set
        dam_id: editingDog.dam_id || "",
      });
    } else if (!editingDog && breeds.length) {
      const corgi = breeds.find((b) => b.name === "Pembroke Welsh Corgi");
      if (corgi) {
        setDog((prevDog) => ({
          ...prevDog,
          breed_id: corgi.id,
        }));
      }
    }
  }, [editingDog, breeds]);

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

  const handleSaveDog = (e) => {
    e.preventDefault();

    // Build FormData with everything as strings or empty strings
    const formData = new FormData();
    formData.append("registered_name", dog.registered_name);
    formData.append("call_name", dog.call_name);
    formData.append("breed_id", dog.breed_id);
    formData.append("gender", dog.gender);
    formData.append("birth_date", dog.birth_date);
    formData.append("status", dog.status);
    formData.append("color", dog.color);
    formData.append("weight", dog.weight);        // might be "", "abc", etc. => server handles
    formData.append("microchip", dog.microchip);
    formData.append("notes", dog.notes);
    formData.append("sire_id", dog.sire_id);
    formData.append("dam_id", dog.dam_id);

    if (dog.cover_photo_file) {
      formData.append("cover_photo", dog.cover_photo_file);
    }

    const apiUrl = editingDog
      ? `http://127.0.0.1:5000/api/dogs?dog_id=${editingDog.id}`
      : `http://127.0.0.1:5000/api/dogs`;

    fetch(apiUrl, {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          // We'll parse the error but won't show a big alert
          // If you want to silently ignore, you can do so here.
          const err = await response.json();
          console.error("Error saving dog (server returned non-OK):", err);
          return; // no user-facing alert, just log
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return; // in case of error above
        if (editingDog) {
          setDogs(dogs.map((d) => (d.id === editingDog.id ? data : d)));
        } else {
          setDogs([...dogs, data]);
        }
        navigate("/dashboard/dogs");
      })
      .catch((error) => {
        // Hide from end users => just log
        console.error("Error saving dog:", error);
      });
  };

  return (
    <div className="dog-form-container">
      <h2>{editingDog ? "Edit Dog" : "Add New Dog"}</h2>

      <form onSubmit={handleSaveDog}>
        <div className="cover-photo-section">
          {dog.cover_photo_preview ? (
            <img
              src={dog.cover_photo_preview}
              alt="Dog Cover"
              className="cover-photo"
            />
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
          <input
            type="text"
            name="registered_name"
            value={dog.registered_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Call Name</label>
          <input
            type="text"
            name="call_name"
            value={dog.call_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Breed</label>
          <select
            name="breed_id"
            value={dog.breed_id || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select Breed</option>
            {breeds.map((breed) => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </select>
        </div>

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
              />{" "}
              Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={dog.gender === "Female"}
                onChange={handleChange}
              />{" "}
              Female
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Birth Date</label>
          <input
            type="date"
            name="birth_date"
            value={dog.birth_date}
            onChange={handleChange}
            required
          />
        </div>

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
              />{" "}
              Active
            </label>
            <label>
              <input
                type="radio"
                name="status"
                value="Retired"
                checked={dog.status === "Retired"}
                onChange={handleChange}
              />{" "}
              Retired
            </label>
            <label>
              <input
                type="radio"
                name="status"
                value="Upcoming"
                checked={dog.status === "Upcoming"}
                onChange={handleChange}
              />{" "}
              Upcoming
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Sire (Father)</label>
          <select name="sire_id" value={dog.sire_id} onChange={handleChange}>
            <option value="">None</option>
            {sireOptions.map((sire) => (
              <option key={sire.id} value={sire.id}>
                {sire.registered_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Dam (Mother)</label>
          <select name="dam_id" value={dog.dam_id} onChange={handleChange}>
            <option value="">None</option>
            {damOptions.map((dam) => (
              <option key={dam.id} value={dam.id}>
                {dam.registered_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Color</label>
          <input
            type="text"
            name="color"
            value={dog.color}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Weight (lbs)</label>
          <input
            type="number"
            name="weight"
            value={dog.weight}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Microchip</label>
          <input
            type="text"
            name="microchip"
            value={dog.microchip}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={dog.notes}
            onChange={handleChange}
          ></textarea>
        </div>

        <button type="submit">{editingDog ? "Save Changes" : "Add Dog"}</button>
      </form>
    </div>
  );
};

export default DogForm;
