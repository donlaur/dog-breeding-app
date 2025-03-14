import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPost } from '../utils/apiUtils';

/**
 * A dialog for creating and editing calendar events
 */
const CreateEventDialog = ({ open, onClose, selectedDate, onEventCreated }) => {
  // Event form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate || moment());
  const [endDate, setEndDate] = useState(selectedDate || moment());
  const [allDay, setAllDay] = useState(true);
  const [eventType, setEventType] = useState('custom');
  const [relatedType, setRelatedType] = useState('');
  const [relatedId, setRelatedId] = useState('');
  const [color, setColor] = useState('#2196F3'); // Default blue
  const [notify, setNotify] = useState(false);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(1);
  const [recurring, setRecurring] = useState('none');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Related entity lists
  const [dogs, setDogs] = useState([]);
  const [litters, setLitters] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  
  // Reset form when dialog opens with a new selected date
  useEffect(() => {
    if (open && selectedDate) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
      resetForm();
    }
  }, [open, selectedDate]);
  
  // Fetch dogs and litters for related entity selection
  useEffect(() => {
    if (open) {
      fetchEntities();
    }
  }, [open]);
  
  const fetchEntities = async () => {
    setLoadingEntities(true);
    try {
      // Fetch dogs and litters in parallel
      const [dogsResponse, littersResponse] = await Promise.all([
        apiGet('dogs/'),
        apiGet('litters/')
      ]);
      
      if (dogsResponse.ok) {
        setDogs(dogsResponse.data);
      }
      
      if (littersResponse.ok) {
        setLitters(littersResponse.data);
      }
    } catch (error) {
      debugError('Error fetching entities:', error);
    } finally {
      setLoadingEntities(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventType('custom');
    setRelatedType('');
    setRelatedId('');
    setColor('#2196F3');
    setNotify(false);
    setNotifyDaysBefore(1);
    setRecurring('none');
    setError(null);
    setSuccess(false);
  };
  
  const handleCreateEvent = async () => {
    // Validate required fields
    if (!title) {
      setError('Title is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Format dates properly
      const startDateTime = allDay 
        ? startDate.startOf('day').format() 
        : startDate.format();
      
      const endDateTime = allDay 
        ? endDate.endOf('day').format() 
        : endDate.format();
      
      // Create event data object
      const eventData = {
        title,
        description,
        start_date: startDateTime,
        end_date: endDateTime,
        all_day: allDay,
        event_type: eventType,
        color,
        notify,
        notify_days_before: notify ? notifyDaysBefore : 0,
        recurring
      };
      
      // Add related entity if selected
      if (relatedType && relatedId) {
        eventData.related_type = relatedType;
        eventData.related_id = relatedId;
      }
      
      // Send the request to create the event using apiPost
      const response = await apiPost('events/', eventData);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create event');
      }
      
      setSuccess(true);
      
      // Notify parent component
      if (onEventCreated && response.data) {
        onEventCreated(response.data);
      }
      
      // Close dialog after successful creation
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };
  
  // Event type options
  const eventTypeOptions = [
    { value: 'custom', label: 'Custom Event' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'litter_milestone', label: 'Litter Milestone' },
    { value: 'heat_reminder', label: 'Heat Reminder' },
    { value: 'vet_appointment', label: 'Vet Appointment' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'medication', label: 'Medication' },
    { value: 'show', label: 'Dog Show' },
    { value: 'training', label: 'Training' }
  ];
  
  // Color options with labels
  const colorOptions = [
    { value: '#2196F3', label: 'Blue' },
    { value: '#4CAF50', label: 'Green' },
    { value: '#F44336', label: 'Red' },
    { value: '#FF9800', label: 'Orange' },
    { value: '#9C27B0', label: 'Purple' },
    { value: '#009688', label: 'Teal' },
    { value: '#FFEB3B', label: 'Yellow' },
    { value: '#795548', label: 'Brown' },
    { value: '#607D8B', label: 'Grey' }
  ];
  
  // Recurring options
  const recurringOptions = [
    { value: 'none', label: 'No Recurrence' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];
  
  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          {/* Show error or success messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Event created successfully!
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Event title */}
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  fullWidth
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Grid>
              
              {/* Event description */}
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
              
              {/* Date and time fields */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allDay}
                      onChange={(e) => setAllDay(e.target.checked)}
                    />
                  }
                  label="All Day Event"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              {!allDay && (
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="Start Time"
                    value={startDate}
                    onChange={setStartDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={startDate}
                />
              </Grid>
              
              {!allDay && (
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="End Time"
                    value={endDate}
                    onChange={setEndDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Event Details
                </Typography>
              </Grid>
              
              {/* Event type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    label="Event Type"
                  >
                    {eventTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Event color */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    label="Color"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: '50%', 
                            bgcolor: selected,
                            mr: 1
                          }} 
                        />
                        {colorOptions.find(opt => opt.value === selected)?.label || selected}
                      </Box>
                    )}
                  >
                    {colorOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%', 
                              bgcolor: option.value,
                              mr: 1
                            }} 
                          />
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Related entity fields */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Related To</InputLabel>
                  <Select
                    value={relatedType}
                    onChange={(e) => {
                      setRelatedType(e.target.value);
                      setRelatedId(''); // Reset related ID when type changes
                    }}
                    label="Related To"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="dog">Dog</MenuItem>
                    <MenuItem value="litter">Litter</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {relatedType && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{relatedType === 'dog' ? 'Dog' : 'Litter'}</InputLabel>
                    <Select
                      value={relatedId}
                      onChange={(e) => setRelatedId(e.target.value)}
                      label={relatedType === 'dog' ? 'Dog' : 'Litter'}
                      disabled={loadingEntities}
                    >
                      {loadingEntities ? (
                        <MenuItem value="">Loading...</MenuItem>
                      ) : relatedType === 'dog' ? (
                        dogs.map((dog) => (
                          <MenuItem key={dog.id} value={dog.id}>
                            {dog.call_name || dog.registered_name || `Dog #${dog.id}`}
                          </MenuItem>
                        ))
                      ) : (
                        litters.map((litter) => (
                          <MenuItem key={litter.id} value={litter.id}>
                            {litter.litter_name || `Litter #${litter.id}`}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Notifications & Recurrence
                </Typography>
              </Grid>
              
              {/* Notification settings */}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={notify}
                      onChange={(e) => setNotify(e.target.checked)}
                    />
                  }
                  label="Send Notification"
                />
              </Grid>
              
              {notify && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Days Before"
                    type="number"
                    fullWidth
                    value={notifyDaysBefore}
                    onChange={(e) => setNotifyDaysBefore(parseInt(e.target.value) || 0)}
                    InputProps={{ inputProps: { min: 0, max: 30 } }}
                  />
                </Grid>
              )}
              
              {/* Recurrence setting */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Recurrence</InputLabel>
                  <Select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value)}
                    label="Recurrence"
                  >
                    {recurringOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateEvent} 
            variant="contained" 
            disabled={loading || !title}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateEventDialog;