// src/components/EventsListView.js
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Badge,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Event as EventIcon,
  EventNote as EventNoteIcon,
  Pets as PetsIcon,
  Favorite as FavoriteIcon,
  Healing as HealingIcon,
  Spa as SpaIcon,
  EmojiEvents as ShowsIcon,
  Celebration as BirthdayIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { debugLog, debugError } from '../config';
import { apiGet, apiDelete } from '../utils/apiUtils';

// Helper function to determine event icon
const getEventIcon = (event) => {
  // Check source type first
  if (event.sourceType === 'heat') {
    return <FavoriteIcon color="error" />;
  }
  
  if (event.sourceType === 'litter-birth') {
    return <PetsIcon color="primary" />;
  }
  
  if (event.sourceType === 'litter-gohome') {
    return <PetsIcon color="action" />;
  }
  
  // Check category for standard events
  switch (event.category) {
    case 'Health':
      return <HealingIcon color="secondary" />;
    case 'Breeding':
      return <FavoriteIcon color="error" />;
    case 'Training':
      return <SpaIcon color="primary" />;
    case 'Shows':
      return <ShowsIcon color="warning" />;
    case 'General':
      if (event.event_type === 'Birthday') {
        return <BirthdayIcon color="success" />;
      }
      return <EventNoteIcon color="info" />;
    default:
      return <EventIcon />;
  }
};

// Format date for display
const formatEventDate = (dateString) => {
  const date = moment(dateString);
  return date.format('MMM D, YYYY');
};

// Format date with time
const formatEventDateTime = (dateString) => {
  const date = moment(dateString);
  return date.format('MMM D, YYYY, h:mm a');
};

// Get relative time
const getRelativeTime = (dateString) => {
  const date = moment(dateString);
  return date.fromNow();
};

