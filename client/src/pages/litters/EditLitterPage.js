// src/pages/litters/EditLitterPage.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, debugLog } from "../../config";
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
    // Fetch the existing litter details from the API
    fetch(`${API_URL}/litters/${litterId}`)
      .then((res) => res.json())
      .then((data) => {
        debugLog("Fetched existing litter:", data);
        if (data.error) {
          console.error("Error fetching litter:", data.error);
          setLoading(false);
          return;
        }
        // Force the breed field to the default value and set up prefilled data
        const prefilled = {
          litter_name: data.litter_name || "",
          status: data.status || "Planned",
          birth_date: data.birth_date || "",
          expected_date: data.expected_date || "",
          planned_date: data.planned_date || "",
          // Always force the breed to the default value (Pembroke Welsh Corgis)
          breed_id: DEFAULT_BREED_ID,
          sire_id: data.sire_id || "",
          dam_id: data.dam_id || "",
          price: data.price || "",
          deposit: data.deposit || "",
          extras: data.extras || "",
          socialization: data.socialization || "",
          // Note: cover_photo_file and preview are not set when editing
        };
        setLitter(prefilled);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching litter:", error);
        setLoading(false);
      });
  }, [litterId, DEFAULT_BREED_ID]);

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
