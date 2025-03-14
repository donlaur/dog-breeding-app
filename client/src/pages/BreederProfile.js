import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiGet, apiPost, apiPut } from '../utils/apiUtils';
import { sanitizeApiData } from '../utils/apiUtils';
import { debugLog, debugError } from '../config';

const BreederProfile = () => {
  const navigate = useNavigate();
  const [program, setProgram] = useState({
    name: '',
    kennel_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    established_year: '',
    // New fields
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    logo_url: '',
    banner_url: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Load breeder profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Using the correct endpoint from program.py with apiGet
        const data = await apiGet('/program/');
        debugLog('Profile data loaded:', data);
        setProgram(data);
      } catch (error) {
        debugError('Error fetching program:', error);
        
        // If profile doesn't exist yet, we'll handle it gracefully
        if (error.status === 404) {
          debugLog('Profile not found, will create a new one when saved');
        } else {
          setError('Failed to load breeder profile. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProgram((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Sanitize data before sending to API
      const sanitizedData = sanitizeApiData(program);
      
      let response;
      if (program.id) {
        // Update existing profile
        response = await apiPut(`/program/${program.id}`, sanitizedData);
        debugLog('Updated program:', response);
      } else {
        // Create new profile
        response = await apiPost('/program/', sanitizedData);
        debugLog('Created new program:', response);
      }
      
      setSuccess(true);
      setProgram(response);
      
      // Automatically navigate back to dashboard after successful save
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      debugError('Error saving program:', error);
      setError('Failed to save breeder profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Breeder Profile
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Profile saved successfully! Redirecting to dashboard...
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Breeder Name"
                    name="name"
                    value={program.name || ''}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Kennel Name"
                    name="kennel_name"
                    value={program.kennel_name || ''}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={program.address || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={program.city || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={program.state || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    name="zip_code"
                    value={program.zip_code || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={program.phone || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={program.email || ''}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    name="website"
                    value={program.website || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Established Year"
                    name="established_year"
                    type="number"
                    value={program.established_year || ''}
                    onChange={handleChange}
                    inputProps={{ min: 1900, max: new Date().getFullYear() }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Facebook URL"
                    name="facebook_url"
                    value={program.facebook_url || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Instagram URL"
                    name="instagram_url"
                    value={program.instagram_url || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Twitter URL"
                    name="twitter_url"
                    value={program.twitter_url || ''}
                    onChange={handleChange}
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
                  />
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      sx={{ mr: 2 }}
                      variant="outlined"
                      onClick={() => navigate('/dashboard')}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default BreederProfile;
