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

  const handleUpdate = async (updatedHeat) => {
    try {
      const response = await fetch(`${API_URL}/heats/${heatId}`, {
        method: 'PUT', // Use PUT instead of POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHeat),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      navigate('/dashboard/heats');
    } catch (error) {
      debugError("Error updating heat:", error);
      setError("Failed to update heat");
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
          onSave={handleUpdate} 
          isEdit={true} // Add this prop to indicate edit mode
        />
      </Paper>
    </Container>
  );
};

export default EditHeat; 