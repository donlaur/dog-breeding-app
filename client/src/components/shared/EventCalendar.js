import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { API_URL } from '../../config';
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
            const eventsResponse = await fetch(`${API_URL}/events/`);
            if (eventsResponse.ok) {
              const eventsData = await eventsResponse.json();
              
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
            console.error('Error fetching custom events:', error);
          }
        }
        
        // Fetch heats if requested
        if (fetchHeats) {
          const heatsResponse = await fetch(`${API_URL}/heats`);
          if (heatsResponse.ok) {
            const heatsData = await heatsResponse.json();
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
          const littersResponse = await fetch(`${API_URL}/litters/`);
          if (littersResponse.ok) {
            const littersData = await littersResponse.json();
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
        console.error('Error fetching events:', error);
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
        const response = await fetch(`${API_URL}/dogs/`);
        if (!response.ok) throw new Error('Failed to fetch dogs');
        const data = await response.json();
        setDogList(data);
      } catch (error) {
        console.error('Error fetching dogs:', error);
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
  
  // State for controlling calendar date
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Handler for the Today button
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handler for navigating to previous/next month
  const handleNavigate = (action) => {
    const newDate = new Date(currentDate);
    if (action === 'PREV') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (action === 'NEXT') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="p-4 relative">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined"
            size="small"
            onClick={() => handleNavigate('PREV')}
          >
            Previous
          </Button>
          
          <Button 
            variant="contained"
            size="small"
            onClick={handleToday}
          >
            Today
          </Button>
          
          <Button 
            variant="outlined"
            size="small"
            onClick={() => handleNavigate('NEXT')}
          >
            Next
          </Button>
        </Box>
      </Box>
      
      <div style={{ height: '80vh' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={(slotInfo) => {
            console.log('Selected slot:', slotInfo);
            if (onSelectSlot) onSelectSlot(slotInfo);
          }}
          selectable
          date={currentDate}
          onNavigate={setCurrentDate}
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedEvent.title}
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Event Type</p>
                <p className="font-medium">{selectedEvent.type}</p>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">
                  {selectedEvent.start === selectedEvent.end
                    ? moment(selectedEvent.start).format('MMMM D, YYYY')
                    : `${moment(selectedEvent.start).format('MMMM D, YYYY')} - ${moment(selectedEvent.end).format('MMMM D, YYYY')}`}
                </p>
              </div>
              
              {/* Event description from our new event system */}
              {selectedEvent.resource?.description && (
                <div>
                  <p className="text-gray-600">Description</p>
                  <p className="font-medium">{selectedEvent.resource.description}</p>
                </div>
              )}
              
              {/* Related entity information */}
              {selectedEvent.resource?.related_type && selectedEvent.resource?.related_id && (
                <div>
                  <p className="text-gray-600">Related To</p>
                  <p className="font-medium">
                    {selectedEvent.resource.related_type.charAt(0).toUpperCase() + 
                     selectedEvent.resource.related_type.slice(1)} #{selectedEvent.resource.related_id}
                  </p>
                </div>
              )}
              
              {/* Notification information */}
              {selectedEvent.resource?.notify && (
                <div>
                  <p className="text-gray-600">Notification</p>
                  <p className="font-medium">
                    {selectedEvent.resource.notify_days_before > 0 
                      ? `${selectedEvent.resource.notify_days_before} days before event` 
                      : 'On event day'}
                  </p>
                </div>
              )}
              
              {/* Heat-specific details */}
              {selectedEvent.type === 'heat' && selectedEvent.resource && (
                <>
                  {selectedEvent.resource.mating_date && (
                    <div>
                      <p className="text-gray-600">Mating Date</p>
                      <p className="font-medium">{moment(selectedEvent.resource.mating_date).format('MMMM D, YYYY')}</p>
                    </div>
                  )}
                  {selectedEvent.resource.expected_whelp_date && (
                    <div>
                      <p className="text-gray-600">Expected Whelp Date</p>
                      <p className="font-medium">{moment(selectedEvent.resource.expected_whelp_date).format('MMMM D, YYYY')}</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Litter-specific details */}
              {selectedEvent.type?.startsWith('litter') && selectedEvent.resource && (
                <>
                  {selectedEvent.resource.puppy_count !== undefined && (
                    <div>
                      <p className="text-gray-600">Puppy Count</p>
                      <p className="font-medium">{selectedEvent.resource.puppy_count}</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Generic notes field */}
              {selectedEvent.resource?.notes && (
                <div>
                  <p className="text-gray-600">Notes</p>
                  <p className="font-medium">{selectedEvent.resource.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;