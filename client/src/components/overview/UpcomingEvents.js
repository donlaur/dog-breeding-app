import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { DateRange as DateRangeIcon } from '@mui/icons-material';

const UpcomingEvents = () => {
  return (
    <Card sx={{ height: '100%', boxShadow: 1 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Upcoming Events
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No upcoming events scheduled.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents; 