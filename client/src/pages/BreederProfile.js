// src/pages/BreederProfile.js
import React, { useState, useEffect } from 'react';
import '../styles/BreederProfile.css';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Container,
  Grid
} from '@mui/material';
import { API_URL, debugLog, debugError } from '../config';
import { apiGet, apiPut } from '../utils/apiUtils';
import { showSuccess, showError } from '../utils/notifications';

const BreederProfile = () => {
  const [program, setProgram] = useState({
    name: '',
    description: '',
    contact_email: '',
    website: '',
    facility_details: '',
    testimonial: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch the breeder program details
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using the correct endpoint from program.py
      const response = await fetch(`${API_URL}/program/`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // If profile doesn't exist yet, we'll handle it gracefully
          debugLog('Profile not found, will create a new one when saved');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      debugLog('Profile data loaded:', data);
      setProgram(data);
    } catch (error) {
      debugError('Error fetching program:', error);
      setError('Failed to load breeder profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProgram(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      // Use the correct program endpoint to match our API
      const response = await apiPut('program', program);
      
      if (response.ok) {
        setSaveSuccess(true);
        showSuccess("Profile updated successfully!");
      } else {
        throw new Error(response.error || "Failed to update profile");
      }
    } catch (err) {
      debugError("Error saving profile:", err);
      setError(err.message);
      showError(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Breeder Profile
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile saved successfully!
          </Alert>
        )}
        
        <Box component="form" onSubmit={saveProfile}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Program Name"
                name="name"
                value={program.name || ''}
                onChange={handleChange}
                placeholder="Your breeding program name"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={program.description || ''}
                onChange={handleChange}
                placeholder="Describe your breeding program..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="Contact Email"
                name="contact_email"
                value={program.contact_email || ''}
                onChange={handleChange}
                placeholder="Enter your contact email"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={program.website || ''}
                onChange={handleChange}
                placeholder="Enter your website URL"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Facility Details"
                name="facility_details"
                value={program.facility_details || ''}
                onChange={handleChange}
                placeholder="Describe your facilities..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Testimonial"
                name="testimonial"
                value={program.testimonial || ''}
                onChange={handleChange}
                placeholder="Include a customer testimonial..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                size="large"
                disabled={saving}
                sx={{ mt: 2 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default BreederProfile;