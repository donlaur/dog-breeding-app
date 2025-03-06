import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardMedia,
  CardContent,
  CardActions,
  Divider,
  IconButton,
  CircularProgress
} from '@mui/material';
import { 
  ArrowBackIos as ArrowBackIcon, 
  ArrowForwardIos as ArrowForwardIcon 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { usePages } from './context/PageContext';
import { useApi } from './hooks/useApi';
import PageNavigation from './components/PageNavigation';
import ShortcodeRenderer from './utils/shortcodeProcessor';

function HomePage() {
  const { pages, loading: pagesLoading } = usePages();
  const { get, loading: apiLoading } = useApi();
  const [featuredPuppies, setFeaturedPuppies] = useState([]);
  const [aboutContent, setAboutContent] = useState('');
  const [puppiesPage, setPuppiesPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For puppy slider
  const [currentPuppyIndex, setCurrentPuppyIndex] = useState(0);
  
  // Handle slider navigation
  const nextPuppy = () => {
    if (featuredPuppies.length === 0) return;
    setCurrentPuppyIndex((prevIndex) => 
      prevIndex === featuredPuppies.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevPuppy = () => {
    if (featuredPuppies.length === 0) return;
    setCurrentPuppyIndex((prevIndex) => 
      prevIndex === 0 ? featuredPuppies.length - 1 : prevIndex - 1
    );
  };
  
  // Auto-advance the slider every 5 seconds
  useEffect(() => {
    if (featuredPuppies.length <= 1) return;
    
    const intervalId = setInterval(() => {
      nextPuppy();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [featuredPuppies.length]);

  // Fetch real puppies from API and set up pages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching puppies for homepage display...");
        
        // Fetch active puppies from API
        const puppiesResponse = await get('/puppies');
        
        console.log(`Received ${puppiesResponse?.length || 0} puppies from API`);
        
        if (Array.isArray(puppiesResponse)) {
          // Filter for available puppies
          const availablePuppies = puppiesResponse
            .filter(puppy => puppy.status === 'Available')
            .slice(0, 6); // Limit to 6 puppies
          
          if (availablePuppies.length > 0) {
            // Fetch litter details to get more information
            const litterIds = [...new Set(availablePuppies.map(puppy => puppy.litter_id))];
            const littersPromises = litterIds.map(id => get(`/litters/${id}`));
            const littersResponses = await Promise.allSettled(littersPromises);
            
            const litters = {};
            littersResponses.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value) {
                litters[litterIds[index]] = result.value;
              }
            });
            
            // Enhance puppy data with litter info
            const enhancedPuppies = availablePuppies.map(puppy => {
              const litter = litters[puppy.litter_id];
              
              // Calculate age based on litter whelp date
              let age = 'Unknown age';
              if (litter && litter.whelp_date) {
                const whelpDate = new Date(litter.whelp_date);
                const today = new Date();
                const diffTime = Math.abs(today - whelpDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays < 7) {
                  age = `${diffDays} days old`;
                } else {
                  const weeks = Math.floor(diffDays / 7);
                  age = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`;
                }
              }
              
              return {
                id: puppy.id,
                name: puppy.name || `Puppy #${puppy.identifier || puppy.id}`,
                photo: puppy.photo_url || 'https://via.placeholder.com/300x200?text=No+Photo+Available',
                description: puppy.description || 'Adorable puppy waiting for their forever home.',
                gender: puppy.gender || 'Unknown',
                color: puppy.color || '',
                age,
                litterName: litter ? litter.litter_name : 'Unknown litter'
              };
            });
            
            setFeaturedPuppies(enhancedPuppies);
          } else {
            // If no available puppies, use default images with a message
            setFeaturedPuppies([
              {
                id: 1,
                name: 'Coming Soon',
                photo: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?q=80&w=2070',
                description: 'We\'re currently preparing for our next litter. Please check back soon!',
                age: ''
              },
              {
                id: 2,
                name: 'Accepting Applications',
                photo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2069',
                description: 'Get on our waiting list for future puppies. Contact us for more information.',
                age: ''
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Error fetching puppies:', err);
        setError('Failed to load puppies');
        
        // Fallback to default images
        setFeaturedPuppies([
          {
            id: 1,
            name: 'Adorable Puppies',
            photo: 'https://images.unsplash.com/photo-1593134257782-e89567b7718a?q=80&w=2235',
            description: 'Contact us to learn more about our breeding program.',
            age: ''
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [get]);
  
  // Find the about page and puppies page from CMS
  useEffect(() => {
    if (pages && pages.length > 0) {
      // Find the about page
      const aboutPage = pages.find(page => page.template === 'about' && page.status === 'published');
      if (aboutPage) {
        // Take the first 300 characters for a teaser
        const content = aboutPage.content || '';
        const teaser = content.length > 300 ? `${content.substring(0, 300)}...` : content;
        setAboutContent(teaser);
      }
      
      // Find the puppies page to get the correct slug
      const puppiesPage = pages.find(page => 
        (page.template === 'puppies' || page.slug.includes('puppies') || page.slug === 'available-puppies') 
        && page.status === 'published'
      );
      
      if (puppiesPage) {
        setPuppiesPage(puppiesPage);
        console.log("Found puppies page with slug:", puppiesPage.slug);
      } else {
        console.log("No published puppies page found in CMS");
      }
    }
  }, [pages]);

  // Set document title
  useEffect(() => {
    document.title = 'Home | Breeder Site';
  }, []);

  // Determine the puppies page URL - temporary fix to avoid 404s
  const puppiesPageUrl = '/dashboard/puppies'; // Send to admin puppies section for now until CMS page is created

  return (
    <Box>
      <PageNavigation />
      
      {/* Hero Banner */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 8, 
          position: 'relative',
          backgroundImage: 'url(https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=2069)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Welcome to Our Breeding Program
          </Typography>
          <Typography variant="h5" paragraph>
            Dedicated to raising healthy, happy dogs with exceptional temperaments.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            component={Link}
            to={puppiesPageUrl}
            sx={{ mt: 2 }}
          >
            View Available Puppies
          </Button>
        </Container>
      </Box>
      
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        <Grid container spacing={4}>
          {/* Featured Puppies Section with Slider */}
          <Grid item xs={12}>
            <Typography variant="h4" component="h2" gutterBottom>
              Featured Puppies
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : featuredPuppies.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
                No puppies available at this time. Please check back soon!
              </Typography>
            ) : (
              <>
                {/* Responsive grid view of puppies */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {featuredPuppies.map((puppy, index) => (
                    <Grid item xs={12} sm={6} md={4} key={puppy.id || index}>
                      <Card sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: 8
                        }
                      }}>
                        <Box sx={{ 
                          position: 'relative',
                          pt: '66.67%' // 3:2 aspect ratio
                        }}>
                          <CardMedia
                            component="img"
                            image={puppy.photo}
                            alt={puppy.name}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          {puppy.status === 'Reserved' && (
                            <Box sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              bgcolor: 'secondary.main',
                              color: 'white',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              Reserved
                            </Box>
                          )}
                        </Box>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {puppy.name}
                          </Typography>
                          
                          <Typography variant="body2" color="primary.main" gutterBottom>
                            {puppy.age}
                          </Typography>
                          
                          {puppy.gender && puppy.color && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {puppy.gender} • {puppy.color}
                            </Typography>
                          )}
                          
                          {puppy.litterName && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {puppy.litterName}
                            </Typography>
                          )}
                          
                          <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                            {puppy.description && puppy.description.length > 100 
                              ? `${puppy.description.substring(0, 100)}...` 
                              : puppy.description}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ mt: 'auto', p: 2, pt: 0 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            component={Link}
                            to={puppiesPageUrl}
                            fullWidth
                          >
                            Learn More
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {/* Mobile Navigation Dots */}
                <Box sx={{ 
                  display: { xs: 'flex', md: 'none' }, 
                  justifyContent: 'center', 
                  mb: 2 
                }}>
                  {[...Array(Math.ceil(featuredPuppies.length / 1))].map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentPuppyIndex(index)}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 
                          Math.floor(currentPuppyIndex / 1) === index 
                            ? 'primary.main' 
                            : 'grey.300',
                        mx: 0.5,
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </Box>
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button 
                variant="outlined" 
                component={Link}
                to={puppiesPageUrl}
                size="large"
              >
                View All Available Puppies
              </Button>
            </Box>
          </Grid>
          
          {/* About Us Section */}
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Typography variant="h4" component="h2" gutterBottom>
              About Our Program
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ height: '100%' }}>
                    <ShortcodeRenderer content={aboutContent} />
                    <Button 
                      component={Link}
                      to="/page/about"
                      variant="text"
                      sx={{ mt: 2 }}
                    >
                      Read More About Us
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    component="img"
                    src="https://via.placeholder.com/600x400?text=Our+Facilities"
                    alt="Our facilities"
                    sx={{ width: '100%', borderRadius: 1 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Call to Action */}
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Paper
              sx={{
                p: 4,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                textAlign: 'center',
              }}
            >
              <Typography variant="h5" component="h3" gutterBottom>
                Ready to Find Your Perfect Companion?
              </Typography>
              <Typography variant="body1" paragraph>
                Contact us today to learn more about our available puppies or upcoming litters.
              </Typography>
              <Button 
                variant="contained" 
                color="secondary"
                component={Link}
                to="/page/contact"
                size="large"
              >
                Contact Us
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Testimonials or additional content could go here */}
    </Box>
  );
}

export default HomePage;
