// src/pages/litters/AddLitterPage.js
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog } from "../../config";
import LitterForm from "./LitterForm";   // <-- must point to the new LitterForm
import "../../styles/AddLitterPage.css";
import DogContext from "../../context/DogContext";

const AddLitterPage = () => {
  const navigate = useNavigate();
  const { dogs, breeds } = useContext(DogContext);

  const sireOptions = dogs.filter((d) => d.gender === "Male");
  const damOptions = dogs.filter((d) => d.gender === "Female");

  const handleSave = (newLitter) => {
    debugLog("Saving new litter:", newLitter);

    fetch(`${API_URL}/litters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLitter),
    })
      .then((res) => res.json())
      .then((data) => {
        debugLog("New litter saved:", data);
        navigate("/dashboard/litters");
      })
      .catch((error) => console.error("Error saving litter:", error));
  };

  return (
    <div className="add-litter-container">
      <h2>Add a New Litter</h2>
      <LitterForm
        onSave={handleSave}
        breedOptions={breeds}       // pass breed array
        sireOptions={sireOptions}   // pass male dogs
        damOptions={damOptions}     // pass female dogs
      />
    </div>
  );
};

export default AddLitterPage;