// EventsListView component
const EventsListView = ({ onEventCreated, onEventDeleted, onEventEdited, limit, showPast = false, filter = null }) => {
  // State for events
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filter/search
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [relatedEntities, setRelatedEntities] = useState({
    dogs: [],
    litters: [],
    puppies: []
  });
  
  // State for event actions
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Fetch events from all sources
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from multiple sources concurrently
      const [eventsResponse, heatsResponse, littersResponse] = await Promise.all([
        apiGet('/events/'),
        apiGet('/heats/'),
        apiGet('/litters/')
      ]);
      
      debugLog('Events API response:', eventsResponse);
      
      // Process custom events from events table
      let allEvents = [];
      
      // Process regular events
      const eventsData = eventsResponse || [];
      allEvents = eventsData.map(event => ({
        ...event,
        sourceType: 'event' // Mark the source for identification
      }));
      
      // Process heat cycles as events
      const heatsData = heatsResponse || [];
      const heatEvents = heatsData.map(heat => ({
        id: `heat-${heat.id}`,
        title: `Heat Cycle`,
        description: heat.notes || 'Heat cycle',
        start_date: heat.start_date,
        end_date: heat.end_date,
        category: 'Breeding',
        event_type: 'Heat',
        all_day: true,
        color: '#e57373',
        relates_to: 'dog',
        related_id: heat.dog_id,
        sourceType: 'heat',
        // Include the raw heat data for reference
        heatData: heat
      }));
      
      allEvents = [...allEvents, ...heatEvents];
      
      // Process litters as events
      const littersData = littersResponse || [];
      
      // Map litters to birth events
      const litterBirthEvents = littersData
        .filter(litter => litter.whelp_date) // Only include litters with whelp date
        .map(litter => ({
          id: `litter-birth-${litter.id}`,
          title: `Litter Born`,
          description: `${litter.name || 'Litter'} whelped`,
          start_date: litter.whelp_date,
          end_date: litter.whelp_date,
          category: 'Breeding',
          event_type: 'Whelping',
          all_day: true,
          color: '#4caf50',
          relates_to: 'litter',
          related_id: litter.id,
          sourceType: 'litter-birth',
          // Include the raw litter data for reference
          litterData: litter
        }));
      
      // Map litters to go-home events
      const litterGoHomeEvents = littersData
        .filter(litter => litter.go_home_date) // Only include litters with go home date
        .map(litter => ({
          id: `litter-gohome-${litter.id}`,
          title: `Puppies Go Home`,
          description: `${litter.name || 'Litter'} puppies go to new homes`,
          start_date: litter.go_home_date,
          end_date: litter.go_home_date,
          category: 'General',
          event_type: 'Milestone',
          all_day: true,
          color: '#2196f3',
          relates_to: 'litter',
          related_id: litter.id,
          sourceType: 'litter-gohome',
          // Include the raw litter data for reference
          litterData: litter
        }));
      
      // Combine all events
      allEvents = [...allEvents, ...litterBirthEvents, ...litterGoHomeEvents];
      
      // Sort events by date
      allEvents.sort((a, b) => {
        return new Date(a.start_date) - new Date(b.start_date);
      });
      
      // Apply limit if specified
      if (limit && !isNaN(limit)) {
        allEvents = allEvents.slice(0, parseInt(limit));
      }
      
      setEvents(allEvents);
    } catch (err) {
      debugError('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [limit]);
  
  // Fetch related entities (dogs, litters) for display info
  useEffect(() => {
    const fetchRelatedEntities = async () => {
      try {
        const [dogsResponse, littersResponse, puppiesResponse] = await Promise.all([
          apiGet('/dogs/'),
          apiGet('/litters/'),
          apiGet('/puppies/')
        ]);
        
        const dogsData = dogsResponse || [];
        const littersData = littersResponse || [];
        const puppiesData = puppiesResponse || [];
        
        const entitiesData = {
          dogs: dogsData,
          litters: littersData,
          puppies: puppiesData
        };
        
        setRelatedEntities(entitiesData);
      } catch (err) {
        debugError('Error fetching related entities:', err);
        // Non-critical, so we don't set an error state
      }
    };
    
    fetchRelatedEntities();
  }, []);
  
  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  // Update filtered events when events change or search term changes
  useEffect(() => {
    let filtered = [...events];
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(term) ||
        (event.description && event.description.toLowerCase().includes(term))
      );
    }
    
    // Apply tab filter
    if (tabValue === 1) { // Upcoming
      filtered = filtered.filter(event => 
        moment(event.start_date).isAfter(moment())
      );
    } else if (tabValue === 2) { // Past
      filtered = filtered.filter(event => 
        moment(event.start_date).isBefore(moment())
      );
    }
    
    // Apply external filter if provided
    if (filter) {
      if (filter.category) {
        filtered = filtered.filter(event => event.category === filter.category);
      }
      if (filter.eventType) {
        filtered = filtered.filter(event => event.event_type === filter.eventType);
      }
      if (filter.relatesTo) {
        filtered = filtered.filter(event => 
          event.relates_to === filter.relatesTo.type && 
          event.related_id === filter.relatesTo.id
        );
      }
    }
    
    // Show past based on prop
    if (!showPast) {
      filtered = filtered.filter(event => 
        moment(event.start_date).isAfter(moment().subtract(1, 'days'))
      );
    }
    
    // Sort events by date
    filtered.sort((a, b) => {
      return new Date(a.start_date) - new Date(b.start_date);
    });
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, tabValue, filter, showPast]);
  
  // Handle refresh
  const handleRefresh = () => {
    fetchEvents();
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Get related entity name
  const getRelatedEntityName = (event) => {
    if (!event.relates_to || !event.related_id) {
      return null;
    }
    
    if (event.relates_to === 'dog') {
      const dog = relatedEntities.dogs.find(d => d.id === event.related_id);
      return dog ? dog.name : 'Unknown Dog';
    }
    
    if (event.relates_to === 'litter') {
      const litter = relatedEntities.litters.find(l => l.id === event.related_id);
      return litter ? (litter.name || `Litter #${litter.id}`) : 'Unknown Litter';
    }
    
    if (event.relates_to === 'puppy') {
      const puppy = relatedEntities.puppies.find(p => p.id === event.related_id);
      return puppy ? puppy.name : 'Unknown Puppy';
    }
    
    return null;
  };
  
  // Handle event click to view details
  const handleEventClick = (event) => {
    // If already selected, deselect
    if (selectedEvent && selectedEvent.id === event.id) {
      setSelectedEvent(null);
      return;
    }
    
    setSelectedEvent(event);
  };
  
  // Delete the selected event
  const handleDeleteEvent = async () => {
    setDeleteInProgress(true);
    setError(null);
    
    try {
      let response;
      
      // Special handling for different source types
      if (selectedEvent.sourceType === 'heat') {
        // For heat events
        setError("Cannot delete heat events directly. Please edit the heat record instead.");
        setDeleteInProgress(false);
        return;
      } else if (selectedEvent.sourceType === 'litter') {
        // For litter events (birth, go home, etc)
        // You could potentially add an API to update litter dates if needed
        setError("Cannot delete litter events directly. Please edit the litter instead.");
        setDeleteInProgress(false);
        return;
      } else {
        // For regular events
        response = await apiDelete(`/events/${selectedEvent.id}`);
      }
      
      // Handle successful deletion
      debugLog('Event deleted successfully');
      
      // Update UI
      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
      
      // Notify parent component
      if (onEventDeleted) {
        onEventDeleted(selectedEvent);
      }
      
    } catch (error) {
      debugError('Error deleting event:', error);
      setError(error.message || 'Failed to delete event');
    } finally {
      setDeleteInProgress(false);
    }
  };
  
  // Handle menu open
  const handleMenuOpen = (event, eventItem) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedEvent(eventItem);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle edit event
  const handleEditEvent = () => {
    setMenuAnchorEl(null);
    
    // Handle edit based on source type
    if (selectedEvent.sourceType === 'heat') {
      // Navigate to heat edit page
      // This would typically be handled by the parent component
      if (onEventEdited) {
        onEventEdited(selectedEvent, 'heat');
      }
    } else if (selectedEvent.sourceType === 'litter-birth' || selectedEvent.sourceType === 'litter-gohome') {
      // Navigate to litter edit page
      if (onEventEdited) {
        onEventEdited(selectedEvent, 'litter');
      }
    } else {
      // For regular events
      setEditMode(true);
    }
  };
  
  // Handle delete from menu
  const handleDeleteFromMenu = () => {
    setMenuAnchorEl(null);
    setDeleteDialogOpen(true);
  };
  
  // Check if event is today
  const isToday = (dateString) => {
    return moment(dateString).isSame(moment(), 'day');
  };
  
  // Check if event is upcoming
  const isUpcoming = (dateString) => {
    const today = moment().startOf('day');
    const eventDate = moment(dateString).startOf('day');
    return eventDate.isAfter(today);
  };
  
  // Check if event is past
  const isPast = (dateString) => {
    const today = moment().startOf('day');
    const eventDate = moment(dateString).startOf('day');
    return eventDate.isBefore(today);
  };
  
  // Get relative day description
  const getRelativeDayDescription = (dateString) => {
    const date = moment(dateString);
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    
    if (date.isSame(today, 'day')) {
      return 'Today';
    } else if (date.isSame(tomorrow, 'day')) {
      return 'Tomorrow';
    } else if (date.isSame(yesterday, 'day')) {
      return 'Yesterday';
    } else if (date.isBefore(today)) {
      return date.from(today);
    } else {
      return date.from(today);
    }
  };
  
  return (
    <Box>
      {/* Header with Search and Tabs */}
      <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
        <TextField
          placeholder="Search events..."
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={handleClearSearch}
                  edge="end"
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <Tabs 
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Events" />
          <Tab label="Upcoming" />
          <Tab label="Past" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            size="small" 
            sx={{ ml: 2 }}
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </Alert>
      ) : filteredEvents.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No events to display
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm ? 'Try adjusting your search term' : 'Create an event to get started'}
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }} disablePadding>
          {filteredEvents.map((event, index) => {
            const isSelected = selectedEvent && selectedEvent.id === event.id;
            const relatedEntityName = getRelatedEntityName(event);
            
            return (
              <React.Fragment key={event.id || index}>
                <ListItemButton 
                  selected={isSelected}
                  onClick={() => handleEventClick(event)}
                  sx={{
                    borderLeft: 4, 
                    borderColor: event.color || 'transparent',
                    opacity: isPast(event.start_date) ? 0.8 : 1,
                    bgcolor: isToday(event.start_date) ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                  }}
                >
                  <ListItemIcon>
                    {isToday(event.start_date) ? (
                      <Badge 
                        color="error" 
                        variant="dot"
                        overlap="circular"
                      >
                        {getEventIcon(event)}
                      </Badge>
                    ) : (
                      getEventIcon(event)
                    )}
                  </ListItemIcon>
                  
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                          variant="body1" 
                          component="span"
                          sx={{ 
                            fontWeight: isToday(event.start_date) ? 500 : 400,
                            mr: 1
                          }}
                        >
                          {event.title}
                        </Typography>
                        
                        {isToday(event.start_date) && (
                          <Chip 
                            label="Today" 
                            size="small" 
                            color="primary" 
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" component="span">
                          {formatEventDate(event.start_date)}
                          {event.end_date && event.end_date !== event.start_date && 
                            ` - ${formatEventDate(event.end_date)}`
                          }
                          {!event.all_day && ` at ${moment(event.start_date).format('h:mm a')}`}
                        </Typography>
                        
                        {(event.description || relatedEntityName) && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              mt: 0.5
                            }}
                          >
                            {event.description}
                            {relatedEntityName && !event.description && `Related to: ${relatedEntityName}`}
                            {relatedEntityName && event.description && ` | Related to: ${relatedEntityName}`}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Tooltip title="Event Options">
                      <IconButton 
                        edge="end" 
                        aria-label="event options"
                        onClick={(e) => handleMenuOpen(e, event)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItemButton>
                
                {index < filteredEvents.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            );
          })}
        </List>
      )}
      
      {/* Event details card */}
      {selectedEvent && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getEventIcon(selectedEvent)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {selectedEvent.title}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Date:</strong> {formatEventDate(selectedEvent.start_date)}
              {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && 
                ` - ${formatEventDate(selectedEvent.end_date)}`
              }
              {!selectedEvent.all_day && ` at ${moment(selectedEvent.start_date).format('h:mm a')}`}
              {' '}<em>({getRelativeDayDescription(selectedEvent.start_date)})</em>
            </Typography>
            
            {selectedEvent.description && (
              <Typography variant="body2" paragraph>
                <strong>Description:</strong> {selectedEvent.description}
              </Typography>
            )}
            
            {selectedEvent.category && (
              <Chip 
                label={selectedEvent.category} 
                size="small" 
                sx={{ mr: 1, mb: 1 }} 
              />
            )}
            
            {selectedEvent.event_type && (
              <Chip 
                label={selectedEvent.event_type} 
                size="small" 
                sx={{ mr: 1, mb: 1 }} 
                variant="outlined"
              />
            )}
            
            {selectedEvent.relates_to && selectedEvent.relates_to !== 'none' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Related to:</strong> {getRelatedEntityName(selectedEvent) || 'Unknown'}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              {selectedEvent.sourceType === 'event' && (
                <Button 
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Delete
                </Button>
              )}
              
              <Button 
                startIcon={<EditIcon />}
                onClick={handleEditEvent}
              >
                {selectedEvent.sourceType === 'event' ? 'Edit Event' : 'View Details'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Event options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditEvent}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {selectedEvent?.sourceType === 'event' ? 'Edit Event' : 'View Details'}
          </ListItemText>
        </MenuItem>
        
        {selectedEvent?.sourceType === 'event' && (
          <MenuItem onClick={handleDeleteFromMenu}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>
              Delete Event
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteInProgress && setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Confirm Delete Event
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this event?
          </DialogContentText>
          {selectedEvent && (
            <Typography variant="body2" fontWeight="500" mt={1}>
              "{selectedEvent.title}" on {formatEventDate(selectedEvent.start_date)}
            </Typography>
          )}
          <Typography variant="body2" color="error" mt={2}>
            This action cannot be undone.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleteInProgress}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteEvent} 
            color="error"
            disabled={deleteInProgress}
            startIcon={deleteInProgress ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleteInProgress ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

EventsListView.propTypes = {
  onEventCreated: PropTypes.func,
  onEventDeleted: PropTypes.func,
  onEventEdited: PropTypes.func,
  limit: PropTypes.number,
  showPast: PropTypes.bool,
  filter: PropTypes.object
};

export default EventsListView;
