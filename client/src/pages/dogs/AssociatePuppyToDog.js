import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getDogWithPuppyHistory, 
  associateDogWithPuppy, 
  disassociateDogFromPuppy,
  getLitter,
  getLitterPuppies,
  apiGet, apiPut
} from '../../utils/apiUtils';
import { 
  Typography, 
  Button, 
  Alert, 
  CircularProgress, 
  Container, 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Grid, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { formatDate } from '../../utils/dateUtils';

const AssociatePuppyToDog = () => {
  const { dogId } = useParams();
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [associating, setAssociating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [puppyInfo, setPuppyInfo] = useState(null);
  
  // For the improved UI
  const [litters, setLitters] = useState([]);
  const [selectedLitterId, setSelectedLitterId] = useState('');
  const [puppiesInLitter, setPuppiesInLitter] = useState([]);
  const [selectedPuppyId, setSelectedPuppyId] = useState('');
  const [loadingLitters, setLoadingLitters] = useState(false);
  const [loadingPuppies, setLoadingPuppies] = useState(false);

  // Function to fetch dog data with puppy history
  const fetchDogData = async () => {
    setLoading(true);
    try {
      console.log(`Attempting to fetch dog ${dogId} with puppy history...`);
      // First try to get dog with puppy history
      const response = await getDogWithPuppyHistory(dogId);
      
      if (response.ok) {
        console.log('Successfully fetched dog with puppy history:', response.data);
        setDog(response.data);
        // If dog already has an associated puppy, fetch its details
        if (response.data.puppy_id) {
          setSelectedPuppyId(response.data.puppy_id);
          setPuppyInfo(response.data.puppy_info);
        }
      } else {
        console.log('Endpoint not available, falling back to standard dog fetch');
        // Fallback to standard dog fetch if the endpoint is not available
        const fallbackResponse = await apiGet(`dogs/${dogId}`);
        if (fallbackResponse.ok) {
          console.log('Successfully fetched dog with fallback:', fallbackResponse.data);
          setDog(fallbackResponse.data);
          
          // If dog has puppy_id, fetch the puppy separately
          if (fallbackResponse.data.puppy_id) {
            setSelectedPuppyId(fallbackResponse.data.puppy_id);
            const puppyResponse = await apiGet(`puppies/${fallbackResponse.data.puppy_id}`);
            if (puppyResponse.ok) {
              setPuppyInfo(puppyResponse.data);
            }
          }
        } else {
          setError(`Failed to load dog: ${fallbackResponse.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error in fetchDogData:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format litter name in a user-friendly way
  const formatLitterName = (litter) => {
    // Get the date string
    const dateStr = litter.whelp_date 
      ? new Date(litter.whelp_date).toLocaleDateString() 
      : litter.expected_date 
        ? new Date(litter.expected_date).toLocaleDateString() + ' (expected)'
        : 'No date';
    
    // Format as "Dam x Sire - Date" or use litter name if available
    if (litter.name) {
      return `${litter.name} - ${dateStr}`;
    } else if (litter.dam_name && litter.sire_name) {
      return `${litter.dam_name} x ${litter.sire_name} - ${dateStr}`;
    } else {
      return `Litter #${litter.id} - ${dateStr}`;
    }
  };

  // Fetch dog and litters on component mount
  useEffect(() => {
    if (dogId) {
      fetchDogData();
      fetchLitters();
    }
  }, [dogId]);

  // Fetch all litters
  const fetchLitters = async () => {
    setLoadingLitters(true);
    try {
      console.log('Fetching litters...');
      // Use the correct endpoint without leading slash
      const response = await apiGet('litters');
      console.log('Litters response:', response);
      
      if (response.ok) {
        const littersData = Array.isArray(response.data) ? response.data : [];
        console.log('Litters data:', littersData);
        
        const sortedLitters = [...littersData].sort((a, b) => {
          if (a.whelp_date && b.whelp_date) {
            return new Date(b.whelp_date) - new Date(a.whelp_date);
          }
          if (a.expected_date && b.expected_date) {
            return new Date(b.expected_date) - new Date(a.expected_date);
          }
          return b.id - a.id;
        });
        
        setLitters(sortedLitters);
      } else {
        console.error('Failed to fetch litters:', response.error);
        setLitters([]); 
      }
    } catch (err) {
      console.error('Error fetching litters:', err);
      setLitters([]); 
    } finally {
      setLoadingLitters(false);
    }
  };

  // Fetch puppies when a litter is selected
  useEffect(() => {
    if (selectedLitterId) {
      fetchPuppiesForLitter(selectedLitterId);
    } else {
      setPuppiesInLitter([]);
      setSelectedPuppyId('');
    }
  }, [selectedLitterId]);

  const fetchPuppiesForLitter = async (litterId) => {
    setLoadingPuppies(true);
    try {
      // Use the correct endpoint without leading slash
      const response = await getLitterPuppies(litterId);
      console.log('Puppies response:', response);
      
      if (response.ok) {
        setPuppiesInLitter(response.data);
      } else {
        console.error('Failed to fetch puppies for litter:', response.error);
        setPuppiesInLitter([]);
      }
    } catch (err) {
      console.error('Error fetching puppies:', err);
      setPuppiesInLitter([]);
    } finally {
      setLoadingPuppies(false);
    }
  };

  // Handle litter selection change
  const handleLitterChange = (event) => {
    console.log('Litter selected:', event.target.value);
    setSelectedLitterId(event.target.value);
    setSelectedPuppyId('');
  };

  // Handle puppy selection change
  const handlePuppyChange = (event) => {
    console.log('Puppy selected:', event.target.value);
    setSelectedPuppyId(event.target.value);
  };

  // Handle form submission to associate puppy
  const handleAssociatePuppy = async (e) => {
    if (e) e.preventDefault();
    
    if (!selectedPuppyId) {
      setError("Please select a puppy to associate with this dog");
      return;
    }

    setAssociating(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`Associating dog ${dogId} with puppy ${selectedPuppyId}`);
      
      // Try the dedicated endpoint first
      const response = await associateDogWithPuppy(dogId, selectedPuppyId);
      
      if (response.ok) {
        console.log('Successfully associated puppy with dog:', response.data);
        setSuccess(true);
        // Refresh dog data to show the association
        await fetchDogData();
      } else {
        console.log('Association endpoint failed, attempting fallback...');
        
        // Fallback: Update the dog record directly
        const fallbackResponse = await apiPut(`dogs/${dogId}`, { 
          puppy_id: selectedPuppyId 
        });
        
        if (fallbackResponse.ok) {
          console.log('Successfully associated puppy with dog using fallback');
          setSuccess(true);
          // Refresh dog data to show the association
          await fetchDogData();
        } else {
          console.error('Failed to associate puppy:', fallbackResponse.error);
          setError(`Failed to associate puppy: ${fallbackResponse.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error associating puppy:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setAssociating(false);
    }
  };

  // Handle disassociation
  const handleDisassociate = async () => {
    setAssociating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await disassociateDogFromPuppy(dogId);
      
      if (response.ok) {
        setSuccess(`Successfully removed puppy association from dog ${dog.call_name}`);
        const updatedDogResponse = await getDogWithPuppyHistory(dogId);
        if (updatedDogResponse.ok) {
          setDog(updatedDogResponse.data);
          setPuppyInfo(null);
          setSelectedPuppyId('');
          setSelectedLitterId('');
        }
      } else {
        setError(`Failed to remove association: ${response.error}`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setAssociating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading dog details...</Typography>
      </Box>
    );
  }

  if (!dog) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || 'Dog not found'}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/dashboard/dogs"
          sx={{ mt: 2 }}
        >
          Back to Dogs
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          component={Link} 
          to={`/dashboard/dogs/${dogId}`}
          sx={{ mr: 2 }}
        >
          Back to Dog
        </Button>
        <Typography variant="h4">
          Associate Puppy Record with {dog.call_name}
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title={dog.call_name} 
          subheader={dog.breeding_status ? `Breeding Status: ${dog.breeding_status}` : ''}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography><strong>Registered Name:</strong> {dog.registered_name || 'N/A'}</Typography>
              <Typography><strong>Breed:</strong> {dog.breed?.breed_name || dog.breed || 'N/A'}</Typography>
              <Typography><strong>Birth Date:</strong> {formatDate(dog.birth_date) || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><strong>Gender:</strong> {dog.gender || 'N/A'}</Typography>
              <Typography><strong>Color:</strong> {dog.color || 'N/A'}</Typography>
              <Typography><strong>Microchip:</strong> {dog.microchip_id || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {puppyInfo ? (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Associated Puppy Record" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography><strong>Puppy ID:</strong> {puppyInfo.id}</Typography>
                <Typography><strong>Name:</strong> {puppyInfo.name || 'N/A'}</Typography>
                <Typography><strong>Gender:</strong> {puppyInfo.gender || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Color:</strong> {puppyInfo.color || 'N/A'}</Typography>
                <Typography><strong>Litter ID:</strong> {puppyInfo.litter_id || 'N/A'}</Typography>
                {dog.birth_litter && (
                  <Typography><strong>Litter Name:</strong> {dog.birth_litter.name || 'N/A'}</Typography>
                )}
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDisassociate} 
                disabled={associating}
              >
                {associating ? 'Removing...' : 'Remove Puppy Association'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Associate with Puppy Record" />
          <CardContent>
            <form onSubmit={(e) => handleAssociatePuppy(e)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="litter-select-label">Select Litter</InputLabel>
                    <Select
                      labelId="litter-select-label"
                      id="litter-select"
                      value={selectedLitterId}
                      onChange={handleLitterChange}
                      label="Select Litter"
                      disabled={loadingLitters}
                    >
                      <MenuItem value="">
                        <em>Select a litter</em>
                      </MenuItem>
                      {litters.map((litter) => (
                        <MenuItem key={litter.id} value={litter.id}>
                          {formatLitterName(litter)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {loadingPuppies && (
                  <Grid item xs={12} sx={{ textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2">Loading puppies...</Typography>
                  </Grid>
                )}

                {selectedLitterId && !loadingPuppies && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="puppy-select-label">Select Puppy</InputLabel>
                      <Select
                        labelId="puppy-select-label"
                        id="puppy-select"
                        value={selectedPuppyId}
                        onChange={handlePuppyChange}
                        label="Select Puppy"
                        disabled={puppiesInLitter.length === 0}
                      >
                        <MenuItem value="">
                          <em>Select a puppy</em>
                        </MenuItem>
                        {puppiesInLitter.map((puppy) => (
                          <MenuItem key={puppy.id} value={puppy.id}>
                            {puppy.name || `Puppy #${puppy.id}`} - {puppy.gender || 'Unknown'} - {puppy.color || 'Unknown color'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {puppiesInLitter.length === 0 && !loadingPuppies && (
                      <Typography color="error" sx={{ mt: 1 }}>
                        No puppies found in this litter
                      </Typography>
                    )}
                  </Grid>
                )}

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={associating || !selectedPuppyId}
                    sx={{ 
                      mr: 2, 
                      backgroundColor: '#1976d2', 
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      },
                      '&:disabled': {
                        backgroundColor: '#e0e0e0',
                        color: '#9e9e9e'
                      }
                    }}
                  >
                    {associating ? 'Associating...' : 'Associate with Puppy'}
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    component={Link}
                    to={`/dashboard/dogs/${dogId}`}
                  >
                    Cancel
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default AssociatePuppyToDog;
