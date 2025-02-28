// src/pages/litters/ManageLitters.js
import React, { useEffect, useRef } from 'react';
import { useDog } from '../../context/DogContext';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardMedia,
  Grid, 
  Paper, 
  Divider,
  Container,
  Chip,
  Avatar 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Pets as PetsIcon, 
  Visibility as LittersIcon,
  Female as FemaleIcon,
  Male as MaleIcon 
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function ManageLitters() {
  const { litters, dogs, loading, error, refreshData } = useDog();
  const navigate = useNavigate();

  // This effect runs EXACTLY once per component lifecycle
  // Note the empty dependency array - this is critical
  useEffect(() => {
    // Explicit check to prevent re-fetching when data exists
    if (!litters || litters.length === 0) {
      refreshData();
    }
    // Empty dependency array ensures this only runs once when component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to find a dog by ID without console logs
  const findDogById = (dogId) => {
    if (!dogId || !dogs || !Array.isArray(dogs)) return null;
    return dogs.find(dog => 
      dog.id === dogId || 
      dog.id === Number(dogId) || 
      String(dog.id) === String(dogId)
    ) || null;
  };

  // Format date consistently
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Function to handle clicking on a litter card
  const handleLitterClick = (litterId) => {
    navigate(`/dashboard/litters/${litterId}`);
  };

  // Helper to get dog name with fallbacks
  const getDogName = (dog) => {
    if (!dog) return 'Unknown';
    return dog.call_name || dog.name || dog.registered_name || 
           dog.full_name || `Dog #${dog.id}`;
  };

  // Explicit handler for manual refresh
  const handleRefresh = () => {
    refreshData();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Litters
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleRefresh}
              sx={{ mr: 2 }}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={Link}
              to="/dashboard/litters/add"
            >
              Add Litter
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography>Loading litters...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'error.main' }}>
            <Typography variant="h6">Error loading litters</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{error}</Typography>
            <Button 
              onClick={handleRefresh} 
              variant="outlined" 
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        ) : (!litters || litters.length === 0) ? (
          // Improved empty state
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            backgroundColor: '#f8f9fa',
            maxWidth: 800,
            mx: 'auto',
            mt: 4
          }}>
            <Box sx={{ mb: 3 }}>
              <LittersIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
              <Typography variant="h5" gutterBottom>No Litters Yet</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Track your breeding program by adding litters. Each litter entry allows you to record 
                important details such as whelp date, dam, sire, number of puppies, and more.
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Getting Started
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                To add your first litter, click the "Add Litter" button above. You'll need to have dam and 
                sire records created in your Dogs section first.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                component={Link}
                to="/dashboard/litters/add"
                sx={{ mt: 1 }}
              >
                Add Your First Litter
              </Button>
            </Box>
          </Paper>
        ) : (
          // Enhanced litters display with detailed cards
          <Grid container spacing={3}>
            {litters.map(litter => {
              const sire = litter.sire_id ? findDogById(litter.sire_id) : null;
              const dam = litter.dam_id ? findDogById(litter.dam_id) : null;
              
              return (
                <Grid item xs={12} md={6} key={litter.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handleLitterClick(litter.id)}
                  >
                    {litter.cover_photo && (
                      <CardMedia
                        component="img"
                        height="180"
                        image={litter.cover_photo}
                        alt={litter.litter_name || `Litter #${litter.id}`}
                      />
                    )}
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          {litter.litter_name || `Litter #${litter.id}`}
                        </Typography>
                        {litter.status && (
                          <Chip 
                            label={litter.status} 
                            color={
                              litter.status === 'Born' ? 'success' :
                              litter.status === 'Available' ? 'primary' :
                              litter.status === 'Planned' ? 'default' :
                              litter.status === 'Expected' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        )}
                      </Box>
                      
                      <Grid container spacing={2}>
                        {dam && (
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <FemaleIcon color="error" sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body2" fontWeight="bold">Dam:</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {dam.photo_url && (
                                <Avatar 
                                  src={dam.photo_url} 
                                  alt={getDogName(dam)}
                                  sx={{ width: 40, height: 40, mr: 1 }}
                                />
                              )}
                              <Typography variant="body2">{getDogName(dam)}</Typography>
                            </Box>
                          </Grid>
                        )}
                        
                        {sire && (
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <MaleIcon color="primary" sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body2" fontWeight="bold">Sire:</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {sire.photo_url && (
                                <Avatar 
                                  src={sire.photo_url} 
                                  alt={getDogName(sire)}
                                  sx={{ width: 40, height: 40, mr: 1 }}
                                />
                              )}
                              <Typography variant="body2">{getDogName(sire)}</Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                      
                      <Box sx={{ mt: 2 }}>
                        {litter.birth_date && (
                          <Typography variant="body2" color="text.secondary">
                            Born: {formatDate(litter.birth_date)}
                          </Typography>
                        )}
                        
                        {litter.expected_date && !litter.birth_date && (
                          <Typography variant="body2" color="text.secondary">
                            Expected: {formatDate(litter.expected_date)}
                          </Typography>
                        )}
                        
                        {litter.puppy_count > 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Puppies: {litter.puppy_count}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          to={`/dashboard/litters/${litter.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default ManageLitters;
