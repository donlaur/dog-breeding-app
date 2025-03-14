import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HeatForm from '../../components/heats/HeatForm';
import { debugLog, debugError } from "../../config";
import { showSuccess, showError } from '../../utils/notifications';
import { apiGet, apiPut } from '../../utils/apiUtils';
import PropTypes from 'prop-types';

const EditHeat = () => {
  const { heatId } = useParams();
  const navigate = useNavigate();
  const [heat, setHeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Load heat data on mount
  useEffect(() => {
    const fetchHeat = async () => {
      try {
        debugLog(`Fetching heat with id ${heatId}`);
        const response = await apiGet(`/heats/${heatId}`);
        debugLog('Heat data fetched:', response);
        setHeat(response);
      } catch (error) {
        debugError("Error fetching heat:", error);
        setError(`Failed to load heat data: ${error.message}`);
        showError(`Failed to load heat data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (heatId) {
      fetchHeat();
    }
  }, [heatId]);
  
  // Handle form submission
  const handleSubmit = async (heatData) => {
    debugLog("Saving updated heat:", heatData);
    try {
      setSaving(true);
      setError(null);
      
      // Remove any non-schema fields that might cause database errors
      const sanitizedData = { ...heatData };
      delete sanitizedData.dog_name;
      delete sanitizedData.dog_info;
      
      const response = await apiPut(`/heats/${heatId}`, sanitizedData);
      
      debugLog("Heat update response:", response);
      
      showSuccess("Heat cycle updated successfully!");
      
      // Navigate back to heat management
      navigate('/dashboard/heats');
    } catch (error) {
      debugError("Error updating heat cycle:", error);
      setError(`Failed to update heat cycle: ${error.message}`);
      showError(`Failed to update heat cycle: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading heat cycle data...
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  // Show error state if heat not found
  if (!heat && !loading) {
    return (
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Heat cycle not found or could not be loaded
          </Alert>
          <Button
            component={Link}
            to="/dashboard/heats"
            variant="contained"
          >
            Back to Heat Cycles
          </Button>
        </Paper>
      </Container>
    );
  }
  
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
          <Typography variant="h5">Edit Heat Cycle</Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <HeatForm 
          initialData={heat}
          onSubmit={handleSubmit} 
          isSubmitting={saving}
          submitButtonText={saving ? "Saving..." : "Update Heat Cycle"}
          submitButtonIcon={saving ? <CircularProgress size={20} /> : <NavigateNextIcon />}
        />
      </Paper>
    </Container>
  );
};

EditHeat.propTypes = {
  onSuccess: PropTypes.func
};

export default EditHeat;
