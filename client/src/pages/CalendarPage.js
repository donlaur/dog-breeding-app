import React from 'react';
import EventCalendar from '../components/shared/EventCalendar';
import { Typography, Box, Paper } from '@mui/material';

const CalendarPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Events
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View all upcoming events including heat cycles, litter births, and puppy go-home dates.
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <EventCalendar 
          title="Events Calendar" 
          fetchHeats={true}
          fetchLitters={true}
        />
      </Paper>
    </Box>
  );
};

export default CalendarPage;