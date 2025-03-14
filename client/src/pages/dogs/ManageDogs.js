// src/pages/dogs/ManageDogs.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { debugLog, debugError } from "../../config";
import { apiGet, apiDelete } from "../../utils/apiUtils";
import { 
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Typography,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { showError, showSuccess } from '../../utils/notifications';
import { getGenderDisplay, getImageUrl } from '../../utils/imageUtils';
import { formatAdultAge } from '../../utils/ageUtils';
import ConfirmationDialog from '../../components/ConfirmationDialog';

const ManageDogs = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dogToDelete, setDogToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    breed: '',
    gender: '',
    ageMin: '',
    ageMax: '',
    status: ''
  });
  
  // Reference to search input for focusing
  const searchInputRef = useRef(null);
  
  // Load dogs on component mount
  useEffect(() => {
    fetchDogs();
  }, []);
  
  // Fetch dogs from API
  const fetchDogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiGet('/dogs');
      debugLog('Dogs fetched:', data);
      setDogs(data || []);
    } catch (err) {
      debugError('Error fetching dogs:', err);
      setError(err.message || 'An error occurred while fetching dogs');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to refresh dogs list
  const refreshDogs = () => {
    fetchDogs();
  };
  
  // Handle opening delete confirmation dialog
  const handleDeleteClick = (dog) => {
    setDogToDelete(dog);
    setDeleteDialogOpen(true);
  };
  
  // Close delete dialog without deleting
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDogToDelete(null);
  };
  
  // Confirm and process dog deletion
  const handleDeleteConfirm = async () => {
    if (!dogToDelete) {
      setDeleteDialogOpen(false);
      return;
    }
    
    const dogId = dogToDelete.id;
    const dogName = dogToDelete.name;
    
    setDeleteDialogOpen(false);
    setDogToDelete(null);
    
    try {
      debugLog(`Deleting dog with ID: ${dogId}`);
      
      const response = await apiDelete(`/dogs/${dogId}`);
      
      showSuccess(`Successfully deleted dog "${dogName || 'Unknown'}"`);
      refreshDogs();
      
    } catch (error) {
      debugError('Error deleting dog:', error);
      showError(`Failed to delete dog: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Handle search input changes
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Clear search field
  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    setFilterDialogOpen(false);
    // The actual filtering is done in the filtered dogs computation
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      breed: '',
      gender: '',
      ageMin: '',
      ageMax: '',
      status: ''
    });
  };
  
  // Compute filtered dogs based on search term and filters
  const filteredDogs = dogs.filter(dog => {
    // Search term filtering
    if (searchTerm && !dog.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Breed filtering
    if (filters.breed && dog.breed_name !== filters.breed) {
      return false;
    }
    
    // Gender filtering
    if (filters.gender && dog.gender !== filters.gender) {
      return false;
    }
    
    // Age filtering
    const ageInYears = dog.age_years || 0;
    if (filters.ageMin && ageInYears < parseInt(filters.ageMin)) {
      return false;
    }
    if (filters.ageMax && ageInYears > parseInt(filters.ageMax)) {
      return false;
    }
    
    // Status filtering
    if (filters.status && dog.status !== filters.status) {
      return false;
    }
    
    return true;
  });
  
  // Determine if any filters are active
  const filtersActive = Object.values(filters).some(value => value !== '');
  
  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h4" gutterBottom component="div">
          Manage Dogs
        </Typography>
        
        {/* Search and Filter Bar */}
        <Box sx={{ display: 'flex', mb: 3, alignItems: 'center' }}>
          <TextField 
            placeholder="Search dogs..."
            variant="outlined"
            size="small"
            inputRef={searchInputRef}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClearSearch}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mr: 2, flexGrow: 1 }}
          />
          
          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
            color={filtersActive ? "primary" : "inherit"}
          >
            {filtersActive ? "Filters Active" : "Filter"}
          </Button>
          
          <Button 
            component={Link} 
            to="/dashboard/dogs/add" 
            variant="contained" 
            sx={{ ml: 2 }}
          >
            Add Dog
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : filteredDogs.length === 0 ? (
          <Typography>
            {dogs.length === 0 
              ? "No dogs found. Add your first dog!"
              : "No dogs match your search criteria. Try adjusting your filters."}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredDogs.map(dog => (
              <Grid item xs={12} sm={6} md={4} key={dog.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="140"
                    image={getImageUrl(dog.image_url, "dog")}
                    alt={dog.name}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography gutterBottom variant="h6" component="div">
                        {dog.name}
                      </Typography>
                      <Box>
                        <IconButton 
                          component={Link} 
                          to={`/dashboard/dogs/edit/${dog.id}`}
                          aria-label="edit"
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          aria-label="delete"
                          onClick={() => handleDeleteClick(dog)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      Breed: {dog.breed_name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Age: {formatAdultAge(dog.age_years, dog.date_of_birth)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gender: {getGenderDisplay(dog.gender)}
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={dog.status || 'Active'} 
                        size="small" 
                        color={dog.status === 'Retired' ? 'secondary' : 'primary'} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          title="Confirm Delete"
          message={`Are you sure you want to delete ${dogToDelete?.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmButtonColor="error"
        />
        
        {/* Filter Dialog */}
        <Dialog 
          open={filterDialogOpen} 
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Filter Dogs</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Set filters to narrow down your dog list.
            </DialogContentText>
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Breed"
                    name="breed"
                    value={filters.breed}
                    onChange={handleFilterChange}
                    fullWidth
                    select
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value=""></option>
                    {/* This would ideally use a distinct list of breeds from the dog list */}
                    {Array.from(new Set(dogs.map(dog => dog.breed_name))).sort().map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Gender"
                    name="gender"
                    value={filters.gender}
                    onChange={handleFilterChange}
                    fullWidth
                    select
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value=""></option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Minimum Age (years)"
                    name="ageMin"
                    type="number"
                    value={filters.ageMin}
                    onChange={handleFilterChange}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Maximum Age (years)"
                    name="ageMax"
                    type="number"
                    value={filters.ageMax}
                    onChange={handleFilterChange}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    fullWidth
                    select
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value=""></option>
                    <option value="Active">Active</option>
                    <option value="Retired">Retired</option>
                    <option value="Deceased">Deceased</option>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetFilters} color="secondary">
              Reset Filters
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyFilters} variant="contained">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default ManageDogs;
