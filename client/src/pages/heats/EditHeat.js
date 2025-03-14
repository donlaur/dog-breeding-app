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
import { apiGet, apiPut } from '../../utils/apiUtils';
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
        const response = await apiGet(`heats/${heatId}`);
        if (response.ok) {
          setHeat(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch heat data");
        }
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
      
      const response = await apiPut(`heats/${heatId}`, heatData);
      
      if (response.ok) {
        showSuccess("Heat cycle updated successfully!");
        navigate('/dashboard/heats');
      } else {
        throw new Error(response.error || "Failed to update heat cycle");
      }
    } catch (error) {
      debugError("Error updating heat:", error);
      setError(`Failed to update heat cycle: ${error.message}`);
      showError(`Failed to update heat cycle: ${error.message}`);
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