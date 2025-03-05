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

const ManageLitters = () => {
  const { litters, loading, error, refreshLitters } = useDog();
  const [breeds, setBreeds] = useState([]);
  const [sires, setSires] = useState([]);
  const [dams, setDams] = useState([]);
  const [errorBreeds, setErrorBreeds] = useState(null);
  
  // Debug litters data
  useEffect(() => {
    if (litters && litters.length > 0) {
      console.log("Litters data received:", litters);
      // Check each litter's sire_id and dam_id
      litters.forEach(litter => {
        console.log(`Litter ${litter.id} - sire_id: ${litter.sire_id}, dam_id: ${litter.dam_id}, num_puppies: ${litter.num_puppies || litter.puppy_count}`);
      });
    }
  }, [litters]);
  
  // State for confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [litterToDelete, setLitterToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

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
        
        console.log("All dogs fetched for litter page:", data);
        
        // Filter for male and female dogs and debug
        const males = data.filter(dog => dog.gender === 'Male');
        const females = data.filter(dog => dog.gender === 'Female');
        
        console.log("Filtered males:", males);
        console.log("Filtered females:", females);
        
        setSires(males);
        setDams(females);
        
        // Log the dog IDs as numbers for easier comparison with litter data
        console.log("Male dog IDs:", males.map(dog => dog.id));
        console.log("Female dog IDs:", females.map(dog => dog.id));
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
    if (!dogId) return 'Unknown';
    
    // Log details for debugging
    console.log(`Getting ${isSire ? 'sire' : 'dam'} name for dog ID: ${dogId}`);
    console.log(`Available ${isSire ? 'sires' : 'dams'}: `, isSire ? sires : dams);
    
    const dogList = isSire ? sires : dams;
    const dog = dogList.find(d => d.id === dogId);
    
    if (dog) {
      // Use call_name as primary, fallback to name
      return dog.call_name || dog.name || `Dog #${dogId}`;
    }
    
    return `Dog #${dogId}`;
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

  // Add a helper function to validate litter links at the top of the component
  const validateLitterId = (litter, action = 'viewing') => {
    if (!litter || !litter.id) {
      debugError(`⚠️ Attempted ${action} litter with missing/invalid ID:`, litter);
      showError(`Cannot ${action} litter: Invalid litter ID`);
      return false;
    }
    return true;
  };

  // Helper function to get the litter's display name
  const getLitterDisplayName = (litter) => {
    if (!litter) return 'Unknown Litter';
    
    // Try to find a name field
    for (const prop of Object.keys(litter)) {
      if (
        prop.toLowerCase().includes('name') || 
        prop.toLowerCase() === 'title' ||
        prop.toLowerCase() === 'label'
      ) {
        return litter[prop] || `Litter #${litter.id}`;
      }
    }
    
    // If no name field is found, use ID
    return `Litter #${litter.id}`;
  };

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
                        onClick={() => {
                          console.log('Litter title clicked:', litter);
                          console.log('Litter ID:', litter.id);
                          console.log('Navigating to URL:', `/dashboard/litters/${litter.id}`);
                          navigate(`/dashboard/litters/${litter.id}`);
                        }}
                        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                      >
                        {getLitterDisplayName(litter)}
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
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                      {/* Always show Sire field, even if empty */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MaleIcon sx={{ color: 'primary.main', mr: 0.5, fontSize: 16 }} />
                        <Typography variant="body2">
                          Sire: {
                            litter.sire && (litter.sire.call_name || litter.sire.name) ? 
                              (litter.sire.call_name || litter.sire.name) : 
                              (litter.sire_id ? getDogName(litter.sire_id, true) : 'Not specified')
                          }
                        </Typography>
                      </Box>
                      
                      {/* Always show Dam field, even if empty */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FemaleIcon sx={{ color: 'secondary.main', mr: 0.5, fontSize: 16 }} />
                        <Typography variant="body2">
                          Dam: {
                            litter.dam && (litter.dam.call_name || litter.dam.name) ? 
                              (litter.dam.call_name || litter.dam.name) : 
                              (litter.dam_id ? getDogName(litter.dam_id, false) : 'Not specified')
                          }
                        </Typography>
                      </Box>
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
                      
                      {/* Show number of puppies using either puppy_count or num_puppies field */}
                      {(litter.puppy_count || litter.num_puppies) && (
                        <Typography variant="body2" color="text.secondary">
                          Puppies: {litter.puppy_count || litter.num_puppies || 0}
                        </Typography>
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => {
                          console.log('View button clicked for litter:', litter);
                          console.log('Litter ID:', litter.id);
                          console.log('Navigating to URL:', `/dashboard/litters/${litter.id}`);
                          navigate(`/dashboard/litters/${litter.id}`);
                        }}
                      >
                        View
                      </Button>
                      <Button size="small" component={Link} to={`/dashboard/litters/edit/${litter.id}`}>
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
                    </CardActions>
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
