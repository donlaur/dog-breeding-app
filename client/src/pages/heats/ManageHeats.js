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

const ManageHeats = () => {
  const [heats, setHeats] = useState([]);
  const [dogs, setDogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dogs for name lookup
  const loadDogs = async () => {
    try {
      const response = await fetch(`${API_URL}/dogs`);
      if (!response.ok) throw new Error('Failed to fetch dogs');
      const dogsData = await response.json();
      
      // Create lookup object with id as key
      const dogsLookup = {};
      dogsData.forEach(dog => {
        dogsLookup[dog.id] = dog;
      });
      setDogs(dogsLookup);
      return dogsLookup;  // Return the lookup for immediate use
    } catch (err) {
      debugError("Error fetching dogs:", err);
      setError("Failed to load dogs data");
      return null;
    }
  };

  const loadHeats = async (dogsLookup) => {
    debugLog("Fetching heats...");
    try {
      const response = await fetch(`${API_URL}/heats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Process heats with the dogs lookup we already have
      const heatsWithNames = data.map(heat => ({
        ...heat,
        dogName: dogsLookup[heat.dog_id]?.call_name || "Unknown Dog",
        sireName: dogsLookup[heat.sire_id]?.call_name || "Unknown Dog"
      }));
      
      debugLog("Final processed heats:", heatsWithNames);
      setHeats(heatsWithNames);
    } catch (err) {
      debugError("Error fetching heats:", err);
      setError("Unable to connect to server. Please try again later.");
    }
  };

  // Load both dogs and heats when component mounts
  useEffect(() => {
    const loadData = async () => {
      const dogsLookup = await loadDogs();
      if (dogsLookup) {
        await loadHeats(dogsLookup);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDelete = (heatId) => {
    if (!window.confirm("Are you sure you want to delete this heat record?")) {
      return;
    }

    debugLog("Deleting heat:", heatId);
    fetch(`${API_URL}/heats/${heatId}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        loadHeats(dogs); // Reload the list after deletion
      })
      .catch((err) => {
        debugError("Error deleting heat:", err);
        setError("Failed to delete heat. Please try again.");
      });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusClass = (heat) => {
    const today = new Date();
    const startDate = new Date(heat.start_date);
    const endDate = heat.end_date ? new Date(heat.end_date) : null;
    
    if (endDate && today > endDate) return "completed";
    if (today >= startDate && (!endDate || today <= endDate)) return "active";
    if (today < startDate) return "upcoming";
    return "";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'upcoming': return 'warning';
      default: return 'default';
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
    <Box sx={{ p: 2, pb: { xs: 10, sm: 2 } }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        position: 'sticky',
        top: 0,
        bgcolor: 'background.paper',
        zIndex: 1,
        py: 2
      }}>
        <Typography variant="h5" component="h2">
          Heats
        </Typography>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Button
            component={Link}
            to="/dashboard/heats/add"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Heat
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {heats.map((heat) => (
          <Grid item xs={12} sm={6} md={4} key={heat.id}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                boxShadow: 3
              }
            }}>
              <CardContent>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mb: 2
                }}>
                  <Chip
                    label={getStatusClass(heat)}
                    color={getStatusColor(getStatusClass(heat))}
                    size="small"
                  />
                </Box>

                <Typography variant="h5" component="h3" gutterBottom>
                  {heat.dogName}
                  {heat.mating_date && heat.sireName && (
                    <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                      & {heat.sireName}
                    </Typography>
                  )}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Start:
                    </Typography>
                    <Typography>
                      {formatDate(heat.start_date)}
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      End:
                    </Typography>
                    <Typography>
                      {formatDate(heat.end_date)}
                    </Typography>
                  </Box>
                  {heat.mating_date && (
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: 1,
                      borderColor: 'divider'
                    }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Mating:
                      </Typography>
                      <Typography>
                        {formatDate(heat.mating_date)}
                      </Typography>
                    </Box>
                  )}
                  {heat.expected_whelp_date && (
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: 1,
                      borderColor: 'divider'
                    }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Expected Whelp:
                      </Typography>
                      <Typography>
                        {formatDate(heat.expected_whelp_date)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {heat.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {heat.notes}
                  </Typography>
                )}

                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  mt: 'auto'
                }}>
                  <Button
                    component={Link}
                    to={`/dashboard/heats/edit/${heat.id}`}
                    variant="contained"
                    startIcon={<EditIcon />}
                    fullWidth
                  >
                    EDIT
                  </Button>
                  <Button
                    onClick={() => handleDelete(heat.id)}
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    fullWidth
                  >
                    DELETE
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Mobile FAB */}
      <Box sx={{
        display: { xs: 'block', sm: 'none' },
        position: 'fixed',
        bottom: 16,
        right: 16
      }}>
        <Fab
          component={Link}
          to="/dashboard/heats/add"
          color="primary"
          aria-label="add heat"
        >
          <AddIcon />
        </Fab>
      </Box>
    </Box>
  );
};

export default ManageHeats; 