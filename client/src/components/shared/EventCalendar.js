import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { API_URL, debugLog, debugError } from '../../config';
import { apiGet } from '../../utils/apiUtils';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

const localizer = momentLocalizer(moment);

/**
 * A generic event calendar component that can display different types of events
 * @param {Object} props Component props
 * @param {Array} props.events Optional events data to display
 * @param {string} props.title Calendar title
 * @param {boolean} props.fetchHeats Whether to fetch heat data
 * @param {boolean} props.fetchLitters Whether to fetch litter data
 */
const EventCalendar = ({ 
  events: propEvents, 
  title = 'Event Calendar',
  fetchHeats = true,
  fetchLitters = false,
  fetchEvents = true,
  onSelectSlot = null
}) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dogList, setDogList] = useState([]);
  const [events, setEvents] = useState(propEvents || []);
  const [loading, setLoading] = useState(!propEvents);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch data if not provided as props
  useEffect(() => {
    // If events were provided as props, no need to fetch
    if (propEvents) {
      setEvents(propEvents);
      return;
    }

    const fetchData = async () => {
      try {
        let allEvents = [];
        
        // Fetch custom events from the events API
        if (fetchEvents) {
          try {
            const eventsResponse = await apiGet('events');
            if (eventsResponse.success) {
              const eventsData = eventsResponse.data;
              
              // Process events data
              const customEvents = eventsData.map(event => ({
                id: `event-${event.id}`,
                title: event.title,
                start: new Date(event.start_date),
                end: event.end_date ? new Date(event.end_date) : new Date(event.start_date),
                type: event.event_type || 'custom',
                color: event.color || '#2196F3', // Default blue
                allDay: event.all_day,
                resource: {
                  ...event,
                  related_type: event.related_type,
                  related_id: event.related_id,
                  description: event.description,
                  notify: event.notify
                }
              }));
              
              allEvents = [...allEvents, ...customEvents];
            }
          } catch (error) {
            debugError('Error fetching custom events:', error);
          }
        }
        
        // Fetch heats if requested
        if (fetchHeats) {
          const heatsResponse = await apiGet('heats');
          if (heatsResponse.success) {
            const heatsData = heatsResponse.data;
            // Add heat events
            const heatEvents = heatsData.map(heat => ({
              id: `heat-${heat.id}`,
              title: `Heat - ${heat.dog_id}`,
              start: new Date(heat.start_date),
              end: new Date(heat.end_date),
              type: 'heat',
              color: '#FF9800',
              resource: heat
            }));
            allEvents = [...allEvents, ...heatEvents];
          }
        }

        // Fetch litters if requested
        if (fetchLitters) {
          const littersResponse = await apiGet('litters');
          if (littersResponse.success) {
            const littersData = littersResponse.data;
            // Add litter events like whelp date, go-home date, etc.
            const litterEvents = littersData.flatMap(litter => {
              const events = [];
              // We'll only include these basic litter events if there are no custom events for this litter
              // This helps avoid duplicates with our new events system
              const hasCustomEvents = allEvents.some(e => 
                e.resource && e.resource.related_type === 'litter' && e.resource.related_id === litter.id
              );
              
              if (!hasCustomEvents) {
                if (litter.whelp_date) {
                  events.push({
                    id: `litter-whelp-${litter.id}`,
                    title: `Litter Born - ${litter.litter_name || 'Unnamed'}`,
                    start: new Date(litter.whelp_date),
                    end: new Date(litter.whelp_date),
                    type: 'litter-birth',
                    color: '#4CAF50',
                    resource: litter
                  });
                }
                
                // Calculate go home date (8 weeks after birth)
                if (litter.whelp_date) {
                  const whelpDate = new Date(litter.whelp_date);
                  const goHomeDate = new Date(whelpDate);
                  goHomeDate.setDate(whelpDate.getDate() + 56); // 8 weeks
                  
                  events.push({
                    id: `litter-go-home-${litter.id}`,
                    title: `Puppies Go Home - ${litter.litter_name || 'Unnamed'}`,
                    start: goHomeDate,
                    end: goHomeDate,
                    type: 'litter-go-home',
                    color: '#673AB7',
                    resource: litter
                  });
                }
              }
              return events;
            });
            allEvents = [...allEvents, ...litterEvents];
          }
        }
        
        setEvents(allEvents);
      } catch (error) {
        debugError('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propEvents, fetchHeats, fetchLitters]);

  // Fetch all dogs when component mounts
  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const response = await apiGet('dogs');
        if (response.success) {
          setDogList(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch dogs');
        }
      } catch (error) {
        debugError('Error fetching dogs:', error);
      }
    };

    fetchDogs();
  }, []);

  // Don't render until data is loaded
  if (loading || !dogList || dogList.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Process events to include dog names
  const calendarEvents = events.map(event => {
    // If it's a heat event, look up the dog name
    if (event.type === 'heat' && event.resource?.dog_id) {
      const dog = dogList.find(d => d.id === event.resource.dog_id);
      const dogName = dog ? dog.call_name : 'Unknown Dog';
      return {
        ...event,
        title: `${dogName} - Heat`,
        resource: {
          ...event.resource,
          dogName
        }
      };
    }
    return event;
  });

  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: event.color || '#039be5',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return { style };
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = (slotInfo) => {
    // If callback was provided, pass slot info
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '70vh', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        
        {selectedEvent && (
          <Box sx={{ position: 'absolute', right: 16, top: 0, backgroundColor: 'white', p: 2, boxShadow: 3, zIndex: 10, borderRadius: 1 }}>
            <Typography variant="h6">{selectedEvent.title}</Typography>
            <Typography variant="body2">
              {moment(selectedEvent.start).format('MMM D, YYYY')}
              {!moment(selectedEvent.start).isSame(moment(selectedEvent.end), 'day') && 
                ` - ${moment(selectedEvent.end).format('MMM D, YYYY')}`}
            </Typography>
            {selectedEvent.resource?.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedEvent.resource.description}
              </Typography>
            )}
            <Button 
              size="small" 
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </Button>
          </Box>
        )}
      </Box>
      
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable={!!onSelectSlot}
        views={['month', 'week', 'day']}
        defaultView="month"
        defaultDate={currentDate}
        onNavigate={date => setCurrentDate(date)}
      />
    </Box>
  );
};

// Add PropTypes validation
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
  onSelectSlot: PropTypes.func
};

export default EventCalendar;