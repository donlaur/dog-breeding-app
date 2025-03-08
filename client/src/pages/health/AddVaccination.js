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

const AddVaccination = () => {
  const navigate = useNavigate();
  const { addVaccination } = useHealth();
  const { dogs, puppies } = useDog();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    vaccine_name: '',
    animal_type: '',
    animal_id: '',
    vaccination_date: null,
    next_due_date: null,
    administered_by: '',
    lot_number: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    vaccine_name: '',
    animal_type: '',
    animal_id: '',
    vaccination_date: ''
  });

  const validateForm = () => {
    let isValid = true;
    const errors = {
      vaccine_name: '',
      animal_type: '',
      animal_id: '',
      vaccination_date: ''
    };
    
    if (!formData.vaccine_name.trim()) {
      errors.vaccine_name = 'Vaccine name is required';
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
    
    if (!formData.vaccination_date) {
      errors.vaccination_date = 'Vaccination date is required';
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
      const vaccinationData = {
        ...formData,
        vaccination_date: formData.vaccination_date?.toISOString().split('T')[0],
        next_due_date: formData.next_due_date?.toISOString().split('T')[0],
        dog_id: formData.animal_type === 'dog' ? formData.animal_id : null,
        puppy_id: formData.animal_type === 'puppy' ? formData.animal_id : null
      };
      
      delete vaccinationData.animal_type;
      delete vaccinationData.animal_id;
      
      await addVaccination(vaccinationData);
      setSuccessMessage('Vaccination added successfully!');
      
      // Navigate after a brief delay to show success message
      setTimeout(() => {
        navigate('/dashboard/health/vaccinations');
      }, 1500);
    } catch (err) {
      setError('Failed to add vaccination. Please try again.');
      console.error('Error adding vaccination:', err);
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
          Add Vaccination
        </Typography>
        
        <Paper sx={{ p: 3, mt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Vaccine Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Vaccine Name"
                  name="vaccine_name"
                  value={formData.vaccine_name}
                  onChange={handleChange}
                  error={!!formErrors.vaccine_name}
                  helperText={formErrors.vaccine_name}
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
              <Grid item xs={12}>
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
              
              {/* Vaccination Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Vaccination Date *"
                  value={formData.vaccination_date}
                  onChange={(date) => handleDateChange('vaccination_date', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!formErrors.vaccination_date}
                      helperText={formErrors.vaccination_date}
                    />
                  )}
                />
              </Grid>
              
              {/* Next Due Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Next Due Date"
                  value={formData.next_due_date}
                  onChange={(date) => handleDateChange('next_due_date', date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </Grid>
              
              {/* Administered By */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Administered By"
                  name="administered_by"
                  value={formData.administered_by}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Smith or Self"
                />
              </Grid>
              
              {/* Lot Number */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lot Number"
                  name="lot_number"
                  value={formData.lot_number}
                  onChange={handleChange}
                  placeholder="Vaccine lot number"
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
                  placeholder="Additional details about this vaccination"
                />
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/health/vaccinations')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  Save Vaccination
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

export default AddVaccination;
