import React, { useState } from 'react';
import EventCalendar from '../components/shared/EventCalendar';
import CreateEventDialog from '../components/CreateEventDialog';
import { Typography, Box, Paper, Button, Fab, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import moment from 'moment';

const CalendarPage = () => {
  // State for the create event dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force calendar refresh
  
  // Open the event creation dialog
  const handleCreateEvent = (date = null) => {
    setSelectedDate(date ? moment(date) : moment());
    setCreateDialogOpen(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
  };
  
  // Handle event created by dialog
  const handleEventCreated = () => {
    // Increment refresh key to force calendar to reload data
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Events Calendar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all upcoming events for your kennel.
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleCreateEvent()}
        >
          Create Event
        </Button>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <EventCalendar 
          key={refreshKey} // Force refresh when events are created
          title="Events Calendar" 
          fetchHeats={true}
          fetchLitters={true}
          fetchEvents={true}
          onSelectSlot={(slotInfo) => handleCreateEvent(slotInfo.start)}
        />
      </Paper>
      
      {/* Floating action button for creating events */}
      <Tooltip title="Create Event" placement="left">
        <Fab 
          color="primary" 
          aria-label="add" 
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24 
          }}
          onClick={() => handleCreateEvent()}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
      
      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
        selectedDate={selectedDate}
        onEventCreated={handleEventCreated}
      />
    </Box>
  );
};

export default CalendarPage;