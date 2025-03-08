import React, { useState } from 'react';
import EventCalendar from '../components/shared/EventCalendar';
import EventsListView from '../components/EventsListView';
import CreateEventDialog from '../components/CreateEventDialog';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Fab, 
  Tooltip, 
  ToggleButtonGroup, 
  ToggleButton,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ListIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import moment from 'moment';

const CalendarPage = () => {
  // State for view mode (calendar or list)
  const [viewMode, setViewMode] = useState('calendar');
  
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
  
  // Handle view change
  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };
  
  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Events Calendar
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage all upcoming events for your kennel.
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              aria-label="view mode"
              size="small"
            >
              <ToggleButton value="calendar" aria-label="calendar view">
                <CalendarIcon sx={{ mr: 1 }} fontSize="small" />
                Calendar
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
                <ListIcon sx={{ mr: 1 }} fontSize="small" />
                List
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleCreateEvent()}
            >
              Create Event
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        {viewMode === 'calendar' ? (
          <EventCalendar 
            key={`calendar-${refreshKey}`} // Force refresh when events are created
            title="Events Calendar" 
            fetchHeats={true}
            fetchLitters={true}
            fetchEvents={true}
            onSelectSlot={(slotInfo) => handleCreateEvent(slotInfo.start)}
          />
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ px: 1, pt: 1 }}>
              All Events
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <EventsListView 
              key={`list-${refreshKey}`}
              onEventCreated={handleEventCreated}
              onEventDeleted={handleEventCreated}
            />
          </Box>
        )}
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