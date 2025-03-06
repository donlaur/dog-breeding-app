/**
 * Shortcode processor for the CMS system
 * 
 * This utility provides functionality for parsing and rendering shortcodes
 * within CMS page content. Shortcodes allow dynamic content embedding
 * like [DisplayDogs gender=Male] or [DisplayDog id=3].
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Divider, 
  CircularProgress,
  Chip
} from '@mui/material';
import { useApi } from '../hooks/useApi';

// Regex for matching shortcodes
// Matches: [ShortcodeName param1=value1 param2="value with spaces"]
const SHORTCODE_REGEX = /\[([a-zA-Z0-9_]+)(?:\s+([^\]]+))?\]/g;

// Regex for parsing attributes within a shortcode
// Matches: param="value with spaces" or param=value
const ATTRIBUTE_REGEX = /([a-zA-Z0-9_]+)=(?:"([^"]*)"|([^ "]*))/g;

/**
 * Parse shortcode attributes from a string
 * @param {string} attributesStr - String containing shortcode attributes
 * @returns {Object} - Object containing parsed attributes
 */
const parseAttributes = (attributesStr) => {
  if (!attributesStr) return {};
  
  const attributes = {};
  let match;
  
  while ((match = ATTRIBUTE_REGEX.exec(attributesStr)) !== null) {
    const [, name, quotedValue, unquotedValue] = match;
    attributes[name] = quotedValue !== undefined ? quotedValue : unquotedValue;
  }
  
  return attributes;
};

