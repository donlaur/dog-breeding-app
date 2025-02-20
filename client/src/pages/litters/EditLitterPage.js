// src/pages/litters/EditLitterPage.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, debugLog } from "../../config";
import LitterForm from "./LitterForm";  // <-- The new LitterForm with all fields
import "../../styles/AddLitterPage.css";

// ✅ Import DogContext so we can pass breedOptions, sireOptions, damOptions
import DogContext from "../../context/DogContext";

const EditLitterPage = () => {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const { dogs, breeds } = useContext(DogContext);

  // We'll store the existing litter's data here
  const [litter, setLitter] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derive sire/dam options from dogs
  const sireOptions = dogs.filter((d) => d.gender === "Male");
  const damOptions = dogs.filter((d) => d.gender === "Female");

  // 1) Fetch existing litter details
  useEffect(() => {
    fetch(`${API_URL}/litters/${litterId}`)
      .then((res) => res.json())
      .then((data) => {
        debugLog("Fetched existing litter:", data);
        if (data.error) {
          console.error("Error fetching litter:", data.error);
          setLoading(false);
          return;
        }
        // Transform data into the shape LitterForm expects
        // We'll assume these columns exist: litter_name, status, birth_date, expected_date,
        // planned_date, breed_id, sire_id, dam_id, price, deposit, extras, socialization
        const prefilled = {
          litter_name: data.litter_name || "",
          status: data.status || "Planned",
          birth_date: data.birth_date || "",
          expected_date: data.expected_date || "",
          planned_date: data.planned_date || "",
          breed_id: data.breed_id || "",
          sire_id: data.sire_id || "",
          dam_id: data.dam_id || "",
          price: data.price || "",
          deposit: data.deposit || "",
          extras: data.extras || "",
          socialization: data.socialization || "",
          // The form uses cover_photo_file for uploads; we won't set that here
        };
        setLitter(prefilled);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching litter:", error);
        setLoading(false);
      });
  }, [litterId]);

  // 2) Save (PUT) the updated litter
  const handleSave = (updatedLitter) => {
    debugLog("Updating litter:", updatedLitter);

    // We'll send JSON. If you want to support file uploads (cover_photo_file),
    // you'd build FormData here and do a multipart PUT.
    const payload = { ...updatedLitter };
    // remove cover_photo_file, cover_photo_preview if not doing multipart
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
        // On success, navigate back to the litter details page
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
      <h2>Edit Litter #{litterId}</h2>
      <LitterForm
        onSave={handleSave}
        initialData={litter}        // prefill the form with existing data
        breedOptions={breeds}       // pass in breed array
        sireOptions={sireOptions}   // pass in male dogs
        damOptions={damOptions}     // pass in female dogs
      />
    </div>
  );
};

export default EditLitterPage;
