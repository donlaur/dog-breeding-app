import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link, 
  IconButton, 
  Divider, 
  Button,
  Stack,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import PinterestIcon from '@mui/icons-material/Pinterest';
import YouTubeIcon from '@mui/icons-material/YouTube';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PetsIcon from '@mui/icons-material/Pets';

/**
 * Enhanced footer component with multiple sections
 * - Business information
 * - Quick links
 * - Newsletter signup
 * - Social media links
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box component="footer" sx={{ 
      bgcolor: 'background.neutral', 
      color: 'text.primary',
      borderTop: '1px solid',
      borderColor: 'divider',
      mt: 6,
      pt: 6,
      pb: 3
    }}>
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Grid container spacing={4}>
          {/* Logo and About */}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PetsIcon 
                sx={{ 
                  color: 'primary.main', 
                  fontSize: 32, 
                  mr: 1.5 
                }} 
              />
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '-0.02em'
                }}
              >
                Pembroke Pups
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, maxWidth: 300 }}>
              Quality Pembroke Welsh Corgi puppies from health-tested parents. 
              Our breeding program focuses on temperament, health, and breed standard excellence.
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOnIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                Portland, Oregon
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PhoneIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                (555) 123-4567
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                info@pembrokepups.com
              </Typography>
            </Box>
          </Grid>
          
          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Quick Links
            </Typography>
            
            <List disablePadding dense>
              <ListItem disableGutters disablePadding sx={{ mb: 0.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Home
                </Link>
              </ListItem>
              <ListItem disableGutters disablePadding sx={{ mb: 0.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/page/dogs"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Our Dogs
                </Link>
              </ListItem>
              <ListItem disableGutters disablePadding sx={{ mb: 0.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/page/puppies"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Available Puppies
                </Link>
              </ListItem>
              <ListItem disableGutters disablePadding sx={{ mb: 0.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/page/about"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  About Us
                </Link>
              </ListItem>
              <ListItem disableGutters disablePadding>
                <Link 
                  component={RouterLink} 
                  to="/page/contact"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Contact
                </Link>
              </ListItem>
            </List>
          </Grid>
          
          {/* Resources */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Resources
            </Typography>
            
            <List disablePadding dense>
              <ListItem disableGutters disablePadding sx={{ mb: 0.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/page/faq"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  FAQ
                </Link>
              </ListItem>
              <ListItem disableGutters disablePadding sx={{ mb: 0.5 }}>
                <Link 
                  href="https://www.akc.org/dog-breeds/pembroke-welsh-corgi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Breed Standard
                </Link>
              </ListItem>
              <ListItem disableGutters disablePadding sx={{ mb: 0.5 }}>
                <Link 
                  href="https://pwcca.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Breed Club
                </Link>
              </ListItem>
              <ListItem disableGutters disablePadding>
                <Link 
                  component={RouterLink} 
                  to="/page/health-testing"
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Health Testing
                </Link>
              </ListItem>
            </List>
          </Grid>
          
          {/* Newsletter Signup */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Stay Updated
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              Subscribe to receive updates about new litters, puppy availability, and more.
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
                  padding: '10px 16px',
                  fontSize: '14px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px 0 0 12px',
                  borderRight: 0,
                  outline: 'none',
                  marginBottom: { xs: '8px', sm: 0 }
                }}
              />
              <Button
                variant="contained"
                size="small"
                sx={{ 
                  borderRadius: { xs: '12px', sm: '0 12px 12px 0' },
                  whiteSpace: 'nowrap'
                }}
              >
                Subscribe
              </Button>
            </Box>
            
            {/* Social Media */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Follow Us
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <IconButton 
                aria-label="Facebook" 
                color="primary"
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { transform: 'translateY(-3px)' }
                }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton 
                aria-label="Instagram" 
                color="primary"
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { transform: 'translateY(-3px)' }
                }}
              >
                <InstagramIcon />
              </IconButton>
              <IconButton 
                aria-label="Pinterest" 
                color="primary"
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { transform: 'translateY(-3px)' }
                }}
              >
                <PinterestIcon />
              </IconButton>
              <IconButton 
                aria-label="YouTube" 
                color="primary"
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { transform: 'translateY(-3px)' }
                }}
              >
                <YouTubeIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
        
        {/* Footer Bottom */}
        <Divider sx={{ mt: 4, mb: 3 }} />
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 1, sm: 0 } }}>
            &copy; {currentYear} Pembroke Pups. All rights reserved.
          </Typography>
          
          <Box>
            <Link 
              href="#" 
              color="text.secondary" 
              underline="hover" 
              sx={{ mx: 1, fontSize: '0.875rem' }}
            >
              Privacy Policy
            </Link>
            <Link 
              href="#" 
              color="text.secondary" 
              underline="hover" 
              sx={{ mx: 1, fontSize: '0.875rem' }}
            >
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;