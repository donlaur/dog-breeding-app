// src/pages/litters/ManageLitters.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Container,
  Paper,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Pets as PetsIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';
import { useDog } from '../../context/DogContext';
import { API_URL, debugLog, debugError } from '../../config';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { showSuccess, showError } from '../../utils/notifications';
import { apiGet, apiDelete } from '../../utils/apiUtils';

const ManageLitters = () => {
  const { litters, loading, error, refreshLitters } = useDog();
  const [breeds, setBreeds] = useState([]);
  const [sires, setSires] = useState([]);
  const [dams, setDams] = useState([]);
  const [errorBreeds, setErrorBreeds] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  
  // State for confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [litterToDelete, setLitterToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  // Refresh litters data when component mounts
  useEffect(() => {
    debugLog("ManageLitters: Initial data load");
    refreshLitters(true);
    
    // Set up an interval to periodically refresh litters data (every 30 seconds)
    const intervalId = setInterval(() => {
      refreshLitters(true); // Force refresh to ensure we always get fresh data
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    const fetchBreeds = async () => {
      setLocalLoading(true);
      try {
        const response = await apiGet('breeds');
        if (response && response.ok) {
          setBreeds(response.data || []);
        } else {
          debugError("Error fetching breeds:", response?.error);
          setErrorBreeds("Failed to load breeds. Please try again later.");
        }
      } catch (error) {
        debugError("Exception fetching breeds:", error);
        setErrorBreeds("Failed to load breeds. Please try again later.");
      } finally {
        setLocalLoading(false);
      }
    };

    fetchBreeds();
  }, []);

  useEffect(() => {
    const fetchDogs = async () => {
      setLocalLoading(true);
      try {
        const response = await apiGet('dogs');
        if (response && response.ok) {
          const data = response.data || [];
          
          // Filter for male and female dogs
          const males = data.filter(dog => dog.gender === 'Male');
          const females = data.filter(dog => dog.gender === 'Female');
          
          setSires(males);
          setDams(females);
        } else {
          debugError("Error fetching dogs:", response?.error);
        }
      } catch (error) {
        debugError("Exception fetching dogs:", error);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchDogs();
  }, []);

  const handleRefresh = () => {
    refreshLitters(true); // Force refresh
  };

  // Function to handle deleting a litter
  const handleDeleteClick = (litter) => {
    setLitterToDelete(litter);
    setDeleteDialogOpen(true);
  };

  // Function to confirm deletion
  const handleConfirmDelete = async () => {
    if (!litterToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      const response = await apiDelete(`litters/${litterToDelete.id}`);
      
      if (response && response.ok) {
        showSuccess(`Successfully deleted litter "${litterToDelete.litter_name}"`);
        refreshLitters(true); // Force refresh after deletion
      } else {
        throw new Error(response?.error || "Unknown error");
      }
      
    } catch (error) {
      debugError("Error deleting litter:", error);
      showError(`Failed to delete litter: ${error.message}`);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setLitterToDelete(null);
    }
  };

  // Function to close the dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setLitterToDelete(null);
  };

  // Get status color for chip
  const getStatusColor = (status) => {
    switch (status) {
      case 'Planned':
        return 'default';
      case 'Expected':
        return 'primary';
      case 'Born':
        return 'secondary';
      case 'Available':
        return 'success';
      case 'Completed':
        return 'info';
      default:
        return 'default';
    }
  };

  // Render the breed name from the ID
  const getBreedName = (breedId) => {
    const breed = breeds.find(b => b.id === breedId);
    return breed ? breed.name : 'Unknown';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Litters
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<PetsIcon />} 
            onClick={handleRefresh}
            sx={{ mr: 2 }}
          >
            Refresh
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
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {(loading || localLoading) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : litters && litters.length > 0 ? (
        <Grid container spacing={3}>
          {litters.map(litter => (
            <Grid item xs={12} sm={6} md={4} key={litter.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2">
                      {litter.litter_name || `Litter #${litter.id}`}
                    </Typography>
                    <Chip 
                      label={litter.status || 'Unknown'} 
                      color={getStatusColor(litter.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Breed:</strong> {getBreedName(litter.breed_id)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MaleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      <strong>Sire:</strong> {litter.sire_name || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FemaleIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      <strong>Dam:</strong> {litter.dam_name || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Date of Birth:</strong> {litter.date_of_birth ? formatDate(litter.date_of_birth) : 'Not yet born'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Expected Date:</strong> {litter.expected_date ? formatDate(litter.expected_date) : 'Unknown'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Puppies:</strong> {litter.num_puppies || litter.puppy_count || 0}
                  </Typography>
                  
                  {litter.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Notes:</strong> {litter.notes}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    component={Link}
                    to={`/dashboard/litters/${litter.id}`}
                  >
                    View Details
                  </Button>
                  <Box>
                    <Tooltip title="Edit Litter">
                      <IconButton 
                        size="small"
                        component={Link}
                        to={`/dashboard/litters/edit/${litter.id}`}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Litter">
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(litter)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No litters found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You haven't added any litters yet. Click the "Add Litter" button to create your first litter.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            component={Link} 
            to="/dashboard/litters/add"
            sx={{ mt: 2 }}
          >
            Add Litter
          </Button>
        </Paper>
      )}
      
      <ConfirmationDialog 
        open={deleteDialogOpen}
        title="Delete Litter"
        content={`Are you sure you want to delete the litter "${litterToDelete?.litter_name || `#${litterToDelete?.id}`}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
        loading={deleteLoading}
      />
    </Container>
  );
};

export default ManageLitters;
