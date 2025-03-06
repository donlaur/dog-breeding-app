import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  Paper,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  Button,
  CardMedia,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePages } from '../context/PageContext';
import { useApi } from '../hooks/useApi';
import ShortcodeRenderer from '../utils/shortcodeProcessor';
import PageNavigation from '../components/PageNavigation';
import Footer from '../components/layout/Footer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PetsIcon from '@mui/icons-material/Pets';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

// Enhanced template components with modern designs and better mobile experiences

// Default Template
const DefaultTemplate = ({ content, page }) => (
  <Box>
    <ShortcodeRenderer content={content} />
  </Box>
);

// About Template
const AboutTemplate = ({ content, page }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box>
      {/* Hero section */}
      <Box 
        sx={{ 
          mb: 5, 
          pb: 3, 
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden', 
          borderRadius: 3,
          backgroundColor: 'background.neutral',
          backgroundImage: 'url(https://images.unsplash.com/photo-1546975490-e8b92a360b24?q=80&w=2574)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: { xs: 220, md: 280 }
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            p: 3
          }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              fontWeight: 700,
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
              mb: 2
            }}
          >
            About Our Breeding Program
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{
              maxWidth: 700,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            Dedicated to raising healthy, happy Pembroke Welsh Corgis with exceptional temperament and breed quality
          </Typography>
        </Box>
      </Box>
      
      {/* Our values */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%', 
              backgroundColor: 'background.neutral',
              textAlign: 'center',
              p: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
              }
            }}
          >
            <Avatar
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: 'primary.light', 
                mx: 'auto',
                mb: 2,
                color: 'primary.dark'
              }}
            >
              <HealthAndSafetyIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" gutterBottom>Health First</Typography>
            <Typography variant="body2" color="text.secondary">
              We prioritize health testing and genetic screening for all our breeding dogs
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              backgroundColor: 'background.neutral',
              textAlign: 'center',
              p: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
              }
            }}
          >
            <Avatar
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: 'primary.light', 
                mx: 'auto',
                mb: 2,
                color: 'primary.dark'
              }}
            >
              <EmojiEventsIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" gutterBottom>Breed Standards</Typography>
            <Typography variant="body2" color="text.secondary">
              Our breeding program follows AKC standards for the Pembroke Welsh Corgi
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              backgroundColor: 'background.neutral',
              textAlign: 'center',
              p: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
              }
            }}
          >
            <Avatar
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: 'primary.light', 
                mx: 'auto',
                mb: 2,
                color: 'primary.dark'
              }}
            >
              <FavoriteIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" gutterBottom>Loving Environment</Typography>
            <Typography variant="body2" color="text.secondary">
              Our puppies are raised in our home with early socialization and enrichment
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              backgroundColor: 'background.neutral',
              textAlign: 'center',
              p: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
              }
            }}
          >
            <Avatar
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: 'primary.light', 
                mx: 'auto',
                mb: 2,
                color: 'primary.dark'
              }}
            >
              <VerifiedIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" gutterBottom>Breeder Support</Typography>
            <Typography variant="body2" color="text.secondary">
              We provide lifetime support and guidance to all our puppy families
            </Typography>
          </Card>
        </Grid>
      </Grid>
      
      {/* Main content */}
      {content ? (
        <Box>
          <ShortcodeRenderer content={content} />
        </Box>
      ) : (
        <Box>
          <Typography variant="body1" paragraph>
            Welcome to Pembroke Pups! We are a small, family-run breeding program dedicated to producing 
            exceptional Pembroke Welsh Corgis that excel as both show dogs and beloved family companions.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Our breeding program focuses on health, temperament, and adherence to breed standards. 
            We carefully select our breeding pairs based on complementary traits, genetic health clearances, 
            and sound temperaments to produce puppies that represent the best of the breed.
          </Typography>
          
          <Box 
            component="img" 
            src="https://images.unsplash.com/photo-1612536057832-2ff7ead58194?q=80&w=1887" 
            alt="Corgi puppies" 
            sx={{ 
              width: '100%', 
              height: 400, 
              objectFit: 'cover', 
              borderRadius: 3,
              my: 4
            }}
          />
          
          <Typography variant="body1" paragraph>
            All of our adult dogs undergo comprehensive health testing including OFA hip and elbow evaluations, 
            eye clearances, and genetic screening for breed-specific conditions. We believe that responsible breeding 
            starts with prioritizing the health and well-being of our dogs.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Our puppies are raised in our home with early socialization, enrichment activities, and 
            health protocols developed with our veterinary team. By the time they go to their new homes, 
            they are well-adjusted, confident, and ready to become cherished family members.
          </Typography>
        </Box>
      )}
      
      {/* Meet our team section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Meet Our Team
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
              <CardMedia
                component="img"
                sx={{ 
                  width: { xs: '100%', sm: 160 },
                  height: { xs: 240, sm: 'auto' },
                  objectFit: 'cover'
                }}
                image="https://images.unsplash.com/photo-1544717305-996b815c338c?q=80&w=1974"
                alt="Jessica Miller"
              />
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography variant="h6" component="div">
                  Jessica Miller
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Breeder & Owner
                </Typography>
                <Typography variant="body2">
                  Jessica has been breeding and showing Pembroke Welsh Corgis for over 15 years. 
                  Her dedication to the breed and commitment to excellence has resulted in multiple 
                  champion-titled dogs and a reputation for exceptional puppies.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
              <CardMedia
                component="img"
                sx={{ 
                  width: { xs: '100%', sm: 160 },
                  height: { xs: 240, sm: 'auto' },
                  objectFit: 'cover'
                }}
                image="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974"
                alt="Michael Johnson"
              />
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography variant="h6" component="div">
                  Michael Johnson
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Co-Owner & Handler
                </Typography>
                <Typography variant="body2">
                  Michael handles our dogs in the show ring and oversees our puppy socialization program. 
                  With a background in animal behavior, he ensures all our puppies receive the best start in life 
                  with age-appropriate training and enrichment.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// Contact Template
const ContactTemplate = ({ content, page }) => {
  const theme = useTheme();
  const { get } = useApi();
  const [programInfo, setProgramInfo] = useState({
    contact_email: 'info@pembrokepups.com',
    phone: '(555) 123-4567',
    address: 'Portland, Oregon'
  });
  
  // Fetch program info for contact details
  useEffect(() => {
    const fetchProgramInfo = async () => {
      try {
        const data = await get('/program');
        console.log('Fetched program info:', data);
        if (data) {
          setProgramInfo({
            contact_email: data.contact_email || 'info@pembrokepups.com',
            phone: data.phone || '(555) 123-4567',
            address: data.address || 'Portland, Oregon'
          });
        }
      } catch (err) {
        console.error('Error fetching program info:', err);
        // Keep default values on error
      }
    };
    
    fetchProgramInfo();
  }, [get]);
  
  return (
    <Box>
      {/* Hero section */}
      <Box 
        sx={{ 
          mb: 5, 
          pb: 2, 
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden', 
          borderRadius: 3,
          backgroundColor: 'background.neutral',
          backgroundImage: 'url(https://images.unsplash.com/photo-1546975490-e8b92a360b24?q=80&w=2574)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          height: { xs: 180, md: 220 }
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            p: 3
          }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              fontWeight: 700,
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
              mb: 1
            }}
          >
            Contact Us
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{
              maxWidth: 500,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            We'd love to hear from you about our puppies or answer any questions
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={4}>
        {/* Contact Form Section */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'primary.main' }}>
                Send us a message
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 3 }}>
                Have questions about our puppies, breeding program, or availability? Drop us a message and we'll get back to you as soon as possible.
              </Typography>
              
              <ShortcodeRenderer content={content || "[ContactForm subject='Puppy Inquiry']"} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Contact Information */}
        <Grid item xs={12} md={5}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 3, 
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: 'white',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ p: 4, flex: 1 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Contact Information
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 4, opacity: 0.9 }}>
                Feel free to reach out through any of the following methods:
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', mr: 2 }}>
                  <LocationOnIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">Our Location</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {programInfo.address}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', mr: 2 }}>
                  <PhoneIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {programInfo.phone}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', mr: 2 }}>
                  <EmailIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {programInfo.contact_email}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', mr: 2 }}>
                  <PetsIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">Breeding Program</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    AKC Registered Pembroke Welsh Corgis
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            
{/* Image of dogs/puppies instead of map */}
            <Box 
              sx={{ 
                width: '100%', 
                height: 200, 
                backgroundImage: 'url(https://images.unsplash.com/photo-1612536057832-2ff7ead58194?q=80&w=1887)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '0 0 3px 3px'
              }}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Dogs Template
