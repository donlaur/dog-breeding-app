// src/pages/litters/ManageLitters.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Tooltip
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

const ManageLitters = () => {
  const { litters, loading, error, refreshLitters } = useDog();
  const [breeds, setBreeds] = useState([]);
  const [sires, setSires] = useState([]);
  const [dams, setDams] = useState([]);
  const [errorBreeds, setErrorBreeds] = useState(null);
  
  // State for confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [litterToDelete, setLitterToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Only refresh if we don't have any litters and aren't currently loading
    if (!loading && (!litters || litters.length === 0)) {
      refreshLitters();
    }
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const response = await fetch(`${API_URL}/breeds`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        debugLog("Fetched breeds:", data);
        setBreeds(data);
      } catch (error) {
        debugError("Error fetching breeds:", error);
        setErrorBreeds("Failed to load breeds. Please try again later.");
      }
    };

    fetchBreeds();
  }, []);

  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const response = await fetch(`${API_URL}/dogs`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Filter for male and female dogs
        const males = data.filter(dog => dog.gender === 'Male');
        const females = data.filter(dog => dog.gender === 'Female');
        
        setSires(males);
        setDams(females);
      } catch (error) {
        debugError("Error fetching dogs:", error);
      }
    };

    fetchDogs();
  }, []);

  const handleRefresh = () => {
    refreshLitters();
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
      
      const response = await fetch(`${API_URL}/litters/${litterToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      showSuccess(`Successfully deleted litter "${litterToDelete.litter_name}"`);
      refreshLitters(); // Refresh litters list
      
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

  // Render sire/dam info
  const getDogName = (dogId, isSire = true) => {
    const dogList = isSire ? sires : dams;
    const dog = dogList.find(d => d.id === dogId);
    return dog ? dog.name : 'Unknown';
  };
  
  // Content for empty state
  const emptyContent = (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <PetsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No Litters Found
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        You haven't added any litters yet.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        component={Link}
        to="/dashboard/litters/add"
        startIcon={<AddIcon />}
      >
        Add Your First Litter
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Manage Litters
          </Typography>
          <Box>
            <Button
              variant="outlined"
              sx={{ mr: 2 }}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/dashboard/litters/add"
              startIcon={<AddIcon />}
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : litters && litters.length > 0 ? (
          <Grid container spacing={3}>
            {litters.map((litter) => (
              <Grid item xs={12} md={6} key={litter.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        component={Link} 
                        to={`/dashboard/litters/${litter.id}`} 
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {litter.litter_name || 'Unnamed Litter'}
                      </Typography>
                      <Chip 
                        label={litter.status} 
                        color={getStatusColor(litter.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Breed: {getBreedName(litter.breed_id)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      {litter.sire_id && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MaleIcon sx={{ color: 'primary.main', mr: 0.5, fontSize: 16 }} />
                          <Typography variant="body2">
                            Sire: {getDogName(litter.sire_id, true)}
                          </Typography>
                        </Box>
                      )}
                      
                      {litter.dam_id && (
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                          <FemaleIcon sx={{ color: 'secondary.main', mr: 0.5, fontSize: 16 }} />
                          <Typography variant="body2">
                            Dam: {getDogName(litter.dam_id, false)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      {litter.whelp_date && (
                        <Typography variant="body2" color="text.secondary">
                          Born: {formatDate(litter.whelp_date)}
                        </Typography>
                      )}
                      
                      {litter.expected_date && !litter.whelp_date && (
                        <Typography variant="body2" color="text.secondary">
                          Expected: {formatDate(litter.expected_date)}
                        </Typography>
                      )}
                      
                      {litter.puppy_count && (
                        <Typography variant="body2" color="text.secondary">
                          Puppies: {litter.puppy_count}
                        </Typography>
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        component={Link}
                        to={`/dashboard/litters/${litter.id}`}
                        size="small"
                        sx={{ mr: 1 }}
                        disabled={!litter.id}
                      >
                        View
                      </Button>
                      <Button
                        component={Link}
                        to={`/dashboard/litters/edit/${litter.id}`}
                        size="small"
                        startIcon={<EditIcon />}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Tooltip title="Delete Litter">
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDeleteClick(litter)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          emptyContent
        )}
      </Box>
      
      {/* Confirmation dialog for deletion */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Litter"
        message={`Are you sure you want to delete the litter "${litterToDelete?.litter_name}"? This action cannot be undone and will remove all associated puppies.`}
        confirmButtonText={deleteLoading ? "Deleting..." : "Delete Litter"}
        severity="error"
      />
    </Container>
  );
};

export default ManageLitters;
