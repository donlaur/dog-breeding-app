import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
  ListItemIcon,
  ListItemText,
  Collapse,
  Menu,
  MenuItem,
  Avatar,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  ExpandLess,
  ExpandMore,
  Healing as HealingIcon,
  Face as FaceIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  NotificationsActive as NotificationsIcon,
  AcUnit as HeatIcon,
  Favorite as LitterIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../hooks/useAuth';
import NotificationsCenter from './NotificationsCenter';

const drawerWidth = 240;

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerStyled = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const DashboardLayout = () => {
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [healthOpen, setHealthOpen] = useState(false);
  const [dogsOpen, setDogsOpen] = useState(false);
  const [littersOpen, setLittersOpen] = useState(false);
  const [heatsOpen, setHeatsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  
  // Automatically expand submenus based on current path
  useEffect(() => {
    if (location.pathname.includes('/dashboard/health')) {
      setHealthOpen(true);
    }
    if (location.pathname.includes('/dashboard/dogs')) {
      setDogsOpen(true);
    }
    if (location.pathname.includes('/dashboard/litters')) {
      setLittersOpen(true);
    }
    if (location.pathname.includes('/dashboard/heats')) {
      setHeatsOpen(true);
    }
  }, [location.pathname]);
  
  // Toggle drawer open state
  const toggleDrawer = () => {
    setOpen(!open);
  };
  
  // Toggle health submenu
  const toggleHealth = () => {
    setHealthOpen(!healthOpen);
  };
  
  // Toggle dogs submenu
  const toggleDogs = () => {
    setDogsOpen(!dogsOpen);
  };
  
  // Toggle litters submenu
  const toggleLitters = () => {
    setLittersOpen(!littersOpen);
  };
  
  // Toggle heats submenu
  const toggleHeats = () => {
    setHeatsOpen(!heatsOpen);
  };
  
  // Handle profile menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle profile menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle logging out
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };
  
  // Handle marking a notification as read
  const handleMarkAsRead = (id) => {
    // Implementation for marking notification as read
    // This would update the unread count
    setUnreadNotifications(Math.max(0, unreadNotifications - 1));
  };
  
  // Check if a menu item should be highlighted
  const isActive = (path) => {
    // Exact match
    if (location.pathname === path) {
      return true;
    }
    
    // For nested routes, make sure we don't highlight parent paths incorrectly
    // For example, /dashboard/health shouldn't highlight when we're on /dashboard/health/medications
    if (path === '/dashboard') {
      return false; // Don't highlight dashboard for other pages
    }
    
    // Special case for health dashboard to prevent highlighting when on sub-pages
    if (path === '/dashboard/health' && location.pathname !== '/dashboard/health') {
      // If we're on a sub-page like /dashboard/health/records, don't highlight the health dashboard
      return false;
    }
    
    // For child routes, check if the current path starts with the menu path
    // and either ends there or continues with a slash
    if (location.pathname.startsWith(path)) {
      // If path is exactly the same, it's active
      if (location.pathname === path) {
        return true;
      }
      
      // If path is followed by a slash, it's a child route
      const nextChar = location.pathname.charAt(path.length);
      return nextChar === '/';
    }
    
    return false;
  };
  
  // Main content for the drawer sidebar
  const drawer = (
    <div>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
        }}
      >
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Breeder Tools
        </Typography>
        <IconButton onClick={toggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        <ListItem 
          button 
          component={Link} 
          to="/dashboard" 
          selected={isActive('/dashboard')}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        
        {/* Health Management Section */}
        <ListItem button onClick={toggleHealth}>
          <ListItemIcon>
            <HealingIcon />
          </ListItemIcon>
          <ListItemText primary="Health" />
          {healthOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={healthOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/health" 
              selected={isActive('/dashboard/health')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Health Dashboard" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/health/records" 
              selected={isActive('/dashboard/health/records')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText primary="Health Records" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/health/medications" 
              selected={isActive('/dashboard/health/medications')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <HealingIcon />
              </ListItemIcon>
              <ListItemText primary="Medications" />
            </ListItem>
          </List>
        </Collapse>
        
        {/* Dogs Management Section */}
        <ListItem button onClick={toggleDogs}>
          <ListItemIcon>
            <PetsIcon />
          </ListItemIcon>
          <ListItemText primary="Dogs" />
          {dogsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={dogsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/dogs/manage" 
              selected={isActive('/dashboard/dogs/manage')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <PetsIcon />
              </ListItemIcon>
              <ListItemText primary="Manage Dogs" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/dogs/add" 
              selected={isActive('/dashboard/dogs/add')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <PetsIcon />
              </ListItemIcon>
              <ListItemText primary="Add Dog" />
            </ListItem>
          </List>
        </Collapse>
        
        {/* Litters Management Section */}
        <ListItem button onClick={toggleLitters}>
          <ListItemIcon>
            <LitterIcon />
          </ListItemIcon>
          <ListItemText primary="Litters" />
          {littersOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={littersOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/litters/manage" 
              selected={isActive('/dashboard/litters/manage')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <LitterIcon />
              </ListItemIcon>
              <ListItemText primary="Manage Litters" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/litters/add" 
              selected={isActive('/dashboard/litters/add')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <LitterIcon />
              </ListItemIcon>
              <ListItemText primary="Add Litter" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/puppies/manage" 
              selected={isActive('/dashboard/puppies/manage')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <PetsIcon />
              </ListItemIcon>
              <ListItemText primary="Manage Puppies" />
            </ListItem>
          </List>
        </Collapse>
        
        {/* Heats Management Section */}
        <ListItem button onClick={toggleHeats}>
          <ListItemIcon>
            <HeatIcon />
          </ListItemIcon>
          <ListItemText primary="Heats" />
          {heatsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={heatsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/heats/manage" 
              selected={isActive('/dashboard/heats/manage')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <HeatIcon />
              </ListItemIcon>
              <ListItemText primary="Manage Heats" />
            </ListItem>
            <ListItem 
              button 
              component={Link} 
              to="/dashboard/heats/add" 
              selected={isActive('/dashboard/heats/add')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <HeatIcon />
              </ListItemIcon>
              <ListItemText primary="Add Heat" />
            </ListItem>
          </List>
        </Collapse>
        
        {/* Other main sections */}
        <ListItem 
          button 
          component={Link} 
          to="/dashboard/applications" 
          selected={isActive('/dashboard/applications')}
        >
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText primary="Applications" />
        </ListItem>
        <ListItem 
          button 
          component={Link} 
          to="/dashboard/customers" 
          selected={isActive('/dashboard/customers')}
        >
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Customer CRM" />
        </ListItem>
        <ListItem 
          button 
          component={Link} 
          to="/dashboard/media" 
          selected={isActive('/dashboard/media')}
        >
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary="Media Library" />
        </ListItem>
        <ListItem 
          button 
          component={Link} 
          to="/dashboard/profile" 
          selected={isActive('/dashboard/profile')}
        >
          <ListItemIcon>
            <FaceIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
      </List>
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="absolute" open={open}>
        <Toolbar
          sx={{
            pr: '24px',
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            Breeding Management System
          </Typography>
          <IconButton color="inherit" onClick={toggleNotifications}>
            <Badge badgeContent={unreadNotifications} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
          >
            <Avatar alt={user?.name || 'User'} src={user?.avatar} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem component={Link} to="/dashboard/profile">Profile</MenuItem>
            <MenuItem component={Link} to="/dashboard/settings">Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>
      <DrawerStyled
        variant="permanent"
        open={open}
      >
        {drawer}
      </DrawerStyled>
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          padding: (theme) => theme.spacing(4)
        }}
      >
        <Toolbar /> {/* Spacer for fixed app bar */}
        {notificationsOpen && (
          <NotificationsCenter 
            onClose={() => setNotificationsOpen(false)}
            onMarkAsRead={handleMarkAsRead}
          />
        )}
        {/* Main content */}
        <Box sx={{ p: 3 }}>
          {/* This is where the main content will be rendered */}
          {/* Components will be passed as children to DashboardLayout */}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
