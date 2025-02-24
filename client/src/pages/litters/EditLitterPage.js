// src/pages/litters/EditLitterPage.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import LitterForm from "./LitterForm"; // The updated LitterForm with all new fields
import "../../styles/AddLitterPage.css";
import DogContext from "../../context/DogContext";

const EditLitterPage = () => {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const { dogs, breeds } = useContext(DogContext);

  const [litter, setLitter] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter dogs to use as sire (male adults) and dam (female adults)
  // (Assumes each dog object has an "is_adult" boolean property)
  const sireOptions = dogs.filter((d) => d.is_adult && d.gender === "Male");
  const damOptions = dogs.filter((d) => d.is_adult && d.gender === "Female");

  // Default breed ID from environment (set this in your .env file, e.g., REACT_APP_DEFAULT_BREED_ID=123)
  const DEFAULT_BREED_ID = process.env.REACT_APP_DEFAULT_BREED_ID || "";

  useEffect(() => {
    debugLog("Fetching litter data for editing:", litterId);
    fetch(`${API_URL}/litters/${litterId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        debugLog("Litter data received:", data);
        setLitter(data);
        setLoading(false);
      })
      .catch((error) => {
        debugError("Error fetching litter:", error);
        debugError("Error details:", error.message);
        setLoading(false);
      });
  }, [litterId]);

  // Save the updated litter via a PUT request
  const handleSave = (updatedLitter) => {
    debugLog("Updating litter:", updatedLitter);
    const payload = { ...updatedLitter };
    // Remove any temporary file fields
    delete payload.cover_photo_file;
    delete payload.cover_photo_preview;

    fetch(`${API_URL}/litters/${litterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        debugLog("Updated litter:", data);
        if (data.error) {
          console.error("Error updating litter:", data.error);
          return;
        }
        navigate(`/dashboard/litters/${litterId}`);
      })
      .catch((error) => console.error("Error updating litter:", error));
  };

  if (loading) {
    return <p>Loading litter data...</p>;
  }

  if (!litter) {
    return <p>Could not load litter details.</p>;
  }

  return (
    <div className="add-litter-container">
      {/* Back button for easier navigation */}
      <button onClick={() => navigate("/dashboard/litters")} className="back-button">
        &larr; Back to Manage Litters
      </button>
      <h2>Edit Litter #{litterId}</h2>
      <LitterForm
        onSave={handleSave}
        initialData={litter}        // Prefill form fields with existing litter data
        breedOptions={breeds}       // Provide available breeds (if needed)
        sireOptions={sireOptions}   // Provide adult male dogs for sire selection
        damOptions={damOptions}     // Provide adult female dogs for dam selection
      />
    </div>
  );
};

export default EditLitterPage;
