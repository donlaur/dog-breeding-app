// src/pages/litters/AddLitterPage.js
import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import LitterForm from "./LitterForm";   // <-- must point to the new LitterForm
import "../../styles/AddLitterPage.css";
import DogContext from "../../context/DogContext";
import { useNotifications } from "../../context/NotificationContext";
import { apiPost } from '../../utils/apiUtils';

const AddLitterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { dogs, breeds, addLitter, refreshData, refreshDogs, dogsLoading } = useContext(DogContext);
  const { notifyLitterAdded } = useNotifications();
  const [dogsLoaded, setDogsLoaded] = useState(false);

  // Ensure dogs are loaded
  useEffect(() => {
    if (!dogs || dogs.length === 0) {
      debugLog("No dogs found in context, refreshing dogs data...");
      if (refreshDogs) {
        refreshDogs(true);
      }
    } else {
      debugLog("Dogs data available:", dogs.length, "dogs");
      setDogsLoaded(true);
    }
  }, [dogs, refreshDogs]);

  // Filter and sort dogs only when they're loaded
  const sireOptions = dogsLoaded ? dogs
    .filter((d) => d.gender === "Male")
    .sort((a, b) => {
      const nameA = (a.call_name || a.name || '').toLowerCase();
      const nameB = (b.call_name || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }) : [];
    
  const damOptions = dogsLoaded ? dogs
    .filter((d) => d.gender === "Female")
    .sort((a, b) => {
      const nameA = (a.call_name || a.name || '').toLowerCase();
      const nameB = (b.call_name || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }) : [];

  const handleSave = async (litterData) => {
    try {
      setLoading(true);
      
      const response = await apiPost('litters', litterData);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create litter');
      }
      
      const newLitter = response.data;
      addLitter(newLitter);
      
      // Get dam and sire info for notification
      const dam = dogs.find(dog => dog.id === parseInt(newLitter.dam_id));
      const sire = dogs.find(dog => dog.id === parseInt(newLitter.sire_id));
      
      // Trigger notification
      if (dam) {
        notifyLitterAdded(newLitter.id, dam.call_name, newLitter.sire_id, sire);
      }
      
      refreshData();
      // Pass a state parameter to indicate that we're coming from adding a litter
      navigate('/dashboard/litters', { state: { refreshNeeded: true, newLitterId: newLitter.id } });
    } catch (error) {
      debugError('Error saving litter:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-litter-container">
      <h2>Add a New Litter</h2>
      
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      
      {dogsLoading || !dogsLoaded ? (
        <div className="loading-container">
          <p>Loading dogs data...</p>
        </div>
      ) : (
        <LitterForm
          onSave={handleSave}
          breedOptions={breeds || []}
          sireOptions={sireOptions}
          damOptions={damOptions}
        />
      )}
    </div>
  );
};

export default AddLitterPage;
