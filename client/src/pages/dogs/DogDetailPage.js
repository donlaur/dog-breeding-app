import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Divider, 
  Chip,
  Button,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useApi } from '../../hooks/useApi';
import PageNavigation from '../../components/PageNavigation';
import Footer from '../../components/layout/Footer';
import { getDogAge } from '../../utils/ageUtils';
import { getPhotoUrl, handleImageError, DEFAULT_DOG_IMAGE } from '../../utils/photoUtils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import CakeIcon from '@mui/icons-material/Cake';
import VerifiedIcon from '@mui/icons-material/Verified';
import PetsIcon from '@mui/icons-material/Pets';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const DogDetailPage = () => {
  const { id, slug, gender } = useParams();
  const { get } = useApi();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [relatedLitters, setRelatedLitters] = useState([]);
  const [relatedDogs, setRelatedDogs] = useState([]);
  
  // Functions
  const fetchDog = async () => {
    try {
      setLoading(true);
      const response = await get(`/dogs/${id}`);
      if (response && response.id) {
        setDog(response);
        
        // Get related litters
        if (response.gender === 'Female') {
          const litterResponse = await get(`/litters?dam_id=${response.id}`);
          if (Array.isArray(litterResponse)) {
            setRelatedLitters(litterResponse);
          }
        } else if (response.gender === 'Male') {
          const litterResponse = await get(`/litters?sire_id=${response.id}`);
          if (Array.isArray(litterResponse)) {
            setRelatedLitters(litterResponse);
          }
        }
        
        // Get related dogs (siblings, parents, etc)
        if (response.dam_id || response.sire_id) {
          const relatedDogsResponse = await get(`/dogs?related_to=${response.id}`);
          if (Array.isArray(relatedDogsResponse)) {
            setRelatedDogs(relatedDogsResponse);
          }
        }
      } else {
        setError('Dog not found');
      }
    } catch (err) {
      console.error('Error fetching dog details:', err);
      setError('Failed to load dog information');
    } finally {
      setLoading(false);
    }
  };
  
  // Load dog data on mount
  useEffect(() => {
    if (id) {
      fetchDog();
    } else {
      setError('Invalid dog ID');
      setLoading(false);
    }
  }, [id]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Loading state
  if (loading) {
    return (
      <>
        <PageNavigation />
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '60vh'
          }}>
            <CircularProgress />
          </Box>
        </Container>
        <Footer />
      </>
    );
  }
  
  // Error state
  if (error) {
    return (
      <>
        <PageNavigation />
        <Container maxWidth="lg">
          <Box sx={{ py: 5 }}>
            <Typography variant="h4" color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              component={Link} 
              to="/page/dogs"
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 2 }}
            >
              Back to All Dogs
            </Button>
          </Box>
        </Container>
        <Footer />
      </>
    );
  }
  
  // If no dog found
  if (!dog) {
    return (
      <>
        <PageNavigation />
        <Container maxWidth="lg">
          <Box sx={{ py: 5 }}>
            <Typography variant="h4" gutterBottom>
              Dog Not Found
            </Typography>
            <Button 
              component={Link} 
              to="/page/dogs"
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 2 }}
            >
              Back to All Dogs
            </Button>
          </Box>
        </Container>
        <Footer />
      </>
    );
  }
  
  // Default image imported from photoUtils
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
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
  
  // Calculate dog's age
  const dogAge = dog.date_of_birth ? getDogAge(dog.date_of_birth) : 'Unknown';
  
  return (
    <>
      <PageNavigation />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Back link */}
          <Button 
            component={Link} 
            to="/page/dogs"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 3 }}
          >
            Back to All Dogs
          </Button>
          
          <Grid container spacing={4}>
            {/* Dog Photo and Basic Info Card */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    sx={{ 
                      height: { xs: 300, sm: 400 },
                      objectFit: 'cover'
                    }}
                    image={dog.cover_photo ? getPhotoUrl(dog.cover_photo, 'DOG') : 
                          (dog.photo_url ? getPhotoUrl(dog.photo_url, 'DOG') : DEFAULT_DOG_IMAGE)}
                    alt={dog.call_name || dog.name}
                    onError={handleImageError('DOG')}
                  />
                  
                  {/* Gender badge */}
                  <Chip
                    icon={dog.gender === 'Female' ? <FemaleIcon /> : <MaleIcon />}
                    label={dog.gender}
                    color={dog.gender === 'Female' ? 'secondary' : 'primary'}
                    sx={{ 
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      fontWeight: 'bold',
                      px: 1
                    }}
                  />
                  
                  {/* Age badge if available */}
                  {dogAge !== 'Unknown' && (
                    <Chip
                      icon={<CakeIcon />}
                      label={dogAge}
                      color="default"
                      sx={{ 
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: 'text.primary',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </Box>
                
                <CardContent sx={{ p: 3 }}>
                  {/* Call Name */}
                  <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                    {dog.call_name || dog.name}
                  </Typography>
                  
                  {/* Registered Name */}
                  {dog.registered_name && (
                    <Typography 
                      variant="subtitle1" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ 
                        fontStyle: 'italic',
                        mb: 2
                      }}
                    >
                      {dog.registered_name}
                    </Typography>
                  )}
                  
                  {/* Key info badges */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {dog.color && (
                      <Chip 
                        label={dog.color} 
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                    
                    {dog.championship_title && (
                      <Chip 
                        icon={<EmojiEventsIcon />}
                        label={dog.championship_title} 
                        color="secondary"
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                    
                    {dog.akc_registered && (
                      <Chip 
                        label="AKC Registered" 
                        color="primary"
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  </Box>
                  
                  {/* Birth date and other key details */}
                  <List dense disablePadding>
                    {dog.date_of_birth && (
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemText 
                          primary="Date of Birth"
                          secondary={formatDate(dog.date_of_birth)}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                            fontWeight: 500
                          }}
                          secondaryTypographyProps={{
                            variant: 'body1',
                            color: 'text.primary',
                            fontWeight: 400
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {dog.color && (
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemText 
                          primary="Color"
                          secondary={dog.color}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                            fontWeight: 500
                          }}
                          secondaryTypographyProps={{
                            variant: 'body1',
                            color: 'text.primary',
                            fontWeight: 400
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {dog.akc_number && (
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemText 
                          primary="AKC Number"
                          secondary={dog.akc_number}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                            fontWeight: 500
                          }}
                          secondaryTypographyProps={{
                            variant: 'body1',
                            color: 'text.primary',
                            fontWeight: 400
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {dog.microchip && (
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemText 
                          primary="Microchip"
                          secondary={dog.microchip}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                            fontWeight: 500
                          }}
                          secondaryTypographyProps={{
                            variant: 'body1',
                            color: 'text.primary',
                            fontWeight: 400
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
              
              {/* Health Testing Card (if applicable) */}
              {dog.health_tested && (
                <Card sx={{ borderRadius: 3, mt: 3, overflow: 'hidden' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <VerifiedIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        Health Testing
                      </Typography>
                    </Box>
                    
                    <List dense disablePadding>
                      {dog.testing_hips && (
                        <ListItem disablePadding sx={{ mb: 1 }}>
                          <ListItemText 
                            primary="Hip Evaluation"
                            secondary={dog.testing_hips}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary',
                              fontWeight: 500
                            }}
                          />
                        </ListItem>
                      )}
                      
                      {dog.testing_eyes && (
                        <ListItem disablePadding sx={{ mb: 1 }}>
                          <ListItemText 
                            primary="Eye Certification"
                            secondary={dog.testing_eyes}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary',
                              fontWeight: 500
                            }}
                          />
                        </ListItem>
                      )}
                      
                      {dog.testing_dna && (
                        <ListItem disablePadding sx={{ mb: 1 }}>
                          <ListItemText 
                            primary="DNA Testing"
                            secondary={dog.testing_dna}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary',
                              fontWeight: 500
                            }}
                          />
                        </ListItem>
                      )}
                      
                      {dog.testing_heart && (
                        <ListItem disablePadding sx={{ mb: 1 }}>
                          <ListItemText 
                            primary="Cardiac Evaluation"
                            secondary={dog.testing_heart}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary',
                              fontWeight: 500
                            }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            {/* Detailed Information Tabs */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label="About" />
                  <Tab label="Pedigree" />
                  {dog.gender === 'Female' ? (
                    <Tab label="Litters" />
                  ) : (
                    <Tab label="Offspring" />
                  )}
                </Tabs>
                
                <CardContent sx={{ p: 3 }}>
                  {/* About Tab */}
                  {activeTab === 0 && (
                    <Box>
                      {/* Description */}
                      {dog.description && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" gutterBottom>
                            About {dog.call_name || dog.name}
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {dog.description}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Personality */}
                      {dog.personality && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" gutterBottom>
                            Personality & Temperament
                          </Typography>
                          <Typography variant="body1">
                            {dog.personality}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Lineage */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                          Lineage
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Dam
                              </Typography>
                              <Typography variant="body1">
                                {dog.dam_name || 'Unknown'}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Sire
                              </Typography>
                              <Typography variant="body1">
                                {dog.sire_name || 'Unknown'}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      {/* Achievements if applicable */}
                      {dog.achievements && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" gutterBottom>
                            Achievements & Titles
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {dog.achievements}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {/* Pedigree Tab */}
                  {activeTab === 1 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Pedigree
                      </Typography>
                      {dog.pedigree_info ? (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                          {dog.pedigree_info}
                        </Typography>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            py: 4
                          }}
                        >
                          <PetsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="body1" color="text.secondary" align="center">
                            Detailed pedigree information is not available for this dog.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {/* Litters/Offspring Tab */}
                  {activeTab === 2 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {dog.gender === 'Female' ? 'Litters' : 'Offspring'}
                      </Typography>
                      
                      {relatedLitters.length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>{dog.gender === 'Female' ? 'Sire' : 'Dam'}</TableCell>
                                <TableCell>Puppies</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {relatedLitters.map((litter) => (
                                <TableRow key={litter.id}>
                                  <TableCell>
                                    {formatDate(litter.birth_date || litter.expected_date)}
                                  </TableCell>
                                  <TableCell>
                                    {dog.gender === 'Female' ? litter.sire_name : litter.dam_name}
                                  </TableCell>
                                  <TableCell>
                                    {litter.num_puppies || 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={litter.status || 'Unknown'} 
                                      size="small"
                                      color={
                                        litter.status === 'Planned' ? 'secondary' :
                                        litter.status === 'Born' ? 'primary' :
                                        litter.status === 'Available' ? 'success' :
                                        'default'
                                      }
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            py: 4
                          }}
                        >
                          <FavoriteIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="body1" color="text.secondary" align="center">
                            No litters found for this dog yet.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
      <Footer />
    </>
  );
};

export default DogDetailPage;