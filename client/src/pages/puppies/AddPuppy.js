import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDog } from '../../context/DogContext';
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
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Pets as PetsIcon,
  Female as FemaleIcon,
  Male as MaleIcon
} from '@mui/icons-material';
import { apiPost } from '../../utils/apiUtils';
import { showSuccess, showError } from '../../utils/notifications';

function AddPuppy() {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const { litters, refreshData } = useDog();
  const [currentLitter, setCurrentLitter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [puppy, setPuppy] = useState({
    name: '',
    gender: '',
    color: '',
    markings: '',
    birthdate: '',
    weight_birth: '',
    description: '',
    litter_id: litterId
  });

  useEffect(() => {
    // Find the current litter
    if (litters && litters.length > 0) {
      const litter = litters.find(l => String(l.id) === String(litterId));
      if (litter) {
        setCurrentLitter(litter);
        // Pre-fill birthdate from litter if available
        if (litter.birth_date) {
          // Format the date as YYYY-MM-DD for the date input
          const formattedDate = new Date(litter.birth_date).toISOString().split('T')[0];
          setPuppy(prev => ({ ...prev, birthdate: formattedDate }));
        }
      }
    }
  }, [litterId, litters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPuppy(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!puppy.name || !puppy.gender) {
        setError("Name and gender are required");
        showError("Name and gender are required");
        setLoading(false);
        return;
      }
      
      const response = await apiPost(`litters/${litterId}/puppies`, puppy);
      
      if (response.ok) {
        showSuccess("Puppy added successfully!");
        
        // Refresh data
        await refreshData();
        
        // Navigate after a short delay to allow viewing the success message
        setTimeout(() => {
          navigate(`/dashboard/litters/${litterId}/puppies`);
        }, 1500);
      } else {
        throw new Error(response.error || "Failed to add puppy");
      }
    } catch (error) {
      setError(error.message);
      showError(`Error adding puppy: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentLitter) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading litter information...</Typography>
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
                      value="male"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MaleIcon color="primary" sx={{ mr: 0.5 }} />
                          Male
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="female"
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
                  name="birthdate"
                  type="date"
                  value={puppy.birthdate}
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
                  name="weight_birth"
                  type="number"
                  value={puppy.weight_birth}
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
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Puppy'}
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