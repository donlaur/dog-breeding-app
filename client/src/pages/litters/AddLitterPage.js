// src/pages/litters/AddLitterPage.js
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import LitterForm from "./LitterForm";   // <-- must point to the new LitterForm
import "../../styles/AddLitterPage.css";
import DogContext from "../../context/DogContext";
import { apiPost } from '../../utils/apiUtils';

const AddLitterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { dogs, breeds, addLitter, refreshData } = useContext(DogContext);

  const sireOptions = dogs.filter((d) => d.gender === "Male");
  const damOptions = dogs.filter((d) => d.gender === "Female");

  const handleSave = async (litterData) => {
    try {
      setLoading(true);
      
      // Check if litterData is FormData (for file uploads) or regular JSON
      const isFormData = litterData instanceof FormData;
      
      // Set the appropriate headers and body based on data type
      const options = {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? litterData : JSON.stringify(litterData)
      };
      
      const response = await fetch(`${API_URL}/litters/`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create litter');
      }
      
      const newLitter = await response.json();
      addLitter(newLitter);
      refreshData();
      navigate('/dashboard/litters');
    } catch (error) {
      console.error('Error saving litter:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-litter-container">
      <h2>Add a New Litter</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
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
