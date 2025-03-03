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
  IconButton,
  Avatar,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Snackbar
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

function LitterDetail() {
  const params = useParams();
  const { id } = params;
  const navigate = useNavigate();
  const { getLitter, getPuppiesForLitter, refreshData } = useDog();
  const theme = useTheme();
  const location = window.location;
  
  console.log('LitterDetails: Component mounting');
  console.log('LitterDetails: Full URL:', window.location.href);
  console.log('LitterDetails: Route params:', params);
  console.log('LitterDetails: ID from params:', id);
  
  const [litter, setLitter] = useState(null);
  const [puppies, setPuppies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorNotification, setShowErrorNotification] = useState(false);

  useEffect(() => {
    const checkLitterId = () => {
      if (!id) {
        debugError('⚠️ LitterDetails mounted with no ID');
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
        debugError('⚠️ LitterDetails mounted with non-numeric ID:', id);
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

  const debugResponse = async (response) => {
    const clone = response.clone();
    const text = await clone.text();
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', response.headers);
    try {
      console.log('API Response Body:', JSON.parse(text));
    } catch (e) {
      console.log('API Response Body (raw):', text);
    }
    return response;
  };

  const fetchLitterDetails = async () => {
    debugLog('LitterDetails component mounting with ID:', id);
    
    if (!id) {
      setError('Litter ID is missing');
      setLoading(false);
      showError('Invalid litter ID');
      return;
    }

    setLoading(true);
    
    try {
      debugLog(`Fetching litter details for ID: ${id}`);
      console.log(`Making API call to: ${API_URL}/litters/${id}`);
      
      let response;
      try {
        response = await fetch(`${API_URL}/litters/${id}`);
        await debugResponse(response);
      } catch (networkError) {
        console.error('Network error:', networkError);
        throw new Error(`Network error: ${networkError.message}`);
      }
      
      if (!response.ok) {
        const status = response.status;
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        let errorMsg;
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || `Failed to fetch litter (${status})`;
        } catch (e) {
          errorMsg = `Failed to fetch litter (${status}): ${errorText.substring(0, 100)}`;
        }
        
        console.error('Error response:', errorMsg);
        throw new Error(errorMsg);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error(`Invalid JSON response: ${jsonError.message}`);
      }
      
      if (!data) {
        throw new Error('Litter not found');
      }
      
      setLitter(data);
      debugLog("Retrieved litter data:", data);
      
      fetchPuppies(id);
    } catch (error) {
      debugError('Error fetching litter details:', error);
      setError(error.message);
      showError(`Failed to load litter details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPuppies = async (litterId) => {
    if (!litterId || litterId === 'undefined') {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/litters/${litterId}/puppies`);
      
      if (!response.ok) {
        debugError(`Failed to fetch puppies: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      setPuppies(data || []);
    } catch (error) {
      debugError("Error fetching puppies:", error);
    }
  };

  const handleDeleteLitter = () => {
    if (window.confirm('Are you sure you want to delete this litter? This action cannot be undone.')) {
      // Delete logic here
    }
  };

  const handleManagePuppies = () => {
    navigate(`/dashboard/litters/${id}/puppies`);
  };

  const handleAddPuppy = () => {
    navigate(`/dashboard/litters/${id}/puppies/add`);
  };

  const renderLitterName = () => {
    if (!litter) return 'Litter Details';
    
    if (litter.name) return litter.name;
    
    const damName = litter.dam_name || 'Unknown Dam';
    const sireName = litter.sire_name || 'Unknown Sire';
    
    return `${damName} & ${sireName}`;
  };

  const showErrorNotificationHandler = (message) => {
    setError(message);
    setShowErrorNotification(true);
  };

  const formatPropertyName = (propertyName) => {
    if (!propertyName) return '';
    return propertyName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const formatPropertyValue = (value, propertyName) => {
    if (value === null || value === undefined) {
      return 'Not specified';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (propertyName.includes('date') || propertyName.includes('_at')) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch (e) {
        return value;
      }
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return value.toString();
  };

  const shouldDisplayProperty = (propertyName, value) => {
    const excludedProperties = ['__proto__', 'constructor', 'prototype'];
    if (excludedProperties.includes(propertyName)) {
      return false;
    }
    
    if (typeof value === 'function') {
      return false;
    }
    
    return true;
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
              {litter.litter_name || 
               `${litter.dam?.call_name || 'Unknown Dam'} & ${litter.sire?.call_name || 'Unknown Sire'}`}
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
                    Whelp Date
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
                      {puppies.length}/{litter.num_puppies || 0}
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
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Dam (Mother)
                      </Typography>
                      {litter.dam ? (
                        <>
                          <Typography variant="body1">
                            {litter.dam.call_name || 'Unnamed'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {litter.dam_id}
                          </Typography>
                          {litter.dam.birth_date && (
                            <Typography variant="body2" color="text.secondary">
                              Born: {new Date(litter.dam.birth_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant="body1">
                          {litter.dam_id ? `ID: ${litter.dam_id}` : 'Not specified'}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Sire (Father)
                      </Typography>
                      {litter.sire ? (
                        <>
                          <Typography variant="body1">
                            {litter.sire.call_name || 'Unnamed'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {litter.sire_id}
                          </Typography>
                          {litter.sire.birth_date && (
                            <Typography variant="body2" color="text.secondary">
                              Born: {new Date(litter.sire.birth_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant="body1">
                          {litter.sire_id ? `ID: ${litter.sire_id}` : 'Not specified'}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PetsIcon sx={{ mr: 1, color: 'primary.light' }} />
                Puppies
              </Typography>

              {puppies.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No puppies have been added to this litter yet.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/dashboard/litters/${id}/puppies/add`)}
                  >
                    Add First Puppy
                  </Button>
                </Box>
              ) : (
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Puppies ({puppies.length} of {litter.num_puppies || 0})
                </Typography>
              )}

              {puppies.length > 0 ? (
                <Grid container spacing={2}>
                  {puppies.map((puppy) => (
                    <Grid item xs={12} sm={6} md={4} key={puppy.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6">
                            {puppy.call_name || puppy.name || `Puppy #${puppy.id}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Gender: {puppy.gender || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Color: {puppy.color || 'Unknown'}
                          </Typography>
                          {puppy.birth_date && (
                            <Typography variant="body2" color="text.secondary">
                              Born: {new Date(puppy.birth_date).toLocaleDateString()}
                            </Typography>
                          )}
                          <Button 
                            size="small" 
                            variant="outlined" 
                            sx={{ mt: 1 }}
                            component={Link}
                            to={`/dashboard/dogs/${puppy.id}`}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {litter.num_puppies > 0 ? 
                      `No puppies have been added yet, but this litter should have ${litter.num_puppies}.` : 
                      'No puppies recorded for this litter.'}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate(`/dashboard/puppies/new?litter=${litter.id}`)}
                    startIcon={<span>+</span>}
                  >
                    Add First Puppy
                  </Button>
                </Box>
              )}
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
      <Snackbar
        open={showErrorNotification}
        autoHideDuration={6000}
        onClose={() => setShowErrorNotification(false)}
      >
        <Alert onClose={() => setShowErrorNotification(false)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default LitterDetail; 