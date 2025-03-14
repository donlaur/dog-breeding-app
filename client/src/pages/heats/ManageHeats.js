import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, debugLog, debugError } from "../../config";
import { 
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Fab,
  Container,
  Paper,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon
} from '@mui/icons-material';
import HeatList from '../../components/heats/HeatList';
import HeatCalendar from '../../components/heats/HeatCalendar';
import { apiGet, apiDelete } from '../../utils/apiUtils';
import { showSuccess, showError } from '../../utils/notifications';

const ManageHeats = () => {
  const [view, setView] = useState('list'); // 'list' or 'calendar'
  const [heats, setHeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load heats when component mounts
  useEffect(() => {
    const loadHeats = async () => {
      try {
        const response = await apiGet('heats');
        if (response.ok) {
          setHeats(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch heats');
        }
      } catch (err) {
        debugError("Error fetching heats:", err);
        setError("Failed to load heats data");
      } finally {
        setLoading(false);
      }
    };

    loadHeats();
  }, []);

  const fetchFilteredHeats = async (filters) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await apiGet(`heats?${queryParams}`);
      if (response.ok) {
        setHeats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch heats');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHeat = async (heatId, dogName) => {
    try {
      const response = await apiDelete(`heats/${heatId}`);
      
      if (response.ok) {
        showSuccess(`Successfully deleted heat cycle for ${dogName}`);
        refreshHeats(); // Refresh the heats list
      } else {
        throw new Error(response.error || 'Failed to delete heat cycle');
      }
    } catch (error) {
      debugError("Error deleting heat cycle:", error);
      showError(`Failed to delete heat cycle: ${error.message}`);
    }
  };

  // Add this function to refresh the heats data
  const refreshHeats = async () => {
    try {
      setLoading(true);
      const response = await apiGet('heats');
      if (response.ok) {
        setHeats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch heats');
      }
      setLoading(false);
    } catch (err) {
      debugError("Error refreshing heats:", err);
      setError(err.message || "Failed to refresh heats data");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Empty state
  if (heats.length === 0) {
    return (
      <Container maxWidth="sm">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mt: 4, 
            textAlign: 'center',
            backgroundColor: 'transparent'
          }}
        >
          <PetsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Heat Records Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start tracking your dog's heat cycles to better manage breeding schedules.
          </Typography>
          <Button
            component={Link}
            to="/dashboard/heats/add"
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
          >
            Add First Heat Record
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Heats</h1>
        <div className="flex items-center gap-4">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setView('list')}
              className={`inline-flex items-center px-4 py-2 rounded-l-lg border ${
                view === 'list'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`inline-flex items-center px-4 py-2 rounded-r-lg border-t border-r border-b -ml-px ${
                view === 'calendar'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Calendar View
            </button>
          </div>
          <Link
            to="/dashboard/heats/add"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Heat
          </Link>
        </div>
      </div>

      {/* Render either list or calendar based on view state */}
      {view === 'list' ? (
        <HeatList heats={heats} setHeats={setHeats} />
      ) : (
        <HeatCalendar heats={heats} />
      )}
    </div>
  );
};

export default ManageHeats; 