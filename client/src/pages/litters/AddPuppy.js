// src/pages/litters/AddPuppy.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_URL, debugLog, debugError } from "../../config";
import { apiGet, apiPost } from "../../utils/apiUtils";
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Breadcrumbs,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  FormHelperText
} from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DogContext from "../../context/DogContext";

const AddPuppy = () => {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const { breeds } = useContext(DogContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [litter, setLitter] = useState(null);
  
  const [puppy, setPuppy] = useState({
    registered_name: "",
    call_name: "",
    breed_id: "",
    gender: "",
    color: "",
    markings: "",
    markings_description: "",
    status: "Available", // Default status
    price: "",
    microchip: "",
    description: "", // Public-facing description of personality, etc.
    notes: "", // Private breeder notes
    birth_date: "",
    sire_id: "",
    dam_id: "",
    litter_id: litterId,
    program_id: "",
    registration_type: "Limited",
    weight_at_birth: "",
    collar_color: "",
    min_adult_weight: "", // Added anticipated weight range
    max_adult_weight: "",
    is_available: true, // Quick toggle for availability
  });

  // Fetch litter details first
  useEffect(() => {
    const fetchLitterDetails = async () => {
      try {
        const response = await apiGet(`litters/${litterId}`);
        
        if (response.ok) {
          setLitter(response.data);
          // Pre-fill puppy data from litter
          setPuppy(prev => ({
            ...prev,
            breed_id: response.data.breed_id,
            birth_date: response.data.birth_date,
            sire_id: response.data.sire_id,
            dam_id: response.data.dam_id,
            program_id: response.data.program_id,
            price: response.data.puppy_price || response.data.price, // Use puppy price if set, otherwise litter price
          }));
        } else {
          throw new Error(response.error || 'Failed to fetch litter details');
        }
      } catch (err) {
        debugError("Error fetching litter:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLitterDetails();
  }, [litterId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPuppy(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiPost(`litters/${litterId}/puppies`, puppy);

      if (response.ok) {
        debugLog("Puppy created:", response.data);
        navigate(`/dashboard/litters/${litterId}`);
      } else {
        throw new Error(response.error || 'Failed to create puppy');
      }
    } catch (err) {
      debugError("Error creating puppy:", err);
      setError(err.message);
    }
  };

  const handleAvailabilityToggle = () => {
    setPuppy(prev => ({ 
      ...prev, 
      is_available: !prev.is_available,
      status: !prev.is_available ? "Available" : "Reserved" 
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link 
            to="/dashboard/litters"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Litters
          </Link>
          <Link 
            to={`/dashboard/litters/${litterId}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {litter.litter_name}
          </Link>
          <Typography color="text.primary">Add Puppy</Typography>
        </Breadcrumbs>

        <Typography variant="h4" sx={{ mt: 2, mb: 4 }}>
          Add New Puppy
        </Typography>

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Quick Availability Toggle */}
              <Grid item xs={12}>
                <FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={puppy.is_available}
                        onChange={handleAvailabilityToggle}
                        color="primary"
                      />
                    }
                    label={puppy.is_available ? "Available" : "Not Available"}
                  />
                </FormControl>
              </Grid>

              {/* Basic Info Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="call_name"
                  label="Call Name"
                  value={puppy.call_name}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="registered_name"
                  label="Registered Name"
                  value={puppy.registered_name}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={puppy.gender}
                    onChange={handleChange}
                    label="Gender"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={puppy.status}
                    onChange={handleChange}
                    label="Status"
                  >
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Reserved">Reserved</MenuItem>
                    <MenuItem value="Sold">Sold</MenuItem>
                    <MenuItem value="Retained">Retained</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Color and Markings Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Appearance</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="color"
                  label="Color"
                  value={puppy.color}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="markings_description"
                  label="Markings Description"
                  helperText="Detailed description of coat pattern, distinctive markings, etc."
                  value={puppy.markings_description}
                  onChange={handleChange}
                />
              </Grid>

              {/* Weight Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Weight Information</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="weight_at_birth"
                  label="Birth Weight (oz)"
                  value={puppy.weight_at_birth}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="min_adult_weight"
                  label="Min Adult Weight (lbs)"
                  value={puppy.min_adult_weight}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  name="max_adult_weight"
                  label="Max Adult Weight (lbs)"
                  value={puppy.max_adult_weight}
                  onChange={handleChange}
                />
              </Grid>

              {/* Description and Notes Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Description & Notes</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="description"
                  label="Public Description"
                  helperText="This description will be visible to potential buyers"
                  value={puppy.description}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="notes"
                  label="Private Notes"
                  helperText="These notes are for breeder reference only"
                  value={puppy.notes}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Add Puppy
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AddPuppy;
