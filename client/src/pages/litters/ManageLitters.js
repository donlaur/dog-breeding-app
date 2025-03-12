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
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Pets as PetsIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
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
  
  // Filter states
  const [selectedDam, setSelectedDam] = useState('');
  const [selectedSire, setSelectedSire] = useState('');
  const [filteredLitters, setFilteredLitters] = useState([]);
  
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

  // Apply filters when litters or filter selections change
  useEffect(() => {
    if (!litters) {
      setFilteredLitters([]);
      return;
    }
    
    let filtered = [...litters];
    
    // Apply dam filter if selected
    if (selectedDam !== '') {
      filtered = filtered.filter(litter => litter.dam_id === selectedDam);
    }
    
    // Apply sire filter if selected
    if (selectedSire !== '') {
      filtered = filtered.filter(litter => litter.sire_id === selectedSire);
    }
    
    // Sort by whelp_date (newest first)
    filtered.sort((a, b) => {
      // Use whelp_date if available, otherwise use expected_date
      const dateA = a.whelp_date || a.expected_date || '';
      const dateB = b.whelp_date || b.expected_date || '';
      
      // Sort in descending order (newest first)
      if (dateA && dateB) {
        return new Date(dateB) - new Date(dateA);
      }
      // If only one has a date, prioritize the one with a date
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      
      // If neither has a date, sort by ID (newest first)
      return b.id - a.id;
    });
    
    setFilteredLitters(filtered);
  }, [litters, selectedDam, selectedSire]);

  const handleRefresh = () => {
    refreshLitters(true);
  };

  const handleClearFilters = () => {
    setSelectedDam('');
    setSelectedSire('');
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
      
      {/* Filter controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Filter Litters</Typography>
          </Box>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="dam-filter-label">Dam (Mother)</InputLabel>
            <Select
              labelId="dam-filter-label"
              id="dam-filter"
              value={selectedDam}
              label="Dam (Mother)"
              onChange={(e) => setSelectedDam(e.target.value)}
            >
              <MenuItem value="">
                <em>All Dams</em>
              </MenuItem>
              {dams && dams.length > 0 ? (
                dams.map((dam) => (
                  <MenuItem key={dam.id} value={dam.id}>
                    {dam.call_name || dam.name || `Dog #${dam.id}`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  <em>No female dogs available</em>
                </MenuItem>
              )}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="sire-filter-label">Sire (Father)</InputLabel>
            <Select
              labelId="sire-filter-label"
              id="sire-filter"
              value={selectedSire}
              label="Sire (Father)"
              onChange={(e) => setSelectedSire(e.target.value)}
            >
              <MenuItem value="">
                <em>All Sires</em>
              </MenuItem>
              {sires && sires.length > 0 ? (
                sires.map((sire) => (
                  <MenuItem key={sire.id} value={sire.id}>
                    {sire.call_name || sire.name || `Dog #${sire.id}`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  <em>No male dogs available</em>
                </MenuItem>
              )}
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            startIcon={<ClearIcon />} 
            onClick={handleClearFilters}
            disabled={!selectedDam && !selectedSire}
          >
            Clear Filters
          </Button>
          
          {(selectedDam || selectedSire) && (
            <Typography variant="body2" color="text.secondary">
              Showing {filteredLitters.length} of {litters.length} litters
            </Typography>
          )}
        </Stack>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {(loading || localLoading) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredLitters && filteredLitters.length > 0 ? (
        <Grid container spacing={3}>
          {filteredLitters.map(litter => (
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
                    <strong>Date of Birth:</strong> {litter.whelp_date ? formatDate(litter.whelp_date) : 'Not yet born'}
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
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          {selectedDam || selectedSire ? (
            <>
              <Typography variant="h6" gutterBottom>No Matching Litters</Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                No litters found with the selected filters.
              </Typography>
              <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>No Litters Found</Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You haven't added any litters yet.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />} 
                component={Link} 
                to="/dashboard/litters/add"
              >
                Add Your First Litter
              </Button>
            </>
          )}
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
