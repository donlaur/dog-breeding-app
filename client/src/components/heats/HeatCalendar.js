import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './HeatCalendar.css'; // Updated CSS path
import { debugLog, debugError } from '../../config';
import { apiGet } from '../../utils/apiUtils';
import { CircularProgress, Box } from '@mui/material';

const localizer = momentLocalizer(moment);

// Custom event styling
const eventStyleGetter = (event, start, end, isSelected) => {
  let backgroundColor = '#ff7043'; // Default for heat events
  
  if (event.event_type === 'mating') {
    backgroundColor = '#42a5f5'; // Blue for mating events
  } else if (event.event_type === 'expected_heat') {
    backgroundColor = '#ab47bc'; // Purple for expected future heats
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

const HeatCalendar = ({ heats: propHeats, onEventSelect }) => {
  const [heats, setHeats] = useState(propHeats || []);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(!propHeats);
  const [dogList, setDogList] = useState([]);
  
  // Load heats if not provided as props
  useEffect(() => {
    if (!propHeats) {
      const fetchHeats = async () => {
        setLoading(true);
        try {
          const data = await apiGet('/heats/');
          debugLog('Fetched heats for calendar:', data);
          setHeats(data);
        } catch (error) {
          debugError('Error fetching heats:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchHeats();
    }
  }, [propHeats]);
  
  // Load dog data for names
  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const data = await apiGet('/dogs/');
        debugLog('Fetched dogs for heat calendar:', data);
        setDogList(data);
      } catch (error) {
        debugError('Error fetching dogs:', error);
      }
    };
    
    if (heats && heats.length > 0) {
      fetchDogs();
    }
  }, [heats]);
  
  // Transform heats into calendar events
  useEffect(() => {
    if (!heats || !dogList.length) return;
    
    const transformedEvents = [];
    
    // Process each heat cycle
    heats.forEach(heat => {
      if (!heat.start_date) return;
      
      const dog = dogList.find(d => d.id === heat.dog_id);
      const dogName = dog ? dog.name : `Dog #${heat.dog_id}`;
      
      // Add heat cycle event
      const heatEvent = {
        id: `heat-${heat.id}`,
        title: `${dogName} - Heat Cycle`,
        start: new Date(heat.start_date),
        end: heat.end_date ? new Date(heat.end_date) : undefined,
        allDay: true,
        event_type: 'heat',
        resource: heat
      };
      
      transformedEvents.push(heatEvent);
      
      // Add mating event if present
      if (heat.mating_date) {
        const matingEvent = {
          id: `mating-${heat.id}`,
          title: `${dogName} - Mating`,
          start: new Date(heat.mating_date),
          end: new Date(heat.mating_date),
          allDay: true,
          event_type: 'mating',
          resource: heat
        };
        
        transformedEvents.push(matingEvent);
      }
      
      // Add expected future heat cycles (if heat has ended)
      if (heat.end_date) {
        // Average cycle is ~6 months
        const nextHeatDate = moment(heat.end_date).add(6, 'months');
        
        // Only add if it's in the future
        if (nextHeatDate.isAfter(moment())) {
          const expectedHeatEvent = {
            id: `expected-heat-${heat.id}`,
            title: `${dogName} - Expected Heat`,
            start: nextHeatDate.toDate(),
            end: nextHeatDate.add(3, 'weeks').toDate(), // Typical heat duration
            allDay: true,
            event_type: 'expected_heat',
            resource: {
              ...heat,
              is_expected: true
            }
          };
          
          transformedEvents.push(expectedHeatEvent);
        }
      }
    });
    
    setEvents(transformedEvents);
  }, [heats, dogList]);
  
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
    <div className="heat-calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        eventPropGetter={eventStyleGetter}
        views={['month', 'agenda']}
        onSelectEvent={handleSelectEvent}
        popup
      />
    </div>
  );
};

HeatCalendar.propTypes = {
  heats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      dog_id: PropTypes.number,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
      mating_date: PropTypes.string,
      notes: PropTypes.string
    })
  ),
  onEventSelect: PropTypes.func
};

export default HeatCalendar;
