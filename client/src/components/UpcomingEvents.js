import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { 
  DateRange as DateRangeIcon,
  Pets as PetsIcon,
  Favorite as HeartIcon,
  MedicalServices as VetIcon,
  Cake as CakeIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet } from '../utils/apiUtils';
import moment from 'moment';
import { Link } from 'react-router-dom';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        
        // Calculate date range for upcoming events (next 30 days)
        const startDate = moment().startOf('day').format();
        const endDate = moment().add(30, 'days').endOf('day').format();
        
        // Fetch events in date range using apiGet
        const response = await apiGet(`events/?start_date=${startDate}&end_date=${endDate}`);
        
        if (response.ok) {
          debugLog("Upcoming events fetched:", response.data);
          const eventsData = response.data;
          
          // Sort by date
          eventsData.sort((a, b) => 
            new Date(a.start_date) - new Date(b.start_date)
          );
          
          // Limit to 5 events
          setEvents(eventsData.slice(0, 5));
        } else {
          throw new Error(response.error || "Failed to fetch events");
        }
      } catch (err) {
        debugError("Error fetching upcoming events:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcomingEvents();
  }, []);
  
  // Get icon based on event type
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'litter_milestone':
        return <PetsIcon color="success" />;
      case 'heat_reminder':
        return <HeartIcon color="error" />;
      case 'vet_appointment':
        return <VetIcon color="info" />;
      case 'birthday':
        return <CakeIcon color="secondary" />;
      default:
        return <EventIcon color="primary" />;
    }
  };
  
  // Format the event date nicely
  const formatEventDate = (date) => {
    const eventDate = moment(date);
    const today = moment().startOf('day');
    
    if (eventDate.isSame(today, 'day')) {
      return 'Today';
    } else if (eventDate.isSame(today.clone().add(1, 'day'), 'day')) {
      return 'Tomorrow';
    } else {
      return eventDate.format('MMM D');
    }
  };
  
  return (
    <Card sx={{ height: '100%', boxShadow: 1 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
              Upcoming Events
            </Typography>
          </Box>
          <Typography 
            variant="body2" 
            component={Link} 
            to="/dashboard/calendar" 
            sx={{ color: 'primary.main', textDecoration: 'none' }}
          >
            View All
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error" sx={{ py: 2 }}>
            Error loading events: {error}
          </Typography>
        ) : events.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No upcoming events scheduled.
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {events.map((event, index) => (
              <React.Fragment key={event.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getEventIcon(event.event_type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={event.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip 
                          label={formatEventDate(event.start_date)} 
                          size="small" 
                          variant="outlined"
                          sx={{ mr: 1, fontSize: '0.7rem' }}
                        />
                        {event.description && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {event.description.substring(0, 30)}
                            {event.description.length > 30 ? '...' : ''}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents; 