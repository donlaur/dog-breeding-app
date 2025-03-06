import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Typography,
  Link as MuiLink,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Event as EventIcon,
  Pets as PetsIcon,
  Favorite as HeartIcon,
  MedicalServices as VetIcon,
  Cake as CakeIcon,
  Search as SearchIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

// Helper function to determine event icon
const getEventIcon = (eventType) => {
  switch (eventType) {
    case 'litter_milestone':
      return <PetsIcon color="success" fontSize="small" />;
    case 'heat_reminder':
      return <HeartIcon color="error" fontSize="small" />;
    case 'vet_appointment':
      return <VetIcon color="info" fontSize="small" />;
    case 'birthday':
      return <CakeIcon color="secondary" fontSize="small" />;
    default:
      return <EventIcon color="primary" fontSize="small" />;
  }
};

// Helper function to get display text for related entity
const getRelatedEntityText = (type, id, entities) => {
  if (!type || !id) return '—';
  
  if (type === 'dog' && entities.dogs) {
    const dog = entities.dogs.find(d => d.id === id);
    return dog ? `Dog: ${dog.call_name || dog.registered_name || `#${id}`}` : `Dog #${id}`;
  }
  
  if (type === 'litter' && entities.litters) {
    const litter = entities.litters.find(l => l.id === id);
    return litter ? `Litter: ${litter.litter_name || `#${id}`}` : `Litter #${id}`;
  }
  
  if (type === 'puppy' && entities.puppies) {
    const puppy = entities.puppies.find(p => p.id === id);
    return puppy ? `Puppy: ${puppy.name || `#${id}`}` : `Puppy #${id}`;
  }
  
  return `${type}: ${id}`;
};

