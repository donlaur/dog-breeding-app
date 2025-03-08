import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Button, Paper, 
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, Grid, Snackbar, Alert, Switch, FormControlLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';

const AddMedication = () => {
  const navigate = useNavigate();
  const { addMedication } = useHealth();
  const { dogs, puppies } = useDog();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    medication_name: '',
    animal_type: '',
    animal_id: '',
    condition: '',
    dosage: '',
    frequency: '',
    start_date: null,
    end_date: null,
    prescribed_by: '',
    pharmacy: '',
    dosage_remaining: '',
    is_active: true,
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    medication_name: '',
    animal_type: '',
    animal_id: '',
    start_date: ''
  });

  const validateForm = () => {
    let isValid = true;
    const errors = {
      medication_name: '',
      animal_type: '',
      animal_id: '',
      start_date: ''
    };
    
    if (!formData.medication_name.trim()) {
      errors.medication_name = 'Medication name is required';
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
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
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
      const medicationData = {
        ...formData,
        start_date: formData.start_date?.toISOString().split('T')[0],
        end_date: formData.end_date?.toISOString().split('T')[0],
        dog_id: formData.animal_type === 'dog' ? formData.animal_id : null,
        puppy_id: formData.animal_type === 'puppy' ? formData.animal_id : null,
        active: formData.is_active
      };
      
      // Remove temporary fields
      delete medicationData.animal_type;
      delete medicationData.animal_id;
      delete medicationData.is_active;
      
      await addMedication(medicationData);
      setSuccessMessage('Medication added successfully!');
      
      // Navigate after a brief delay to show success message
      setTimeout(() => {
        navigate('/dashboard/health/medications');
      }, 1500);
    } catch (err) {
      setError('Failed to add medication. Please try again.');
      console.error('Error adding medication:', err);
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

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
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
          Add Medication
        </Typography>
        
        <Paper sx={{ p: 3, mt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Medication Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Medication Name"
                  name="medication_name"
                  value={formData.medication_name}
                  onChange={handleChange}
                  error={!!formErrors.medication_name}
                  helperText={formErrors.medication_name}
                />
              </Grid>
              
              {/* Condition */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  placeholder="What condition is this treating?"
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
              
              {/* Dosage */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dosage"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g., 10mg twice daily"
                />
              </Grid>
              
              {/* Frequency */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  placeholder="e.g., Every 12 hours, As needed"
                />
              </Grid>
              
              {/* Start Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date *"
                  value={formData.start_date}
                  onChange={(date) => handleDateChange('start_date', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!formErrors.start_date}
                      helperText={formErrors.start_date}
                    />
                  )}
                />
              </Grid>
              
              {/* End Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={(date) => handleDateChange('end_date', date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </Grid>
              
              {/* Prescribed By */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prescribed By"
                  name="prescribed_by"
                  value={formData.prescribed_by}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Smith"
                />
              </Grid>
              
              {/* Pharmacy */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pharmacy"
                  name="pharmacy"
                  value={formData.pharmacy}
                  onChange={handleChange}
                  placeholder="Where the medication was dispensed"
                />
              </Grid>
              
              {/* Dosage Remaining */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dosage Remaining"
                  name="dosage_remaining"
                  type="number"
                  value={formData.dosage_remaining}
                  onChange={handleChange}
                  placeholder="Number of pills/doses remaining"
                />
              </Grid>
              
              {/* Is Active */}
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={handleSwitchChange}
                      name="is_active"
                      color="primary"
                    />
                  }
                  label="Medication is currently active"
                />
              </Grid>
              
              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional details about this medication"
                />
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/health/medications')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  Save Medication
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

export default AddMedication;
