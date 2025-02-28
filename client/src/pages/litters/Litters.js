import React, { useState, useEffect } from 'react';
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
  Skeleton,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Pets as PetsIcon, 
  Female as FemaleIcon,
  Male as MaleIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

console.log('Litters component is loading');

function Litters() {
  const { litters, dogs, loading, refreshData } = useDog();
  const [contentReady, setContentReady] = useState(false);
  const navigate = useNavigate();
  
  // Ensure we have complete data before showing content
  useEffect(() => {
    // If we have data, set contentReady to true with a small delay
    if (!loading && litters && dogs && litters.length >= 0 && dogs.length > 0) {
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [loading, litters, dogs]);

  // Helper function to find a dog by ID
  const findDogById = (dogId) => {
    return dogs.find(dog => dog.id === dogId) || null;
  };
  
  // Function to handle clicking on a litter card
  const handleLitterClick = (litterId) => {
    navigate(`/dashboard/litters/${litterId}`);
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

  // Show the loading skeleton until we have content ready
  if (!contentReady) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Litters
            </Typography>
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
          
          <Grid container spacing={3}>
            {[1, 2, 3].map(item => (
              <Grid item xs={12} md={6} lg={4} key={item}>
                <Card sx={{ height: '100%' }}>
                  <Skeleton variant="rectangular" height={140} />
                  <CardContent>
                    <Skeleton variant="text" height={40} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Litters
          </Typography>
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
        
        {(!litters || litters.length === 0) ? (
          <Paper sx={{
            p: 4,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{ mb: 3 }}>
              <PetsIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
              <Typography variant="h5" gutterBottom>No Litters Yet</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Track your breeding program by adding litters. Each litter entry allows you to record 
                important details such as whelp date, dam, sire, number of puppies, and more.
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3, width: '100%' }} />
            
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
          <Grid container spacing={3}>
            {litters.map(litter => {
              const sire = findDogById(litter.sire_id);
              const dam = findDogById(litter.dam_id);
              
              return (
                <Grid item xs={12} md={6} lg={4} key={litter.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
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
                        height="140"
                        image={litter.cover_photo}
                        alt={litter.litter_name || `Litter #${litter.id}`}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
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
                          sx={{ mb: 2 }}
                        />
                      )}
                      
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {sire && (
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <MaleIcon color="primary" sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body2" fontWeight="bold">
                                Sire:
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={sire.photo_url} 
                                alt={sire.name}
                                sx={{ width: 40, height: 40, mr: 1 }}
                              />
                              <Typography variant="body2">
                                {sire.name}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        
                        {dam && (
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <FemaleIcon color="error" sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body2" fontWeight="bold">
                                Dam:
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={dam.photo_url} 
                                alt={dam.name}
                                sx={{ width: 40, height: 40, mr: 1 }}
                              />
                              <Typography variant="body2">
                                {dam.name}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                      
                      {litter.birth_date && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Born: {formatDate(litter.birth_date)}
                        </Typography>
                      )}
                      
                      {litter.expected_date && !litter.birth_date && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Expected: {formatDate(litter.expected_date)}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLitterClick(litter.id);
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

export default Litters;