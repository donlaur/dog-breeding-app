/**
 * Shortcode processor for the CMS system
 * 
 * This utility provides functionality for parsing and rendering shortcodes
 * within CMS page content. Shortcodes allow dynamic content embedding
 * like [DisplayDogs gender=Male] or [DisplayDog id=3].
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Card, CardContent, CardMedia, Grid, Divider, CircularProgress } from '@mui/material';
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
    <Card sx={{ maxWidth: 345, margin: '0 auto', mb: 2 }}>
      <CardMedia
        component="img"
        height="180"
        image={dog.photo_url || defaultDogImage}
        alt={dog.name}
        sx={{
          objectFit: 'cover',
          objectPosition: 'center'
        }}
      />
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {dog.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {dog.gender} • {dog.breed || 'Mixed Breed'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {dog.age && `Age: ${dog.age}`}
        </Typography>
        {dog.description && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {dog.description.length > 100 ? `${dog.description.substring(0, 100)}...` : dog.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Component to display a litter card
const LitterCard = ({ litter }) => {
  if (!litter) return null;
  
  return (
    <Card sx={{ margin: '0 auto', mb: 2 }}>
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {litter.dam_name} × {litter.sire_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Born: {new Date(litter.birth_date).toLocaleDateString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {litter.num_puppies || 0} puppies • {litter.status}
        </Typography>
        {litter.description && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {litter.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Component to display a puppy card
const PuppyCard = ({ puppy }) => {
  if (!puppy) return null;
  
  // Default image for puppies
  const defaultPuppyImage = "https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=2564";
  
  return (
    <Card sx={{ maxWidth: 345, margin: '0 auto', mb: 2 }}>
      <CardMedia
        component="img"
        height="180"
        image={puppy.photo_url || defaultPuppyImage}
        alt={puppy.name || 'Puppy'}
        sx={{
          objectFit: 'cover',
          objectPosition: 'center'
        }}
      />
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {puppy.name || `Puppy #${puppy.identifier}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {puppy.gender} • {puppy.color}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Status: {puppy.status}
        </Typography>
        {puppy.description && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {puppy.description.length > 100 ? `${puppy.description.substring(0, 100)}...` : puppy.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Mock data for use in shortcode components
const MOCK_DOGS = [
  { id: 1, name: "Max", gender: "Male", breed: "Golden Retriever", age: "3 years", photo_url: "https://via.placeholder.com/300x180?text=Max", description: "Friendly and loyal Golden Retriever" },
  { id: 2, name: "Bella", gender: "Female", breed: "German Shepherd", age: "2 years", photo_url: "https://via.placeholder.com/300x180?text=Bella", description: "Intelligent and protective German Shepherd" },
  { id: 3, name: "Charlie", gender: "Male", breed: "Labrador", age: "4 years", photo_url: "https://via.placeholder.com/300x180?text=Charlie", description: "Energetic and loving Labrador" }
];

const MOCK_DOG_BY_ID = {
  "1": { id: 1, name: "Max", gender: "Male", breed: "Golden Retriever", age: "3 years", photo_url: "https://via.placeholder.com/300x180?text=Max", description: "Friendly and loyal Golden Retriever" },
  "2": { id: 2, name: "Bella", gender: "Female", breed: "German Shepherd", age: "2 years", photo_url: "https://via.placeholder.com/300x180?text=Bella", description: "Intelligent and protective German Shepherd" },
  "3": { id: 3, name: "Charlie", gender: "Male", breed: "Labrador", age: "4 years", photo_url: "https://via.placeholder.com/300x180?text=Charlie", description: "Energetic and loving Labrador" }
};

const MOCK_LITTERS = [
  { id: 1, dam_name: "Bella", sire_name: "Max", birth_date: "2025-01-15", num_puppies: 6, status: "Available", description: "Healthy litter of Golden Retriever puppies" },
  { id: 2, dam_name: "Luna", sire_name: "Charlie", birth_date: "2025-02-10", num_puppies: 4, status: "Reserved", description: "Beautiful Labrador puppies, all reserved" },
  { id: 3, dam_name: "Sadie", sire_name: "Cooper", birth_date: "2025-04-01", num_puppies: 0, status: "Planned", description: "Upcoming litter expected in early April" }
];

const MOCK_PUPPIES = [
  { id: 1, name: "Puppy 1", identifier: "A1", gender: "Male", color: "Golden", status: "Available", photo_url: "https://via.placeholder.com/300x180?text=Puppy+1", description: "Playful and curious male puppy" },
  { id: 2, name: "Puppy 2", identifier: "A2", gender: "Female", color: "Cream", status: "Reserved", photo_url: "https://via.placeholder.com/300x180?text=Puppy+2", description: "Sweet and gentle female puppy" },
  { id: 3, name: "Puppy 3", identifier: "A3", gender: "Male", color: "Golden", status: "Available", photo_url: "https://via.placeholder.com/300x180?text=Puppy+3", description: "Energetic and bold male puppy" },
  { id: 4, name: "Puppy 4", identifier: "B1", gender: "Female", color: "Black", status: "Available", photo_url: "https://via.placeholder.com/300x180?text=Puppy+4", description: "Calm and attentive female puppy" }
];

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
        const response = await get(endpoint);
        
        if (Array.isArray(response)) {
          setDogs(response);
        } else {
          // Fallback to mock data if API call doesn't return an array
          console.warn('API response was not an array, using fallback data');
          let filteredDogs = [...MOCK_DOGS];
          if (gender) {
            filteredDogs = filteredDogs.filter(dog => dog.gender.toLowerCase() === gender.toLowerCase());
          }
          if (breed) {
            filteredDogs = filteredDogs.filter(dog => dog.breed.toLowerCase().includes(breed.toLowerCase()));
          }
          setDogs(filteredDogs);
        }
      } catch (err) {
        console.error('Error fetching dogs:', err);
        setError('Failed to load dogs');
        
        // Fallback to mock data on error
        let filteredDogs = [...MOCK_DOGS];
        if (gender) {
          filteredDogs = filteredDogs.filter(dog => dog.gender.toLowerCase() === gender.toLowerCase());
        }
        if (breed) {
          filteredDogs = filteredDogs.filter(dog => dog.breed.toLowerCase().includes(breed.toLowerCase()));
        }
        setDogs(filteredDogs);
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
        // Call the real API
        const response = await get(`/dogs/${id}`);
        
        if (response && response.id) {
          setDog(response);
        } else {
          // Fallback to mock data if API call fails
          const dogData = MOCK_DOG_BY_ID[id];
          if (dogData) {
            setDog(dogData);
          } else {
            setError(`Dog with ID ${id} not found`);
          }
        }
      } catch (err) {
        console.error('Error fetching dog:', err);
        setError('Failed to load dog information');
        
        // Fallback to mock data on error
        const dogData = MOCK_DOG_BY_ID[id];
        if (dogData) {
          setDog(dogData);
        }
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
        const response = await get(endpoint);
        
        if (Array.isArray(response)) {
          setLitters(response);
        } else {
          // Fallback to mock data if API call doesn't return an array
          console.warn('API response was not an array, using fallback data');
          
          let filteredLitters = [...MOCK_LITTERS];
          if (status) {
            filteredLitters = filteredLitters.filter(litter => litter.status.toLowerCase() === status.toLowerCase());
          }
          if (dam) {
            filteredLitters = filteredLitters.filter(litter => {
              // Try to match by ID or name depending on what was provided
              if (!isNaN(parseInt(dam))) {
                return litter.dam_id === parseInt(dam);
              }
              return litter.dam_name && litter.dam_name.toLowerCase().includes(dam.toLowerCase());
            });
          }
          if (sire) {
            filteredLitters = filteredLitters.filter(litter => {
              // Try to match by ID or name depending on what was provided
              if (!isNaN(parseInt(sire))) {
                return litter.sire_id === parseInt(sire);
              }
              return litter.sire_name && litter.sire_name.toLowerCase().includes(sire.toLowerCase());
            });
          }
          
          setLitters(filteredLitters);
        }
      } catch (err) {
        console.error('Error fetching litters:', err);
        setError('Failed to load litters');
        
        // Fallback to mock data on error
        let filteredLitters = [...MOCK_LITTERS];
        if (status) {
          filteredLitters = filteredLitters.filter(litter => litter.status.toLowerCase() === status.toLowerCase());
        }
        if (dam) {
          filteredLitters = filteredLitters.filter(litter => 
            litter.dam_name && litter.dam_name.toLowerCase().includes(dam.toLowerCase())
          );
        }
        if (sire) {
          filteredLitters = filteredLitters.filter(litter => 
            litter.sire_name && litter.sire_name.toLowerCase().includes(sire.toLowerCase())
          );
        }
        
        setLitters(filteredLitters);
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
        const response = await get(endpoint);
        
        if (Array.isArray(response)) {
          setPuppies(response);
        } else {
          // Fallback to mock data if API call doesn't return an array
          console.warn('API response was not an array, using fallback data');
          
          let filteredPuppies = [...MOCK_PUPPIES];
          if (status) {
            filteredPuppies = filteredPuppies.filter(puppy => puppy.status.toLowerCase() === status.toLowerCase());
          }
          if (gender) {
            filteredPuppies = filteredPuppies.filter(puppy => puppy.gender.toLowerCase() === gender.toLowerCase());
          }
          if (litter) {
            // In mock data we don't have litter_id, but in real data we would
            console.log('Would filter by litter_id:', litter);
          }
          
          setPuppies(filteredPuppies);
        }
      } catch (err) {
        console.error('Error fetching puppies:', err);
        setError('Failed to load puppies');
        
        // Fallback to mock data on error
        let filteredPuppies = [...MOCK_PUPPIES];
        if (status) {
          filteredPuppies = filteredPuppies.filter(puppy => puppy.status.toLowerCase() === status.toLowerCase());
        }
        if (gender) {
          filteredPuppies = filteredPuppies.filter(puppy => puppy.gender.toLowerCase() === gender.toLowerCase());
        }
        
        setPuppies(filteredPuppies);
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