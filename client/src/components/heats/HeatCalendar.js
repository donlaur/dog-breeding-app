import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './HeatCalendar.css'; // Updated CSS path
import { API_URL, debugLog, debugError } from '../../config';
import { CircularProgress, Box } from '@mui/material';
import { apiGet } from '../../utils/apiUtils';

const localizer = momentLocalizer(moment);

const HeatCalendar = ({ heats: propHeats }) => {
  const [selectedHeat, setSelectedHeat] = useState(null);
  const [dogList, setDogList] = useState([]);
  const [heats, setHeats] = useState(propHeats || []);
  const [loading, setLoading] = useState(!propHeats);

  // Fetch heats if not provided as props
  useEffect(() => {
    // If heats were provided as props, no need to fetch
    if (propHeats) {
      setHeats(propHeats);
      return;
    }

    const fetchHeats = async () => {
      try {
        const response = await apiGet('heats');
        if (!response.ok) throw new Error(response.error || 'Failed to fetch heats');
        setHeats(response.data);
      } catch (error) {
        debugError('Error fetching heats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeats();
  }, [propHeats]);

  // Fetch all dogs when component mounts
  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const response = await apiGet('dogs/');
        if (!response.ok) throw new Error(response.error || 'Failed to fetch dogs');
        setDogList(response.data);
      } catch (error) {
        debugError('Error fetching dogs:', error);
      }
    };

    fetchDogs();
  }, []);

  // Don't render until we have both heats and dogs
  if (loading || !dogList || dogList.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Transform heats into calendar events with proper dog name lookup
  const events = heats.map(heat => {
    const dog = dogList.find(d => d.id === heat.dog_id);
    const dogName = dog ? dog.call_name : 'Unknown Dog';
    
    return {
      id: heat.id,
      title: `${dogName} - Heat`,
      start: new Date(heat.start_date),
      end: new Date(heat.end_date),
      status: heat.mating_date ? 'mated' : 'active',
      resource: {
        ...heat,
        dogName
      }
    };
  });

  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: event.status === 'mated' ? '#4CAF50' : '#FF9800',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return { style };
  };

  const handleSelectEvent = (event) => {
    setSelectedHeat(event.resource);
  };

  return (
    <div className="p-4 relative">
      <h1 className="text-2xl font-bold mb-4">Heat Calendar</h1>
      <div style={{ height: '80vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={(slotInfo) => {
            console.log('Selected slot:', slotInfo);
          }}
          selectable
        />
      </div>

      {/* Heat Details Modal */}
      {selectedHeat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Heat Details - {selectedHeat.dogName}
              </h2>
              <button
                onClick={() => setSelectedHeat(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Start Date</p>
                <p className="font-medium">{moment(selectedHeat.start_date).format('MMMM D, YYYY')}</p>
              </div>
              <div>
                <p className="text-gray-600">End Date</p>
                <p className="font-medium">{moment(selectedHeat.end_date).format('MMMM D, YYYY')}</p>
              </div>
              {selectedHeat.mating_date && (
                <div>
                  <p className="text-gray-600">Mating Date</p>
                  <p className="font-medium">{moment(selectedHeat.mating_date).format('MMMM D, YYYY')}</p>
                </div>
              )}
              {selectedHeat.expected_whelp_date && (
                <div>
                  <p className="text-gray-600">Expected Whelp Date</p>
                  <p className="font-medium">{moment(selectedHeat.expected_whelp_date).format('MMMM D, YYYY')}</p>
                </div>
              )}
              {selectedHeat.notes && (
                <div>
                  <p className="text-gray-600">Notes</p>
                  <p className="font-medium">{selectedHeat.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatCalendar; 