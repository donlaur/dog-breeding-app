import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DogContext from "../../context/DogContext";
import "./DogForm.css";

const DogForm = () => {
  const { dogs, setDogs, breeds } = useContext(DogContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const editingDog = dogs.find((dog) => dog.id === parseInt(id));

  const [dog, setDog] = useState({
    registered_name: "",
    call_name: "",
    breed_id: "",
    gender: "Male",
    birth_date: "",
    status: "Active",
    cover_photo: "",
    additional_photos: [],
  });

  useEffect(() => {
    if (editingDog) {
      setDog({ ...editingDog });
    }
  }, [editingDog]);

  const handleChange = (e) => {
    setDog({ ...dog, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDog({ ...dog, cover_photo: URL.createObjectURL(file) });
    }
  };

  const handleSaveDog = (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append("registered_name", dog.registered_name);
    formData.append("call_name", dog.call_name);
    formData.append("breed_id", dog.breed_id);
    formData.append("gender", dog.gender);
    formData.append("birth_date", dog.birth_date);
    formData.append("status", dog.status);
  
    // ✅ Ensure cover photo is correctly added to FormData
    if (dog.cover_photo instanceof File) {
      formData.append("cover_photo", dog.cover_photo);
    }
  
    const apiUrl = editingDog
      ? `http://127.0.0.1:5000/api/dogs/${editingDog.id}`
      : `http://127.0.0.1:5000/api/dogs`;
    const method = editingDog ? "PUT" : "POST";
  
    fetch(apiUrl, {
      method,
      body: formData, // ✅ Send as FormData
    })
      .then((response) => response.json())
      .then((data) => {
        if (editingDog) {
          setDogs(dogs.map((d) => (d.id === editingDog.id ? data : d)));
        } else {
          setDogs([...dogs, data]);
        }
        navigate("/dashboard/dogs");
      })
      .catch((error) => console.error("Error saving dog:", error));
  };

  // ✅ The `return` statement is correctly inside the function.
  return (
    <div className="dog-form-container">
      <h2>{editingDog ? "Edit Dog" : "Add New Dog"}</h2>

      <form onSubmit={handleSaveDog}>
        {/* Cover Photo Section */}
        <div className="cover-photo-section">
          {dog.cover_photo ? (
            <img src={dog.cover_photo} alt="Dog Cover" className="cover-photo" />
          ) : (
            <div className="cover-photo-placeholder">No Photo</div>
          )}
          <label className="replace-photo-btn">
            Replace Photo
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>
        </div>

        {/* Dog Info Fields */}
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

        {/* Gender Selection */}
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

        {/* Status Selection */}
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

        <button type="submit">{editingDog ? "Save Changes" : "Add Dog"}</button>
      </form>
    </div>
  );
};

export default DogForm;
