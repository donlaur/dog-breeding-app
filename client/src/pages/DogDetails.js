import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDog } from '../context/DogContext';
import { formatDate, formatAge } from '../utils/dateUtils';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet } from '../utils/apiUtils';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  Avatar,
  IconButton,
  LinearProgress,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  Cake as CakeIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Favorite as HeartIcon,
  Assignment as DocumentIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { formatApiUrl } from '../utils/apiUtils';
import { showError } from '../utils/notifications';

function DogDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract dog ID and possible name from URL
  const pathSegments = location.pathname.split('/');
  let dogId = id;
  let possibleNameSegment = '';
  
  // Handle various URL formats
  for (let i = 0; i < pathSegments.length; i++) {
    // Look for a numeric segment that could be an ID
    if (/^\d+$/.test(pathSegments[i])) {
      dogId = dogId || pathSegments[i];
    }
    // Look for a segment that could be a dog name
    else if (pathSegments[i].length > 2 && !/^dashboard$/i.test(pathSegments[i]) && !/^dogs$/i.test(pathSegments[i])) {
      possibleNameSegment = pathSegments[i];
    }
  }
  
  console.log("URL path:", location.pathname);
  console.log("Path segments:", pathSegments);
  console.log("Extracted dog ID:", dogId);
  console.log("Possible dog name segment:", possibleNameSegment);
  
  const { dogs, getDog } = useDog();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPartialData, setIsPartialData] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [heatCycles, setHeatCycles] = useState([]);
  const [heatsLoading, setHeatsLoading] = useState(false);
  const [siredLitters, setSiredLitters] = useState([]);
  const [littersLoading, setLittersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [damLitters, setDamLitters] = useState([]);
  const [loadingLitters, setLoadingLitters] = useState(false);
  
  // Use ref to track loading status
  const loadStatus = useRef({
    attempted: false,
    retryCount: 0
  });
  
  // Log all dogs to help with debugging
  useEffect(() => {
    if (dogs && dogs.length > 0) {
      console.log("All available dogs:", dogs.map(d => ({
        id: d.id,
        name: d.call_name
      })));
    }
  }, [dogs]);
  
  // Effect to load dog based on URL info
  useEffect(() => {
    const fetchDogDetails = async () => {
      if (!dogId) {
        setError('Dog ID is missing');
        setLoading(false);
        showError('Invalid dog ID');
        return;
      }

      setLoading(true);
      // Reset image error state when reloading
      setCoverPhotoError(false);
      
      try {
        debugLog(`Fetching dog details for ID: ${dogId}`);
        // Add a cache-busting parameter to avoid cached responses
        const response = await apiGet(`dogs/${dogId}?_=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(response.error || `Failed to fetch dog (${response.status})`);
        }
        
        setDog(response.data);
        
        if (response.data && response.data.id && response.data.gender) {
          fetchLitters(response.data.id, response.data.gender);
        }
      } catch (error) {
        debugError('Error fetching dog details:', error);
        setError(error.message);
        showError(`Failed to load dog details: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDogDetails();
  }, [dogId, dog?.gender]);
  
  // Fetch heat cycles for female dogs
  useEffect(() => {
    const fetchHeatCycles = async () => {
      if (dog && dog.gender === 'Female') {
        setHeatsLoading(true);
        try {
          // Use our new apiGet utility with query parameters
          const response = await apiGet(`heats?dog_id=${dogId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch heat cycles');
          }
          
          const data = await response.json();
          setHeatCycles(data);
          setHeatsLoading(false);
        } catch (error) {
          console.error('Error fetching heat cycles:', error);
          setHeatsLoading(false);
        }
      }
    };
    
    fetchHeatCycles();
  }, [dogId, dog]);

  // We'll use fetchLitters instead, so we don't need this useEffect

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // State to track image loading errors
  const [coverPhotoError, setCoverPhotoError] = useState(false);

  // Function to get the correct image URL
  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null;
    
    // Handle various photo fields that might be in the API response
    const url = photoUrl.url || photoUrl; // Handle if photo is an object
    
    // If it's already a full URL, use it as is
    if (url.startsWith('http')) {
      return url;
    }
    
    // Import from utils
    return formatApiUrl(url);
  };
  
  // Handler for image load errors
  const handleImageError = () => {
    console.error("Cover photo failed to load, using fallback");
    setCoverPhotoError(true);
  };

  // Get gender icon
  const GenderIcon = dog?.gender === 'Male' ? MaleIcon : FemaleIcon;
  const genderColor = dog?.gender === 'Male' ? '#1976d2' : '#d32f2f';
  
  // Helper to get the correct puppies message
  const getPuppiesMessage = (litter) => {
    if (!litter || !litter.puppies) return 'No puppies have been added to this litter yet.';
    
    // If we have puppy records that match the expected count, show appropriate message
    if (litter.puppies.length === 0) {
      return 'No puppies have been added to this litter yet.';
    } else if (litter.num_puppies > 0 && litter.puppies.length < litter.num_puppies) {
      return `This litter has ${litter.num_puppies} puppies, but only ${litter.puppies.length} have been added individually.`;
    } else {
      return ''; // No message needed, showing the puppies list
    }
  };
  
  // Component to display a litter card with puppies
  const LitterCard = ({ litter, navigate, isDam = false }) => {
    return (
      <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }} key={litter.id}>
        <Box sx={{ 
          p: 2, 
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
              {litter.litter_name || `Litter #${litter.id}`}
            </Typography>
            <Chip 
              label={litter.status || 'Unknown'} 
              color={
                litter.status === 'Born' ? 'success' :
                litter.status === 'Expected' ? 'warning' :
                litter.status === 'Planned' ? 'info' : 'default'
              } 
              size="small" 
              sx={{ mr: 2 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {isDam ? 
                `Sire: ${litter.sire?.call_name || litter.sire?.name || `#${litter.sire_id || 'Unknown'}`}` : 
                `Dam: ${litter.dam?.call_name || litter.dam?.name || `#${litter.dam_id || 'Unknown'}`}`
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {litter.whelp_date ? 
                `Born: ${new Date(litter.whelp_date).toLocaleDateString()}` : 
                litter.expected_date ? 
                `Expected: ${new Date(litter.expected_date).toLocaleDateString()}` : 
                'Date not set'}
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            size="small" 
            component={Link} 
            to={`/dashboard/litters/${litter.id}`}
          >
            Litter Details
          </Button>
        </Box>
        
        {/* Puppies Section */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Puppies ({litter.puppies?.length || litter.num_puppies || 0})
          </Typography>
          
          {(!litter.puppies || litter.puppies.length === 0 || 
            (litter.num_puppies > 0 && litter.puppies.length < litter.num_puppies)) ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {getPuppiesMessage(litter)}
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {litter.puppies.map(puppy => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={puppy.id}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      display: 'flex', 
                      alignItems: 'center',
                      '&:hover': { 
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => navigate(`/dashboard/puppies/${puppy.id}`)}
                  >
                    {puppy.gender === 'Male' ? (
                      <MaleIcon color="primary" sx={{ mr: 1 }} />
                    ) : puppy.gender === 'Female' ? (
                      <FemaleIcon color="error" sx={{ mr: 1 }} />
                    ) : (
                      <PetsIcon sx={{ mr: 1 }} />
                    )}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {puppy.name || `Puppy #${puppy.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {puppy.color || 'Unknown color'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
    );
  };

  // Format heat cycle status with color
  const getHeatStatusDisplay = (status) => {
    switch(status) {
      case 'In Progress':
        return { color: 'warning.main', label: 'In Progress' };
      case 'Completed':
        return { color: 'success.main', label: 'Completed' };
      case 'Bred':
        return { color: 'info.main', label: 'Bred' };
      case 'Confirmed Pregnant':
        return { color: 'secondary.main', label: 'Confirmed Pregnant' };
      default:
        return { color: 'text.secondary', label: status || 'Unknown' };
    }
  };

  // Calculate days between dates
  const calculateDaysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Update edit button navigation
  const navigateToEdit = () => {
    navigate(`/dashboard/dogs/edit/${dogId}`);
  };

  const fetchLitters = async (dogId, gender) => {
    if (!dogId) return;
    
    setLoadingLitters(true);
    try {
      console.log(`Fetching ${gender === 'Male' ? 'sired' : 'dam'} litters for dog ID: ${dogId}`);
      
      // First get all litters
      const response = await apiGet('litters');
      
      if (!response.ok) {
        console.error(`Error fetching litters: ${response.error || response.status}`);
        return;
      }
      
      const allLitters = response.data;
      
      // Manually filter based on gender and ID to ensure we only get the right litters
      const filteredLitters = allLitters.filter(litter => {
        if (gender === 'Male') {
          // Ensure sire_id is exactly matching our dog ID as a number
          return Number(litter.sire_id) === Number(dogId);
        } else {
          // For females, filter by dam_id
          return Number(litter.dam_id) === Number(dogId);
        }
      });
      
      console.log(`Found ${filteredLitters.length} ${gender === 'Male' ? 'sired' : 'dam'} litters after filtering`, filteredLitters);
      
      // For each litter, fetch its puppies
      const littersWithPuppies = await Promise.all(
        filteredLitters.map(async (litter) => {
          try {
            // Only fetch puppies for litters that have puppies
            if (litter.num_puppies > 0) {
              const puppiesResponse = await apiGet(`litters/${litter.id}/puppies`);
              
              if (puppiesResponse && puppiesResponse.ok) {
                return { ...litter, puppies: puppiesResponse.data || [] };
              }
            }
            // Return litter with empty puppies array if fetch failed or no puppies
            return { ...litter, puppies: [] };
          } catch (error) {
            debugError(`Error fetching puppies for litter ${litter.id}:`, error);
            return { ...litter, puppies: [] };
          }
        })
      );
      
      if (gender === 'Male') {
        setSiredLitters(littersWithPuppies);
      } else {
        setDamLitters(littersWithPuppies);
      }
    } catch (error) {
      console.error(`Error fetching litters:`, error);
    } finally {
      setLoadingLitters(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/dogs')}
          sx={{ mb: 3 }}
        >
          Back to Dogs
        </Button>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }
  
  if (!dog) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/dogs')}
          sx={{ mb: 3 }}
        >
          Back to Dogs
        </Button>
        <Alert severity="warning">
          Dog not found. It may have been deleted.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Header with back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')} 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {dog.dog_name || dog.name}
        </Typography>
        <Box>
          <Button 
            startIcon={<EditIcon />} 
            variant="outlined" 
            sx={{ mr: 1 }}
            onClick={navigateToEdit}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Dog Profile Card */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ 
              position: 'relative', 
              height: 200, 
              bgcolor: 'grey.100',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {!coverPhotoError && (dog.cover_photo || dog.profile_photo) ? (
                <img 
                  src={getImageUrl(dog.cover_photo || dog.profile_photo)} 
                  alt={dog.name}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                  // Add a key with timestamp to force re-render when component updates
                  key={`dog-cover-${Date.now()}`}
                  // Add error handler to catch 404s and other image loading failures
                  onError={handleImageError}
                />
              ) : (
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.05)',
                  color: 'text.secondary'
                }}>
                  <PetsIcon sx={{ fontSize: 80, opacity: 0.7 }} />
                </Box>
              )}
              <Chip 
                label={dog.status || 'Active'} 
                color={dog.status === 'Active' ? 'success' : 'default'}
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10 
                }}
              />
            </Box>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                {dog.dog_name || dog.name}
                <GenderIcon sx={{ ml: 1, color: genderColor }} />
              </Typography>
              
              {dog.registered_name && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {dog.registered_name}
                </Typography>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <CakeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2">
                  Born: {formatDate(dog.birth_date)} 
                  {dog.birth_date && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({formatAge(dog.birth_date)})
                    </Typography>
                  )}
                </Typography>
              </Box>
              
              {/* Breed information */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <PetsIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2">
                  Breed: {dog.breed || 'Pembroke Welsh Corgi'}
                </Typography>
              </Box>
              
              {/* Microchip if available */}
              {dog.microchip_id && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <DocumentIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">
                    Microchip: {dog.microchip_id}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Overview" />
              <Tab label="Health" />
              <Tab label="Breeding" />
              <Tab label="Documents" />
            </Tabs>
            
            <Divider />
            
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>About</Typography>
                  {dog.notes ? (
                    <Typography variant="body1">{dog.notes}</Typography>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      No additional information available for this dog.
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" sx={{ mb: 2 }}>Registration Details</Typography>
                  <Grid container spacing={2}>
                    {dog.registration_number && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Registration Number</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dog.registration_number}
                        </Typography>
                      </Grid>
                    )}
                    {dog.registry && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Registry</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dog.registry}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
              
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Health Information</Typography>
                  <Typography variant="body1" color="text.secondary">
                    Health information will be displayed here.
                  </Typography>
                </Box>
              )}
              
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Breeding Information</Typography>
                  
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <PetsIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      {dog.gender === 'Male' ? 'Sired Litters' : 'Dam Litters'}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ ml: 'auto' }}
                      component={Link}
                      to="/dashboard/litters"
                    >
                      View All Litters
                    </Button>
                  </Box>
                  
                  {loadingLitters ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                    ) : dog?.gender === 'Male' && siredLitters.length > 0 ? (
                      <Box>
                        {siredLitters.map((litter) => (
                          <LitterCard
                            key={litter.id}
                            litter={litter}
                            navigate={navigate}
                            isDam={false}
                          />
                        ))}
                      </Box>
                    ) : dog?.gender === 'Female' && damLitters.length > 0 ? (
                      <Box>
                        {damLitters.map((litter) => (
                          <LitterCard
                            key={litter.id}
                            litter={litter}
                            navigate={navigate}
                            isDam={true}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3, px: 2, backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          No litters {dog?.gender === 'Male' ? 'sired by this dog' : 'recorded for this dam'} yet.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          component={Link} 
                          to="/dashboard/litters" 
                          sx={{ mt: 1 }}
                          size="small"
                        >
                          View All Litters
                        </Button>
                      </Box>
                    )}
                  </Box>
              )}
              
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
                  <Typography variant="body1" color="text.secondary">
                    Documents will be displayed here.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

// Helper function to format age for display
function formatAdultAge(birthDate) {
  if (!birthDate) return '';
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  // Adjust years and months if needed
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Format the result
  if (years > 0 && months > 0) {
    return `${years}y ${months}m`;
  } else if (years > 0) {
    return `${years}y`;
  } else {
    return `${months}m`;
  }
}

export default DogDetails; 