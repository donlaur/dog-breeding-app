import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDog } from '../context/DogContext';
import { formatDate, formatAge } from '../utils/dateUtils';
import { API_URL } from '../config';
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
  Chip,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
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
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { apiGet, formatApiUrl } from '../utils/apiUtils';

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
    const loadDog = async () => {
      if (!dogId) return;
      
      try {
        // First try to get from context
        let foundDog = dogs.find(d => d.id === parseInt(dogId));
        
        // If not in context, fetch directly from API
        if (!foundDog) {
          const response = await apiGet(`dogs/${dogId}`);
          if (response && response.ok && response.data) {
            foundDog = response.data;
          }
        }
        
        if (foundDog) {
          console.log("Loaded dog data:", foundDog);
          setDog(foundDog);
        }
      } catch (err) {
        console.error("Error in loadDog:", err);
      } finally {
        // Only set loading to false if we either have a dog or a definitive error
        setLoading(false);
      }
    };
    
    loadDog();
  }, [dogId, dogs]);
  
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

  // Add effect to fetch sired litters for male dogs
  useEffect(() => {
    const fetchSiredLitters = async () => {
      if (dog && dog.gender === 'Male') {
        setLittersLoading(true);
        try {
          const response = await apiGet(`litters?sire_id=${dogId}`);
          if (response && response.ok) {
            setSiredLitters(response.data || []);
          }
        } catch (error) {
          console.error('Error fetching sired litters:', error);
        } finally {
          setLittersLoading(false);
        }
      }
    };

    fetchSiredLitters();
  }, [dogId, dog]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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

  // Get gender icon
  const GenderIcon = dog?.gender === 'Male' ? MaleIcon : FemaleIcon;
  const genderColor = dog?.gender === 'Male' ? '#1976d2' : '#d32f2f';

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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!dog) {
    return (
      <div className="not-found-container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Dog Not Found</h2>
        <p>The dog you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/dashboard/dogs')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Go to Dogs
        </button>
      </div>
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
          {dog.call_name || dog.name}
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
              {dog.cover_photo || dog.profile_photo ? (
                <img 
                  src={getImageUrl(dog.cover_photo || dog.profile_photo)} 
                  alt={dog.name}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                />
              ) : (
                <PetsIcon sx={{ fontSize: 80, color: 'grey.500' }} />
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
                {dog.call_name || dog.name}
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
              {dog.microchip && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <DocumentIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">
                    Microchip: {dog.microchip}
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
                  
                  {dog.gender === 'Male' ? (
                    <>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PetsIcon sx={{ mr: 1, color: 'primary.light' }} />
                          Sired Litters
                        </Typography>
                        
                        {littersLoading ? (
                          <LinearProgress sx={{ my: 2 }} />
                        ) : siredLitters.length > 0 ? (
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Dam</TableCell>
                                  <TableCell>Whelp Date</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Puppies</TableCell>
                                  <TableCell align="right">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {siredLitters.map((litter) => (
                                  <TableRow key={litter.id} hover>
                                    <TableCell>{litter.dam_name || 'Unknown'}</TableCell>
                                    <TableCell>{formatDate(litter.whelp_date)}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={litter.status} 
                                        color={litter.status === 'Born' ? 'success' : 'default'}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>{litter.num_puppies || 0}</TableCell>
                                    <TableCell align="right">
                                      <Button
                                        size="small"
                                        onClick={() => navigate(`/dashboard/litters/${litter.id}`)}
                                      >
                                        View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No sired litters recorded for this dog.
                          </Typography>
                        )}
                      </Box>
                    </>
                  ) : (
                    <>
                      {/* Heat Cycles section for female dogs */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                          <HeartIcon sx={{ mr: 1, color: 'error.light' }} />
                          Heat Cycles
                        </Typography>
                        <Button 
                          size="small" 
                          variant="outlined"
                          startIcon={<CalendarIcon />}
                          onClick={() => navigate('/dashboard/heats')}
                        >
                          Manage Heats
                        </Button>
                      </Box>
                      
                      {heatsLoading ? (
                        <LinearProgress sx={{ my: 2 }} />
                      ) : heatCycles && heatCycles.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Notes</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {heatCycles.map((heat) => {
                                const statusInfo = getHeatStatusDisplay(heat.status);
                                const duration = calculateDaysBetween(heat.start_date, heat.end_date);
                                
                                return (
                                  <TableRow key={heat.id} hover>
                                    <TableCell>{formatDate(heat.start_date)}</TableCell>
                                    <TableCell>{heat.end_date ? formatDate(heat.end_date) : 'In progress'}</TableCell>
                                    <TableCell>
                                      {duration ? `${duration} days` : '-'}
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={statusInfo.label} 
                                        size="small"
                                        sx={{ 
                                          backgroundColor: `${statusInfo.color}`,
                                          color: 'white',
                                          fontSize: '0.75rem'
                                        }} 
                                      />
                                    </TableCell>
                                    <TableCell>{heat.notes || '-'}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          No heat cycles recorded for this dog.
                        </Typography>
                      )}
                    </>
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