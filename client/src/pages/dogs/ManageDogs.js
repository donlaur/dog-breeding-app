// src/pages/dogs/ManageDogs.js
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
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  Female as FemaleIcon,
  Male as MaleIcon
} from '@mui/icons-material';

const BREED_NAME = "Pembroke Welsh Corgi";

const ManageDogs = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDogs();
  }, []);

  const loadDogs = async () => {
    debugLog("Fetching dogs...");
    try {
      const response = await fetch(`${API_URL}/dogs`);
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }
        setDogs([]);
        return;
      }
      const data = await response.json();
      debugLog("Dogs received:", data);
      setDogs(data);
    } catch (err) {
      debugError("Error fetching dogs:", err);
      setError("Unable to connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dogId) => {
    if (!window.confirm("Are you sure you want to delete this dog?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dogs/${dogId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      loadDogs();
    } catch (err) {
      debugError("Error deleting dog:", err);
      setError("Failed to delete dog. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={loadDogs}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  // Empty state
  if (dogs.length === 0) {
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
            Add Your First Dog
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your breeding dogs to track their information, health records, and breeding history.
          </Typography>
          <Button
            component={Link}
            to="/dashboard/dogs/add"
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
          >
            Add Dog
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Dogs</h1>
        <Link 
          to="/dashboard/dogs/add" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New Dog
        </Link>
      </div>

      <Grid container spacing={2}>
        {dogs.map((dog) => (
          <Grid item xs={12} sm={6} md={4} key={dog.id}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                boxShadow: 3
              }
            }}>
              <Box 
                sx={{
                  pt: '75%', // 4:3 aspect ratio
                  position: 'relative'
                }}
              >
                {dog.cover_photo ? (
                  <Box
                    component="img"
                    src={dog.cover_photo}
                    alt={dog.call_name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200'
                    }}
                  >
                    <PetsIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Box>
                )}
              </Box>

              <CardContent>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" component="h3">
                      {dog.call_name}
                    </Typography>
                    {dog.gender === 'Female' ? (
                      <FemaleIcon sx={{ color: 'pink' }} />
                    ) : (
                      <MaleIcon sx={{ color: 'blue' }} />
                    )}
                  </Box>
                  <Chip 
                    label={dog.status || (dog.is_active ? "Active" : "Inactive")}
                    color={dog.is_active ? "success" : "default"}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {dog.registered_name}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography color="text.secondary" variant="body2">
                      Breed:
                    </Typography>
                    <Typography variant="body2">
                      {BREED_NAME}
                    </Typography>
                  </Box>
                  {dog.date_of_birth && (
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: 1,
                      borderColor: 'divider'
                    }}>
                      <Typography color="text.secondary" variant="body2">
                        Date of Birth:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(dog.date_of_birth).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  mt: 'auto'
                }}>
                  <Button
                    component={Link}
                    to={`/dashboard/dogs/edit/${dog.id}`}
                    variant="contained"
                    startIcon={<EditIcon />}
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(dog.id)}
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    fullWidth
                  >
                    Delete
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
          to="/dashboard/dogs/add"
          color="primary"
          aria-label="add dog"
        >
          <AddIcon />
        </Fab>
      </Box>
    </div>
  );
};

export default ManageDogs;