const DogsTemplate = ({ content, page }) => {
  const theme = useTheme();
  
  return (
    <Box>
      {/* Hero section */}
      <Box 
        sx={{ 
          mb: 5, 
          pb: 3, 
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden', 
          borderRadius: 3,
          backgroundColor: 'background.neutral',
          backgroundImage: 'url(https://images.unsplash.com/photo-1597633425046-08f5110420b5?q=80&w=2670)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          height: { xs: 200, md: 300 }
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            p: 3
          }}
        >
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              fontWeight: 700,
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
              mb: 2
            }}
          >
            Our Dogs
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{
              maxWidth: 700,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              fontSize: { xs: '1rem', md: '1.2rem' }
            }}
          >
            Meet our champion bloodline Pembroke Welsh Corgis that make our breeding program special
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 4 }}>
        Our breeding program consists of carefully selected Pembroke Welsh Corgis that exemplify the breed standard
        in temperament, structure, and health. Each of our dogs is health tested, AKC registered, and contributes
        valuable traits to our breeding program.
      </Typography>
      
      {/* Tabs or links for male/female dogs */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            color="primary"
            href="#males"
            sx={{ 
              px: 4, 
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Our Boys
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            href="#females"
            sx={{ 
              px: 4, 
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Our Girls
          </Button>
        </Stack>
      </Box>
      
      {/* Custom content if provided */}
      {content && content.length > 50 && (
        <Box mb={6}>
          <ShortcodeRenderer content={content} />
        </Box>
      )}
      
      {/* Default dogs display if no content */}
      {(!content || content.length < 50) && (
        <>
          <Box id="males" sx={{ mb: 6 }}>
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom 
              id="males"
              sx={{ 
                position: 'relative',
                pb: 2,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  bottom: 0,
                  left: 0
                }
              }}
            >
              Our Boys
            </Typography>
            <ShortcodeRenderer content="[DisplayDogs gender=Male]" />
          </Box>
          
          <Box id="females">
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom 
              id="females"
              sx={{ 
                position: 'relative',
                pb: 2,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  bottom: 0,
                  left: 0
                }
              }}
            >
              Our Girls
            </Typography>
            <ShortcodeRenderer content="[DisplayDogs gender=Female]" />
          </Box>
        </>
      )}
      
      {/* Health testing information */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Our Health Testing Program
        </Typography>
        
        <Card sx={{ backgroundColor: 'background.neutral', borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body1" paragraph>
              At Pembroke Pups, we believe that responsible breeding starts with rigorous health testing. All of our breeding dogs undergo the following health clearances:
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <VerifiedIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      OFA Hip Evaluation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All breeding dogs have OFA Good or Excellent hip ratings
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <VerifiedIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      OFA Eye Certification
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Annual eye examinations by board-certified ophthalmologists
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <VerifiedIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      DNA Testing
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tested for vWD, DM, and other breed-specific genetic conditions
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <VerifiedIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Cardiac Evaluation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Heart examinations to ensure freedom from cardiac conditions
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

// Puppies Template
const PuppiesTemplate = ({ content, page }) => {
  const theme = useTheme();
  
  return (
    <Box>
      {/* Hero section */}
      <Box 
        sx={{ 
          mb: 5, 
          pb: 3, 
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden', 
          borderRadius: 3,
          backgroundColor: 'background.neutral',
          backgroundImage: 'url(https://images.unsplash.com/photo-1425082661705-1834bfd09dca?q=80&w=2676)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          height: { xs: 200, md: 300 }
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            p: 3
          }}
        >
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              fontWeight: 700,
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
              mb: 2
            }}
          >
            Available Puppies
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{
              maxWidth: 700,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              fontSize: { xs: '1rem', md: '1.2rem' }
            }}
          >
            Find your perfect Pembroke Welsh Corgi companion
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 4 }}>
        Our Pembroke Welsh Corgi puppies are raised with love, early socialization, and the best veterinary care. 
        All puppies come with health guarantees, AKC registration, and lifetime breeder support.
      </Typography>
      
      {/* Puppy availability buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button 
            variant="contained" 
            color="primary"
            href="#available"
            sx={{ 
              px: 4, 
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Available Now
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            href="#upcoming"
            sx={{ 
              px: 4, 
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Upcoming Litters
          </Button>
          <Button 
            variant="outlined" 
            color="secondary"
            href="#waiting-list"
            sx={{ 
              px: 4, 
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Join Waiting List
          </Button>
        </Stack>
      </Box>
      
      {/* Custom content if provided */}
      {content && content.length > 50 && (
        <Box mb={6}>
          <ShortcodeRenderer content={content} />
        </Box>
      )}
      
      {/* Default puppy display if no content */}
      {(!content || content.length < 50) && (
        <>
          <Box id="available" sx={{ mb: 6 }}>
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom 
              sx={{ 
                position: 'relative',
                pb: 2,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  bottom: 0,
                  left: 0
                }
              }}
            >
              Currently Available Puppies
            </Typography>
            <ShortcodeRenderer content="[DisplayPuppies status=Available]" />
          </Box>
          
          <Box id="upcoming" sx={{ mb: 6 }}>
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom 
              sx={{ 
                position: 'relative',
                pb: 2,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  bottom: 0,
                  left: 0
                }
              }}
            >
              Upcoming Litters
            </Typography>
            <ShortcodeRenderer content="[DisplayLitters status=Planned]" />
          </Box>
          
          {/* Waiting list section */}
          <Box id="waiting-list" sx={{ mt: 6 }}>
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden', 
              background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            }}>
              <Grid container>
                <Grid item xs={12} md={7}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" component="h3" gutterBottom sx={{ color: 'white' }}>
                      Join Our Waiting List
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ color: 'white', mb: 3, opacity: 0.9 }}>
                      Our puppies are in high demand and often reserved before they're born. Join our waiting list to be notified about future litters and puppy availability.
                    </Typography>
                    
                    <Box 
                      component="form" 
                      sx={{ 
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'stretch',
                        mb: 3
                      }}
                    >
                      <input
                        type="email"
                        placeholder="Your email address"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          fontSize: '14px',
                          border: 'none',
                          borderRadius: '12px 0 0 12px',
                          outline: 'none',
                          marginBottom: '8px'
                        }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ 
                          borderRadius: { xs: '12px', sm: '0 12px 12px 0' },
                          whiteSpace: 'nowrap',
                          py: 1.5
                        }}
                      >
                        Join Waiting List
                      </Button>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                      We respect your privacy and will only contact you about puppy availability.
                    </Typography>
                  </CardContent>
                </Grid>
                <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Box 
                    sx={{ 
                      height: '100%',
                      backgroundImage: 'url(https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=2564)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                </Grid>
              </Grid>
            </Card>
          </Box>
        </>
      )}
      
      {/* Puppy FAQ section */}
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Frequently Asked Questions
        </Typography>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={500}>
              What is the adoption process?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              Our adoption process starts with an application to ensure our puppies go to loving homes that are well-prepared. We conduct interviews, check references, and may arrange a home visit. Once approved, a deposit secures your place on our waiting list for the next available puppy matching your preferences.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={500}>
              What comes with my puppy?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              All our puppies come with AKC registration (limited or full depending on the agreement), a comprehensive health record, first vaccinations, deworming, microchip, a health guarantee, a starter supply of food, a blanket with mother's scent, a toy, and a comprehensive puppy care guide.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={500}>
              How much do your puppies cost?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              Our Pembroke Welsh Corgi puppies typically range from $2,500 to $3,500 depending on pedigree, color, markings, and show potential. This reflects our investment in health testing, excellent care, socialization, and our commitment to responsible breeding practices.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={500}>
              Do you ship puppies?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              We prefer in-person pickup so we can properly transition the puppy to your care and provide hands-on guidance. For approved families at a distance, we can arrange for a flight nanny or puppy transportation service at additional cost.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={500}>
              What health guarantees do you provide?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              We offer a 2-year genetic health guarantee covering hereditary conditions that significantly impact quality of life. We require a veterinary check within 72 hours of bringing your puppy home. Full details are provided in our puppy contract.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

