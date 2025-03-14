import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress, 
  Container,
  Breadcrumbs,
  Paper
} from '@mui/material';
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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeat = async () => {
      try {
        const response = await apiGet(`heats/${heatId}`);
        if (response.success) {
          setHeat(response.data);
        } else {
          throw new Error(response.error || 'Failed to load heat data');
        }
      } catch (error) {
        debugError("Error fetching heat:", error);
        setError("Failed to load heat data");
        showError("Could not load heat record");
      } finally {
        setLoading(false);
      }
    };
    fetchHeat();
  }, [heatId]);

  const handleUpdateHeat = async (heatData) => {
    try {
      setLoading(true);
      
      // Remove any non-schema fields that might cause database errors
      const sanitizedData = { ...heatData };
      delete sanitizedData.dog_name;
      delete sanitizedData.dog_info;
      
      const response = await apiPut(`heats/${heatId}`, sanitizedData);
      
      if (response.success) {
        showSuccess("Heat cycle updated successfully!");
        
        // Navigate back to heat management after a short delay
        setTimeout(() => {
          navigate('/dashboard/heats');
        }, 1500);
      } else {
        throw new Error(response.error || 'Failed to update heat cycle');
      }
      
    } catch (error) {
      debugError("Error updating heat cycle:", error);
      showError(`Failed to update heat cycle: ${error.message}`);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Container maxWidth="md">
      <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
    </Container>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link to="/dashboard/heats" style={{ textDecoration: 'none', color: 'inherit' }}>
            Back to Heats
          </Link>
          <Typography color="text.primary">Edit Heat Record</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Edit Heat Record
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <HeatForm 
          initialData={heat} 
          onSave={handleUpdateHeat} 
          isEdit={true}
          loading={loading}
        />
      </Paper>
    </Container>
  );
};

EditHeat.propTypes = {
  // No props required for this component
};

export default EditHeat;