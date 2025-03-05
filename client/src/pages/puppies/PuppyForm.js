import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Grid, TextField, MenuItem, 
  FormControl, InputLabel, Select, FormHelperText,
  Typography, Divider
} from '@mui/material';
import PhotoGallery from '../../components/PhotoGallery';

function PuppyForm({ initialData = {}, onSave, litter = {}, existingPuppies = [] }) {
  const [puppy, setPuppy] = useState({
    name: '',
    gender: '',
    color: '',
    microchip: '',
    weight: '',
    birth_date: null,
    notes: '',
    status: initialData.status || 'Available', // Ensure status is preserved from initialData
    ...initialData
  });

  const [errors, setErrors] = useState({});
  
  // Generate next available identifier and pre-fill data from litter
  useEffect(() => {
    // Only update if we have litter data
    if (litter && Array.isArray(existingPuppies)) {
      const updates = {};
      
      // Only suggest a name if one isn't already provided
      if (!puppy.name) {
        // Create identifier like "Puppy A", "Puppy B", etc.
        const nextLetter = String.fromCharCode(65 + existingPuppies.length); // A, B, C, ...
        const litterPrefix = litter.litter_name ? litter.litter_name.split(' ')[0] : 'Puppy';
        const suggestedName = `${litterPrefix} ${nextLetter}`;
        updates.name = suggestedName;
      }
      
      // Pre-fill birth date from litter if available and not already set
      if (litter.whelp_date && !puppy.birth_date) {
        try {
          const whelpDate = new Date(litter.whelp_date);
          if (!isNaN(whelpDate.getTime())) {
            updates.birth_date = whelpDate.toISOString().split('T')[0];
            console.log('PuppyForm: Pre-filling birth date:', updates.birth_date);
          }
        } catch (e) {
          console.error("Error formatting whelp_date in PuppyForm:", e);
        }
      }
      
      // Apply all updates if there are any
      if (Object.keys(updates).length > 0) {
        setPuppy(prev => ({
          ...prev,
          ...updates
        }));
      }
    }
  }, [existingPuppies, litter, puppy.name, puppy.birth_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPuppy(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Format date for input field YYYY-MM-DD
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    // If it's already a string in YYYY-MM-DD format, return it
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.substring(0, 10); // Get just the YYYY-MM-DD part
    }
    
    // If it's a Date object or string that needs conversion
    const d = new Date(date);
    if (isNaN(d.getTime())) return ''; // Invalid date
    
    // Format as YYYY-MM-DD
    return d.toISOString().substring(0, 10);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!puppy.name) newErrors.name = 'Name is required';
    if (!puppy.gender) newErrors.gender = 'Gender is required';
    if (!puppy.color) newErrors.color = 'Color is required';
    
    // Make sure status is set to a valid value
    if (!puppy.status) {
      // Default to Available if not set
      puppy.status = 'Available';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Format data for submission
      const formattedData = { ...puppy };
      
      // Convert numeric fields to proper numbers or null
      const numericFields = ['weight', 'weight_at_birth'];
      
      numericFields.forEach(field => {
        if (field in formattedData) {
          if (formattedData[field] === '' || formattedData[field] === undefined) {
            formattedData[field] = null;
          } else {
            const num = Number(formattedData[field]);
            formattedData[field] = isNaN(num) ? null : num;
          }
        }
      });
      
      // If we have weight but no weight_at_birth, copy it over
      if (formattedData.weight !== undefined && formattedData.weight_at_birth === undefined) {
        formattedData.weight_at_birth = formattedData.weight;
      }
      
      console.log('PuppyForm submitting data:', formattedData);
      onSave(formattedData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={puppy.name || ''}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name || ''}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.gender} required>
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              name="gender"
              value={puppy.gender || ''}
              onChange={handleChange}
              label="Gender"
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
            {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Color"
            name="color"
            value={puppy.color || ''}
            onChange={handleChange}
            error={!!errors.color}
            helperText={errors.color || ''}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Weight (lbs)"
            name="weight"
            type="number"
            value={puppy.weight || ''}
            onChange={handleChange}
            inputProps={{ step: "0.1" }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Microchip"
            name="microchip"
            value={puppy.microchip || ''}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Birth Date"
            name="birth_date"
            type="date"
            value={formatDateForInput(puppy.birth_date)}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            error={!!errors.birth_date}
            helperText={errors.birth_date || ''}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.status} required>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={puppy.status || 'Available'}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="Reserved">Reserved</MenuItem>
              <MenuItem value="Sold">Sold</MenuItem>
              <MenuItem value="Not Available">Not Available</MenuItem>
            </Select>
            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={puppy.notes || ''}
            onChange={handleChange}
            multiline
            rows={4}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
            >
              Save Puppy
            </Button>
          </Box>
        </Grid>
        
        {/* Photo Gallery - only show when editing an existing puppy */}
        {puppy.id && (
          <Grid item xs={12}>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>
              Puppy Photos
            </Typography>
            <PhotoGallery
              entityType="puppy"
              entityId={puppy.id}
              onPhotoChange={(photo) => {
                // If a cover photo was set, update the puppy's cover_photo field
                if (photo && photo.is_cover) {
                  setPuppy(prev => ({
                    ...prev,
                    cover_photo: photo.url
                  }));
                }
              }}
            />
          </Grid>
        )}
      </Grid>
    </form>
  );
}

export default PuppyForm; 