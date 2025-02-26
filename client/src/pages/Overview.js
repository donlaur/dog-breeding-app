import React, { useEffect } from 'react';
import { useDog } from '../context/DogContext';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate, calculateAge } from '../utils/dateUtils';
import { API_URL } from '../config';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Avatar,
  Divider,
  LinearProgress,
  IconButton,
  Button,
  Tooltip
} from '@mui/material';
import {
  Pets as PetsIcon,
  Visibility as LittersIcon, 
  Favorite as HeatsIcon, 
  Email as MessagesIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

function Overview() {
  const navigate = useNavigate();
  // Get data from our context
  const { 
    dogs, 
    litters, 
    loading, 
    error, 
    refreshDogs, 
    refreshLitters 
  } = useDog();
  
  // Make sure we refresh data when component mounts
  useEffect(() => {
    // Only trigger refresh if needed (no data available)
    if (!dogs.length) {
      refreshDogs();
    }
    if (!litters.length) {
      refreshLitters();
    }
  }, [dogs.length, litters.length, refreshDogs, refreshLitters]);
  
  // Filter adult dogs (handle undefined by using empty array as fallback)
  const adultDogs = (dogs || []).filter(dog => dog.is_adult);
  
  // Filter puppies (handle undefined by using empty array as fallback)
  const puppies = (dogs || []).filter(dog => !dog.is_adult);
  
  // Count for upcoming heats and messages (placeholder for now)
  const upcomingHeats = 0;
  const newMessages = 0;

  // Function to format adult dog age differently from puppies
  const formatAdultAge = (birthDate) => {
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

  // Stats cards data based on the fetched data
  const statCards = [
    { 
      title: 'Adult Dogs', 
      value: adultDogs.length, 
      icon: <PetsIcon />, 
      color: '#1565c0',
      bgColor: '#e3f2fd',
      path: '/dashboard/dogs'
    },
    { 
      title: 'Puppies', 
      value: puppies.length, 
      icon: <PetsIcon fontSize="small" />, 
      color: '#e65100',
      bgColor: '#fff3e0',
      path: '/dashboard/puppies'
    },
    { 
      title: 'Active Litters', 
      value: litters?.length || 0, 
      icon: <LittersIcon />, 
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      path: '/dashboard/litters'
    },
    { 
      title: 'Upcoming Heats', 
      value: upcomingHeats, 
      icon: <HeatsIcon />, 
      color: '#c62828',
      bgColor: '#ffebee',
      path: '/dashboard/heats'
    },
    { 
      title: 'New Messages', 
      value: newMessages, 
      icon: <MessagesIcon />, 
      color: '#6a1b9a',
      bgColor: '#f3e5f5',
      path: '/dashboard/messages'
    }
  ];

  // Get gender icon and color
  const getGenderDisplay = (gender) => {
    return gender === 'Male' ? 
      { icon: '♂', color: '#1976d2' } : 
      { icon: '♀', color: '#d32f2f' };
  };

  // Function to navigate to dog details
  const navigateToDogDetails = (dog) => {
    // Create a URL-friendly version of the dog's name
    const namePart = dog.call_name || dog.name || '';
    const slugName = namePart.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
      
    // Add a 3-digit offset (100) to make IDs appear bigger but not too big
    const displayId = dog.id + 100;
    
    // Combine for a SEO-friendly URL
    navigate(`/dashboard/dogs/${displayId}/${slugName}`);
  };

  // Show loading state if data is loading
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'error.main' }}>
        <Typography>Error loading data: {error}</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={() => {
            refreshDogs();
            refreshLitters();
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'medium' }}>
        Breeding Program Overview
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card elevation={1}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {card.title}
                  </Typography>
                  <Avatar
                    sx={{
                      bgcolor: card.bgColor,
                      color: card.color,
                      width: 32,
                      height: 32
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ mb: 0 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Adult Dogs Section */}
        <Grid item xs={12}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PetsIcon color="primary" />
                  <Typography variant="h6">Adult Dogs</Typography>
                </Box>
                <Box>
                  <Button 
                    component={Link} 
                    to="/dashboard/dogs/add" 
                    variant="contained" 
                    size="small"
                    startIcon={<AddIcon />}
                    sx={{ mr: 1 }}
                  >
                    Add Dog
                  </Button>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {adultDogs.length > 0 ? (
                <Box>
                  {adultDogs.map((dog, index) => (
                    <React.Fragment key={dog.id || index}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          py: 1.5, 
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            borderRadius: 1,
                          },
                          position: 'relative',
                          pr: 2 // Add padding for the chevron
                        }}
                        onClick={() => navigateToDogDetails(dog)}
                      >
                        <Avatar 
                          src={getImageUrl(dog.cover_photo || dog.profile_photo)}
                          alt={dog.name}
                          sx={{ width: 48, height: 48 }}
                        >
                          {!dog.cover_photo && !dog.profile_photo && <PetsIcon />}
                        </Avatar>
                        <Box sx={{ ml: 2, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 'medium',
                                fontSize: '1.1rem',
                                mr: 1
                              }}
                            >
                              {dog.call_name || dog.name}
                            </Typography>
                            <Typography 
                              sx={{ 
                                fontWeight: 'bold',
                                color: getGenderDisplay(dog.gender).color,
                                display: 'flex',
                                alignItems: 'center' 
                              }}
                            >
                              {getGenderDisplay(dog.gender).icon}
                            </Typography>
                            <Tooltip title={`Born: ${formatDate(dog.birth_date)}`}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  ml: 1, 
                                  color: 'text.secondary',
                                  backgroundColor: 'rgba(0,0,0,0.04)',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                }}
                              >
                                {formatAdultAge(dog.birth_date)}
                              </Typography>
                            </Tooltip>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {dog.registered_name || 'Pembroke Welsh Corgi'}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          bgcolor: dog.status === 'Active' ? '#e8f5e9' : '#f5f5f5',
                          color: dog.status === 'Active' ? '#2e7d32' : '#757575',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                          mr: 2
                        }}>
                          {dog.status || 'Active'}
                        </Box>
                        <ChevronRightIcon 
                          fontSize="small" 
                          sx={{ 
                            color: 'text.secondary',
                            position: 'absolute',
                            right: 8
                          }} 
                        />
                      </Box>
                      {index < adultDogs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: 'text.secondary',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ mb: 2 }}>No dogs added to your program yet</Typography>
                  <Button 
                    component={Link} 
                    to="/dashboard/dogs/add" 
                    variant="contained" 
                    startIcon={<AddIcon />}
                  >
                    Add Your First Dog
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Puppies Section */}
        <Grid item xs={12}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PetsIcon color="primary" fontSize="small" />
                  <Typography variant="h6">Puppies</Typography>
                </Box>
                <Box>
                  <Button 
                    component={Link} 
                    to="/dashboard/puppies/add" 
                    variant="contained" 
                    size="small"
                    startIcon={<AddIcon />}
                    sx={{ mr: 1 }}
                  >
                    Add Puppy
                  </Button>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {puppies.length > 0 ? (
                <Box>
                  {puppies.map((puppy, index) => (
                    <React.Fragment key={puppy.id || index}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          py: 1.5, 
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            borderRadius: 1,
                          },
                          position: 'relative',
                          pr: 2 // Add padding for the chevron
                        }}
                        onClick={() => navigateToDogDetails(puppy)}
                      >
                        <Avatar 
                          src={getImageUrl(puppy.profile_photo)}
                          alt={puppy.name}
                          sx={{ width: 48, height: 48 }}
                        >
                          {!puppy.profile_photo && <PetsIcon fontSize="small" />}
                        </Avatar>
                        <Box sx={{ ml: 2, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 'medium',
                                fontSize: '1.1rem',  // Slightly larger than default
                                mr: 1  // Add margin to separate from gender icon
                              }}
                            >
                              {puppy.call_name || puppy.name}
                            </Typography>
                            <Typography 
                              sx={{ 
                                fontWeight: 'bold',
                                color: getGenderDisplay(puppy.gender).color,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {getGenderDisplay(puppy.gender).icon}
                            </Typography>
                            <Tooltip title={`Born: ${formatDate(puppy.birth_date)}`}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  ml: 1, 
                                  color: 'text.secondary',
                                  backgroundColor: 'rgba(0,0,0,0.04)',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                }}
                              >
                                {calculateAge(puppy.birth_date)}
                              </Typography>
                            </Tooltip>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {puppy.registered_name || 'Pembroke Welsh Corgi'}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          bgcolor: '#e3f2fd',
                          color: '#1565c0',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'medium'
                        }}>
                          Puppy
                        </Box>
                        <ChevronRightIcon 
                          fontSize="small" 
                          sx={{ 
                            color: 'text.secondary',
                            position: 'absolute',
                            right: 8
                          }} 
                        />
                      </Box>
                      {index < puppies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: 'text.secondary',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ mb: 2 }}>No puppies in your program yet</Typography>
                  <Button 
                    component={Link} 
                    to="/dashboard/puppies/add" 
                    variant="contained" 
                    startIcon={<AddIcon />}
                  >
                    Add Your First Puppy
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Litters Section */}
        <Grid item xs={12}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LittersIcon color="primary" />
                  <Typography variant="h6">Litters</Typography>
                </Box>
                <Box>
                  <Button 
                    component={Link} 
                    to="/dashboard/litters/add" 
                    variant="contained" 
                    size="small"
                    startIcon={<AddIcon />}
                    sx={{ mr: 1 }}
                  >
                    Add Litter
                  </Button>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {/* Show litters if available */}
              {(litters && litters.length > 0) ? (
                <Box>
                  {litters.map((litter, index) => (
                    <React.Fragment key={litter.id || index}>
                      <Box sx={{ display: 'flex', py: 1.5, alignItems: 'center' }}>
                        <Avatar 
                          src={getImageUrl(litter.cover_photo)}
                          alt={litter.name || `Litter ${index + 1}`}
                          sx={{ width: 48, height: 48 }}
                        >
                          {!litter.cover_photo && <LittersIcon />}
                        </Avatar>
                        <Box sx={{ ml: 2, flex: 1 }}>
                          <Typography variant="subtitle1">
                            {litter.name || `Litter ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {litter.dam_name && litter.sire_name ? 
                              `${litter.dam_name} × ${litter.sire_name}` : 
                              formatDate(litter.whelp_date) || 'New Litter'}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          bgcolor: '#e8f5e9',
                          color: '#2e7d32',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'medium'
                        }}>
                          {litter.puppies_count || 0} puppies
                        </Box>
                      </Box>
                      {index < litters.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: 'text.secondary',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ mb: 2 }}>No litters recorded yet</Typography>
                  <Button 
                    component={Link} 
                    to="/dashboard/litters/add" 
                    variant="contained" 
                    startIcon={<AddIcon />}
                  >
                    Create Your First Litter
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Overview; 