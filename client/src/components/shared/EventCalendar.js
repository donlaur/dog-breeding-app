import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { debugLog, debugError } from '../../config';
import { apiGet } from '../../utils/apiUtils';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

const localizer = momentLocalizer(moment);

// Custom event styling based on event type
const eventStyleGetter = (event, start, end, isSelected) => {
  let backgroundColor = event.color || '#1976d2'; // Default blue
  
  if (event.type === 'heat') {
    backgroundColor = '#ff7043'; // Orange for heat events
  } else if (event.type === 'mating') {
    backgroundColor = '#42a5f5'; // Light blue for mating
  } else if (event.type === 'whelping') {
    backgroundColor = '#e91e63'; // Pink for whelping
  } else if (event.type === 'vaccination') {
    backgroundColor = '#4caf50'; // Green for vaccinations
  } else if (event.type === 'checkup') {
    backgroundColor = '#9c27b0'; // Purple for vet checkups
  }
  
  return {
    style: {
      backgroundColor,
      borderRadius: '0px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    }
  };
};

const EventCalendar = ({
  events: propEvents,
  title = 'Calendar',
  fetchHeats = false,
  fetchLitters = false,
  fetchEvents = false,
  onEventSelect,
  height = 500,
  showFilters = false
}) => {
  const [events, setEvents] = useState(propEvents || []);
  const [loading, setLoading] = useState(!propEvents);
  const [dogList, setDogList] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filters, setFilters] = useState({
    showHeats: true,
    showLitters: true,
    showEvents: true,
    dogId: 'all'
  });
  
  // Fetch events from APIs if not provided via props
  useEffect(() => {
    if (!propEvents) {
      const loadEvents = async () => {
        setLoading(true);
        const allEvents = [];
        
        try {
          // Fetch custom events from the events API
          if (fetchEvents) {
            try {
              const data = await apiGet('/events/');
              debugLog('Fetched events for calendar:', data);
              
              // Process events data
              const customEvents = data.map(event => ({
                id: `event-${event.id}`,
                title: event.title,
                start: new Date(event.start_date),
                end: new Date(event.end_date || event.start_date),
                allDay: !event.end_date || event.start_date === event.end_date,
                type: event.type || 'custom',
                color: event.color,
                resource: event
              }));
              
              allEvents.push(...customEvents);
            } catch (error) {
              debugError('Error fetching events:', error);
            }
          }
          
          // Fetch heats if requested
          if (fetchHeats) {
            try {
              const data = await apiGet('/heats/');
              debugLog('Fetched heats for calendar:', data);
              
              // Add heat events
              const heatEvents = data.map(heat => ({
                id: `heat-${heat.id}`,
                title: `Heat: ${getDogName(heat.dog_id)}`,
                start: new Date(heat.start_date),
                end: heat.end_date ? new Date(heat.end_date) : undefined,
                allDay: true,
                type: 'heat',
                dogId: heat.dog_id,
                resource: heat
              }));
              
              allEvents.push(...heatEvents);
            } catch (error) {
              debugError('Error fetching heats:', error);
            }
          }
          
          // Fetch litters if requested
          if (fetchLitters) {
            try {
              const data = await apiGet('/litters/');
              debugLog('Fetched litters for calendar:', data);
              
              // Add litter events like whelp date, go-home date, etc.
              const litterEvents = data.flatMap(litter => {
                const events = [];
                
                // Add whelping date
                if (litter.whelp_date) {
                  events.push({
                    id: `litter-whelp-${litter.id}`,
                    title: `Whelping: ${getDogName(litter.dam_id)}`,
                    start: new Date(litter.whelp_date),
                    end: new Date(litter.whelp_date),
                    allDay: true,
                    type: 'whelping',
                    dogId: litter.dam_id,
                    resource: { ...litter, event_type: 'whelping' }
                  });
                }
                
                // Add go-home date (typically 8 weeks after whelping)
                if (litter.whelp_date) {
                  const goHomeDate = moment(litter.whelp_date).add(8, 'weeks');
                  events.push({
                    id: `litter-gohome-${litter.id}`,
                    title: `Puppies Go Home: Litter ${litter.id}`,
                    start: goHomeDate.toDate(),
                    end: goHomeDate.toDate(),
                    allDay: true,
                    type: 'go-home',
                    dogId: litter.dam_id,
                    resource: { ...litter, event_type: 'go-home' }
                  });
                }
                
                return events;
              });
              
              allEvents.push(...litterEvents);
            } catch (error) {
              debugError('Error fetching litters:', error);
            }
          }
          
          setEvents(allEvents);
        } catch (error) {
          debugError('Error loading calendar events:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadEvents();
    } else {
      setEvents(propEvents);
      setLoading(false);
    }
  }, [propEvents, fetchEvents, fetchHeats, fetchLitters]);
  
  // Load dogs for name display
  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const data = await apiGet('/dogs/');
        debugLog('Fetched dogs for event calendar:', data);
        setDogList(data);
      } catch (error) {
        debugError('Error fetching dogs:', error);
      }
    };
    
    fetchDogs();
  }, []);
  
  // Helper function to get dog name
  const getDogName = (dogId) => {
    if (!dogId || !dogList.length) return `Dog #${dogId}`;
    const dog = dogList.find(d => d.id === dogId);
    return dog ? dog.name : `Dog #${dogId}`;
  };
  
  // Apply filters to events
  useEffect(() => {
    if (!events.length) return;
    
    let filtered = [...events];
    
    // Filter by event type
    if (!filters.showHeats) {
      filtered = filtered.filter(event => event.type !== 'heat');
    }
    
    if (!filters.showLitters) {
      filtered = filtered.filter(event => 
        event.type !== 'whelping' && event.type !== 'go-home');
    }
    
    if (!filters.showEvents) {
      filtered = filtered.filter(event => 
        event.type !== 'custom' && 
        event.type !== 'vaccination' && 
        event.type !== 'checkup');
    }
    
    // Filter by dog
    if (filters.dogId !== 'all') {
      filtered = filtered.filter(event => 
        event.dogId && event.dogId.toString() === filters.dogId);
    }
    
    setFilteredEvents(filtered);
  }, [events, filters]);
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle click on a calendar event
  const handleSelectEvent = (event) => {
    if (onEventSelect) {
      onEventSelect(event.resource);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      {showFilters && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant={filters.showHeats ? "contained" : "outlined"}
            color="warning"
            size="small"
            onClick={() => handleFilterChange('showHeats', !filters.showHeats)}
          >
            Heat Cycles
          </Button>
          
          <Button
            variant={filters.showLitters ? "contained" : "outlined"}
            color="error"
            size="small"
            onClick={() => handleFilterChange('showLitters', !filters.showLitters)}
          >
            Litters
          </Button>
          
          <Button
            variant={filters.showEvents ? "contained" : "outlined"}
            color="primary"
            size="small"
            onClick={() => handleFilterChange('showEvents', !filters.showEvents)}
          >
            Events
          </Button>
          
          {dogList.length > 0 && (
            <Box sx={{ ml: 'auto' }}>
              <select
                value={filters.dogId}
                onChange={(e) => handleFilterChange('dogId', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px' }}
              >
                <option value="all">All Dogs</option>
                {dogList.map(dog => (
                  <option key={dog.id} value={dog.id.toString()}>
                    {dog.name}
                  </option>
                ))}
              </select>
            </Box>
          )}
        </Box>
      )}
      
      <Calendar
        localizer={localizer}
        events={filteredEvents.length > 0 ? filteredEvents : events}
        startAccessor="start"
        endAccessor="end"
        style={{ height }}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'agenda']}
        onSelectEvent={handleSelectEvent}
        popup
      />
    </Box>
  );
};

EventCalendar.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      start: PropTypes.instanceOf(Date),
      end: PropTypes.instanceOf(Date),
      type: PropTypes.string,
      color: PropTypes.string,
      resource: PropTypes.object
    })
  ),
  title: PropTypes.string,
  fetchHeats: PropTypes.bool,
  fetchLitters: PropTypes.bool,
  fetchEvents: PropTypes.bool,
  onEventSelect: PropTypes.func,
  height: PropTypes.number,
  showFilters: PropTypes.bool
};

export default EventCalendar;
