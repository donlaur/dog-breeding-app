import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Switch,
  Divider,
  FormControlLabel,
  FormGroup,
  Badge,
  Snackbar,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import PetsIcon from '@mui/icons-material/Pets';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import { useNotifications } from '../../context/NotificationContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications();
  
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    dogUpdates: true,
    puppyUpdates: true,
    litterUpdates: true,
    messageAlerts: true,
    eventReminders: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (event) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked
    });
    
    setSnackbar({
      open: true,
      message: 'Notification settings updated',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleMarkAsRead = (id) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    
    setSnackbar({
      open: true,
      message: 'All notifications marked as read',
      severity: 'success'
    });
  };

  const handleDeleteNotification = (id) => {
    deleteNotification(id);
  };

  const handleClearAllNotifications = () => {
    clearAllNotifications();
    
    setSnackbar({
      open: true,
      message: 'All notifications cleared',
      severity: 'success'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'dog':
        return <PetsIcon />;
      case 'puppy':
        return <ChildCareIcon />;
      case 'message':
        return <EmailIcon />;
      case 'event':
        return <EventIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <NotificationsIcon sx={{ mr: 1 }} /> 
        Notifications
        {unreadCount > 0 && (
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{ ml: 2 }}
          />
        )}
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Notifications" />
          <Tab label="Settings" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {notifications.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, px: 2 }}>
                <Button 
                  onClick={handleMarkAllAsRead}
                  startIcon={<MarkEmailReadIcon />}
                  sx={{ mr: 1 }}
                >
                  Mark All as Read
                </Button>
                <Button 
                  onClick={handleClearAllNotifications}
                  startIcon={<DeleteOutlineIcon />}
                  color="error"
                >
                  Clear All
                </Button>
              </Box>
              
              <List>
                {notifications.map((notification) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        backgroundColor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                        py: 2
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: notification.read ? 'grey.400' : 'primary.main'
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" component="div">
                            {notification.title}
                            {!notification.read && (
                              <Box
                                component="span"
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'error.main',
                                  display: 'inline-block',
                                  ml: 1
                                }}
                              />
                            )}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" color="text.primary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" component="div" color="text.secondary">
                              {new Date(notification.date).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        {!notification.read && (
                          <IconButton 
                            edge="end" 
                            aria-label="mark as read"
                            onClick={() => handleMarkAsRead(notification.id)}
                            sx={{ mr: 1 }}
                          >
                            <MarkEmailReadIcon />
                          </IconButton>
                        )}
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any notifications at the moment.
              </Typography>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom sx={{ px: 2 }}>
            Notification Preferences
          </Typography>
          
          <Box sx={{ px: 2 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={handleSettingChange}
                    name="emailNotifications"
                    color="primary"
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={handleSettingChange}
                    name="pushNotifications"
                    color="primary"
                  />
                }
                label="Push Notifications"
              />
            </FormGroup>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom sx={{ px: 2 }}>
            Notification Types
          </Typography>
          
          <Box sx={{ px: 2 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.dogUpdates}
                    onChange={handleSettingChange}
                    name="dogUpdates"
                    color="primary"
                  />
                }
                label="Dog Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.puppyUpdates}
                    onChange={handleSettingChange}
                    name="puppyUpdates"
                    color="primary"
                  />
                }
                label="Puppy Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.litterUpdates}
                    onChange={handleSettingChange}
                    name="litterUpdates"
                    color="primary"
                  />
                }
                label="Litter Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.messageAlerts}
                    onChange={handleSettingChange}
                    name="messageAlerts"
                    color="primary"
                  />
                }
                label="Message Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.eventReminders}
                    onChange={handleSettingChange}
                    name="eventReminders"
                    color="primary"
                  />
                }
                label="Event Reminders"
              />
            </FormGroup>
          </Box>
        </TabPanel>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default NotificationsPage;