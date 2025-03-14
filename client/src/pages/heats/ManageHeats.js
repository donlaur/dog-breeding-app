import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { debugLog, debugError } from '../../config';
import { apiGet, apiDelete } from '../../utils/apiUtils';
import { showSuccess, showError } from '../../utils/notifications';

const ManageHeats = () => {
  const [heats, setHeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    dog_id: '',
    start_date_from: null,
    start_date_to: null
  });
  const [dogs, setDogs] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [heatToDelete, setHeatToDelete] = useState(null);
  
  // Load heats on mount
  useEffect(() => {
    loadHeats();
    loadDogs();
  }, []);
  
  // Load all heats
  const loadHeats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/heats/');
      debugLog('Heats loaded:', response);
      setHeats(response);
    } catch (error) {
      debugError('Error loading heats:', error);
      setError(`Failed to load heat cycles: ${error.message}`);
      showError(`Failed to load heat cycles: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Load dogs for filtering
  const loadDogs = async () => {
    try {
      const response = await apiGet('/dogs/');
      debugLog('Dogs loaded for filtering:', response);
      setDogs(response);
    } catch (error) {
      debugError('Error loading dogs for filtering:', error);
    }
  };
  
  // Apply filters
  const fetchFilteredHeats = async (filters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.dog_id) {
        queryParams.append('dog_id', filters.dog_id);
      }
      
      if (filters.start_date_from) {
        queryParams.append('start_date_gte', format(filters.start_date_from, 'yyyy-MM-dd'));
      }
      
      if (filters.start_date_to) {
        queryParams.append('start_date_lte', format(filters.start_date_to, 'yyyy-MM-dd'));
      }
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/heats/?${queryString}` : '/heats/';
      
      const response = await apiGet(endpoint);
      debugLog('Filtered heats loaded:', response);
      setHeats(response);
    } catch (error) {
      debugError('Error fetching filtered heats:', error);
      setError(`Failed to apply filters: ${error.message}`);
      showError(`Failed to apply filters: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Confirm and delete a heat
  const handleDeleteClick = (heat) => {
    setHeatToDelete(heat);
    setDeleteDialogOpen(true);
  };
  
  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setHeatToDelete(null);
  };
  
  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!heatToDelete) return;
    
    try {
      setLoading(true);
      setDeleteDialogOpen(false);
      
      debugLog(`Deleting heat cycle ${heatToDelete.id}`);
      const response = await apiDelete(`/heats/${heatToDelete.id}`);
      
      debugLog('Delete response:', response);
      showSuccess(`Successfully deleted heat cycle for ${heatToDelete.dog_name || 'dog'}`);
      
      // Refresh the heats list
      await refreshHeats();
    } catch (error) {
      debugError("Error deleting heat cycle:", error);
      showError(`Failed to delete heat cycle: ${error.message}`);
    } finally {
      setLoading(false);
      setHeatToDelete(null);
    }
  };
  
  // Refresh heats list
  const refreshHeats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/heats/');
      debugLog('Heats refreshed:', response);
      setHeats(response);
    } catch (err) {
      debugError("Error refreshing heats:", err);
      setError(`Failed to refresh heats data: ${err.message}`);
      showError(`Failed to refresh heat cycles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchFilteredHeats(filters);
    setFilterOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      dog_id: '',
      start_date_from: null,
      start_date_to: null
    });
    loadHeats();
    setFilterOpen(false);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Calculate cycle length
  const calculateCycleLength = (heat) => {
    if (!heat.start_date || !heat.end_date) return 'N/A';
    try {
      const start = parseISO(heat.start_date);
      const end = parseISO(heat.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return `${diffDays} days`;
    } catch (e) {
      return 'Error';
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Manage Heat Cycles</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterOpen(!filterOpen)}
              sx={{ mr: 1 }}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshHeats}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              component={Link}
              to="/dashboard/heats/add"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
            >
              Add Heat Cycle
            </Button>
          </Box>
        </Box>
        
        {filterOpen && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filter Heat Cycles
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Dog</InputLabel>
                  <Select
                    value={filters.dog_id}
                    onChange={(e) => handleFilterChange('dog_id', e.target.value)}
                    label="Dog"
                  >
                    <MenuItem value="">All Dogs</MenuItem>
                    {dogs.map(dog => (
                      <MenuItem key={dog.id} value={dog.id}>
                        {dog.call_name || dog.registered_name || `Dog #${dog.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date From"
                    value={filters.start_date_from}
                    onChange={(date) => handleFilterChange('start_date_from', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date To"
                    value={filters.start_date_to}
                    onChange={(date) => handleFilterChange('start_date_to', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={applyFilters}
                    fullWidth
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={resetFilters}
                    fullWidth
                  >
                    Reset
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : heats.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              No heat cycles found.
            </Typography>
            <Button
              component={Link}
              to="/dashboard/heats/add"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add Your First Heat Cycle
            </Button>
          </Paper>
        ) : (
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dog</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Length</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {heats.map(heat => (
                  <TableRow key={heat.id}>
                    <TableCell>{heat.dog_name || `Dog #${heat.dog_id}`}</TableCell>
                    <TableCell>{formatDate(heat.start_date)}</TableCell>
                    <TableCell>{formatDate(heat.end_date)}</TableCell>
                    <TableCell>{calculateCycleLength(heat)}</TableCell>
                    <TableCell>
                      {heat.notes ? (
                        heat.notes.length > 50 
                          ? `${heat.notes.substring(0, 50)}...` 
                          : heat.notes
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No notes
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        component={Link}
                        to={`/dashboard/heats/edit/${heat.id}`}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(heat)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the heat cycle for{' '}
            {heatToDelete ? (heatToDelete.dog_name || `Dog #${heatToDelete.dog_id}`) : 'this dog'}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageHeats;
