import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import LitterForm from './LitterForm';
import { API_URL, debugLog, debugError } from '../../config';
import { apiGet, apiPost } from '../../utils/apiUtils';
import { useDog } from '../../context/DogContext';
import { showSuccess, showError, showWarning } from '../../utils/notifications';

const AddLitter = () => {
  const navigate = useNavigate();
  const { refreshLitters } = useDog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [breeds, setBreeds] = useState([]);
  const [sires, setSires] = useState([]);
  const [dams, setDams] = useState([]);

  // Fetch breeds for dropdown
  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        setLoading(true);
        const response = await apiGet('breeds');
        
        if (response.ok) {
          debugLog("Fetched breeds:", response.data);
          
          if (Array.isArray(response.data) && response.data.length > 0) {
            setBreeds(response.data);
          } else {
            debugLog("No breeds found or invalid data format");
            setError("No breeds found. Please add breeds first.");
            showWarning("No breeds found. Please add breeds first.");
          }
        } else {
          throw new Error(response.error || "Failed to fetch breeds");
        }
      } catch (error) {
        debugError("Error fetching breeds:", error);
        setError("Failed to load breeds. Please try again later.");
        showError("Failed to load breeds. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBreeds();
  }, []);

  // Fetch dogs for sire/dam dropdowns
  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const response = await apiGet('dogs');
        
        if (response.ok) {
          // Filter for male and female dogs
          const males = response.data.filter(dog => dog.gender === 'Male');
          const females = response.data.filter(dog => dog.gender === 'Female');
          
          setSires(males);
          setDams(females);
        } else {
          throw new Error(response.error || "Failed to fetch dogs");
        }
      } catch (error) {
        debugError("Error fetching dogs:", error);
        setError("Failed to load dogs. Please try again later.");
        showError("Failed to load dogs. Please try again later.");
      }
    };

    fetchDogs();
  }, []);

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      debugLog("Submitting litter data:", formData);
      
      // Since we're using FormData which already has the right format for file uploads,
      // we need to use a special version of the call that passes FormData directly
      const response = await apiPost('litters', formData, true);
      
      if (response.ok) {
        debugLog("Litter created successfully:", response.data);
        
        setSuccess(true);
        showSuccess("Litter created successfully!");
        
        // Refresh litters data
        await refreshLitters();
        
        // Navigate back to litters page after a short delay
        setTimeout(() => {
          navigate('/dashboard/litters');
        }, 1500);
      } else {
        throw new Error(response.error || "Failed to create litter");
      }
    } catch (error) {
      debugError("Error creating litter:", error);
      setError(`Failed to create litter: ${error.message}`);
      showError(`Failed to create litter: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/litters')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Add a New Litter
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Litter created successfully!
          </Alert>
        )}
        
        <Paper sx={{ p: 3 }}>
          {loading && !success ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !success ? (
            <LitterForm 
              onSave={handleSave} 
              breedOptions={breeds}
              sireOptions={sires}
              damOptions={dams}
            />
          ) : null}
        </Paper>
      </Box>
    </Container>
  );
};

export default AddLitter; 