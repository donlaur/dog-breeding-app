import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import HeatForm from '../../components/heats/HeatForm';
import { debugLog, debugError } from "../../config";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { showSuccess, showError } from '../../utils/notifications';
import { apiPost } from '../../utils/apiUtils';
import PropTypes from 'prop-types';

const AddHeat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle form submission
  const handleSubmit = async (heat) => {
    debugLog("Saving new heat:", heat);
    try {
      setLoading(true);
      setError(null);
      
      // Remove any non-schema fields that might cause database errors
      const heatData = { ...heat };
      delete heatData.dog_name;
      delete heatData.dog_info;
      
      const response = await apiPost('/heats/', heatData);
      
      debugLog("Heat creation response:", response);
      
      showSuccess("Heat cycle added successfully!");
      
      // Navigate back to heat management
      navigate('/dashboard/heats');
    } catch (error) {
      debugError("Error adding heat cycle:", error);
      setError(`Failed to add heat cycle: ${error.message}`);
      showError(`Failed to add heat cycle: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            component={Link}
            to="/dashboard/heats"
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5">Add New Heat Cycle</Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <HeatForm 
          onSubmit={handleSubmit} 
          isSubmitting={loading}
          submitButtonText={loading ? "Saving..." : "Save Heat Cycle"}
          submitButtonIcon={loading ? <CircularProgress size={20} /> : <NavigateNextIcon />}
        />
      </Paper>
    </Container>
  );
};

AddHeat.propTypes = {
  onSuccess: PropTypes.func
};

export default AddHeat;
