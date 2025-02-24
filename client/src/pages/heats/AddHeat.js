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
import HeatForm from '../../components/HeatForm';
import { API_URL, debugLog, debugError } from "../../config";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const AddHeat = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSave = async (heat) => {
    debugLog("Saving new heat:", heat);
    try {
      const response = await fetch(`${API_URL}/heats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heat),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      debugLog("Heat saved successfully:", data);
      navigate('/dashboard/heats');
    } catch (error) {
      debugError("Error saving heat:", error);
      setError("Failed to save heat. Please try again.");
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