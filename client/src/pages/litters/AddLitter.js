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
        const response = await fetch(`${API_URL}/breeds`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        debugLog("Fetched breeds:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          setBreeds(data);
        } else {
          debugLog("No breeds found or invalid data format");
          setError("No breeds found. Please add breeds first.");
          showWarning("No breeds found. Please add breeds first.");
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
        const response = await fetch(`${API_URL}/dogs`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Filter for male and female dogs
        const males = data.filter(dog => dog.gender === 'Male');
        const females = data.filter(dog => dog.gender === 'Female');
        
        setSires(males);
        setDams(females);
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
      
      const response = await fetch(`${API_URL}/litters`, {
        method: 'POST',
        body: formData, // FormData handles the Content-Type header automatically
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      debugLog("Litter created successfully:", result);
      
      setSuccess(true);
      showSuccess("Litter created successfully!");
      refreshLitters(); // Refresh the litters list in context
      
      // Navigate back to litters page after a short delay
      setTimeout(() => {
        navigate('/dashboard/litters');
      }, 1500);
      
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