// Component to display a dog card
const DogCard = ({ dog }) => {
  if (!dog) return null;
  
  // Default image for dogs without photos
  const defaultDogImage = "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?q=80&w=2487";
  
  return (
    <Card 
      sx={{ 
        maxWidth: 345, 
        margin: '0 auto', 
        mb: 3,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.07)',
        transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="220"
          image={dog.photo_url || defaultDogImage}
          alt={dog.name}
          sx={{
            objectFit: 'cover',
            objectPosition: 'center',
            transition: 'transform 0.5s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        />
        {/* Gender tag pill */}
        <Chip 
          label={dog.gender}
          color={dog.gender === 'Male' ? 'primary' : 'secondary'}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        />
      </Box>
      
      <CardContent sx={{ p: 2.5 }}>
        <Typography 
          gutterBottom 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 600,
            mb: 0.5
          }}
        >
          {dog.name}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {dog.breed || 'Pembroke Welsh Corgi'}
          </Typography>
          {dog.age && (
            <>
              <Box 
                component="span" 
                sx={{ 
                  display: 'inline-block', 
                  mx: 0.7, 
                  width: 4, 
                  height: 4, 
                  borderRadius: '50%', 
                  bgcolor: 'text.disabled' 
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {dog.age}
              </Typography>
            </>
          )}
        </Box>
        
        {dog.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mt: 1.5,
              lineHeight: 1.6
            }}
          >
            {dog.description.length > 120 ? `${dog.description.substring(0, 120)}...` : dog.description}
          </Typography>
        )}
        
        {/* Badges for additional info */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Chip 
            label="AKC Reg" 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ 
              height: 24, 
              fontSize: '0.7rem', 
              fontWeight: 600
            }}
          />
          <Chip 
            label="Health Tested" 
            size="small" 
            color="success" 
            variant="outlined"
            sx={{ 
              height: 24, 
              fontSize: '0.7rem', 
              fontWeight: 600
            }}
          />
          {dog.gender === 'Female' && (
            <Chip 
              label="Breeding Program" 
              size="small" 
              color="secondary" 
              variant="outlined"
              sx={{ 
                height: 24, 
                fontSize: '0.7rem', 
                fontWeight: 600
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Component to display a puppy card
const PuppyCard = ({ puppy }) => {
  if (!puppy) return null;
  
  // Default image for puppies
  const defaultPuppyImage = "https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=2564";
  
  // Status colors and labels
  const getStatusProps = (status) => {
    if (!status) return { color: 'default', label: 'Unknown' };
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'available') {
      return { color: 'success', label: 'Available Now' };
    } else if (statusLower === 'reserved') {
      return { color: 'secondary', label: 'Reserved' };
    } else if (statusLower === 'sold') {
      return { color: 'primary', label: 'Adoption Pending' };
    } else {
      return { color: 'default', label: status };
    }
  };
  
  const statusProps = getStatusProps(puppy.status);
  
  return (
    <Card 
      sx={{ 
        maxWidth: 345, 
        margin: '0 auto', 
        mb: 3,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.07)',
        transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="220"
          image={puppy.photo_url || defaultPuppyImage}
          alt={puppy.name || 'Puppy'}
          sx={{
            objectFit: 'cover',
            objectPosition: 'center',
            transition: 'transform 0.5s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        />
        {/* Status tag */}
        <Chip 
          label={statusProps.label}
          color={statusProps.color}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        />
        
        {/* Age tag - if available */}
        {puppy.age && (
          <Chip 
            label={puppy.age}
            color="primary"
            size="small"
            variant="outlined"
            sx={{ 
              position: 'absolute', 
              bottom: 12, 
              left: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}
          />
        )}
      </Box>
      
      <CardContent sx={{ p: 2.5 }}>
        <Typography 
          gutterBottom 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 600,
            mb: 0.5
          }}
        >
          {puppy.name || `Puppy #${puppy.identifier}`}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {puppy.gender}
          </Typography>
          
          <Box 
            component="span" 
            sx={{ 
              display: 'inline-block', 
              mx: 0.7, 
              width: 4, 
              height: 4, 
              borderRadius: '50%', 
              bgcolor: 'text.disabled' 
            }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {puppy.color || 'Pembroke Welsh Corgi'}
          </Typography>
        </Box>
        
        {puppy.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mt: 1.5,
              lineHeight: 1.6
            }}
          >
            {puppy.description.length > 120 ? `${puppy.description.substring(0, 120)}...` : puppy.description}
          </Typography>
        )}
        
        {/* Litter information if available */}
        {puppy.litter_name && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 2,
              p: 1.5,
              backgroundColor: 'background.neutral',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              Litter: {puppy.litter_name}
            </Typography>
          </Box>
        )}
        
        {/* Additional features */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Chip 
            label="AKC Reg" 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ 
              height: 24, 
              fontSize: '0.7rem', 
              fontWeight: 600
            }}
          />
          {(!puppy.status || puppy.status.toLowerCase() === 'available') && (
            <Chip 
              label="Ready to Go" 
              size="small" 
              color="success" 
              variant="outlined"
              sx={{ 
                height: 24, 
                fontSize: '0.7rem', 
                fontWeight: 600
              }}
            />
          )}
          <Chip 
            label="Vet Checked" 
            size="small" 
            color="info" 
            variant="outlined"
            sx={{ 
              height: 24, 
              fontSize: '0.7rem', 
              fontWeight: 600
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Component to display a litter card
const LitterCard = ({ litter }) => {
  if (!litter) return null;
  
  // Default litter image
  const defaultLitterImage = "https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=2564";
  
  // Format birth date
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Status colors and labels for litters
  const getStatusProps = (status) => {
    if (!status) return { color: 'default', label: 'Unknown' };
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'planned' || statusLower === 'upcoming') {
      return { color: 'secondary', label: 'Upcoming', variant: 'default' };
    } else if (statusLower === 'born' || statusLower === 'current') {
      return { color: 'primary', label: 'New Litter', variant: 'default' };
    } else if (statusLower === 'available') {
      return { color: 'success', label: 'Puppies Available', variant: 'default' };
    } else if (statusLower === 'completed' || statusLower === 'past') {
      return { color: 'default', label: 'Past Litter', variant: 'outlined' };
    } else {
      return { color: 'default', label: status, variant: 'outlined' };
    }
  };
  
  const statusProps = getStatusProps(litter.status);
  const birthDate = formatDate(litter.birth_date);
  const isPlanned = litter.status?.toLowerCase() === 'planned' || !litter.birth_date;
  const expectedDate = isPlanned && litter.expected_date ? formatDate(litter.expected_date) : null;
  
  return (
    <Card 
      sx={{ 
        margin: '0 auto', 
        mb: 3,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.07)',
        transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <Grid container>
        {/* Image Section */}
        <Grid item xs={12} sm={4}>
          <Box 
            sx={{ 
              position: 'relative',
              height: '100%',
              minHeight: { xs: 200, sm: '100%' }
            }}
          >
            <CardMedia
              component="img"
              image={litter.photo_url || defaultLitterImage}
              alt={`${litter.dam_name} x ${litter.sire_name} Litter`}
              sx={{
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
            {/* Status tag */}
            <Chip 
              label={statusProps.label}
              color={statusProps.color}
              variant={statusProps.variant}
              size="small"
              sx={{ 
                position: 'absolute', 
                top: 12, 
                left: 12,
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            />
          </Box>
        </Grid>
        
        {/* Content Section */}
        <Grid item xs={12} sm={8}>
          <CardContent sx={{ p: 3 }}>
            <Typography 
              gutterBottom 
              variant="h6" 
              component="div"
              sx={{ 
                fontWeight: 600,
                mb: 1
              }}
            >
              {litter.dam_name} × {litter.sire_name}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: 1 }}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: isPlanned ? 'secondary.main' : 'primary.main',
                    mr: 1
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {isPlanned ? 'Expected: ' : 'Born: '} 
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {isPlanned ? (expectedDate || 'TBD') : birthDate}
                  </Box>
                </Typography>
              </Box>
              
              {litter.num_puppies > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: 'success.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {litter.num_puppies}
                    </Box> puppies
                  </Typography>
                </Box>
              )}
            </Box>
            
            {litter.description && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mt: 1, mb: 2, lineHeight: 1.6 }}
              >
                {litter.description}
              </Typography>
            )}
            
            {/* Tags/features */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
              <Chip 
                label="AKC Registered" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ 
                  height: 24, 
                  fontSize: '0.7rem', 
                  fontWeight: 600
                }}
              />
              <Chip 
                label="Health Tested Parents" 
                size="small" 
                color="success" 
                variant="outlined"
                sx={{ 
                  height: 24, 
                  fontSize: '0.7rem', 
                  fontWeight: 600
                }}
              />
              {litter.status?.toLowerCase() === 'available' && (
                <Chip 
                  label="Accepting Applications" 
                  size="small" 
                  color="secondary" 
                  sx={{ 
                    height: 24, 
                    fontSize: '0.7rem', 
                    fontWeight: 600
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );
};
      return { color: 'success', label: 'Available Now' };
    } else if (statusLower === 'reserved') {
      return { color: 'secondary', label: 'Reserved' };
    } else if (statusLower === 'sold') {
      return { color: 'primary', label: 'Adoption Pending' };
    } else {
      return { color: 'default', label: status };
    }
  };
  
  const statusProps = getStatusProps(puppy.status);
  
  return (
    <Card 
      sx={{ 
        maxWidth: 345, 
        margin: '0 auto', 
        mb: 3,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.07)',
        transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="220"
          image={puppy.photo_url || defaultPuppyImage}
          alt={puppy.name || 'Puppy'}
          sx={{
            objectFit: 'cover',
            objectPosition: 'center',
            transition: 'transform 0.5s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        />
        {/* Status tag */}
        <Chip 
          label={statusProps.label}
          color={statusProps.color}
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        />
        
        {/* Age tag - if available */}
        {puppy.age && (
          <Chip 
            label={puppy.age}
            color="primary"
            size="small"
            variant="outlined"
            sx={{ 
              position: 'absolute', 
              bottom: 12, 
              left: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}
          />
        )}
      </Box>
      
      <CardContent sx={{ p: 2.5 }}>
        <Typography 
          gutterBottom 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 600,
            mb: 0.5
          }}
        >
          {puppy.name || `Puppy #${puppy.identifier}`}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {puppy.gender}
          </Typography>
          
          <Box 
            component="span" 
            sx={{ 
              display: 'inline-block', 
              mx: 0.7, 
              width: 4, 
              height: 4, 
              borderRadius: '50%', 
              bgcolor: 'text.disabled' 
            }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {puppy.color || 'Pembroke Welsh Corgi'}
          </Typography>
        </Box>
        
        {puppy.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mt: 1.5,
              lineHeight: 1.6
            }}
          >
            {puppy.description.length > 120 ? `${puppy.description.substring(0, 120)}...` : puppy.description}
          </Typography>
        )}
        
        {/* Litter information if available */}
        {puppy.litter_name && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 2,
              p: 1.5,
              backgroundColor: 'background.neutral',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              Litter: {puppy.litter_name}
            </Typography>
          </Box>
        )}
        
        {/* Additional features */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Chip 
            label="AKC Reg" 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ 
              height: 24, 
              fontSize: '0.7rem', 
              fontWeight: 600
            }}
          />
          {(!puppy.status || puppy.status.toLowerCase() === 'available') && (
            <Chip 
              label="Ready to Go" 
              size="small" 
              color="success" 
              variant="outlined"
              sx={{ 
                height: 24, 
                fontSize: '0.7rem', 
                fontWeight: 600
              }}
            />
          )}
          <Chip 
            label="Vet Checked" 
            size="small" 
            color="info" 
            variant="outlined"
            sx={{ 
              height: 24, 
              fontSize: '0.7rem', 
              fontWeight: 600
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Default image URLs for fallback purposes when photos are missing
const DEFAULT_DOG_IMAGE = "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?q=80&w=1887";
const DEFAULT_PUPPY_IMAGE = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974";

// Properly defined React components for each shortcode
// Each is a proper React component that can use hooks

// DisplayDogs shortcode component
const DisplayDogsShortcode = ({ gender, breed, age, status }) => {
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [dogs, setDogs] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDogs = async () => {
      try {
        setLoading(true);
        
        // Call the real API with filters
        const queryParams = new URLSearchParams();
        if (gender) queryParams.append('gender', gender);
        if (breed) queryParams.append('breed', breed);
        if (age) queryParams.append('age', age);
        if (status) queryParams.append('status', status);
        
        const endpoint = `/dogs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log(`Fetching dogs from API endpoint: ${endpoint}`);
        const response = await get(endpoint);
        
        if (Array.isArray(response)) {
          console.log(`Successfully fetched ${response.length} dogs from API`);
          // Transform any dogs that don't have photos
          const dogsWithPhotos = response.map(dog => ({
            ...dog,
            photo_url: dog.photo_url || DEFAULT_DOG_IMAGE,
            breed: dog.breed || 'Pembroke Welsh Corgi' // Default breed if missing
          }));
          setDogs(dogsWithPhotos);
        } else {
          console.error('API response was not an array:', response);
          setError('Failed to load dogs - invalid data returned from server');
          setDogs([]);
        }
      } catch (err) {
        console.error('Error fetching dogs:', err);
        setError('Failed to load dogs. Please try again later.');
        setDogs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDogs();
  }, [gender, breed, age, status, get]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Typography color="error" sx={{ my: 2 }}>
        {error}
      </Typography>
    );
  }
  
  if (dogs.length === 0) {
    return (
      <Typography sx={{ my: 2, fontStyle: 'italic' }}>
        No dogs found matching the selected criteria.
      </Typography>
    );
  }
  
  return (
    <Box sx={{ my: 3 }}>
      <Grid container spacing={3}>
        {dogs.map(dog => (
          <Grid item xs={12} sm={6} md={4} key={dog.id}>
            <DogCard dog={dog} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// DisplayDog shortcode component
const DisplayDogShortcode = ({ id }) => {
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [dog, setDog] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDog = async () => {
      if (!id) {
        setError('Dog ID is required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Fetching dog with ID: ${id}`);
        
        // Call the real API
        const response = await get(`/dogs/${id}`);
        
        if (response && response.id) {
          console.log(`Successfully fetched dog: ${response.name}`);
          // Ensure dog has photo and breed
          const dogWithPhoto = {
            ...response,
            photo_url: response.photo_url || DEFAULT_DOG_IMAGE,
            breed: response.breed || 'Pembroke Welsh Corgi' // Default breed if missing
          };
          setDog(dogWithPhoto);
        } else {
          console.error(`No dog found with ID: ${id}`);
          setError(`Dog with ID ${id} not found`);
        }
      } catch (err) {
        console.error('Error fetching dog:', err);
        setError('Failed to load dog information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDog();
  }, [id, get]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Typography color="error" sx={{ my: 2 }}>
        {error}
      </Typography>
    );
  }
  
  if (!dog) {
    return (
      <Typography sx={{ my: 2, fontStyle: 'italic' }}>
        Dog not found.
      </Typography>
    );
  }
  
  return (
    <Box sx={{ my: 3, maxWidth: 600, mx: 'auto' }}>
      <DogCard dog={dog} />
    </Box>
  );
};

// DisplayLitters shortcode component
const DisplayLittersShortcode = ({ status, dam, sire }) => {
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [litters, setLitters] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchLitters = async () => {
      try {
        setLoading(true);
        
        // Call real API with filters
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        if (dam) queryParams.append('dam_id', dam);
        if (sire) queryParams.append('sire_id', sire);
        
        const endpoint = `/litters${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log(`Fetching litters from API endpoint: ${endpoint}`);
        const response = await get(endpoint);
        
        if (Array.isArray(response)) {
          console.log(`Successfully fetched ${response.length} litters from API`);
          setLitters(response);
        } else {
          console.error('API response was not an array:', response);
          setError('Failed to load litters - invalid data returned from server');
          setLitters([]);
        }
      } catch (err) {
        console.error('Error fetching litters:', err);
        setError('Failed to load litters. Please try again later.');
        setLitters([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLitters();
  }, [status, dam, sire, get]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Typography color="error" sx={{ my: 2 }}>
        {error}
      </Typography>
    );
  }
  
  if (litters.length === 0) {
    return (
      <Typography sx={{ my: 2, fontStyle: 'italic' }}>
        No litters found matching the selected criteria.
      </Typography>
    );
  }
  
  return (
    <Box sx={{ my: 3 }}>
      <Grid container spacing={3}>
        {litters.map(litter => (
          <Grid item xs={12} sm={6} key={litter.id}>
            <LitterCard litter={litter} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// DisplayPuppies shortcode component
const DisplayPuppiesShortcode = ({ status, gender, litter }) => {
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [puppies, setPuppies] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPuppies = async () => {
      try {
        setLoading(true);
        
        // Call real API with filters
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        if (gender) queryParams.append('gender', gender);
        if (litter) queryParams.append('litter_id', litter);
        
        const endpoint = `/puppies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        console.log(`Fetching puppies from API endpoint: ${endpoint}`);
        const response = await get(endpoint);
        
        if (Array.isArray(response)) {
          console.log(`Successfully fetched ${response.length} puppies from API`);
          
          // Ensure all puppies have photos
          const puppiesWithPhotos = response.map(puppy => ({
            ...puppy,
            photo_url: puppy.photo_url || DEFAULT_PUPPY_IMAGE,
          }));
          
          setPuppies(puppiesWithPhotos);
        } else {
          console.error('API response was not an array:', response);
          setError('Failed to load puppies - invalid data returned from server');
          setPuppies([]);
        }
      } catch (err) {
        console.error('Error fetching puppies:', err);
        setError('Failed to load puppies. Please try again later.');
        setPuppies([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPuppies();
  }, [status, gender, litter, get]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Typography color="error" sx={{ my: 2 }}>
        {error}
      </Typography>
    );
  }
  
  if (puppies.length === 0) {
    return (
      <Typography sx={{ my: 2, fontStyle: 'italic' }}>
        No puppies found matching the selected criteria.
      </Typography>
    );
  }
  
  return (
    <Box sx={{ my: 3 }}>
      <Grid container spacing={3}>
        {puppies.map(puppy => (
          <Grid item xs={12} sm={6} md={4} key={puppy.id}>
            <PuppyCard puppy={puppy} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// ContactForm shortcode component
const ContactFormShortcode = ({ subject, recipient }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const { post } = useApi();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In a real implementation, we would call the API
      // await post('/api/contact', { ...formData, subject, recipient });
      console.log('Contact form submitted:', { ...formData, subject, recipient });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit contact form:', err);
      setError('Failed to send message. Please try again later.');
    }
  };
  
  if (submitted) {
    return (
      <Box sx={{ my: 3, p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Thank you for your message!
        </Typography>
        <Typography>
          We've received your inquiry and will get back to you soon.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ my: 3, p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}
    >
      <Typography variant="h6" gutterBottom>
        Contact Us
      </Typography>
      
      {subject && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Subject: {subject}
        </Typography>
      )}
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <TextField
        fullWidth
        label="Your Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        margin="normal"
        required
      />
      
      <TextField
        fullWidth
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        margin="normal"
        required
      />
      
      <TextField
        fullWidth
        label="Message"
        name="message"
        value={formData.message}
        onChange={handleChange}
        margin="normal"
        required
        multiline
        rows={4}
      />
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
      >
        Send Message
      </Button>
    </Box>
  );
};

// Map of shortcode names to React components
const SHORTCODE_COMPONENTS = {
  DisplayDogs: DisplayDogsShortcode,
  DisplayDog: DisplayDogShortcode,
  DisplayLitters: DisplayLittersShortcode,
  DisplayPuppies: DisplayPuppiesShortcode,
  ContactForm: ContactFormShortcode
};

/**
 * Parse content into segments containing text and shortcodes
 * @param {string} content - HTML content that may contain shortcodes
 * @returns {Array} - Array of segments {type: 'text'|'shortcode', content|name, attributes}
 */
export const parseContentWithShortcodes = (content) => {
  if (!content) return [{ type: 'text', content: '' }];
  
  const segments = [];
  let lastIndex = 0;
  let match;
  
  // Reset the regex lastIndex to start from the beginning
  SHORTCODE_REGEX.lastIndex = 0;
  
  while ((match = SHORTCODE_REGEX.exec(content)) !== null) {
    // Add text segment before the shortcode
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }
    
    // Add the shortcode segment
    const [fullMatch, name, attributesStr] = match;
    segments.push({
      type: 'shortcode',
      name,
      attributes: parseAttributes(attributesStr)
    });
    
    lastIndex = match.index + fullMatch.length;
  }
  
  // Add the remaining text after the last shortcode
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }
  
  return segments;
};

/**
 * Component that renders content with processed shortcodes
 */
export const ShortcodeRenderer = ({ content }) => {
  if (!content) return null;
  
  const segments = parseContentWithShortcodes(content);
  
  return (
    <div className="shortcode-content">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <div key={`text-${index}`} dangerouslySetInnerHTML={{ __html: segment.content }} />;
        } else if (segment.type === 'shortcode') {
          const ShortcodeComponent = SHORTCODE_COMPONENTS[segment.name];
          return ShortcodeComponent ? 
            <div className="shortcode-wrapper" key={`shortcode-${index}`}>
              <ShortcodeComponent {...segment.attributes} />
            </div> : 
            <div className="unknown-shortcode" key={`unknown-${index}`}>
              [Unknown shortcode: {segment.name}]
            </div>;
        }
        return null;
      })}
    </div>
  );
};

export default ShortcodeRenderer;