import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Button, 
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { usePages } from '../context/PageContext';

/**
 * Navigation component that displays pages from the CMS
 * Can be used in public-facing pages to show navigation menu
 */
const PageNavigation = () => {
  const { pages, loading, error, fetchPages } = usePages();
  const [menuPages, setMenuPages] = useState([]);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

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
      
      setMenuPages(sorted);
    }
  }, [pages]);

  // Handle mobile menu open/close
  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  // If still loading or error, show nothing or simple placeholder
  if (loading) return null;
  if (error) return <Typography color="error">Menu unavailable</Typography>;

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Site Logo/Name */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ 
              flexGrow: 0,
              mr: 4,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box
              component="img"
              src="/favicon.ico"
              alt="Logo"
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            Breeder Site
          </Typography>
          
          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button 
              component={RouterLink}
              to="/"
              sx={{ color: 'inherit', display: 'block', mx: 1 }}
            >
              Home
            </Button>
            
            {menuPages.map((page) => (
              <Button
                key={page.id}
                component={RouterLink}
                to={`/page/${page.slug}`}
                sx={{ color: 'inherit', display: 'block', mx: 1 }}
              >
                {page.title}
              </Button>
            ))}
          </Box>
          
          {/* Mobile Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-end' }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={mobileMenuAnchor}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              <MenuItem 
                component={RouterLink} 
                to="/"
                onClick={handleMobileMenuClose}
              >
                <ListItemText>Home</ListItemText>
              </MenuItem>
              {menuPages.map((page) => (
                <MenuItem
                  key={page.id}
                  component={RouterLink}
                  to={`/page/${page.slug}`}
                  onClick={handleMobileMenuClose}
                >
                  <ListItemText>{page.title}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default PageNavigation;