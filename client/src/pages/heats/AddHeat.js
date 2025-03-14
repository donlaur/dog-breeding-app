import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert, 
  Container, 
  Breadcrumbs,
  Paper
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
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (heat) => {
    debugLog("Saving new heat:", heat);
    try {
      setLoading(true);
      
      // Remove any non-schema fields that might cause database errors
      const heatData = { ...heat };
      delete heatData.dog_name;
      delete heatData.dog_info;
      
      const response = await apiPost('heats', heatData);
      
      if (response.success) {
        showSuccess("Heat cycle added successfully!");
        
        // Navigate back to heat management
        setTimeout(() => {
          navigate('/dashboard/heats');
        }, 1500);
      } else {
        throw new Error(response.error || 'Failed to add heat cycle');
      }
      
    } catch (error) {
      debugError("Error adding heat cycle:", error);
      showError(`Failed to add heat cycle: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link to="/dashboard/heats" style={{ textDecoration: 'none', color: 'inherit' }}>
            Back to Heats
          </Link>
          <Typography color="text.primary">Add Heat Record</Typography>
        </Breadcrumbs>
      </Box>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Add New Heat Record
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form Container */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <HeatForm onSave={handleSave} loading={loading} />
      </Paper>
    </Container>
  );
};

AddHeat.propTypes = {
  // No props required for this component
};

export default AddHeat;