// FAQ Template
const FaqTemplate = ({ content, page }) => {
  return (
    <Box>
      {/* Hero section */}
      <Box 
        sx={{ 
          mb: 5, 
          pb: 3, 
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden', 
          borderRadius: 3,
          backgroundColor: 'background.neutral',
          backgroundImage: 'url(https://images.unsplash.com/photo-1546975490-e8b92a360b24?q=80&w=2574)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          height: { xs: 180, md: 220 }
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            p: 3
          }}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              fontWeight: 700,
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
              mb: 1
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{
              maxWidth: 600,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            Find answers to common questions about our Pembroke Welsh Corgis
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 4 }}>
        We've compiled answers to the most common questions about our breeding program, puppy adoption process, 
        and Pembroke Welsh Corgi care. If you don't find the information you're looking for, please don't hesitate to contact us.
      </Typography>
      
      {/* FAQ categories */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button 
            variant="contained" 
            color="primary"
            href="#puppies"
            sx={{ 
              px: 3, 
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Puppies & Adoption
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            href="#breed"
            sx={{ 
              px: 3, 
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            About The Breed
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            href="#care"
            sx={{ 
              px: 3, 
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Corgi Care
          </Button>
        </Stack>
      </Box>
      
      {/* Custom content if provided */}
      {content ? (
        <Box>
          <ShortcodeRenderer content={content} />
        </Box>
      ) : (
        <>
          {/* Default FAQs if no content */}
          <Box id="puppies" sx={{ mb: 5 }}>
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom 
              sx={{ 
                position: 'relative',
                pb: 2,
                mb: 3,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  bottom: 0,
                  left: 0
                }
              }}
            >
              Puppies & Adoption
            </Typography>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  How much do your puppies cost?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Our Pembroke Welsh Corgi puppies typically range from $2,500 to $3,500 depending on pedigree, color, markings, and show potential. This reflects our investment in health testing, excellent care, socialization, and our commitment to responsible breeding practices.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  What is your adoption process?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Our adoption process starts with an application to ensure our puppies go to loving homes that are well-prepared. We conduct interviews, check references, and may arrange a home visit. Once approved, a deposit secures your place on our waiting list for the next available puppy matching your preferences.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  How long is your waiting list?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Our waiting list length varies throughout the year, but typically ranges from 3-12 months. Wait times can be shorter for families with flexible preferences or longer for specific color/gender requests. We prioritize finding the right match over a quick placement.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  What comes with my puppy?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  All our puppies come with AKC registration (limited or full depending on the agreement), a comprehensive health record, first vaccinations, deworming, microchip, a health guarantee, a starter supply of food, a blanket with mother's scent, a toy, and a comprehensive puppy care guide.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
          
          <Box id="breed" sx={{ mb: 5 }}>
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom 
              sx={{ 
                position: 'relative',
                pb: 2,
                mb: 3,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  bottom: 0,
                  left: 0
                }
              }}
            >
              About The Breed
            </Typography>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  Are Corgis good family dogs?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Yes, Pembroke Welsh Corgis make excellent family dogs. They are intelligent, affectionate, and loyal companions who typically get along well with children and other pets when properly socialized. Their playful and alert nature makes them engaging family members, while their protective instincts make them good watchdogs.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  How big do Pembroke Welsh Corgis get?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Pembroke Welsh Corgis are medium-sized dogs with short legs and sturdy bodies. Adults typically stand 10-12 inches tall at the shoulder and weigh between 22-30 pounds for males and 20-28 pounds for females. Despite their short stature, they are robust, athletic dogs—not toy breeds.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  Are Corgis easy to train?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Pembroke Welsh Corgis are highly intelligent and eager to please, making them generally easy to train. They respond well to positive reinforcement techniques and consistent training. However, they can be independent thinkers with a stubborn streak, so early training and socialization are important for creating a well-mannered companion.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  What colors do Corgis come in?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Pembroke Welsh Corgis come in several color variations including red, sable, fawn, and tri-color (black, tan, and white). Most have white markings on their face, chest, legs, and neck. Traditionally, Pembrokes have a bobbed tail or a very short natural tail.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
          
          <Box id="care">
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom 
              sx={{ 
                position: 'relative',
                pb: 2,
                mb: 3,
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  bottom: 0,
                  left: 0
                }
              }}
            >
              Corgi Care
            </Typography>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  How much exercise do Corgis need?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Pembroke Welsh Corgis are active dogs that need regular exercise to stay healthy and happy. They typically require 30-60 minutes of physical activity daily, which can include walks, play sessions, and mental stimulation. Without adequate exercise, they may develop behavioral issues stemming from boredom and excess energy.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  Do Corgis shed a lot?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Yes, Pembroke Welsh Corgis are heavy shedders. They have a double coat that sheds year-round, with heavier seasonal shedding ("blowing coat") typically twice a year. Regular brushing (2-3 times per week, daily during shedding seasons) helps manage loose fur and maintains coat health.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  What health issues are Corgis prone to?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  As a breed, Pembroke Welsh Corgis can be prone to certain health conditions including hip dysplasia, degenerative myelopathy, progressive retinal atrophy, and von Willebrand's disease. They may also experience back problems due to their long spine. Our breeding program focuses on health testing to minimize these risks.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={500}>
                  What's the best diet for a Corgi?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Pembroke Welsh Corgis thrive on high-quality dog food appropriate for their age, activity level, and size. Because they can be prone to obesity, portion control is important. We recommend a diet formulated for medium-sized breeds with moderate to high activity levels, and monitoring treats to prevent weight gain.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </>
      )}
      
      {/* Contact CTA */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Still have questions?
        </Typography>
        <Typography variant="body1" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          If you didn't find the answer you were looking for, feel free to reach out to us directly.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          component={Link}
          to="/page/contact"
          size="large"
          sx={{ 
            px: 4,
            py: 1.2,
            borderRadius: 8,
            fontWeight: 600
          }}
        >
          Contact Us
        </Button>
      </Box>
    </Box>
  );
};

// Template components
const templates = {
  default: DefaultTemplate,
  about: AboutTemplate,
  contact: ContactTemplate,
  dogs: DogsTemplate,
  puppies: PuppiesTemplate,
  faq: FaqTemplate
};

const PublicPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { fetchPageBySlug } = usePages();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  // Convert loadPage to useCallback to prevent unnecessary re-renders
  const loadPage = useCallback(async () => {
    if (!slug) {
      setError('No page specified');
      setLoading(false);
      return;
    }
    
    // Only set loading to true if we don't already have this page
    if (!page || page.slug !== slug) {
      setLoading(true);
    }
    
    try {
      console.log(`Attempting to load page with slug: '${slug}'`);
      const pageData = await fetchPageBySlug(slug);
      
      if (pageData) {
        console.log(`Successfully found page: ${pageData.title} (${pageData.status})`);
        
        // Check if page is published
        if (pageData.status === 'draft') {
          console.log(`Page '${slug}' is a draft, redirecting to homepage`);
          // Navigate to 404 or homepage if page is draft
          navigate('/');
          return;
        }
        
        setPage(pageData);
      } else {
        console.error(`Page with slug '${slug}' not found in database`);
        
        // Special cases for common pages - create them on the fly if needed
        if (slug === 'dogs' || slug === 'our-dogs') {
          console.log('Creating dogs page on the fly');
          setPage({
            title: 'Our Dogs',
            slug: slug,
            content: '',
            template: 'dogs',
            status: 'published'
          });
        } else if (slug === 'puppies' || slug === 'available-puppies') {
          console.log('Creating puppies page on the fly');
          setPage({
            title: 'Available Puppies',
            slug: slug,
            content: '',
            template: 'puppies',
            status: 'published'
          });
        } else if (slug === 'about' || slug === 'about-us') {
          console.log('Creating about page on the fly');
          setPage({
            title: 'About Us',
            slug: slug,
            content: '',
            template: 'about',
            status: 'published'
          });
        } else if (slug === 'contact' || slug === 'contact-us') {
          console.log('Creating contact page on the fly');
          setPage({
            title: 'Contact Us',
            slug: slug,
            content: '',
            template: 'contact',
            status: 'published'
          });
        } else if (slug === 'faq' || slug === 'faqs') {
          console.log('Creating FAQ page on the fly');
          setPage({
            title: 'Frequently Asked Questions',
            slug: slug,
            content: '',
            template: 'faq',
            status: 'published'
          });
        } else {
          setError('Page not found');
        }
      }
    } catch (err) {
      console.error(`Error loading page '${slug}':`, err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  }, [slug, fetchPageBySlug, navigate]);

  // Load the page when slug changes
  useEffect(() => {
    loadPage();
  }, [loadPage]);

  // Function to render content based on template
  const renderPageContent = () => {
    if (!page) return null;
    
    const template = page.template || 'default';
    const TemplateComponent = templates[template] || templates.default;
    
    return <TemplateComponent content={page.content} page={page} />;
  };

  // Set the page title and meta description
  useEffect(() => {
    if (page) {
      document.title = `${page.title} | Pembroke Pups`;
      
      // Update meta description if provided
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        if (page.meta_description) {
          metaDescription.setAttribute('content', page.meta_description);
        } else {
          // Default meta descriptions based on template
          const defaultMetas = {
            about: 'Learn about our Pembroke Welsh Corgi breeding program focused on health, temperament, and breed standards.',
            dogs: 'Meet our champion bloodline Pembroke Welsh Corgis that form the foundation of our breeding program.',
            puppies: 'Find your perfect Pembroke Welsh Corgi puppy. View available puppies and upcoming litters.',
            contact: 'Contact Pembroke Pups for information about our Corgi puppies, breeding program, or to join our waiting list.',
            faq: 'Find answers to common questions about Pembroke Welsh Corgis, our breeding program, and puppy adoption process.'
          };
          
          const template = page.template || 'default';
          const metaContent = defaultMetas[template] || 'Quality Pembroke Welsh Corgi breeder dedicated to healthy, well-socialized puppies.';
          metaDescription.setAttribute('content', metaContent);
        }
      }
    }
    
    // Reset when component unmounts
    return () => {
      document.title = 'Pembroke Pups | Quality Pembroke Welsh Corgi Breeder';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Quality Pembroke Welsh Corgi breeder dedicated to healthy, well-socialized puppies with exceptional temperaments.');
      }
    };
  }, [page]);

  if (loading) {
    return (
      <>
        <PageNavigation />
        <Container maxWidth="lg">
          <Box sx={{ 
            mt: 8, 
            mb: 8, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center' 
          }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Loading...
            </Typography>
          </Box>
        </Container>
        <Footer />
      </>
    );
  }

  // Error page with improved design
  if (error) {
    return (
      <>
        <PageNavigation />
        <Container maxWidth="lg">
          <Box sx={{ 
            mt: 4, 
            mb: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 8
          }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '8rem', md: '12rem' },
                fontWeight: 700,
                color: 'primary.light',
                mb: 2,
                lineHeight: 1
              }}
            >
              404
            </Typography>
            <Typography 
              variant="h4" 
              color="text.primary" 
              gutterBottom
              sx={{ mb: 3 }}
            >
              Page Not Found
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              paragraph
              sx={{ maxWidth: 500, mb: 4 }}
            >
              The page you're looking for doesn't exist or has been moved. 
              Please check the URL or navigate to another page.
            </Typography>
            <Button 
              component={Link} 
              to="/"
              variant="contained"
              size="large"
              sx={{ 
                borderRadius: 8,
                px: 4,
                py: 1.2,
                fontWeight: 600
              }}
            >
              Return to Homepage
            </Button>
            
            <Box 
              component="img" 
              src="https://images.unsplash.com/photo-1612536057832-2ff7ead58194?q=80&w=1887" 
              alt="Corgi" 
              sx={{ 
                width: '100%', 
                maxWidth: 400, 
                mt: 6,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            />
          </Box>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <PageNavigation />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 6 }}>
          <Paper 
            sx={{ 
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            {/* Page header - only show for some templates */}
            {!['about', 'dogs', 'puppies', 'contact', 'faq'].includes(page.template) && (
              <>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    mb: 3,
                    color: 'text.primary',
                    fontWeight: 700
                  }}
                >
                  {page.title}
                </Typography>
                <Divider sx={{ mb: 4 }} />
              </>
            )}
            
            <Box className="page-content">
              {renderPageContent()}
            </Box>
          </Paper>
        </Box>
      </Container>
      <Footer />
    </>
  );
};

export default PublicPage;