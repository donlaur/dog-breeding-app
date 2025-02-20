// src/pages/litters/AddPuppy.js
import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DogContext from "../../context/DogContext";
import "../../styles/DogForm.css"; // Reuse dog form styles
import DogFormFields from "../../components/DogFormFields";

const AddPuppy = () => {
  const { litterId } = useParams();
  const { dogs, setDogs, breeds } = useContext(DogContext);
  const navigate = useNavigate();

  const [puppy, setPuppy] = useState({
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
    litter_id: litterId
  });

  useEffect(() => {
    if (breeds.length > 0 && !puppy.breed_id) {
      setPuppy((prev) => ({ ...prev, breed_id: breeds[0].id }));
    }
  }, [breeds, puppy.breed_id]);

  const handleSavePuppy = (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(puppy).forEach((key) => {
      formData.append(key, puppy[key]);
    });

    fetch(`http://127.0.0.1:5000/api/litters/${litterId}/puppies`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setDogs([...dogs, data]);
        navigate(`/dashboard/litters/${litterId}`);
      })
      .catch((error) => console.error("Error adding puppy:", error));
  };

  const handleChange = (e) => {
    setPuppy({ ...puppy, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPuppy({
        ...puppy,
        cover_photo_file: file,
        cover_photo_preview: URL.createObjectURL(file),
      });
    }
  };

  return (
    <div className="dog-form-container">
      <h2>Add Puppy to Litter {litterId}</h2>
      <form onSubmit={handleSavePuppy}>
        <DogFormFields dog={puppy} setDog={setPuppy} breeds={breeds} />
        <button type="submit">Add Puppy</button>
      </form>
    </div>
  );
};

export default AddPuppy;
