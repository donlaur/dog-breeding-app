import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Autocomplete,
  Tabs,
  Tab
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider, DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { apiGet, apiPost } from '../utils/apiUtils';
import { debugLog, debugError } from '../config';

// Event categories and their associated types
const EVENT_CATEGORIES = {
  'Health': ['Vaccination', 'Medication', 'Checkup', 'Surgery', 'Test Results', 'Other'],
  'Breeding': ['Heat Start', 'Heat End', 'Mating', 'Progesterone Test', 'Pregnancy Confirmation', 'Whelping', 'Other'],
  'Training': ['Class', 'Practice', 'Test', 'Certification', 'Other'],
  'Shows': ['Conformation', 'Obedience', 'Rally', 'Agility', 'Other'],
  'General': ['Appointment', 'Grooming', 'Birthday', 'Anniversary', 'Reminder', 'Task', 'Other']
};

// Initial form values
const initialFormValues = {
  title: '',
  description: '',
  category: 'General',
  event_type: 'Reminder',
  start_date: moment(),
  end_date: null,
  all_day: true,
  relates_to: 'none',
  related_id: '',
  color: '#3788d8',
  reminder: false,
  reminder_time: null,
  location: '',
  notes: ''
};

const CreateEventDialog = ({ open, onClose, selectedDate, onEventCreated }) => {
  // Form state
  const [formValues, setFormValues] = useState({
    ...initialFormValues,
    start_date: selectedDate || moment()
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Related entity options
  const [dogs, setDogs] = useState([]);
  const [litters, setLitters] = useState([]);
  
  // Form validation
  const [titleError, setTitleError] = useState(false);
  
  // Update start date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setFormValues(prev => ({
        ...prev,
        start_date: selectedDate
      }));
    }
  }, [selectedDate]);
  
  // Fetch dogs and litters for the dropdown
  useEffect(() => {
    const fetchRelatedEntities = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [dogsResponse, littersResponse] = await Promise.all([
          apiGet('/dogs/'),
          apiGet('/litters/')
        ]);
        
        if (dogsResponse) {
          setDogs(dogsResponse || []);
          debugLog('Dogs fetched for event dialog:', dogsResponse);
        }
        
        if (littersResponse) {
          setLitters(littersResponse || []);
          debugLog('Litters fetched for event dialog:', littersResponse);
        }
      } catch (error) {
        debugError('Error fetching entities:', error);
        setError('Failed to load related entities. Some options may not be available.');
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      fetchRelatedEntities();
    }
  }, [open]);
  
  // Reset form to initial values
  const resetForm = () => {
    setFormValues({
      ...initialFormValues,
      start_date: moment()
    });
    setTitleError(false);
    setError(null);
    setSuccess(false);
    setTabValue(0);
  };
  
  // Handle closing the dialog
  const handleClose = () => {
    onClose();
    // Reset form after animation completes
    setTimeout(resetForm, 300);
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear title error when title is entered
    if (name === 'title' && value.trim() !== '') {
      setTitleError(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formValues.title.trim()) {
      setTitleError(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Prepare event data for API
      const eventData = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        category: formValues.category,
        event_type: formValues.event_type,
        start_date: formValues.start_date.toISOString(),
        end_date: formValues.end_date ? formValues.end_date.toISOString() : null,
        all_day: formValues.all_day,
        color: formValues.color,
        location: formValues.location,
        notes: formValues.notes,
        relates_to: formValues.relates_to,
        related_id: null
      };
      
      // Add related ID if applicable
      if (formValues.relates_to !== 'none' && formValues.related_id) {
        const relatedId = parseInt(formValues.related_id);
        if (!isNaN(relatedId)) {
          eventData.related_id = relatedId;
        }
      }
      
      // Send the request to create the event using apiPost
      const data = await apiPost('/events/', eventData);
      debugLog('Event created successfully:', data);
      
      setSuccess(true);
      
      // Notify parent component
      if (onEventCreated && data) {
        onEventCreated(data);
      }
      
      // Close dialog after successful creation
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      debugError('Error creating event:', error);
      setError(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Get event types based on selected category
  const getEventTypes = () => {
    return EVENT_CATEGORIES[formValues.category] || [];
  };
  
  // Handle date change
  const handleDateChange = (name) => (date) => {
    setFormValues(prev => ({
      ...prev,
      [name]: date
    }));
  };
  
  // Handle all-day toggle
  const handleAllDayChange = (e) => {
    const isAllDay = e.target.value === 'true';
    setFormValues(prev => ({
      ...prev,
      all_day: isAllDay,
      // If switching to all-day, remove time component from dates
      start_date: isAllDay ? moment(prev.start_date).startOf('day') : prev.start_date,
      end_date: prev.end_date ? (isAllDay ? moment(prev.end_date).startOf('day') : prev.end_date) : null
    }));
  };
  
  // Handle category change
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormValues(prev => ({
      ...prev,
      category,
      // Set first event type of the new category
      event_type: EVENT_CATEGORIES[category][0]
    }));
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Create New Event</DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Event created successfully!
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              aria-label="event form tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Basic Details" />
              <Tab label="Date & Time" />
              <Tab label="Associations" />
              <Tab label="Additional Info" />
            </Tabs>
          </Box>
          
          {/* Tab 1: Basic Details */}
          {tabValue === 0 && (
            <Box>
              <DialogContentText sx={{ mb: 2 }}>
                Enter the basic details for this event.
              </DialogContentText>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="title"
                    label="Event Title"
                    value={formValues.title}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={titleError}
                    helperText={titleError ? "Title is required" : ""}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Description"
                    value={formValues.description}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formValues.category}
                      onChange={handleCategoryChange}
                      label="Category"
                    >
                      {Object.keys(EVENT_CATEGORIES).map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Event Type</InputLabel>
                    <Select
                      name="event_type"
                      value={formValues.event_type}
                      onChange={handleChange}
                      label="Event Type"
                    >
                      {getEventTypes().map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="location"
                    label="Location"
                    value={formValues.location}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Tab 2: Date & Time */}
          {tabValue === 1 && (
            <Box>
              <DialogContentText sx={{ mb: 2 }}>
                Set the date and time for this event.
              </DialogContentText>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>All Day Event</InputLabel>
                    <Select
                      name="all_day"
                      value={formValues.all_day.toString()}
                      onChange={handleAllDayChange}
                      label="All Day Event"
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No (Set specific time)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="color"
                      label="Event Color"
                      type="color"
                      value={formValues.color}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    {formValues.all_day ? (
                      <DatePicker
                        label="Start Date"
                        value={formValues.start_date}
                        onChange={handleDateChange('start_date')}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    ) : (
                      <DateTimePicker
                        label="Start Date & Time"
                        value={formValues.start_date}
                        onChange={handleDateChange('start_date')}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    )}
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    {formValues.all_day ? (
                      <DatePicker
                        label="End Date (Optional)"
                        value={formValues.end_date}
                        onChange={handleDateChange('end_date')}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    ) : (
                      <DateTimePicker
                        label="End Date & Time (Optional)"
                        value={formValues.end_date}
                        onChange={handleDateChange('end_date')}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    )}
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Tab 3: Associations */}
          {tabValue === 2 && (
            <Box>
              <DialogContentText sx={{ mb: 2 }}>
                Associate this event with a dog or litter (optional).
              </DialogContentText>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Relates To</InputLabel>
                    <Select
                      name="relates_to"
                      value={formValues.relates_to}
                      onChange={handleChange}
                      label="Relates To"
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="dog">Dog</MenuItem>
                      <MenuItem value="litter">Litter</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {formValues.relates_to === 'dog' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Dog</InputLabel>
                      <Select
                        name="related_id"
                        value={formValues.related_id}
                        onChange={handleChange}
                        label="Select Dog"
                        disabled={loading || dogs.length === 0}
                      >
                        {loading ? (
                          <MenuItem value="">
                            <CircularProgress size={20} /> Loading...
                          </MenuItem>
                        ) : dogs.length === 0 ? (
                          <MenuItem value="">No dogs found</MenuItem>
                        ) : (
                          dogs.map(dog => (
                            <MenuItem key={dog.id} value={dog.id.toString()}>
                              {dog.name} ({dog.breed_name})
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                {formValues.relates_to === 'litter' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Litter</InputLabel>
                      <Select
                        name="related_id"
                        value={formValues.related_id}
                        onChange={handleChange}
                        label="Select Litter"
                        disabled={loading || litters.length === 0}
                      >
                        {loading ? (
                          <MenuItem value="">
                            <CircularProgress size={20} /> Loading...
                          </MenuItem>
                        ) : litters.length === 0 ? (
                          <MenuItem value="">No litters found</MenuItem>
                        ) : (
                          litters.map(litter => (
                            <MenuItem key={litter.id} value={litter.id.toString()}>
                              {litter.name || `Litter #${litter.id}`} ({moment(litter.whelp_date).format('MMM D, YYYY')})
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
          
          {/* Tab 4: Additional Info */}
          {tabValue === 3 && (
            <Box>
              <DialogContentText sx={{ mb: 2 }}>
                Add any additional notes or details for this event.
              </DialogContentText>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="notes"
                    label="Notes"
                    value={formValues.notes}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Event'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

CreateEventDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedDate: PropTypes.object, // moment object
  onEventCreated: PropTypes.func
};

export default CreateEventDialog;
