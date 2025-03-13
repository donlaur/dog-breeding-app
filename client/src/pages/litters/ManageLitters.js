// src/pages/litters/ManageLitters.js
import React, { useEffect, useState, useContext } from 'react';
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
  Pets as PetsIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useDog } from '../../context/DogContext';
import { useNotifications } from '../../context/NotificationContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { formatDate } from '../../utils/dateUtils';
import { apiGet, apiDelete } from '../../utils/apiUtils';
import { API_URL, debugLog, debugError } from '../../config';
import { getPhotoUrl, handleImageError } from '../../utils/photoUtils';

const ManageLitters = () => {
  const { litters, loading, error, refreshLitters } = useDog();
  const { showSuccess, showError } = useNotifications();
  const [breeds, setBreeds] = useState([]);
  const [sires, setSires] = useState([]);
  const [dams, setDams] = useState([]);
  const [errorBreeds, setErrorBreeds] = useState(null);
  const [errorDogs, setErrorDogs] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  
  // Filter states
  const [selectedDam, setSelectedDam] = useState('');
  const [selectedSire, setSelectedSire] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
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

  // Fetch breeds on component mount
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
          const dogs = response.data || [];
          
          // Filter and sort dams (females) by call_name
          const sortedDams = dogs
            .filter(dog => dog.gender === 'Female')
            .sort((a, b) => {
              const nameA = (a.call_name || a.name || '').toLowerCase();
              const nameB = (b.call_name || b.name || '').toLowerCase();
              return nameA.localeCompare(nameB);
            });
          
          // Filter and sort sires (males) by call_name
          const sortedSires = dogs
            .filter(dog => dog.gender === 'Male')
            .sort((a, b) => {
              const nameA = (a.call_name || a.name || '').toLowerCase();
              const nameB = (b.call_name || b.name || '').toLowerCase();
              return nameA.localeCompare(nameB);
            });
          
          setDams(sortedDams);
          setSires(sortedSires);
        } else {
          debugError("Error fetching dogs:", response?.error);
          setErrorDogs("Failed to load dogs. Please try again later.");
        }
      } catch (error) {
        debugError("Exception fetching dogs:", error);
        setErrorDogs("Failed to load dogs. Please try again later.");
      } finally {
        setLocalLoading(false);
      }
    };

    fetchDogs();
  }, []);

  // Function to get status color for chip
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

  // Group litters by their status category
  const getLitterCategory = (status) => {
    if (status === 'Planned' || status === 'Expected') {
      return 'planned';
    } else if (status === 'Born' || status === 'Available') {
      return 'current';
    } else {
      return 'past';
    }
  };

  // Format litter name according to user preference: "Dam x Sire - Date"
  const formatLitterName = (litter) => {
    if (litter.litter_name && litter.litter_name.trim() !== '') {
      return litter.litter_name;
    }
    
    const damName = litter.dam_name || 'Unknown';
    const sireName = litter.sire_name || 'Unknown';
    const date = litter.whelp_date ? formatDate(litter.whelp_date) : 
                (litter.expected_date ? formatDate(litter.expected_date) : 'No Date');
    
    return `${damName} (${sireName}) - ${date}`;
  };

  // Apply all filters and get filtered litters
  const getFilteredLitters = () => {
    // First filter by dam and sire
    let filtered = litters.filter(litter => {
      const matchesDam = !selectedDam || litter.dam_id === parseInt(selectedDam);
      const matchesSire = !selectedSire || litter.sire_id === parseInt(selectedSire);
      return matchesDam && matchesSire;
    });
    
    // Then apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(litter => getLitterCategory(litter.status) === statusFilter);
    }
    
    // Sort by date (newest first)
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
    
    return filtered;
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedDam('');
    setSelectedSire('');
    setStatusFilter('all');
  };

  const handleRefresh = () => {
    refreshLitters(true);
  };

  // Function to handle deleting a litter
  const handleDeleteClick = (litter) => {
    setLitterToDelete(litter);
    setDeleteDialogOpen(true);
  };

  // Function to confirm deletion
  const handleConfirmDelete = async () => {
    if (!litterToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await apiDelete(`litters/${litterToDelete.id}`);
      
      if (response && response.ok) {
        showSuccess(`Litter "${litterToDelete.litter_name || `#${litterToDelete.id}`}" has been deleted.`);
        refreshLitters(true);
      } else {
        showError(`Failed to delete litter: ${response?.error || 'Unknown error'}`);
      }
    } catch (error) {
      debugError('Error deleting litter:', error);
      showError(`Failed to delete litter: ${error.message || 'Unknown error'}`);
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">Filter Litters</Typography>
          </Box>
          
          {/* Status filter */}
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Litters</MenuItem>
              <MenuItem value="planned">Planned</MenuItem>
              <MenuItem value="current">Current</MenuItem>
              <MenuItem value="past">Past</MenuItem>
            </Select>
          </FormControl>
          
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
            disabled={!selectedDam && !selectedSire && statusFilter === 'all'}
          >
            Clear Filters
          </Button>
          
          {(selectedDam || selectedSire || statusFilter !== 'all') && (
            <Typography variant="body2" color="text.secondary">
              Showing {getFilteredLitters().length} of {litters.length} litters
            </Typography>
          )}
        </Stack>
      </Paper>
      
      {(error || errorBreeds || errorDogs) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || errorBreeds || errorDogs}
        </Alert>
      )}
      
      {(loading || localLoading) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : getFilteredLitters().length > 0 ? (
        <Grid container spacing={2}>
          {getFilteredLitters().map(litter => {
            // Find the actual dam and sire objects to get their photos
            const dam = dams.find(d => d.id === litter.dam_id) || {};
            const sire = sires.find(s => s.id === litter.sire_id) || {};
            const isLitterBorn = litter.status === 'Born' || litter.status === 'Available' || litter.status === 'Completed';
            const totalPuppies = litter.num_puppies || litter.puppy_count || 0;
            const availablePuppies = litter.available_puppies || 0;
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={litter.id}>
                <Card 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/litters/${litter.id}`)}
                >
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {isLitterBorn ? formatDate(litter.whelp_date) : `Expected: ${formatDate(litter.expected_date)}`}
                    </Typography>
                    <Chip
                      label={`${availablePuppies}/${totalPuppies}`}
                      size="small"
                      color={availablePuppies > 0 ? "primary" : "default"}
                      sx={{ height: 24, minWidth: 40 }}
                    />
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, pt: 1, pb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ mb: 1, fontSize: '1rem', fontWeight: 600 }}>
                      {formatLitterName(litter)}
                    </Typography>
                    
                    {/* Slightly overlapping dog photos (10% overlap) */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mb: 1.5,
                      position: 'relative',
                      height: 80,
                      width: '100%'
                    }}>
                      {/* Dam photo (left) */}
                      <Avatar 
                        src={dam.cover_photo ? getPhotoUrl(dam.cover_photo, 'DOG') : '/images/placeholder-dog.png'} 
                        alt={dam.call_name || 'Dam'}
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          border: '2px solid #f0f0f0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          position: 'absolute',
                          left: 'calc(50% - 88px)',
                          zIndex: 1
                        }} 
                      />
                      
                      {/* Sire photo (right) - slightly overlapping (10%) */}
                      <Avatar 
                        src={sire.cover_photo ? getPhotoUrl(sire.cover_photo, 'DOG') : '/images/placeholder-dog.png'} 
                        alt={sire.call_name || 'Sire'}
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          border: '2px solid #f0f0f0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          position: 'absolute',
                          left: 'calc(50% - 8px)',
                          zIndex: 0
                        }} 
                      />
                    </Box>
                    
                    {/* Dog names - adjusted to align with photos */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      px: 2,
                      mb: 1
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 'medium', ml: 1 }}>
                        {dam.call_name || 'Unknown Dam'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                        {sire.call_name || 'Unknown Sire'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          {selectedDam || selectedSire || statusFilter !== 'all' ? (
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
