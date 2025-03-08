import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
  Snackbar, Alert, CircularProgress, Divider, IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useHealth } from '../../context/HealthContext';
import { useDog } from '../../context/DogContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseISO } from 'date-fns';

// HealthRecordForm component for adding/editing health records
const HealthRecordForm = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!recordId;
  
  // Get dogs and puppies from context
  const { dogs, puppies } = useDog();
  
  // Get health record functions from context
  const { 
    healthRecords, fetchHealthRecords, createHealthRecord, updateHealthRecord, isLoading 
  } = useHealth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    record_date: new Date(),
    record_type: 'examination',
    notes: '',
    performed_by: '',
    location: '',
    dog_id: '',
    puppy_id: '',
    animal_type: 'dog', // 'dog' or 'puppy'
    attachments: []
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Record types for dropdown
  const recordTypes = [
    { value: 'examination', label: 'Examination' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'test', label: 'Test' },
    { value: 'vaccination', label: 'Vaccination' }
  ];
  
  // Load record data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchHealthRecords().then(() => {
        const record = healthRecords.find(r => r.id === parseInt(recordId));
        if (record) {
          // Determine animal type (dog or puppy)
          const animalType = record.dog_id ? 'dog' : 'puppy';
          
          setFormData({
            ...record,
            animal_type: animalType,
            // Parse date string to Date object if needed
            record_date: record.record_date ? parseISO(record.record_date) : new Date(),
            // Ensure correct ID is set based on animal type
            dog_id: animalType === 'dog' ? record.dog_id : '',
            puppy_id: animalType === 'puppy' ? record.puppy_id : '',
            // Parse attachments if it's a string
            attachments: typeof record.attachments === 'string' 
              ? JSON.parse(record.attachments) 
              : record.attachments || []
          });
        } else {
          // Record not found, redirect to records page
          navigate('/health/records');
        }
      });
    }
  }, [isEditMode, recordId, fetchHealthRecords, healthRecords, navigate]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for animal type
    if (name === 'animal_type') {
      // Reset the other animal ID when changing animal type
      setFormData({
        ...formData,
        animal_type: value,
        dog_id: value === 'dog' ? formData.dog_id : '',
        puppy_id: value === 'puppy' ? formData.puppy_id : ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle date change
  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      record_date: newDate
    });
    
    // Clear error for date if it exists
    if (errors.record_date) {
      setErrors({
        ...errors,
        record_date: ''
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // Include only the relevant animal ID based on animal_type
        dog_id: formData.animal_type === 'dog' ? parseInt(formData.dog_id) : null,
        puppy_id: formData.animal_type === 'puppy' ? parseInt(formData.puppy_id) : null
      };
      
      // Remove animal_type as it's not needed in the API
      delete submissionData.animal_type;
      
      // Create or update record
      if (isEditMode) {
        await updateHealthRecord(parseInt(recordId), submissionData);
        setNotification({
          open: true,
          message: 'Health record updated successfully',
          severity: 'success'
        });
      } else {
        await createHealthRecord(submissionData);
        setNotification({
          open: true,
          message: 'Health record created successfully',
          severity: 'success'
        });
        
        // Reset form if creating a new record
        if (!isEditMode) {
          setFormData({
            title: '',
            record_date: new Date(),
            record_type: 'examination',
            notes: '',
            performed_by: '',
            location: '',
            dog_id: '',
            puppy_id: '',
            animal_type: 'dog',
            attachments: []
          });
        }
      }
    } catch (error) {
      console.error('Error saving health record:', error);
      setNotification({
        open: true,
        message: `Error saving health record: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.record_date) {
      newErrors.record_date = 'Date is required';
    }
    
    if (!formData.record_type) {
      newErrors.record_type = 'Record type is required';
    }
    
    // Ensure an animal is selected
    if (formData.animal_type === 'dog' && !formData.dog_id) {
      newErrors.dog_id = 'Please select a dog';
    }
    
    if (formData.animal_type === 'puppy' && !formData.puppy_id) {
      newErrors.puppy_id = 'Please select a puppy';
    }
    
    return newErrors;
  };
  
  // Handle closing the notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Handle navigation back to records
  const handleBack = () => {
    navigate('/health/records');
  };
  
  // Handle file upload (placeholder functionality)
  const handleFileUpload = () => {
    // In a real implementation, this would handle file selection and upload
    alert('File upload functionality would be implemented here');
  };
  
  if (isLoading && isEditMode) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Edit Health Record' : 'Add Health Record'}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>
            
            {/* Date */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Record Date"
                  value={formData.record_date}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.record_date}
                      helperText={errors.record_date}
                    />
                  )}
                  slotProps={{
                    textField: {
                      error: !!errors.record_date,
                      helperText: errors.record_date,
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Record Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.record_type}>
                <InputLabel id="record-type-label">Record Type</InputLabel>
                <Select
                  labelId="record-type-label"
                  name="record_type"
                  value={formData.record_type}
                  onChange={handleChange}
                  label="Record Type"
                >
                  {recordTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.record_type && (
                  <FormHelperText>{errors.record_type}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Animal Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="animal-type-label">Animal Type</InputLabel>
                <Select
                  labelId="animal-type-label"
                  name="animal_type"
                  value={formData.animal_type}
                  onChange={handleChange}
                  label="Animal Type"
                >
                  <MenuItem value="dog">Dog</MenuItem>
                  <MenuItem value="puppy">Puppy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Dog Selection (shown only if animal_type is dog) */}
            {formData.animal_type === 'dog' && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.dog_id}>
                  <InputLabel id="dog-label">Dog</InputLabel>
                  <Select
                    labelId="dog-label"
                    name="dog_id"
                    value={formData.dog_id}
                    onChange={handleChange}
                    label="Dog"
                  >
                    <MenuItem value="">Select a dog</MenuItem>
                    {dogs.map(dog => (
                      <MenuItem key={dog.id} value={dog.id.toString()}>
                        {dog.call_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.dog_id && (
                    <FormHelperText>{errors.dog_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            
            {/* Puppy Selection (shown only if animal_type is puppy) */}
            {formData.animal_type === 'puppy' && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.puppy_id}>
                  <InputLabel id="puppy-label">Puppy</InputLabel>
                  <Select
                    labelId="puppy-label"
                    name="puppy_id"
                    value={formData.puppy_id}
                    onChange={handleChange}
                    label="Puppy"
                  >
                    <MenuItem value="">Select a puppy</MenuItem>
                    {puppies.map(puppy => (
                      <MenuItem key={puppy.id} value={puppy.id.toString()}>
                        {puppy.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.puppy_id && (
                    <FormHelperText>{errors.puppy_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            
            {/* Performed By */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Performed By"
                name="performed_by"
                value={formData.performed_by}
                onChange={handleChange}
                fullWidth
                placeholder="e.g. Dr. Smith"
              />
            </Grid>
            
            {/* Location */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                fullWidth
                placeholder="e.g. ABC Veterinary Clinic"
              />
            </Grid>
            
            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
            
            {/* File Upload (placeholder) */}
            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Attachments
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={handleFileUpload}
                >
                  Upload Files
                </Button>
                {formData.attachments && formData.attachments.length > 0 ? (
                  <Box mt={2}>
                    <Typography variant="body2" color="textSecondary">
                      {formData.attachments.length} file(s) attached
                    </Typography>
                  </Box>
                ) : (
                  <Box mt={1}>
                    <Typography variant="body2" color="textSecondary">
                      No files attached
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            
            {/* Form Actions */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (isEditMode ? 'Update Record' : 'Save Record')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HealthRecordForm;