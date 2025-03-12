import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Button, Paper, 
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, Grid, Snackbar, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';
import { useNotifications } from '../../context/NotificationContext';

const AddHealthRecord = () => {
  const navigate = useNavigate();
  const { addHealthRecord } = useHealth();
  const { dogs, puppies } = useDog();
  const { notifyHealthRecordAdded } = useNotifications();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    animal_type: '',
    animal_id: '',
    record_type: '',
    record_date: null,
    vet_name: '',
    location: '',
    diagnosis: '',
    treatment: '',
    cost: '',
    followup_date: null,
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    title: '',
    animal_type: '',
    animal_id: '',
    record_type: '',
    record_date: ''
  });

  const recordTypes = [
    'Checkup',
    'Emergency',
    'Surgery',
    'Dental',
    'Test',
    'Specialist',
    'Grooming',
    'Other'
  ];

  const validateForm = () => {
    let isValid = true;
    const errors = {
      title: '',
      animal_type: '',
      animal_id: '',
      record_type: '',
      record_date: ''
    };
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }
    
    if (!formData.animal_type) {
      errors.animal_type = 'Please select an animal type';
      isValid = false;
    }
    
    if (!formData.animal_id) {
      errors.animal_id = 'Please select an animal';
      isValid = false;
    }
    
    if (!formData.record_type) {
      errors.record_type = 'Record type is required';
      isValid = false;
    }
    
    if (!formData.record_date) {
      errors.record_date = 'Record date is required';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Prepare data for submission
      const healthRecordData = {
        ...formData,
        record_date: formData.record_date?.toISOString().split('T')[0],
        followup_date: formData.followup_date?.toISOString().split('T')[0],
        dog_id: formData.animal_type === 'dog' ? formData.animal_id : null,
        puppy_id: formData.animal_type === 'puppy' ? formData.animal_id : null
      };
      
      // Remove temporary fields
      delete healthRecordData.animal_type;
      delete healthRecordData.animal_id;
      
      const newRecord = await addHealthRecord(healthRecordData);
      setSuccessMessage('Health record added successfully!');
      
      // Create notification
      if (formData.animal_type === 'dog') {
        const dog = dogs.find(d => d.id === parseInt(formData.animal_id));
        if (dog) {
          notifyHealthRecordAdded(newRecord.id, dog.id, dog.call_name, formData.record_type);
        }
      } else if (formData.animal_type === 'puppy') {
        const puppy = puppies.find(p => p.id === parseInt(formData.animal_id));
        if (puppy) {
          notifyHealthRecordAdded(newRecord.id, null, puppy.name, formData.record_type, puppy.id);
        }
      }
      
      // Navigate after a brief delay to show success message
      setTimeout(() => {
        navigate('/dashboard/health/records');
      }, 1500);
    } catch (err) {
      setError('Failed to add health record. Please try again.');
      console.error('Error adding health record:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if any
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Clear error for this field if any
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getAnimalOptions = () => {
    if (formData.animal_type === 'dog') {
      return dogs.map(dog => (
        <MenuItem key={dog.id} value={dog.id}>
          {dog.call_name} ({dog.registration_number || 'No Reg #'})
        </MenuItem>
      ));
    } else if (formData.animal_type === 'puppy') {
      return puppies.map(puppy => (
        <MenuItem key={puppy.id} value={puppy.id}>
          {puppy.name} (Litter #{puppy.litter_id})
        </MenuItem>
      ));
    }
    return <MenuItem value="">Select animal type first</MenuItem>;
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add Health Record
        </Typography>
        
        <Paper sx={{ p: 3, mt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                  placeholder="Brief description of this health record"
                />
              </Grid>
              
              {/* Animal Type Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!formErrors.animal_type}>
                  <InputLabel>Animal Type</InputLabel>
                  <Select
                    name="animal_type"
                    value={formData.animal_type}
                    onChange={handleChange}
                    label="Animal Type"
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    <MenuItem value="dog">Dog</MenuItem>
                    <MenuItem value="puppy">Puppy</MenuItem>
                  </Select>
                  {formErrors.animal_type && (
                    <FormHelperText>{formErrors.animal_type}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              {/* Animal Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!formErrors.animal_id} disabled={!formData.animal_type}>
                  <InputLabel>Select Animal</InputLabel>
                  <Select
                    name="animal_id"
                    value={formData.animal_id}
                    onChange={handleChange}
                    label="Select Animal"
                  >
                    <MenuItem value="">Select Animal</MenuItem>
                    {getAnimalOptions()}
                  </Select>
                  {formErrors.animal_id && (
                    <FormHelperText>{formErrors.animal_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              {/* Record Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!formErrors.record_type}>
                  <InputLabel>Record Type</InputLabel>
                  <Select
                    name="record_type"
                    value={formData.record_type}
                    onChange={handleChange}
                    label="Record Type"
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    {recordTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.record_type && (
                    <FormHelperText>{formErrors.record_type}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              {/* Record Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Record Date *"
                  value={formData.record_date}
                  onChange={(date) => handleDateChange('record_date', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!formErrors.record_date}
                      helperText={formErrors.record_date}
                    />
                  )}
                />
              </Grid>
              
              {/* Vet Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Veterinarian Name"
                  name="vet_name"
                  value={formData.vet_name}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Smith"
                />
              </Grid>
              
              {/* Location */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Clinic or hospital name"
                />
              </Grid>
              
              {/* Diagnosis */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  placeholder="Detailed diagnosis information"
                />
              </Grid>
              
              {/* Treatment */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Treatment"
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleChange}
                  placeholder="Treatments provided or recommended"
                />
              </Grid>
              
              {/* Cost */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cost"
                  name="cost"
                  type="number"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="Cost of treatment/visit"
                  InputProps={{
                    startAdornment: <span>$</span>,
                  }}
                />
              </Grid>
              
              {/* Follow-up Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Follow-up Date"
                  value={formData.followup_date}
                  onChange={(date) => handleDateChange('followup_date', date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </Grid>
              
              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Additional Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about this health event"
                />
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/health/records')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  Save Health Record
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
      
      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      {/* Success Snackbar */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddHealthRecord;
