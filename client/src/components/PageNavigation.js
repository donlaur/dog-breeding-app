import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Container,
  Slide,
  useScrollTrigger,
  Fab,
  Divider,
  Avatar,
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PetsIcon from '@mui/icons-material/Pets';
import { usePages } from '../context/PageContext';

// Hide AppBar on scroll
function HideOnScroll(props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Scroll to top button
function ScrollTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = document.querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  return (
    <Slide direction="up" in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 2,
        }}
      >
        {children}
      </Box>
    </Slide>
  );
}

/**
 * Enhanced navigation component with modern design
 * Features:
 * - Hide on scroll for better mobile UX
 * - Full drawer navigation on mobile
 * - Active route highlighting
 * - Smooth transitions
 * - Scroll to top button
 */
const PageNavigation = (props) => {
  const { pages, loading, error, fetchPages } = usePages();
  const [menuPages, setMenuPages] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Custom default pages to always show even if not in CMS
  const defaultPages = [
    { id: 'dogs', title: 'Our Dogs', slug: 'dogs' },
    { id: 'puppies', title: 'Available Puppies', slug: 'puppies' },
    { id: 'about', title: 'About Us', slug: 'about' },
    { id: 'contact', title: 'Contact', slug: 'contact' },
  ];

  // Load menu pages on component mount
  useEffect(() => {
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and sort pages to show in menu
  useEffect(() => {
    if (pages && pages.length > 0) {
      // Filter only published pages marked to show in menu
      const filtered = pages.filter(page => 
        page.status === 'published' && page.show_in_menu
      );
      
      // Sort by menu_order
      const sorted = [...filtered].sort((a, b) => 
        (a.menu_order || 999) - (b.menu_order || 999)
      );
      
      // Combine with default pages, avoiding duplicates
      const slugsInMenu = sorted.map(p => p.slug);
      const additionalPages = defaultPages.filter(p => !slugsInMenu.includes(p.slug));
      
      setMenuPages([...sorted, ...additionalPages]);
    } else {
      // If no pages from CMS, use default pages
      setMenuPages(defaultPages);
    }
  }, [pages]);

  // Toggle drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // Check if a page is the current active page
  const isActivePage = (pageSlug) => {
    if (pageSlug === 'home' && location.pathname === '/') return true;
    return location.pathname === `/page/${pageSlug}`;
  };

  // If still loading, show a minimal header
  if (loading) return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography variant="h6">Breeder Site</Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
  
  if (error) return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
            Breeder Site
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );

  return (
    <>
      <div id="back-to-top-anchor" />
      <HideOnScroll {...props}>
        <AppBar position="sticky" color="default" elevation={2}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ py: { xs: 1, md: 0.5 } }}>
              {/* Site Logo/Name */}
              <Box
                component={RouterLink}
                to="/"
                sx={{ 
                  flexGrow: 0,
                  mr: 3,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Avatar
                  alt="Logo"
                  sx={{ 
                    width: { xs: 40, md: 45 }, 
                    height: { xs: 40, md: 45 }, 
                    mr: 1.5,
                    backgroundColor: 'primary.main',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <PetsIcon fontSize="medium" />
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography 
                    variant="h6" 
                    component="span"
                    sx={{ 
                      fontWeight: 600,
                      lineHeight: 1.2,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Pembroke Pups
                  </Typography>
                  <Typography 
                    variant="caption" 
                    component="span" 
                    sx={{ 
                      display: { xs: 'none', sm: 'block' },
                      color: 'text.secondary',
                      fontWeight: 500,
                      lineHeight: 1
                    }}
                  >
                    Pembroke Welsh Corgi Breeder
                  </Typography>
                </Box>
              </Box>
              
              {/* Desktop Navigation */}
              <Box sx={{ 
                flexGrow: 1, 
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center',
                gap: 1
              }}>
                <Button 
                  component={RouterLink}
                  to="/"
                  sx={{ 
                    color: location.pathname === '/' ? 'primary.main' : 'text.primary',
                    display: 'block',
                    px: 2,
                    py: 1,
                    fontWeight: location.pathname === '/' ? 600 : 500,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: 'primary.main',
                    },
                    '&::after': location.pathname === '/' ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '50%',
                      height: '3px',
                      backgroundColor: 'primary.main',
                      borderRadius: '2px'
                    } : {}
                  }}
                >
                  Home
                </Button>
                
                {menuPages.map((page) => (
                  <Button
                    key={page.id}
                    component={RouterLink}
                    to={`/page/${page.slug}`}
                    sx={{ 
                      color: isActivePage(page.slug) ? 'primary.main' : 'text.primary',
                      display: 'block',
                      px: 2,
                      py: 1,
                      fontWeight: isActivePage(page.slug) ? 600 : 500,
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main',
                      },
                      '&::after': isActivePage(page.slug) ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '50%',
                        height: '3px',
                        backgroundColor: 'primary.main',
                        borderRadius: '2px'
                      } : {}
                    }}
                  >
                    {page.title}
                  </Button>
                ))}
              </Box>
              
              {/* Contact button on desktop */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  component={RouterLink}
                  to="/page/contact"
                  sx={{ 
                    borderRadius: 8,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                  }}
                >
                  Contact Us
                </Button>
              </Box>
              
              {/* Mobile Navigation */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}>
                <IconButton
                  size="large"
                  aria-label="menu"
                  aria-controls="mobile-menu"
                  aria-haspopup="true"
                  onClick={toggleDrawer(true)}
                  color="inherit"
                  sx={{ 
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
              
              {/* Mobile Drawer */}
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                sx={{
                  '& .MuiDrawer-paper': { 
                    width: { xs: '100%', sm: 350 },
                    backgroundColor: 'background.paper',
                    borderRadius: { xs: 0, sm: '16px 0 0 16px' }
                  },
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  position: 'relative'
                }}>
                  {/* Drawer header with logo and close button */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    py: 2, 
                    px: 3,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flex: 1
                    }}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          mr: 1.5,
                          backgroundColor: 'primary.main'
                        }}
                      >
                        <PetsIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Pembroke Pups
                      </Typography>
                    </Box>
                    <IconButton 
                      onClick={toggleDrawer(false)}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(0,0,0,0.05)' 
                        } 
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  
                  {/* Menu Items */}
                  <List sx={{ flex: 1, py: 2 }}>
                    <ListItem 
                      button 
                      component={RouterLink} 
                      to="/" 
                      onClick={toggleDrawer(false)}
                      selected={location.pathname === '/'}
                      sx={{ 
                        borderRadius: 2,
                        mb: 1,
                        mx: 1.5,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          }
                        }
                      }}
                    >
                      <ListItemText 
                        primary="Home" 
                        primaryTypographyProps={{ 
                          fontWeight: location.pathname === '/' ? 600 : 500 
                        }}
                      />
                      {location.pathname === '/' && (
                        <Chip 
                          label="Active" 
                          size="small" 
                          color="primary" 
                          sx={{ height: 24 }}
                        />
                      )}
                    </ListItem>
                    
                    {menuPages.map((page) => (
                      <ListItem 
                        key={page.id}
                        button 
                        component={RouterLink} 
                        to={`/page/${page.slug}`} 
                        onClick={toggleDrawer(false)}
                        selected={isActivePage(page.slug)}
                        sx={{ 
                          borderRadius: 2,
                          mb: 1,
                          mx: 1.5,
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.light',
                            }
                          }
                        }}
                      >
                        <ListItemText 
                          primary={page.title} 
                          primaryTypographyProps={{ 
                            fontWeight: isActivePage(page.slug) ? 600 : 500 
                          }}
                        />
                        {isActivePage(page.slug) && (
                          <Chip 
                            label="Active" 
                            size="small" 
                            color="primary" 
                            sx={{ height: 24 }}
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                  
                  {/* Contact button at bottom of drawer */}
                  <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      component={RouterLink}
                      to="/page/contact"
                      onClick={toggleDrawer(false)}
                      fullWidth
                      size="large"
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 600,
                        py: 1.5
                      }}
                    >
                      Contact Us
                    </Button>
                  </Box>
                </Box>
              </Drawer>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>
      
      {/* Scroll to top button */}
      <ScrollTop {...props}>
        <Fab 
          color="primary" 
          size="small" 
          aria-label="scroll back to top"
          sx={{ 
            boxShadow: 3,
            '&:hover': {
              transform: 'translateY(-3px)',
            }
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </>
  );
};

export default PageNavigation;