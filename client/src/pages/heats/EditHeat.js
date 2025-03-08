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
import { API_URL, debugLog, debugError } from "../../config";
import { showSuccess, showError } from '../../utils/notifications';

const EditHeat = () => {
  const { heatId } = useParams();
  const navigate = useNavigate();
  const [heat, setHeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeat = async () => {
      try {
        const response = await fetch(`${API_URL}/heats/${heatId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setHeat(data);
      } catch (error) {
        debugError("Error fetching heat:", error);
        setError("Failed to load heat data");
      } finally {
        setLoading(false);
      }
    };
    fetchHeat();
  }, [heatId]);

  const handleUpdateHeat = async (heatData) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/heats/${heatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heatData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      showSuccess("Heat cycle updated successfully!");
      
      // Navigate back to heat management after a short delay
      setTimeout(() => {
        navigate('/dashboard/heats');
      }, 1500);
      
    } catch (error) {
      console.error("Error updating heat cycle:", error);
      showError(`Failed to update heat cycle: ${error.message}`);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

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
          isEdit={true} // Add this prop to indicate edit mode
        />
      </Paper>
    </Container>
  );
};

export default EditHeat; 