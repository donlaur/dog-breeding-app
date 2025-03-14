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
import { API_URL, debugLog, debugError } from "../../config";
import { apiPost } from '../../utils/apiUtils';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { showSuccess, showError } from '../../utils/notifications';

const AddHeat = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (heat) => {
    debugLog("Saving new heat:", heat);
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiPost('heats', heat);
      
      if (response.ok) {
        showSuccess("Heat cycle added successfully!");
        navigate('/dashboard/heats');
      } else {
        throw new Error(response.error || "Failed to add heat cycle");
      }
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
        <HeatForm onSave={handleSave} />
      </Paper>
    </Container>
  );
};

export default AddHeat; 