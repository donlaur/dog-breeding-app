import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDog } from '../../context/DogContext';
import { apiGet } from '../../utils/apiUtils';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Add as AddIcon,
  Pets as PetsIcon
} from '@mui/icons-material';

function LitterDetail() {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const { getLitter, getPuppiesForLitter, refreshData } = useDog();
  
  const [litter, setLitter] = useState(null);
  const [puppies, setPuppies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLitter = async () => {
      setLoading(true);
      try {
        // Remove leading slash and properly handle the response format
        const response = await apiGet(`litters/${litterId}`);
        if (response && response.ok && response.data) {
          setLitter(response.data);
          
          // Also fetch puppies for this litter
          const puppiesResponse = await apiGet(`litters/${litterId}/puppies`);
          if (puppiesResponse && puppiesResponse.ok) {
            setPuppies(puppiesResponse.data || []);
          }
        } else {
          throw new Error(response?.error || "Failed to fetch litter");
        }
      } catch (error) {
        console.error("Error fetching litter:", error);
        setError(error.message || "An error occurred while loading the litter.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLitter();
  }, [litterId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDeleteLitter = () => {
    // Add confirmation and deletion logic
    if (window.confirm('Are you sure you want to delete this litter? This action cannot be undone.')) {
      // Delete logic here
    }
  };

  const handleManagePuppies = () => {
    navigate(`/dashboard/litters/${litterId}/puppies`);
  };

  const handleAddPuppy = () => {
    navigate(`/dashboard/litters/${litterId}/puppies/add`);
  };

  const renderLitterName = () => {
    if (!litter) return 'Litter Details';
    
    if (litter.name) return litter.name;
    
    const damName = litter.dam_name || 'Unknown Dam';
    const sireName = litter.sire_name || 'Unknown Sire';
    
    return `${damName} & ${sireName}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button 
              component={Link} 
              to="/dashboard/litters"
              variant="contained"
            >
              Back to Litters
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!litter) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="info">Litter not found</Alert>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button 
              component={Link} 
              to="/dashboard/litters"
              variant="contained"
            >
              Back to Litters
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Button 
          component={Link} 
          to="/dashboard/litters"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          BACK TO LITTERS
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              {litter.name || `${litter.dam_name || 'Unknown'} - ${litter.sire_name || 'Unknown'}`}
            </Typography>
            {litter.status === 'Born' && (
              <Chip label="Born" color="success" size="small" sx={{ ml: 2 }} />
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddPuppy}
          >
            ADD PUPPY
          </Button>
        </Box>
        
        {litter.num_puppies > 0 && puppies.length < litter.num_puppies && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            This litter has {litter.num_puppies} puppies recorded, but {puppies.length > 0 ? 'only ' + puppies.length + ' have' : 'none have'} been added yet. You need to add {litter.num_puppies - puppies.length} more puppies.
          </Alert>
        )}
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Litter Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(litter.whelp_date) || 'Not recorded'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Puppies
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">
                      {litter.num_puppies || 0}
                    </Typography>
                    <Chip 
                      label={`${puppies.length}/${litter.num_puppies} added`}
                      size="small"
                      color={puppies.length === litter.num_puppies ? "success" : "warning"}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Parents
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <FemaleIcon sx={{ mr: 0.5, color: 'pink' }} /> Dam
                    </Typography>
                  </Box>
                  
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center',
                      borderLeft: '4px solid pink'
                    }}
                  >
                    <Box sx={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: '50%', 
                      bgcolor: 'pink', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      mr: 2
                    }}>
                      <FemaleIcon sx={{ fontSize: 30, color: 'white' }} />
                    </Box>
                    
                    <Box>
                      <Typography variant="h6">{litter.dam_name || 'Unknown'}</Typography>
                      <Button 
                        size="small" 
                        sx={{ mt: 0.5 }}
                        component={Link}
                        to={litter.dam_id ? `/dashboard/dogs/${litter.dam_id}` : '#'}
                        disabled={!litter.dam_id}
                      >
                        VIEW PROFILE
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <MaleIcon sx={{ mr: 0.5, color: 'primary.main' }} /> Sire
                    </Typography>
                  </Box>
                  
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center',
                      borderLeft: '4px solid primary.main'
                    }}
                  >
                    <Box sx={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      mr: 2
                    }}>
                      <MaleIcon sx={{ fontSize: 30, color: 'white' }} />
                    </Box>
                    
                    <Box>
                      <Typography variant="h6">{litter.sire_name || 'Unknown'}</Typography>
                      <Button 
                        size="small" 
                        sx={{ mt: 0.5 }}
                        component={Link}
                        to={litter.sire_id ? `/dashboard/dogs/${litter.sire_id}` : '#'}
                        disabled={!litter.sire_id}
                      >
                        VIEW PROFILE
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={<EditIcon />}
                  component={Link}
                  to={`/dashboard/litters/${litter.id}/edit`}
                >
                  EDIT LITTER
                </Button>
                
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<PetsIcon />}
                  onClick={handleManagePuppies}
                >
                  MANAGE PUPPIES
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="warning"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={handleAddPuppy}
                >
                  ADD MISSING PUPPIES
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="error"
                  fullWidth
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteLitter}
                >
                  DELETE LITTER
                </Button>
              </Box>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {formatDate(litter.created_at)}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {formatDate(litter.updated_at)}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  ID
                </Typography>
                <Typography variant="body2">
                  {litter.id}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default LitterDetail; 