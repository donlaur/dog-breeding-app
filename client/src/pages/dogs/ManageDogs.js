// src/pages/dogs/ManageDogs.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, debugLog, debugError } from "../../config";
import { apiGet, apiDelete } from "../../utils/apiUtils";
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
  Avatar,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  Female as FemaleIcon,
  Male as MaleIcon
} from '@mui/icons-material';
import { useDog } from '../../context/DogContext';
import DogCard from '../../components/DogCard';
import '../../styles/ManageDogs.css';
import { getPhotoUrl } from '../../utils/photoUtils';
import { showSuccess, showError } from '../../utils/notifications';

const BREED_NAME = "Pembroke Welsh Corgi";

// Helper function to get the dog's display name
const getDogDisplayName = (dog) => {
  if (!dog) return 'Unknown Dog';
  
  // Try different possible name fields
  for (const prop of Object.keys(dog)) {
    if (
      prop.toLowerCase().includes('name') || 
      prop.toLowerCase() === 'title' ||
      prop.toLowerCase() === 'label'
    ) {
      return dog[prop] || `Dog #${dog.id}`;
    }
  }
  
  // If no name property found, use ID
  return `Dog #${dog.id}`;
};

const ManageDogs = () => {
  const { dogs, loading, error, refreshDogs } = useDog();
  const [filter, setFilter] = useState('all'); // 'all', 'male', 'female'
  const [sortedDogs, setSortedDogs] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dogsLoading, setDogsLoading] = useState(false);
  const hasAttemptedLoad = useRef(false);

  // Load dogs on component mount - only once
  useEffect(() => {
    // Only refresh dogs once when the component mounts if no data and we haven't tried loading yet
    if (dogs.length === 0 && !loading && !hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true;
      debugLog('ManageDogs: Initial data load');
      refreshDogs(false, { includeLitters: false }); // Explicitly don't include litters
    }
  }, [dogs.length, loading, refreshDogs]); // Only depends on these values

  // Apply filtering and sorting whenever dogs or filter changes
  useEffect(() => {
    if (!dogs || dogs.length === 0) return;
    
    // First filter by gender
    let filteredDogs = [...dogs];
    if (filter === 'male') {
      filteredDogs = filteredDogs.filter(dog => dog.gender === 'Male');
    } else if (filter === 'female') {
      filteredDogs = filteredDogs.filter(dog => dog.gender === 'Female');
    }
    
    // Then sort alphabetically by call_name
    filteredDogs.sort((a, b) => {
      const nameA = (a.call_name || '').toLowerCase();
      const nameB = (b.call_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    setSortedDogs(filteredDogs);
  }, [dogs, filter]);

  const handleDelete = async (dogId, dogName) => {
    try {
      setDeleteLoading(true);
      
      const response = await apiDelete(`dogs/${dogId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      showSuccess(`Successfully deleted dog "${dogName || 'Unknown'}"`);
      refreshDogs();
      
    } catch (error) {
      debugError("Error deleting dog:", error);
      showError(`Failed to delete dog: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Update the handleRefresh function to prevent rapid clicks
  const handleRefresh = () => {
    // Only allow refresh if not already loading
    if (!loading) {
      refreshDogs();
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
            <Button color="inherit" size="small" onClick={handleRefresh}>
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
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Manage Dogs
          </Typography>
          <Box>
            <Button
              variant="outlined"
              sx={{ mr: 2 }}
              onClick={handleRefresh}
              disabled={loading} // Use the specific loading state
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/dashboard/dogs/add"
              startIcon={<AddIcon />}
            >
              Add Dog
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? ( // Use the specific loading state
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : dogs.length > 0 ? (
          <Grid container spacing={3}>
            {sortedDogs.length > 0 ? (
              sortedDogs.map(dog => (
                <Grid item xs={12} sm={6} md={4} key={dog.id}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Link 
                      to={`/dashboard/dogs/${dog.id}`} 
                      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}
                    >
                      <Box 
                        sx={{ 
                          height: 250, 
                          overflow: 'hidden',
                          borderRadius: 1,
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          bgcolor: '#f5f5f5'
                        }}
                      >
                        {dog.cover_photo ? (
                          <img 
                            src={getPhotoUrl(dog.cover_photo)} 
                            alt={dog.call_name} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover' 
                            }} 
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              height: '100%',
                              width: '100%'
                            }}
                          >
                            <Typography 
                              variant="h1" 
                              component="div" 
                              sx={{ color: '#bdbdbd' }}
                            >
                              🐕
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {getDogDisplayName(dog)}
                      </Typography>
                      
                      <Typography variant="body2" align="center" sx={{ flexGrow: 1 }}>
                        {dog.registered_name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="body2">{dog.gender}</Typography>
                        <Typography 
                          variant="body2"
                          sx={{
                            bgcolor: dog.status === 'Active' ? '#e8f5e9' : '#ffebee',
                            color: dog.status === 'Active' ? '#2e7d32' : '#c62828',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                          }}
                        >
                          {dog.status}
                        </Typography>
                      </Box>
                    </Link>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                <Typography>
                  No dogs found. Add your first dog to get started!
                </Typography>
              </Box>
            )}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error">Error: {error}</Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ManageDogs;