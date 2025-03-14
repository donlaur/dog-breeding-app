// src/components/layout/DashboardLayout.js
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GlobalSearchShortcut from '../GlobalSearchShortcut';
import { useNotifications } from '../../context/NotificationContext';

// MUI components
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  useMediaQuery,
  useTheme,
  InputBase,
  Avatar,
  Menu,
  MenuItem,
  alpha,
  styled,
  Badge,
  Tooltip,
  Snackbar,
  Alert,
  Collapse,
  ListSubheader,
} from '@mui/material';

// MUI icons
import {
  Home as HomeIcon,
  Pets as PetsIcon,
  Favorite as HeartIcon,
  CalendarMonth as CalendarIcon,
  ChildCare as PuppyIcon,
  Person as ProfileIcon,
  Menu as MenuIcon,
  LogoutOutlined as LogoutIcon,
  NotificationsOutlined as NotificationsIcon,
  SettingsOutlined as SettingsIcon,
  Search as SearchIcon,
  AccountCircle,
  Article as PageIcon,
  ArticleOutlined as ArticleIcon,
  PhotoLibrary as MediaIcon,
  Keyboard as KeyboardIcon,
  Close as CloseIcon,
  MedicalServices as HealthIcon,
  Vaccines as VaccinesIcon,
  Medication as MedicationIcon,
  HealthAndSafety as HealthRecordsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Dashboard as DashboardIcon,
  Description as DocumentIcon,
  ContactMail as CRMIcon,
  Settings as SettingsIcon2,
} from '@mui/icons-material';

const drawerWidth = 260;

// Styled search component
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    paddingRight: '42px', // Make room for the shortcut badge
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '25ch',
    },
  },
  '& .MuiInputAdornment-root': {
    position: 'absolute',
    right: theme.spacing(1),
    top: '50%',
    transform: 'translateY(-50%)',
  },
}));

