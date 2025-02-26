import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDog } from '../context/DogContext';
import { formatDate, calculateAge } from '../utils/dateUtils';
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
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

function DogDetails() {
  const { dogId, dogName } = useParams();
  const navigate = useNavigate();
  const { dogs, loading, error, refreshDogs } = useDog();
  const [activeTab, setActiveTab] = useState(0);
  const [dogDetail, setDogDetail] = useState(null);
  const [heatCycles, setHeatCycles] = useState([]);
  const [heatsLoading, setHeatsLoading] = useState(false);

  // Extract the numeric ID from the dogId parameter
  const extractNumericId = () => {
    // Remove the 3-digit offset we added
    return parseInt(dogId, 10) - 100;
  };

  const numericId = extractNumericId();

  // Find the dog in our context
  useEffect(() => {
    if (dogs && dogs.length > 0) {
      const foundDog = dogs.find(dog => dog.id === numericId);
      setDogDetail(foundDog);
    }
  }, [dogs, numericId]);

  // If we don't have the dog in context, fetch it directly
  useEffect(() => {
    const fetchDogDetails = async () => {
      if (!dogDetail && !loading) {
        try {
          const token = localStorage.getItem('token');
          // Use the numeric ID for the API call
          const response = await fetch(`${API_URL}/dogs/${numericId}/`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : ''
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch dog details');
          }
          
          const data = await response.json();
          setDogDetail(data);
        } catch (error) {
          console.error('Error fetching dog details:', error);
        }
      }
    };
    
    fetchDogDetails();
  }, [numericId, dogDetail, loading]);

  // Fetch heat cycles for female dogs
  useEffect(() => {
    const fetchHeatCycles = async () => {
      if (dogDetail && dogDetail.gender === 'Female') {
        setHeatsLoading(true);
        try {
          const token = localStorage.getItem('token');
          // Use the numeric ID for the API call
          const response = await fetch(`${API_URL}/heats/?dog_id=${numericId}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : ''
            }
          });
          
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
  }, [numericId, dogDetail]);

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
    
    // Otherwise, construct the full URL
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Get gender icon
  const GenderIcon = dogDetail?.gender === 'Male' ? MaleIcon : FemaleIcon;
  const genderColor = dogDetail?.gender === 'Male' ? '#1976d2' : '#d32f2f';

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
    navigate(`/dashboard/dogs/edit/${numericId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {loading ? (
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading dog details...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', color: 'error.main', my: 4 }}>
          <Typography variant="h6">Error: {error}</Typography>
          <Button onClick={refreshDogs} variant="contained" sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      ) : !dogDetail ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6">Dog not found</Typography>
          <Button onClick={() => navigate('/dashboard')} variant="contained" sx={{ mt: 2 }}>
            Return to Dashboard
          </Button>
        </Box>
      ) : (
        <>
          {/* Header with back button */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton 
              onClick={() => navigate('/dashboard')} 
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              {dogDetail.call_name || dogDetail.name}
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
                  {dogDetail.cover_photo || dogDetail.profile_photo ? (
                    <img 
                      src={getImageUrl(dogDetail.cover_photo || dogDetail.profile_photo)} 
                      alt={dogDetail.name}
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
                    label={dogDetail.status || 'Active'} 
                    color={dogDetail.status === 'Active' ? 'success' : 'default'}
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10 
                    }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    {dogDetail.call_name || dogDetail.name}
                    <GenderIcon sx={{ ml: 1, color: genderColor }} />
                  </Typography>
                  
                  {dogDetail.registered_name && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {dogDetail.registered_name}
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <CakeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">
                      Born: {formatDate(dogDetail.birth_date)} 
                      {dogDetail.birth_date && (
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({dogDetail.is_adult ? 
                            formatAdultAge(dogDetail.birth_date) : 
                            calculateAge(dogDetail.birth_date)})
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                  
                  {/* Breed information */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <PetsIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">
                      Breed: {dogDetail.breed || 'Pembroke Welsh Corgi'}
                    </Typography>
                  </Box>
                  
                  {/* Microchip if available */}
                  {dogDetail.microchip && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <DocumentIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2">
                        Microchip: {dogDetail.microchip}
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
                      {dogDetail.description ? (
                        <Typography variant="body1">{dogDetail.description}</Typography>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No additional information available for this dog.
                        </Typography>
                      )}
                      
                      <Divider sx={{ my: 3 }} />
                      
                      <Typography variant="h6" sx={{ mb: 2 }}>Registration Details</Typography>
                      <Grid container spacing={2}>
                        {dogDetail.registration_number && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2">Registration Number</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {dogDetail.registration_number}
                            </Typography>
                          </Grid>
                        )}
                        {dogDetail.registry && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2">Registry</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {dogDetail.registry}
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
                      
                      {/* Heat Cycles section for female dogs */}
                      {dogDetail.gender === 'Female' && (
                        <>
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
                      
                      {/* Breeding section depending on gender */}
                      {dogDetail.gender === 'Female' ? (
                        // For females - Litters
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <PetsIcon sx={{ mr: 1, color: 'primary.light' }} />
                            Litters
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No litters recorded for this dog.
                          </Typography>
                        </Box>
                      ) : (
                        // For males - Sired Litters
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <PetsIcon sx={{ mr: 1, color: 'primary.light' }} />
                            Sired Litters
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No sired litters recorded for this dog.
                          </Typography>
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
        </>
      )}
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