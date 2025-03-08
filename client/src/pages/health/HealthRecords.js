import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Chip, TextField, MenuItem, 
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  CircularProgress, Tabs, Tab, Tooltip, Select, FormControl, InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';

// Component to display health records
const HealthRecords = () => {
  const navigate = useNavigate();
  const { dogs, puppies } = useDog();
  const { healthRecords, isLoading, error, fetchHealthRecords, deleteHealthRecord } = useHealth();
  
  // Filter and sort states
  const [filters, setFilters] = useState({
    recordType: '',
    animal: '',
    animalType: 'all' // 'all', 'dog', or 'puppy'
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortField, setSortField] = useState('record_date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    recordId: null,
    recordTitle: ''
  });

  // Tab state for dog/puppy view
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Fetch all health records initially
    fetchHealthRecords();
  }, [fetchHealthRecords]);

  // Apply filters to the health records
  const filteredRecords = healthRecords.filter(record => {
    // Filter by record type
    if (filters.recordType && record.record_type !== filters.recordType) {
      return false;
    }

    // Filter by animal type
    if (filters.animalType === 'dog' && !record.dog_id) {
      return false;
    }
    if (filters.animalType === 'puppy' && !record.puppy_id) {
      return false;
    }

    // Filter by specific animal
    if (filters.animal) {
      if (record.dog_id && record.dog_id !== parseInt(filters.animal)) {
        return false;
      }
      if (record.puppy_id && record.puppy_id !== parseInt(filters.animal)) {
        return false;
      }
    }

    return true;
  });

  // Sort the filtered records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    // Handle sort field
    let aValue = a[sortField];
    let bValue = b[sortField];

    // If sorting by animal name, get the animal name
    if (sortField === 'animal_name') {
      aValue = getAnimalName(a);
      bValue = getAnimalName(b);
    }

    // If sorting by date, convert to timestamp for comparison
    if (sortField === 'record_date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Apply sort direction
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Helper function to get animal name from ID
  const getAnimalName = (record) => {
    if (record.dog_id) {
      const dog = dogs.find(d => d.id === record.dog_id);
      return dog ? dog.call_name : 'Unknown Dog';
    } else if (record.puppy_id) {
      const puppy = puppies.find(p => p.id === record.puppy_id);
      return puppy ? puppy.name : 'Unknown Puppy';
    }
    return 'Unknown';
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Handle opening the delete confirmation dialog
  const openDeleteDialog = (record) => {
    setDeleteDialog({
      open: true,
      recordId: record.id,
      recordTitle: record.title
    });
  };

  // Handle closing the delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      recordId: null,
      recordTitle: ''
    });
  };

  // Handle confirming delete
  const handleDeleteRecord = async () => {
    try {
      await deleteHealthRecord(deleteDialog.recordId);
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting health record:', error);
    }
  };

  // Handle tab change for dog/puppy view
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFilters({
      ...filters,
      animalType: newValue === 0 ? 'all' : newValue === 1 ? 'dog' : 'puppy'
    });
  };

  // Handle sort column click
  const handleSortClick = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to descending by default
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get color for record type
  const getRecordTypeColor = (type) => {
    const typeColors = {
      'examination': 'info',
      'surgery': 'error',
      'treatment': 'warning',
      'test': 'secondary',
      'vaccination': 'success'
    };
    return typeColors[type] || 'default';
  };

  // Record type options for filter
  const recordTypeOptions = [
    { value: 'examination', label: 'Examination' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'test', label: 'Test' },
    { value: 'vaccination', label: 'Vaccination' }
  ];

  // Handle navigating to add record page
  const handleAddRecord = () => {
    navigate('/health/records/add');
  };

  // Handle navigating to edit record page
  const handleEditRecord = (recordId) => {
    navigate(`/health/records/edit/${recordId}`);
  };

  // Handle navigating to view record page
  const handleViewRecord = (recordId) => {
    navigate(`/health/records/${recordId}`);
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Toggle filter panel
  const toggleFilterPanel = () => {
    setFilterOpen(!filterOpen);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      recordType: '',
      animal: '',
      animalType: 'all'
    });
    setTabValue(0);
  };

  if (isLoading && healthRecords.length === 0) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box my={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          Health Records
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRecord}
        >
          Add Record
        </Button>
      </Box>

      {/* Filter panel toggle button */}
      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button
          startIcon={<FilterListIcon />}
          onClick={toggleFilterPanel}
          color="inherit"
        >
          Filter Records
        </Button>
      </Box>

      {/* Filter panel */}
      {filterOpen && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Options
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="record-type-label">Record Type</InputLabel>
              <Select
                labelId="record-type-label"
                name="recordType"
                value={filters.recordType}
                onChange={handleFilterChange}
                label="Record Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {recordTypeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="animal-label">Specific Animal</InputLabel>
              <Select
                labelId="animal-label"
                name="animal"
                value={filters.animal}
                onChange={handleFilterChange}
                label="Specific Animal"
              >
                <MenuItem value="">All Animals</MenuItem>
                <MenuItem disabled>---- Dogs ----</MenuItem>
                {dogs.map(dog => (
                  <MenuItem key={`dog-${dog.id}`} value={dog.id.toString()}>
                    {dog.call_name}
                  </MenuItem>
                ))}
                <MenuItem disabled>---- Puppies ----</MenuItem>
                {puppies.map(puppy => (
                  <MenuItem key={`puppy-${puppy.id}`} value={puppy.id.toString()}>
                    {puppy.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button variant="text" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Box>
        </Paper>
      )}

      {/* Animal type tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Animals" />
          <Tab label="Dogs Only" />
          <Tab label="Puppies Only" />
        </Tabs>
      </Box>

      {/* Records table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                onClick={() => handleSortClick('record_date')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                Date
                {sortField === 'record_date' && (
                  <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </TableCell>
              <TableCell 
                onClick={() => handleSortClick('title')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                Title
                {sortField === 'title' && (
                  <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </TableCell>
              <TableCell 
                onClick={() => handleSortClick('animal_name')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                Animal
                {sortField === 'animal_name' && (
                  <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </TableCell>
              <TableCell 
                onClick={() => handleSortClick('record_type')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                Type
                {sortField === 'record_type' && (
                  <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </TableCell>
              <TableCell 
                onClick={() => handleSortClick('performed_by')}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
              >
                Performed By
                {sortField === 'performed_by' && (
                  <span>{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRecords.length > 0 ? (
              sortedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.record_date)}</TableCell>
                  <TableCell>{record.title}</TableCell>
                  <TableCell>{getAnimalName(record)}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={record.record_type} 
                      color={getRecordTypeColor(record.record_type)}
                    />
                  </TableCell>
                  <TableCell>{record.performed_by || '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => handleViewRecord(record.id)}
                        color="primary"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRecord(record.id)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(record)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box py={3}>
                    <Typography variant="body1" color="textSecondary">
                      No health records found
                    </Typography>
                    <Button
                      variant="text"
                      startIcon={<AddIcon />}
                      onClick={handleAddRecord}
                      sx={{ mt: 1 }}
                    >
                      Add Your First Health Record
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Health Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the health record "{deleteDialog.recordTitle}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteRecord} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HealthRecords;