const DashboardLayout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchTip, setShowSearchTip] = useState(false);
  
  // Define navItems first before any functions that use it
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    
    // BREEDING PROGRAM section
    { 
      id: 'breeding',
      label: 'Breeding Program', 
      icon: <PetsIcon />,
      isExpandable: true,
      children: [
        { path: '/dashboard/dogs', label: 'Dogs', icon: <PetsIcon /> },
        { path: '/dashboard/litters', label: 'Litters', icon: <PuppyIcon /> },
        { path: '/dashboard/heats', label: 'Heats', icon: <HeartIcon /> }
      ]
    },
    
    // HEALTH MANAGEMENT section
    { 
      id: 'health',
      label: 'Health Management', 
      icon: <HealthIcon />, 
      isExpandable: true,
      children: [
        { path: '/dashboard/health', label: 'Health Dashboard', icon: <HealthIcon /> },
        { path: '/dashboard/health/vaccinations', label: 'Vaccinations', icon: <VaccinesIcon /> },
        { path: '/dashboard/health/medications', label: 'Medications', icon: <MedicationIcon /> },
        { path: '/dashboard/health/records', label: 'Health Records', icon: <HealthRecordsIcon /> }
      ]
    },
    
    // CALENDAR & MEDIA
    { path: '/dashboard/calendar', label: 'Calendar', icon: <CalendarIcon /> },
    { path: '/dashboard/media', label: 'Media Library', icon: <MediaIcon /> },
    
    // WEBSITE & CRM section
    { 
      id: 'content',
      label: 'Website & Content', 
      icon: <DocumentIcon />, 
      isExpandable: true,
      children: [
        { path: '/dashboard/pages', label: 'Web Pages', icon: <PageIcon /> }
      ]
    },
    
    // CRM section
    { 
      id: 'crm',
      label: 'Customer Management', 
      icon: <CRMIcon />, 
      isExpandable: true,
      children: [
        { path: '/dashboard/applications', label: 'Applications', icon: <ArticleIcon /> }
      ]
    },
    
    // ACCOUNT section
    { path: '/dashboard/profile', label: 'My Account', icon: <ProfileIcon /> },
  ];
  
  // State for collapsible menu sections
  const [openMenu, setOpenMenu] = useState({
    health: false,
    breeding: false,
    content: false,
    crm: false
  });
  
  // Check if any child route of a menu section is active
  const isMenuSectionActive = (menuId) => {
    if (!menuId || !navItems) return false;
    
    // Find the menu section
    const menuSection = navItems.find(item => item.id === menuId);
    if (!menuSection || !menuSection.children) return false;
    
    // Check if any child route is active
    return menuSection.children.some(child => isActive(child.path));
  };
  
  // Effect to automatically expand menu sections when their children are active
  useEffect(() => {
    const newOpenState = { ...openMenu };
    
    // Check each menu section
    navItems?.forEach(item => {
      if (item.isExpandable && item.id) {
        // If any child is active, expand the menu
        if (isMenuSectionActive(item.id)) {
          newOpenState[item.id] = true;
        }
      }
    });
    
    // Update state only if changes are needed
    if (JSON.stringify(newOpenState) !== JSON.stringify(openMenu)) {
      setOpenMenu(newOpenState);
    }
  }, [location.pathname, navItems, isMenuSectionActive, openMenu]);
  
  const handleMenuToggle = (menu) => {
    setOpenMenu({
      ...openMenu,
      [menu]: !openMenu[menu]
    });
  };
  
  const isActive = (path) => {
    // For exact matches like Dashboard
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    
    // For nested routes, make sure we don't highlight parent paths incorrectly
    // For example, /dashboard/health shouldn't highlight when we're on /dashboard/health/medications
    if (path === '/dashboard') {
      return false; // Don't highlight dashboard for other pages
    }
    
    // Special case for health dashboard route
    if (path === '/dashboard/health') {
      // Only highlight if it's exactly the health dashboard, not a sub-page
      return location.pathname === '/dashboard/health';
    }
    
    // For other child routes, check if the current path starts with the menu path
    // and either ends there or continues with a slash
    if (location.pathname.startsWith(path)) {
      // If path is exactly the same, it's active
      if (location.pathname === path) {
        return true;
      }
      
      // If path continues with a slash, it's a child route
      if (location.pathname.charAt(path.length) === '/') {
        return true;
      }
    }
    
    return false;
  };
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleSearchSubmit = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Show search tip if it's the user's first search
      if (!localStorage.getItem('searchTipShown')) {
        localStorage.setItem('searchTipShown', 'true');
        setShowSearchTip(true);
        // Hide the tip after 5 seconds
        setTimeout(() => setShowSearchTip(false), 5000);
      }
    }
  };
  
  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Show search tip if it's the user's first search
      if (!localStorage.getItem('searchTipShown')) {
        localStorage.setItem('searchTipShown', 'true');
        setShowSearchTip(true);
        // Hide the tip after 5 seconds
        setTimeout(() => setShowSearchTip(false), 5000);
      }
    }
  };
  
  const handleCloseTip = () => {
    setShowSearchTip(false);
  };
  
  const drawer = (
    <>
      <Toolbar 
        sx={{ 
          px: [1, 2], 
          minHeight: 64,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box display="flex" alignItems="center">
          <Box 
            component="img" 
            src="/icons/dog-paw.png" 
            alt="Logo" 
            sx={{ width: 32, height: 32, mr: 1 }}
          />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'white' }}>
            Breeder Dashboard
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
      <List sx={{ px: 2, py: 1 }}>
        {navItems.map((item) => (
          item.isExpandable ? (
            <React.Fragment key={item.id}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleMenuToggle(item.id)}
                  sx={{
                    borderRadius: 1,
                    py: 1,
                    color: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 40,
                      color: 'rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontSize: 14 }}
                  />
                  {openMenu[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openMenu[item.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItem key={child.path} disablePadding sx={{ pl: 4 }}>
                      <ListItemButton
                        component={Link}
                        to={child.path}
                        selected={isActive(child.path)}
                        sx={{
                          borderRadius: 1,
                          py: 1,
                          color: 'rgba(255, 255, 255, 0.8)',
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(255, 255, 255, 0.16)',
                            color: '#fff',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.24)',
                            },
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          },
                        }}
                        onClick={() => isMobile && setMobileOpen(false)}
                      >
                        <ListItemIcon 
                          sx={{ 
                            minWidth: 40,
                            color: isActive(child.path) ? '#fff' : 'rgba(255, 255, 255, 0.8)'
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={child.label} 
                          primaryTypographyProps={{ fontSize: 14 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ) : (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 1,
                  py: 1,
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.24)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                }}
                onClick={() => isMobile && setMobileOpen(false)}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 40,
                    color: isActive(item.path) ? '#fff' : 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ fontSize: 14 }}
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', mt: 2 }} />
      <List sx={{ px: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              py: 1,
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'rgba(255, 255, 255, 0.8)' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ fontSize: 14 }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  const { unreadCount } = useNotifications();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App bar */}
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          borderBottom: '1px solid #eaeaea',
        }}
      >
        <Toolbar>
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Page title - visible on mobile only */}
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'block', sm: 'none' } 
            }}
          >
            {navItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
          </Typography>
          
          {/* Search - visible on desktop */}
          <Search sx={{ display: { xs: 'none', sm: 'block' } }}>
            <SearchIconWrapper onClick={handleSearchClick}>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search dogs, puppies, litters..."
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleSearchSubmit}
              endAdornment={
                <Typography 
                  variant="caption" 
                  sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.08)', 
                    px: 0.5, 
                    py: 0.2, 
                    borderRadius: 1,
                    color: 'text.secondary',
                    display: { xs: 'none', md: 'inline' }
                  }}
                >
                  {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                </Typography>
              }
            />
          </Search>
          
          {/* Mobile search icon */}
          <IconButton 
            onClick={() => navigate('/dashboard/search')}
            sx={{ display: { xs: 'block', sm: 'none' }, mr: 1 }}
          >
            <SearchIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Action icons */}
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Notifications">
              <IconButton 
                size="large" 
                color="inherit"
                component={Link}
                to="/dashboard/notifications"
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="System Settings">
              <IconButton 
                size="large" 
                color="inherit"
                component={Link}
                to="/dashboard/settings"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Account">
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            keepMounted
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem 
              component={Link} 
              to="/dashboard/profile" 
              onClick={handleMenuClose}
            >
              Breeder Profile
            </MenuItem>
            <MenuItem 
              component={Link} 
              to="/dashboard/account" 
              onClick={handleMenuClose}
            >
              Account Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* The sidebar/drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="dashboard navigation"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#1a2035',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#1a2035',
              boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f8f9fa',
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* This creates space for the fixed app bar */}
        <Outlet />
      </Box>
      
      {/* Add global search shortcut */}
      <GlobalSearchShortcut />
      
      {/* Keyboard shortcut tip */}
      <Snackbar
        open={showSearchTip}
        autoHideDuration={5000}
        onClose={handleCloseTip}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseTip} 
          severity="info"
          icon={<KeyboardIcon />}
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': { 
              display: 'flex', 
              alignItems: 'center' 
            }
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseTip}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <Typography variant="body2">
            Pro tip: Press <b>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K</b> to search from anywhere
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardLayout; 