const EventsListView = ({ onEventCreated, onEventDeleted }) => {
  // State for events and sorting
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('start_date');
  
  // State for related entities
  const [entities, setEntities] = useState({
    dogs: [],
    litters: [],
    puppies: []
  });
  
  // State for event detail modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  
  // State for filters
  const [filters, setFilters] = useState({
    eventType: 'all',
    relatedType: 'all',
    relatedEntity: 'all',
    dateRange: 'all',
    startDate: moment().startOf('day').toDate(),
    endDate: moment().add(3, 'months').endOf('day').toDate(),
    showPastEvents: false
  });
  
  // State for filter dialog
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  
  // Fetch events data including heats and litter events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Fetch from multiple endpoints in parallel
        const [eventsResponse, heatsResponse, littersResponse] = await Promise.all([
          fetch(`${API_URL}/events/`),
          fetch(`${API_URL}/heats/`),
          fetch(`${API_URL}/litters/`)
        ]);
        
        // Process custom events from events table
        let allEvents = [];
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          allEvents = eventsData.map(event => ({
            ...event,
            sourceType: 'event' // Mark the source for identification
          }));
        }
        
        // Process heat cycles as events
        if (heatsResponse.ok) {
          const heatsData = await heatsResponse.json();
          const heatEvents = heatsData.map(heat => ({
            id: `heat-${heat.id}`,
            title: `Heat Cycle`,
            description: heat.notes || 'Heat cycle',
            start_date: heat.start_date,
            end_date: heat.end_date || heat.start_date,
            event_type: 'heat_reminder',
            related_type: 'dog',
            related_id: heat.dog_id,
            color: '#FF9800', // Orange for heat events
            sourceType: 'heat',
            raw_data: heat
          }));
          allEvents = [...allEvents, ...heatEvents];
        }
        
        // Process litters as events
        if (littersResponse.ok) {
          const littersData = await littersResponse.json();
          
          // Map litters to birth events
          const litterEvents = littersData.flatMap(litter => {
            const events = [];
            
            // Birth event
            if (litter.whelp_date) {
              events.push({
                id: `litter-birth-${litter.id}`,
                title: `Litter Birth - ${litter.litter_name || `#${litter.id}`}`,
                description: `Litter ${litter.litter_name || `#${litter.id}`} born`,
                start_date: litter.whelp_date,
                end_date: litter.whelp_date,
                event_type: 'litter_milestone',
                related_type: 'litter',
                related_id: litter.id,
                color: '#4CAF50', // Green for litter events
                sourceType: 'litter',
                raw_data: litter
              });
            }
            
            // Go home date (8 weeks after birth)
            if (litter.whelp_date) {
              const whelpDate = new Date(litter.whelp_date);
              const goHomeDate = new Date(whelpDate);
              goHomeDate.setDate(whelpDate.getDate() + 56); // 8 weeks
              
              events.push({
                id: `litter-gohome-${litter.id}`,
                title: `Puppies Go Home - ${litter.litter_name || `#${litter.id}`}`,
                description: `Puppies from litter ${litter.litter_name || `#${litter.id}`} ready to go home`,
                start_date: goHomeDate.toISOString(),
                end_date: goHomeDate.toISOString(),
                event_type: 'litter_milestone',
                related_type: 'litter',
                related_id: litter.id,
                color: '#673AB7', // Purple
                sourceType: 'litter',
                raw_data: litter
              });
            }
            
            return events;
          });
          
          allEvents = [...allEvents, ...litterEvents];
        }
        
        // Sort by date
        allEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        
        setEvents(allEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Fetch related entities for lookup
  useEffect(() => {
    const fetchRelatedEntities = async () => {
      try {
        const dogRes = fetch(`${API_URL}/dogs/`);
        const litterRes = fetch(`${API_URL}/litters/`);
        const puppyRes = fetch(`${API_URL}/puppies/`);
        
        const [dogsResponse, littersResponse, puppiesResponse] = await Promise.all([
          dogRes, litterRes, puppyRes
        ]);
        
        const dogsData = dogsResponse.ok ? await dogsResponse.json() : [];
        const littersData = littersResponse.ok ? await littersResponse.json() : [];
        const puppiesData = puppiesResponse.ok ? await puppiesResponse.json() : [];
        
        setEntities({
          dogs: dogsData,
          litters: littersData,
          puppies: puppiesData
        });
      } catch (err) {
        console.error('Error fetching related entities:', err);
      }
    };
    
    fetchRelatedEntities();
  }, []);
  
  // Handle sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Get the sortable value from an event based on column
  const getSortValue = (event, column) => {
    switch (column) {
      case 'start_date':
        return new Date(event.start_date);
      case 'title':
        return event.title.toLowerCase();
      case 'event_type':
        return event.event_type;
      case 'related_entity':
        return event.related_type ? (event.related_type + event.related_id) : '';
      case 'recurring':
        return event.recurring || 'none';
      default:
        return '';
    }
  };
  
  // Apply filters to events
  useEffect(() => {
    if (!events.length) return;
    
    let result = [...events];
    
    // Filter by event type
    if (filters.eventType !== 'all') {
      result = result.filter(event => event.event_type === filters.eventType);
    }
    
    // Filter by related type
    if (filters.relatedType !== 'all') {
      result = result.filter(event => event.related_type === filters.relatedType);
    }
    
    // Filter by related entity (specific dog, litter, etc.)
    if (filters.relatedEntity !== 'all') {
      result = result.filter(event => 
        event.related_type === filters.relatedType && 
        event.related_id === parseInt(filters.relatedEntity)
      );
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = moment();
      
      switch (filters.dateRange) {
        case 'today':
          result = result.filter(event => 
            moment(event.start_date).isSame(now, 'day')
          );
          break;
        case 'week':
          result = result.filter(event => 
            moment(event.start_date).isSameOrAfter(now.clone().startOf('day')) &&
            moment(event.start_date).isSameOrBefore(now.clone().add(7, 'days').endOf('day'))
          );
          break;
        case 'month':
          result = result.filter(event => 
            moment(event.start_date).isSameOrAfter(now.clone().startOf('day')) &&
            moment(event.start_date).isSameOrBefore(now.clone().add(1, 'month').endOf('day'))
          );
          break;
        case 'custom':
          result = result.filter(event => 
            moment(event.start_date).isSameOrAfter(moment(filters.startDate).startOf('day')) &&
            moment(event.start_date).isSameOrBefore(moment(filters.endDate).endOf('day'))
          );
          break;
        default:
          break;
      }
    }
    
    // Show/hide past events
    if (!filters.showPastEvents) {
      result = result.filter(event => 
        moment(event.start_date).isSameOrAfter(moment().startOf('day'))
      );
    }
    
    setFilteredEvents(result);
  }, [events, filters]);
  
  // Sort the events
  const sortedEvents = [...(filteredEvents.length ? filteredEvents : events)].sort((a, b) => {
    const aValue = getSortValue(a, orderBy);
    const bValue = getSortValue(b, orderBy);
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Format date for display
  const formatEventDate = (date) => {
    return moment(date).format('MMM D, YYYY');
  };
  
  // Handle event details click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };
  
  // Handle event delete
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    setDeleteInProgress(true);
    try {
      // Different deletion logic based on event source
      let response;
      
      if (selectedEvent.sourceType === 'heat') {
        // For heat events, we need to delete the heat cycle
        const heatId = selectedEvent.id.replace('heat-', '');
        response = await fetch(`${API_URL}/heats/${heatId}`, {
          method: 'DELETE'
        });
      } else if (selectedEvent.sourceType === 'litter') {
        // For litter events, we don't want to delete the litter
        // Instead, we'll just remove the event from the UI
        // You could potentially add an API to update litter dates if needed
        setError("Cannot delete litter events directly. Please edit the litter instead.");
        setDeleteInProgress(false);
        return;
      } else {
        // For regular events, delete from the events API
        response = await fetch(`${API_URL}/events/${selectedEvent.id}`, {
          method: 'DELETE'
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status}`);
      }
      
      // Remove event from local state
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      
      // Close dialogs
      setShowDeleteConfirm(false);
      setSelectedEvent(null);
      
      // Notify parent
      if (onEventDeleted) {
        onEventDeleted();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(`Error deleting event: ${err.message}`);
    } finally {
      setDeleteInProgress(false);
    }
  };
  
  // Get link for related entity
  const getEntityLink = (event) => {
    if (!event.related_type || !event.related_id) return null;
    
    switch (event.related_type) {
      case 'dog':
        return `/dashboard/dogs/${event.related_id}`;
      case 'litter':
        return `/dashboard/litters/${event.related_id}`;
      case 'puppy':
        return `/dashboard/puppies/${event.related_id}`;
      default:
        return null;
    }
  };
  
  // Get recurrence display text
  const getRecurrenceText = (recurring) => {
    switch (recurring) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return 'One-time';
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Get event type options for filter
  const getEventTypeOptions = () => {
    // Get unique event types from events
    const types = [...new Set(events.map(event => event.event_type))];
    return [
      { value: 'all', label: 'All Types' },
      ...types.map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    ];
  };
  
  // Get related type options for filter
  const getRelatedTypeOptions = () => {
    // Get unique related types from events
    const types = [...new Set(events.filter(e => e.related_type).map(event => event.related_type))];
    return [
      { value: 'all', label: 'All Entities' },
      ...types.map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
      }))
    ];
  };
  
  // Get related entity options based on selected related type
  const getRelatedEntityOptions = () => {
    if (filters.relatedType === 'all') return [{ value: 'all', label: 'All' }];
    
    let entities = [];
    
    switch (filters.relatedType) {
      case 'dog':
        entities = entities.dogs || [];
        return [
          { value: 'all', label: 'All Dogs' },
          ...entities.map(entity => ({
            value: entity.id.toString(),
            label: entity.call_name || entity.registered_name || `Dog #${entity.id}`
          }))
        ];
      case 'litter':
        entities = entities.litters || [];
        return [
          { value: 'all', label: 'All Litters' },
          ...entities.map(entity => ({
            value: entity.id.toString(),
            label: entity.litter_name || `Litter #${entity.id}`
          }))
        ];
      case 'puppy':
        entities = entities.puppies || [];
        return [
          { value: 'all', label: 'All Puppies' },
          ...entities.map(entity => ({
            value: entity.id.toString(),
            label: entity.name || `Puppy #${entity.id}`
          }))
        ];
      default:
        return [{ value: 'all', label: 'All' }];
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      eventType: 'all',
      relatedType: 'all',
      relatedEntity: 'all',
      dateRange: 'all',
      startDate: moment().startOf('day').toDate(),
      endDate: moment().add(3, 'months').endOf('day').toDate(),
      showPastEvents: false
    });
  };
  
  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.eventType !== 'all') count++;
    if (filters.relatedType !== 'all') count++;
    if (filters.relatedEntity !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.showPastEvents) count++;
    return count;
  };
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Filter summary bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Box>
          {getActiveFilterCount() > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Active filters:
              </Typography>
              
              {filters.eventType !== 'all' && (
                <Chip 
                  size="small" 
                  label={`Type: ${filters.eventType.replace(/_/g, ' ')}`}
                  onDelete={() => handleFilterChange({ eventType: 'all' })}
                />
              )}
              
              {filters.relatedType !== 'all' && (
                <Chip 
                  size="small" 
                  label={`Related: ${filters.relatedType}`}
                  onDelete={() => handleFilterChange({ 
                    relatedType: 'all', 
                    relatedEntity: 'all' 
                  })}
                />
              )}
              
              {filters.dateRange !== 'all' && (
                <Chip 
                  size="small" 
                  label={`Date: ${filters.dateRange === 'custom' ? 'Custom range' : filters.dateRange}`}
                  onDelete={() => handleFilterChange({ dateRange: 'all' })}
                />
              )}
              
              {filters.showPastEvents && (
                <Chip 
                  size="small" 
                  label="Including past events"
                  onDelete={() => handleFilterChange({ showPastEvents: false })}
                />
              )}
              
              <Button 
                size="small" 
                variant="text" 
                onClick={resetFilters}
              >
                Clear all
              </Button>
            </Box>
          )}
        </Box>
        
        <Button
          startIcon={<FilterIcon />}
          onClick={() => setShowFilterDialog(true)}
          variant={getActiveFilterCount() > 0 ? "contained" : "outlined"}
          size="small"
          color={getActiveFilterCount() > 0 ? "primary" : "inherit"}
        >
          {getActiveFilterCount() > 0 ? `Filters (${getActiveFilterCount()})` : "Filter"}
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        {loading ? (
          <LinearProgress />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'start_date'}
                    direction={orderBy === 'start_date' ? order : 'asc'}
                    onClick={() => handleRequestSort('start_date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'title'}
                    direction={orderBy === 'title' ? order : 'asc'}
                    onClick={() => handleRequestSort('title')}
                  >
                    Event
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'event_type'}
                    direction={orderBy === 'event_type' ? order : 'asc'}
                    onClick={() => handleRequestSort('event_type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'related_entity'}
                    direction={orderBy === 'related_entity' ? order : 'asc'}
                    onClick={() => handleRequestSort('related_entity')}
                  >
                    Related To
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'recurring'}
                    direction={orderBy === 'recurring' ? order : 'asc'}
                    onClick={() => handleRequestSort('recurring')}
                  >
                    Recurrence
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No events found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedEvents.map((event) => (
                  <TableRow 
                    key={event.id}
                    hover
                    sx={{ '&:hover': { cursor: 'pointer' } }}
                  >
                    <TableCell onClick={() => handleEventClick(event)}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getEventIcon(event.event_type)}
                        <Box sx={{ ml: 1 }}>
                          {formatEventDate(event.start_date)}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell onClick={() => handleEventClick(event)}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {event.title}
                      </Typography>
                      {event.description && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {event.description.length > 50 
                            ? `${event.description.substring(0, 50)}...` 
                            : event.description
                          }
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell onClick={() => handleEventClick(event)}>
                      <Chip 
                        size="small" 
                        label={event.event_type.replace('_', ' ')} 
                        color={
                          event.event_type === 'litter_milestone' ? 'success' :
                          event.event_type === 'heat_reminder' ? 'error' :
                          event.event_type === 'vet_appointment' ? 'info' :
                          event.event_type === 'birthday' ? 'secondary' : 'primary'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell onClick={() => handleEventClick(event)}>
                      {event.related_type && event.related_id ? (
                        <MuiLink 
                          component={Link} 
                          to={getEntityLink(event) || '#'}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getRelatedEntityText(event.related_type, event.related_id, entities)}
                        </MuiLink>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell onClick={() => handleEventClick(event)}>
                      {getRecurrenceText(event.recurring)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleEventClick(event)}>
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {event.sourceType !== 'litter' ? (
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Cannot delete litter events directly">
                          <span>
                            <IconButton 
                              size="small" 
                              color="default"
                              disabled
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
      
      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog
          open={!!selectedEvent && !showDeleteConfirm}
          onClose={() => setSelectedEvent(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            {selectedEvent.title}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1">
                  {formatEventDate(selectedEvent.start_date)}
                  {selectedEvent.end_date && selectedEvent.start_date !== selectedEvent.end_date && (
                    ` - ${formatEventDate(selectedEvent.end_date)}`
                  )}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Event Type
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getEventIcon(selectedEvent.event_type)}
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {selectedEvent.event_type.replace(/_/g, ' ')}
                  </Typography>
                </Box>
              </Box>
              
              {/* Heat specific details */}
              {selectedEvent.sourceType === 'heat' && selectedEvent.raw_data && (
                <>
                  {selectedEvent.raw_data.mating_date && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Mating Date
                      </Typography>
                      <Typography variant="body1">
                        {formatEventDate(selectedEvent.raw_data.mating_date)}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedEvent.raw_data.status && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent.raw_data.status}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              
              {/* Litter specific details */}
              {selectedEvent.sourceType === 'litter' && selectedEvent.raw_data && (
                <>
                  {selectedEvent.raw_data.num_puppies > 0 && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Puppy Count
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent.raw_data.num_puppies}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Show dam info */}
                  {selectedEvent.raw_data.dam_id && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Dam
                      </Typography>
                      <Typography variant="body1" component="div">
                        {entities.dogs?.find(d => d.id === selectedEvent.raw_data.dam_id)?.call_name || `#${selectedEvent.raw_data.dam_id}`}
                        <Button 
                          component={Link} 
                          to={`/dashboard/dogs/${selectedEvent.raw_data.dam_id}`}
                          size="small" 
                          sx={{ ml: 1 }}
                        >
                          View
                        </Button>
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Show sire info */}
                  {selectedEvent.raw_data.sire_id && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Sire
                      </Typography>
                      <Typography variant="body1" component="div">
                        {entities.dogs?.find(d => d.id === selectedEvent.raw_data.sire_id)?.call_name || `#${selectedEvent.raw_data.sire_id}`}
                        <Button 
                          component={Link} 
                          to={`/dashboard/dogs/${selectedEvent.raw_data.sire_id}`}
                          size="small" 
                          sx={{ ml: 1 }}
                        >
                          View
                        </Button>
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              
              {selectedEvent.description && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}
              
              {selectedEvent.related_type && selectedEvent.related_id && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Related To
                  </Typography>
                  <Typography variant="body1">
                    {getRelatedEntityText(selectedEvent.related_type, selectedEvent.related_id, entities)}
                    {getEntityLink(selectedEvent) && (
                      <Button 
                        component={Link} 
                        to={getEntityLink(selectedEvent)}
                        size="small" 
                        sx={{ ml: 1 }}
                      >
                        View
                      </Button>
                    )}
                  </Typography>
                </Box>
              )}
              
              {selectedEvent.recurring && selectedEvent.recurring !== 'none' && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Recurrence
                  </Typography>
                  <Typography variant="body1">
                    {getRecurrenceText(selectedEvent.recurring)}
                  </Typography>
                </Box>
              )}
              
              {selectedEvent.notify && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Notification
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.notify_days_before > 0 
                      ? `${selectedEvent.notify_days_before} days before event` 
                      : 'On event day'}
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
            {selectedEvent.sourceType !== 'litter' && (
              <Button 
                color="error" 
                onClick={() => setShowDeleteConfirm(true)}
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this event?
          </Typography>
          {selectedEvent && (
            <Typography variant="body2" fontWeight="500" mt={1}>
              "{selectedEvent.title}" on {formatEventDate(selectedEvent.start_date)}
            </Typography>
          )}
          <Typography variant="body2" color="error" mt={2}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteConfirm(false)} 
            disabled={deleteInProgress}
          >
            Cancel
          </Button>
          <Button 
            color="error" 
            onClick={handleDeleteEvent}
            disabled={deleteInProgress}
          >
            {deleteInProgress ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Filter Dialog */}
      <Dialog 
        open={showFilterDialog} 
        onClose={() => setShowFilterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Events</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* Event Type Filter */}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.eventType}
                  onChange={(e) => handleFilterChange({ eventType: e.target.value })}
                  label="Event Type"
                >
                  {getEventTypeOptions().map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Related Type Filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Related To</InputLabel>
                <Select
                  value={filters.relatedType}
                  onChange={(e) => handleFilterChange({ 
                    relatedType: e.target.value,
                    relatedEntity: 'all' // Reset entity when type changes
                  })}
                  label="Related To"
                >
                  {getRelatedTypeOptions().map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Related Entity Filter (only shown when a related type is selected) */}
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth 
                variant="outlined" 
                size="small"
                disabled={filters.relatedType === 'all'}
              >
                <InputLabel>Specific {filters.relatedType === 'all' ? 'Entity' : filters.relatedType}</InputLabel>
                <Select
                  value={filters.relatedEntity}
                  onChange={(e) => handleFilterChange({ relatedEntity: e.target.value })}
                  label={`Specific ${filters.relatedType === 'all' ? 'Entity' : filters.relatedType}`}
                >
                  {getRelatedEntityOptions().map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider textAlign="left">
                <Typography variant="caption" color="text.secondary">
                  Date Range
                </Typography>
              </Divider>
            </Grid>
            
            {/* Date Range Filter */}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange({ dateRange: e.target.value })}
                  label="Date Range"
                >
                  <MenuItem value="all">All Dates</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Next 7 Days</MenuItem>
                  <MenuItem value="month">Next 30 Days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Custom Date Range (only shown when custom is selected) */}
            {filters.dateRange === 'custom' && (
              <>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DatePicker
                      label="Start Date"
                      value={moment(filters.startDate)}
                      onChange={(newValue) => {
                        handleFilterChange({ startDate: newValue.toDate() });
                      }}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DatePicker
                      label="End Date"
                      value={moment(filters.endDate)}
                      onChange={(newValue) => {
                        handleFilterChange({ endDate: newValue.toDate() });
                      }}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                      minDate={moment(filters.startDate)}
                    />
                  </LocalizationProvider>
                </Grid>
              </>
            )}
            
            {/* Past Events Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.showPastEvents}
                    onChange={(e) => handleFilterChange({ showPastEvents: e.target.checked })}
                    name="showPastEvents"
                  />
                }
                label="Show past events"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFilters} color="inherit">
            Reset All
          </Button>
          <Button onClick={() => setShowFilterDialog(false)}>
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventsListView;