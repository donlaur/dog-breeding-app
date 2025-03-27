import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  IconButton,
  Avatar,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText
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
import { formatDate, formatAge } from '../../utils/dateUtils';
import { API_URL, debugLog, debugError } from '../../config';
import { showError, showInfo } from '../../utils/notifications';
import { useTheme } from '@mui/material/styles';
import PhotoGallery from '../../components/PhotoGallery';
import { apiGet, getLitter, getLitterPuppies, apiPost, getLitterPhotos } from '../../utils/apiUtils';

function LitterDetail() {
  const params = useParams();
  const { id } = params;
  const navigate = useNavigate();
  const theme = useTheme();
  
  debugLog('LitterDetails: Component mounting');
  debugLog('LitterDetails: Route params:', params);
  debugLog('LitterDetails: ID from params:', id);
  
  const [litter, setLitter] = useState(null);
  const [puppies, setPuppies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for quick add puppies dialog
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [puppyRows, setPuppyRows] = useState([]);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState(null);

  useEffect(() => {
    const checkLitterId = () => {
      if (!id) {
        debugError(' LitterDetails mounted with no ID');
        setError('Missing litter ID. Please select a valid litter.');
        setLoading(false);
        showError('Missing litter ID. Redirecting back to litters list...');
        
        setTimeout(() => {
          navigate('/dashboard/litters');
        }, 1000);
        return false;
      }
      
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        debugError(' LitterDetails mounted with non-numeric ID:', id);
        setError(`Invalid litter ID: ${id}. Please select a valid litter.`);
        setLoading(false);
        showError('Invalid litter ID. Redirecting back to litters list...');
        
        setTimeout(() => {
          navigate('/dashboard/litters');
        }, 1000);
        return false;
      }
      
      return true;
    };
    
    if (checkLitterId()) {
      fetchLitterDetails();
    }
  }, [id, navigate]);

  const fetchLitterDetails = async () => {
    debugLog('Fetching litter details for ID:', id);
    
    if (!id) {
      setError('Litter ID is missing');
      setLoading(false);
      showError('Invalid litter ID');
      return;
    }

    setLoading(true);
    
    try {
      // Add cache-busting parameter to prevent stale data
      const timestamp = new Date().getTime();
      // Use the apiUtils function to get litter data
      const response = await apiGet(`litters/${id}?_=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch litter details');
      }
      
      if (!response.data) {
        throw new Error('Litter not found');
      }
      
      // Debug the response data
      debugLog("Retrieved litter data:", response.data);
      debugLog("Sire name from API:", response.data.sire_name);
      debugLog("Sire info from API:", response.data.sire_info);
      
      setLitter(response.data);
      
      // Now fetch puppies
      fetchPuppies(id);
    } catch (error) {
      debugError('Error fetching litter details:', error);
      setError(error.message);
      showError(`Failed to load litter details: ${error.message}`);
      setLoading(false);
    }
  };

  const fetchPuppies = async (litterId) => {
    if (!litterId || litterId === 'undefined') {
      setLoading(false);
      return;
    }
    
    try {
      // Use the apiUtils function to get puppies
      const response = await getLitterPuppies(litterId);
      
      if (!response.ok) {
        debugError(`Failed to fetch puppies: ${response.error}`);
        setPuppies([]);
      } else {
        setPuppies(response.data || []);
        debugLog(`Retrieved ${response.data?.length || 0} puppies for litter ${litterId}`);
      }
    } catch (error) {
      debugError("Error fetching puppies:", error);
      setPuppies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLitter = () => {
    if (window.confirm('Are you sure you want to delete this litter? This action cannot be undone.')) {
      // Delete litter logic
    }
  };

  const handleEditLitter = () => {
    navigate(`/dashboard/litters/edit/${id}`);
  };

  const handleAddPuppy = () => {
    navigate(`/dashboard/litters/${id}/add-puppy`);
  };

  const handleManagePuppies = () => {
    navigate(`/dashboard/litters/${id}/puppies`);
  };

  const handleRefresh = () => {
    debugLog("Manually refreshing litter details");
    fetchLitterDetails();
  };

  // Quick Add Puppies functions
  const handleOpenQuickAdd = () => {
    // Initialize puppy rows based on the number of puppies needed
    const remainingPuppies = (litter.num_puppies || 0) - puppies.length;
    const initialRows = Array(remainingPuppies > 0 ? remainingPuppies : 1).fill().map(() => ({
      name: '',
      gender: '',
      color: '',
      error: null
    }));
    setPuppyRows(initialRows);
    setQuickAddError(null);
    setQuickAddOpen(true);
  };
  
  const handleCloseQuickAdd = () => {
    setQuickAddOpen(false);
    setQuickAddError(null);
  };
  
  const handlePuppyRowChange = (index, field, value) => {
    const newRows = [...puppyRows];
    newRows[index] = {
      ...newRows[index],
      [field]: value,
      // Clear error when field is changed
      error: field === 'error' ? value : null
    };
    setPuppyRows(newRows);
  };
  
  const handleAddRow = () => {
    setPuppyRows([...puppyRows, { name: '', gender: '', color: '', error: null }]);
  };
  
  const handleRemoveRow = (index) => {
    const newRows = [...puppyRows];
    newRows.splice(index, 1);
    setPuppyRows(newRows);
  };
  
  const validatePuppyRows = () => {
    let isValid = true;
    const newRows = [...puppyRows];
    
    newRows.forEach((row, index) => {
      // Validate required fields
      if (!row.name.trim()) {
        newRows[index].error = 'Name is required';
        isValid = false;
      } else if (!row.gender) {
        newRows[index].error = 'Gender is required';
        isValid = false;
      }
    });
    
    setPuppyRows(newRows);
    return isValid;
  };
  
  const handleQuickAddSubmit = async () => {
    if (!validatePuppyRows()) {
      setQuickAddError('Please fix the errors in the form');
      return;
    }
    
    setQuickAddLoading(true);
    setQuickAddError(null);
    
    try {
      // Get the whelp date from the litter
      const birthDate = litter.whelp_date;
      
      // Create all puppies in sequence
      const results = [];
      for (const row of puppyRows) {
        if (row.name.trim()) { // Only process rows with names
          const puppyData = {
            name: row.name.trim(),
            gender: row.gender,
            color: row.color.trim(),
            litter_id: parseInt(id),
            birthdate: birthDate, // Use the litter's whelp date
            dam_id: litter.dam_id,
            sire_id: litter.sire_id,
            breed_id: litter.breed_id
          };
          
          const response = await apiPost('puppies', puppyData);
          if (response.ok) {
            results.push(response.data);
          } else {
            throw new Error(response.error || `Failed to add puppy: ${row.name}`);
          }
        }
      }
      
      // Success - refresh puppies list
      showInfo(`Successfully added ${results.length} puppies to the litter`);
      fetchPuppies(id);
      handleCloseQuickAdd();
    } catch (error) {
      debugError('Error adding puppies:', error);
      setQuickAddError(error.message || 'Failed to add puppies');
    } finally {
      setQuickAddLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/dashboard/litters"
        >
          Back to Litters
        </Button>
      </Container>
    );
  }

  if (!litter) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Litter not found
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/dashboard/litters"
        >
          Back to Litters
        </Button>
      </Container>
    );
  }

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          component={Link} 
          to="/dashboard/litters" 
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Litters
        </Button>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<PetsIcon />} 
            onClick={handleRefresh}
            sx={{ mr: 2 }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {litter.litter_name || `Litter #${litter.id}`}
          <Chip 
            label={litter.status || 'Unknown'} 
            color={getStatusColor(litter.status)}
            size="small"
            sx={{ ml: 2 }}
          />
        </Typography>
      </Box>
      
      {litter.num_puppies > 0 && puppies.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This litter has {litter.num_puppies} puppies recorded, but none have been added yet. You need to add {litter.num_puppies} more puppies.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Litter Information
            </Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">Whelp Date</TableCell>
                    <TableCell>{litter.whelp_date ? formatDate(litter.whelp_date) : 'Not yet born'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Total Puppies</TableCell>
                    <TableCell>
                      {litter.num_puppies || 0}
                      {litter.num_puppies > 0 && puppies.length > 0 && (
                        <Chip 
                          label={`${puppies.length}/${litter.num_puppies} added`} 
                          color={puppies.length === litter.num_puppies ? "success" : "warning"}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                  {litter.expected_date && (
                    <TableRow>
                      <TableCell component="th" scope="row">Expected Date</TableCell>
                      <TableCell>{formatDate(litter.expected_date)}</TableCell>
                    </TableRow>
                  )}
                  {litter.notes && (
                    <TableRow>
                      <TableCell component="th" scope="row">Notes</TableCell>
                      <TableCell>{litter.notes}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parents
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FemaleIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Dam (Mother)
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {litter.dam_name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {litter.dam_id || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MaleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Sire (Father)
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {litter.sire_name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {litter.sire_id || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary" 
              startIcon={<EditIcon />} 
              onClick={handleEditLitter}
              sx={{ mb: 2 }}
            >
              Edit Litter
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<PetsIcon />} 
              onClick={handleManagePuppies}
              sx={{ mb: 2 }}
            >
              Manage Puppies
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              color="secondary" 
              startIcon={<AddIcon />} 
              onClick={handleAddPuppy}
              sx={{ mb: 2 }}
            >
              Add Missing Puppies
            </Button>
            <Button 
              fullWidth 
              variant="contained" 
              color="secondary" 
              startIcon={<AddIcon />} 
              onClick={handleOpenQuickAdd}
              sx={{ mb: 2 }}
            >
              Quick Add Puppies
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={handleDeleteLitter}
            >
              Delete Litter
            </Button>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Metadata
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">Created</TableCell>
                    <TableCell>{litter.created_at ? formatDate(litter.created_at) : 'Unknown'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Last Updated</TableCell>
                    <TableCell>{litter.updated_at ? formatDate(litter.updated_at) : 'Unknown'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">ID</TableCell>
                    <TableCell>{litter.id}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <PetsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Puppies
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />} 
                onClick={handleAddPuppy}
              >
                Add Puppy
              </Button>
            </Box>
            
            {puppies.length > 0 ? (
              <Grid container spacing={2}>
                {puppies.map(puppy => (
                  <Grid item xs={12} sm={6} md={4} key={puppy.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {puppy.call_name || puppy.name || `Puppy #${puppy.id}`}
                        </Typography>
                        <Typography color="text.secondary">
                          {puppy.gender === 'Male' ? (
                            <MaleIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                          ) : (
                            <FemaleIcon color="secondary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                          )}
                          {puppy.gender}
                        </Typography>
                        {puppy.birth_date && (
                          <Typography variant="body2" color="text.secondary">
                            Age: {formatAge(puppy.birth_date)}
                          </Typography>
                        )}
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/dashboard/puppies/${puppy.id}`}
                          sx={{ mt: 1 }}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary" paragraph>
                  No puppies have been added to this litter yet.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />} 
                  onClick={handleAddPuppy}
                >
                  Add First Puppy
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Photos
              </Typography>
              <Button variant="contained" color="primary">
                Add Photo
              </Button>
            </Box>
            
            <PhotoGallery entityType="litter" entityId={id} />
          </Paper>
        </Grid>
      </Grid>
      
      {/* Quick Add Puppies Dialog */}
      <Dialog 
        open={quickAddOpen} 
        onClose={handleCloseQuickAdd}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Quick Add Puppies to Litter
        </DialogTitle>
        <DialogContent>
          {quickAddError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {quickAddError}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Quickly add multiple puppies to this litter. All puppies will use the litter's whelp date ({litter?.whelp_date || 'Unknown'}) as their birth date.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Name*</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2">Gender*</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Color</Typography>
              </Grid>
              <Grid item xs={1}>
                <Typography variant="subtitle2">Actions</Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 2 }} />
            
            {puppyRows.map((row, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={row.name}
                    onChange={(e) => handlePuppyRowChange(index, 'name', e.target.value)}
                    error={Boolean(row.error && row.error.includes('Name'))}
                    helperText={row.error && row.error.includes('Name') ? row.error : ''}
                    required
                  />
                </Grid>
                <Grid item xs={3}>
                  <FormControl 
                    fullWidth 
                    size="small"
                    error={Boolean(row.error && row.error.includes('Gender'))}
                  >
                    <InputLabel id={`gender-label-${index}`}>Gender</InputLabel>
                    <Select
                      labelId={`gender-label-${index}`}
                      value={row.gender}
                      label="Gender"
                      onChange={(e) => handlePuppyRowChange(index, 'gender', e.target.value)}
                      required
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </Select>
                    {row.error && row.error.includes('Gender') && (
                      <FormHelperText>{row.error}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Color"
                    value={row.color}
                    onChange={(e) => handlePuppyRowChange(index, 'color', e.target.value)}
                  />
                </Grid>
                <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleRemoveRow(index)}
                    disabled={puppyRows.length <= 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={handleAddRow}
              sx={{ mt: 1 }}
            >
              Add Row
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuickAdd}>Cancel</Button>
          <Button 
            onClick={handleQuickAddSubmit} 
            variant="contained" 
            color="primary"
            disabled={quickAddLoading}
          >
            {quickAddLoading ? 'Adding...' : 'Add Puppies'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LitterDetail;
