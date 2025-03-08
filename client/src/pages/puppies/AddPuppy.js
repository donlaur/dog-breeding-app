import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Paper,
  Divider,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Pets as PetsIcon,
  Female as FemaleIcon,
  Male as MaleIcon
} from '@mui/icons-material';
import { apiGet, apiPost, addPuppyToLitter } from '../../utils/apiUtils';
import { showSuccess, showError } from '../../utils/notifications';

function AddPuppy() {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const [currentLitter, setCurrentLitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [puppy, setPuppy] = useState({
    name: '',
    gender: '',
    color: '',
    markings: '',
    birth_date: '',  // Changed from birthdate to match backend
    weight_at_birth: '',  // Corrected field name per database schema
    description: '',
    litter_id: litterId
  });

  useEffect(() => {
    const fetchLitterData = async () => {
      if (!litterId) {
        setError('Missing litter ID');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching litter data for puppy form, litter ID:', litterId);
        const response = await apiGet(`litters/${litterId}`);
        
        if (!response.ok) {
          throw new Error(response.error || 'Failed to fetch litter details');
        }
        
        const litter = response.data;
        setCurrentLitter(litter);
        
        // Pre-fill birth date from litter's whelp_date if available
        if (litter.whelp_date) {
          console.log('Pre-filling birth date from litter whelp_date:', litter.whelp_date);
          
          // Format the date as YYYY-MM-DD for the date input
          try {
            // Create a proper date object
            const whelpDate = new Date(litter.whelp_date);
            
            // Check if date is valid
            if (!isNaN(whelpDate.getTime())) {
              const formattedDate = whelpDate.toISOString().split('T')[0];
              console.log('Formatted whelp date for puppy birth_date:', formattedDate);
              
              setPuppy(prev => ({ 
                ...prev, 
                birth_date: formattedDate 
              }));
            } else {
              console.error("Invalid whelp_date format:", litter.whelp_date);
            }
          } catch (e) {
            console.error("Error formatting whelp_date:", e, litter.whelp_date);
          }
        } else {
          console.log('No whelp_date available in litter data');
        }
      } catch (err) {
        console.error('Error fetching litter data:', err);
        setError(`Failed to load litter: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLitterData();
  }, [litterId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPuppy(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Validate required fields
      if (!puppy.name || !puppy.gender) {
        setError("Name and gender are required");
        showError("Name and gender are required");
        setSaving(false);
        return;
      }
      
      // Clean data for submission
      const cleanData = { ...puppy };
      
      // Process numeric fields
      ['weight_at_birth', 'weight_birth'].forEach(field => {
        if (field in cleanData) {
          if (cleanData[field] === '') {
            cleanData[field] = null;
          } else if (cleanData[field] !== null && cleanData[field] !== undefined) {
            const parsed = parseFloat(cleanData[field]);
            cleanData[field] = isNaN(parsed) ? null : parsed;
          }
        }
      });
      
      console.log('Submitting puppy data with cleaned values:', cleanData);
      
      // Use the addPuppyToLitter utility function
      const response = await addPuppyToLitter(litterId, cleanData);
      
      if (response.ok) {
        showSuccess("Puppy added successfully!");
        
        // Navigate after a short delay to allow viewing the success message
        setTimeout(() => {
          navigate(`/dashboard/litters/${litterId}`);
        }, 1500);
      } else {
        throw new Error(response.error || "Failed to add puppy");
      }
    } catch (error) {
      setError(error.message);
      showError(`Error adding puppy: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading litter information...</Typography>
        </Box>
      </Container>
    );
  }
  
  if (!currentLitter && !error) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Could not find litter with ID: {litterId}</Typography>
          <Button 
            component={Link}
            to="/dashboard/litters"
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to Litters
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button
          component={Link}
          to={`/dashboard/litters/${litterId}/puppies`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Puppies
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          Add New Puppy
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          For {currentLitter.name || `Litter #${currentLitter.id}`}
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Puppy Name"
                  name="name"
                  value={puppy.name}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Enter puppy name"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">Gender</FormLabel>
                  <RadioGroup
                    name="gender"
                    value={puppy.gender}
                    onChange={handleChange}
                    row
                  >
                    <FormControlLabel
                      value="Male"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MaleIcon color="primary" sx={{ mr: 0.5 }} />
                          Male
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="Female"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FemaleIcon color="error" sx={{ mr: 0.5 }} />
                          Female
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Color"
                  name="color"
                  value={puppy.color}
                  onChange={handleChange}
                  fullWidth
                  placeholder="e.g., Black, Brown, etc."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Markings"
                  name="markings"
                  value={puppy.markings}
                  onChange={handleChange}
                  fullWidth
                  placeholder="e.g., White chest, tan points, etc."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Birth Date"
                  name="birth_date"
                  type="date"
                  value={puppy.birth_date || ''}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Birth Weight"
                  name="weight_at_birth"
                  type="number"
                  value={puppy.weight_at_birth}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">oz</InputAdornment>,
                  }}
                  inputProps={{
                    step: "0.1"
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={puppy.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter any additional information about this puppy"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    component={Link}
                    to={`/dashboard/litters/${litterId}/puppies`}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Puppy'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default AddPuppy; 