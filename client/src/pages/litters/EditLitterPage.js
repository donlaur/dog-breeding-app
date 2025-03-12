// src/pages/litters/EditLitterPage.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import {
  Container,
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  CircularProgress,
  Alert
} from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LitterForm from "./LitterForm";
import DogContext from "../../context/DogContext";
import { apiGet, apiPut } from '../../utils/apiUtils';

const EditLitterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dogs, breeds: contextBreeds, refreshBreeds } = useContext(DogContext);
  
  // Create a local breeds array that defaults to an empty array if contextBreeds is undefined
  const [breeds, setBreeds] = useState([]);
  const [litter, setLitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isNewLitter = !id || id === 'new';

  console.log("EditLitterPage: ID from params:", id);
  console.log("EditLitterPage: isNewLitter:", isNewLitter);
  console.log("EditLitterPage: Context breeds:", contextBreeds);
  
  // Update local breeds when contextBreeds changes
  useEffect(() => {
    if (contextBreeds) {
      // Use the context breeds as the source of truth
      setBreeds(contextBreeds);
    } else {
      // If contextBreeds is undefined, try to fetch them
      if (refreshBreeds) {
        console.log("Attempting to refresh breeds...");
        refreshBreeds();
      }
    }
  }, [contextBreeds, refreshBreeds]);

  // Handle breed information from litter data separately to avoid loops
  useEffect(() => {
    if (!litter) return;
    
    // If we have breed_info from the API and it's not in our breeds array
    if (litter.breed_info && breeds.length > 0 && !breeds.some(b => b.id === litter.breed_info.id)) {
      console.log("Adding breed_info from API response to breeds array:", litter.breed_info);
      // Add the breed info to our breeds array
      setBreeds(prevBreeds => [
        ...prevBreeds,
        { 
          id: litter.breed_info.id, 
          name: litter.breed_info.name 
        }
      ]);
    }
  }, [litter, breeds]);
  
  // Filter dogs by gender for sire and dam options
  const sireOptions = dogs.filter((d) => d.gender === "Male");
  const damOptions = dogs.filter((d) => d.gender === "Female");
  
  // Debug logging
  console.log("Available breeds:", breeds);
  console.log("Available sires:", sireOptions);
  console.log("Available dams:", damOptions);

  const fetchLitterData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching litter data for ID: ${id}`);
      const response = await apiGet(`litters/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch litter: ${response.error}`);
      }
      
      const data = response.data;
      console.log("Received litter data:", data);
      
      // Ensure breed_id is properly formatted (as a number or null)
      if (data.breed_id) {
        data.breed_id = Number(data.breed_id);
      } else {
        data.breed_id = null;
      }
      
      // Convert other ID fields to numbers
      if (data.dam_id) data.dam_id = Number(data.dam_id);
      if (data.sire_id) data.sire_id = Number(data.sire_id);
      
      // If we have breed_info from the API and breeds array is empty, try to refresh breeds
      if (data.breed_info && (!breeds || breeds.length === 0) && refreshBreeds) {
        console.log("Refreshing breeds from API because we have breed_info");
        refreshBreeds();
      }
      
      setLitter(data);
    } catch (error) {
      console.error("Error in fetchLitterData:", error);
      setError(error.message || "Failed to load litter data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNewLitter) {
      fetchLitterData();
    } else {
      // Initialize with empty litter for new litter creation
      setLitter({
        litter_name: "",
        breed_id: null,
        dam_id: null,
        sire_id: null,
        whelp_date: null,
        expected_date: null,
        status: "Planned",
        num_puppies: 0
      });
      setLoading(false);
    }
  }, [id, isNewLitter]);

  const handleSave = async (updatedLitter) => {
    try {
      console.log("EditLitterPage - Saving litter with data:", updatedLitter);
      
      // Clean up the data before sending to API
      const dataToSend = { ...updatedLitter };
      
      // Remove any fields that don't exist in the database schema
      delete dataToSend.dam_name;
      delete dataToSend.sire_name;
      delete dataToSend.breed_name;
      delete dataToSend.dam_info;
      delete dataToSend.sire_info;
      delete dataToSend.breed_info;
      
      // Ensure ID fields are properly formatted
      ['breed_id', 'dam_id', 'sire_id'].forEach(field => {
        if (dataToSend[field] === '') {
          dataToSend[field] = null;
        } else if (dataToSend[field] !== null) {
          dataToSend[field] = Number(dataToSend[field]);
        }
      });
      
      // Ensure number fields are properly formatted
      ['puppy_count', 'price', 'deposit'].forEach(field => {
        if (dataToSend[field] !== '' && dataToSend[field] !== null && dataToSend[field] !== undefined) {
          dataToSend[field] = Number(dataToSend[field]);
        }
      });
      
      console.log("EditLitterPage - Sending cleaned data to API:", dataToSend);
      
      // Send the request with improved error handling
      const response = await apiPut(`litters/${id}`, dataToSend);
      if (!response.ok) {
        const errorMessage = response.error || `HTTP error! status: ${response.status}`;
        console.error("API response error:", response);
        throw new Error(errorMessage);
      }
      
      const data = response.data;
      debugLog("Updated litter:", data);
      navigate(`/dashboard/litters/${id}`);
    } catch (error) {
      debugError("Error updating litter:", error);
      setError(error.message || "An unknown error occurred while updating the litter");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!litter) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Could not load litter details.</Alert>
      </Box>
    );
  }

  // Debug the litter data being passed to the form
  console.log("Litter data being passed to form:", litter);
  console.log("Breed ID type:", typeof litter.breed_id, "Value:", litter.breed_id);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link 
            to="/dashboard/litters"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Litters
          </Link>
          <Typography color="text.primary">Edit Litter</Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" sx={{ mt: 2, mb: 4 }}>
          Edit Litter: {litter.litter_name || `Litter #${id}`}
        </Typography>

        <Paper sx={{ p: 3 }}>
          <LitterForm
            onSave={handleSave}
            initialData={litter}
            breedOptions={breeds || []}
            sireOptions={sireOptions}
            damOptions={damOptions}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default EditLitterPage;
