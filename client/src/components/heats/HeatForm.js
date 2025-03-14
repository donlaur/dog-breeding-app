import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import moment from 'moment';
import { apiGet, apiPost, apiPut, sanitizeApiData } from '../../utils/apiUtils';
import { debugLog, debugError } from '../../config';

// Initial form state
const initialFormState = {
  dog_id: '',
  start_date: null,
  end_date: null,
  has_mating: false,
  mating_date: null,
  sire_id: '',
  expected_whelp_date: null,
  notes: ''
};

const HeatForm = ({ onSave, initialData = null, isEdit = false }) => {
  // Form state
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dogs, setDogs] = useState({
    females: [],
    males: []
  });
  
  // Load available dogs
  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const data = await apiGet('/dogs/');
        debugLog('Dogs fetched for heat form:', data);
        
        setDogs({
          females: data.filter(dog => dog.gender === 'female'),
          males: data.filter(dog => dog.gender === 'male')
        });
      } catch (error) {
        debugError("Error fetching dogs:", error);
        setError("Failed to load dogs. Please try again.");
      }
    };
    
    fetchDogs();
  }, []);
  
  // Initialize form with data if provided
  useEffect(() => {
    if (initialData) {
      const formattedData = {
        ...initialData,
        has_mating: !!initialData.mating_date,
        start_date: initialData.start_date ? moment(initialData.start_date) : null,
        end_date: initialData.end_date ? moment(initialData.end_date) : null,
        mating_date: initialData.mating_date ? moment(initialData.mating_date) : null,
        expected_whelp_date: initialData.expected_whelp_date ? moment(initialData.expected_whelp_date) : null
      };
      
      setFormData(formattedData);
    }
  }, [initialData]);
  
  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle date changes
  const handleDateChange = (name) => (date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle mating checkbox
  const handleMatingCheckbox = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      has_mating: checked,
      // Clear mating-related fields if unchecked
      mating_date: checked ? prev.mating_date : null,
      sire_id: checked ? prev.sire_id : '',
      expected_whelp_date: checked ? prev.expected_whelp_date : null
    }));
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.dog_id) {
      errors.dog_id = 'Please select a female dog';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    // If mating is checked, validate mating fields
    if (formData.has_mating) {
      if (!formData.mating_date) {
        errors.mating_date = 'Mating date is required when mating is selected';
      }
      
      if (!formData.sire_id) {
        errors.sire_id = 'Please select a sire';
      }
    }
    
    // Logical date validation
    if (formData.start_date && formData.end_date && 
        moment(formData.end_date).isBefore(formData.start_date)) {
      errors.end_date = 'End date cannot be before start date';
    }
    
    if (formData.start_date && formData.mating_date) {
      // Mating should be within 2 weeks of heat start
      const heatStart = moment(formData.start_date);
      const matingDate = moment(formData.mating_date);
      
      if (matingDate.isBefore(heatStart)) {
        errors.mating_date = 'Mating date should not be before heat start date';
      }
      
      if (matingDate.isAfter(heatStart.clone().add(3, 'weeks'))) {
        errors.mating_date = 'Mating date should typically be within 3 weeks of heat start';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API
      const dataToSend = {
        ...formData,
        // Format dates for API
        start_date: formData.start_date ? formData.start_date.format('YYYY-MM-DD') : null,
        end_date: formData.end_date ? formData.end_date.format('YYYY-MM-DD') : null,
        mating_date: formData.has_mating && formData.mating_date ? formData.mating_date.format('YYYY-MM-DD') : null,
        expected_whelp_date: formData.has_mating && formData.expected_whelp_date ? formData.expected_whelp_date.format('YYYY-MM-DD') : null,
        // Convert to proper types
        dog_id: Number(formData.dog_id),
        sire_id: formData.has_mating && formData.sire_id ? Number(formData.sire_id) : null
      };
      
      // Remove non-database fields
      delete dataToSend.has_mating;
      delete dataToSend.dog_info;
      delete dataToSend.sire_info;
      
      // Apply general data sanitization
      const sanitizedData = sanitizeApiData(dataToSend);
      
      let response;
      if (isEdit && formData.id) {
        // Update existing heat
        response = await apiPut(`/heats/${formData.id}`, sanitizedData);
        debugLog('Heat updated:', response);
      } else {
        // Create new heat
        response = await apiPost('/heats/', sanitizedData);
        debugLog('Heat created:', response);
      }
      
      // Call onSave callback with the response data
      if (onSave) {
        onSave(response);
      }
      
    } catch (error) {
      debugError('Error saving heat:', error);
      setError(error.message || 'Failed to save heat cycle. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Estimate expected whelp date (63 days from mating)
  useEffect(() => {
    if (formData.has_mating && formData.mating_date) {
      const estimatedWhelpDate = moment(formData.mating_date).add(63, 'days');
      setFormData(prev => ({
        ...prev,
        expected_whelp_date: estimatedWhelpDate
      }));
    }
  }, [formData.has_mating, formData.mating_date]);
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isEdit ? 'Edit Heat Cycle' : 'Add New Heat Cycle'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Dog Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!formErrors.dog_id}>
              <InputLabel>Female Dog</InputLabel>
              <Select
                name="dog_id"
                value={formData.dog_id}
                onChange={handleInputChange}
                label="Female Dog"
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Select a dog</em>
                </MenuItem>
                {dogs.females.map(dog => (
                  <MenuItem key={dog.id} value={dog.id}>
                    {dog.name} ({dog.breed_name})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.dog_id && (
                <FormHelperText>{formErrors.dog_id}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          {/* Start Date */}
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Heat Start Date *"
                value={formData.start_date}
                onChange={handleDateChange('start_date')}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    error={!!formErrors.start_date}
                    helperText={formErrors.start_date}
                  />
                )}
                disabled={loading}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* End Date */}
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Heat End Date"
                value={formData.end_date}
                onChange={handleDateChange('end_date')}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    error={!!formErrors.end_date}
                    helperText={formErrors.end_date}
                  />
                )}
                disabled={loading}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Mating Checkbox */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.has_mating}
                  onChange={handleMatingCheckbox}
                  name="has_mating"
                  color="primary"
                  disabled={loading}
                />
              }
              label="This heat includes a mating"
            />
          </Grid>
          
          {/* Mating fields, only shown if mating is checked */}
          {formData.has_mating && (
            <>
              {/* Mating Date */}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="Mating Date *"
                    value={formData.mating_date}
                    onChange={handleDateChange('mating_date')}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!formErrors.mating_date}
                        helperText={formErrors.mating_date}
                      />
                    )}
                    disabled={loading}
                  />
                </LocalizationProvider>
              </Grid>
              
              {/* Sire Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.sire_id}>
                  <InputLabel>Sire</InputLabel>
                  <Select
                    name="sire_id"
                    value={formData.sire_id}
                    onChange={handleInputChange}
                    label="Sire"
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Select a sire</em>
                    </MenuItem>
                    {dogs.males.map(dog => (
                      <MenuItem key={dog.id} value={dog.id}>
                        {dog.name} ({dog.breed_name})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.sire_id && (
                    <FormHelperText>{formErrors.sire_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              {/* Expected Whelp Date */}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="Expected Whelping Date"
                    value={formData.expected_whelp_date}
                    onChange={handleDateChange('expected_whelp_date')}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                    disabled={loading}
                  />
                </LocalizationProvider>
                <FormHelperText>
                  Automatically calculated as 63 days from mating date
                </FormHelperText>
              </Grid>
            </>
          )}
          
          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              name="notes"
              label="Notes"
              multiline
              rows={4}
              value={formData.notes || ''}
              onChange={handleInputChange}
              fullWidth
              disabled={loading}
            />
          </Grid>
          
          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : (isEdit ? 'Update Heat Cycle' : 'Save Heat Cycle')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

HeatForm.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    id: PropTypes.number,
    dog_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    mating_date: PropTypes.string,
    sire_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    expected_whelp_date: PropTypes.string,
    notes: PropTypes.string
  }),
  isEdit: PropTypes.bool
};

export default HeatForm;
