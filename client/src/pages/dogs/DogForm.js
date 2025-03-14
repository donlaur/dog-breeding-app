// src/pages/dogs/DogForm.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { debugLog, debugError } from "../../config";
import DogContext from "../../context/DogContext";
import { useNotifications } from "../../context/NotificationContext";
import { apiGet, apiPost, apiPut } from "../../utils/apiUtils";
import { showSuccess, showError } from "../../utils/notifications";
import "../../styles/DogForm.css";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  FormHelperText,
  CircularProgress,
  Autocomplete,
  Paper,
  Divider,
  Container
} from '@mui/material';
import { format, parse } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function DogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addDog, updateDog } = useContext(DogContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [breeds, setBreeds] = useState([]);
  const [colors, setColors] = useState([]);
  const [breeders, setBreeders] = useState([]);
  const [dogs, setDogs] = useState([]); // For sire/dam selection
  
  // Form state
  const [dog, setDog] = useState({
    id: null,
    registered_name: "",
    call_name: "",
    registration_number: "",
    birth_date: null,
    sex: "",
    breeder_id: "",
    breed_id: "",
    color: "",
    height: "",
    weight: "",
    microchip_number: "",
    notes: "",
    status: "owned",
    price: "",
    dam_id: "",
    sire_id: "",
    is_breeding_stock: false
  });
  
  // Form validation state
  const [errors, setErrors] = useState({});
  
  // Get reference to notification context
  
  // Load reference data on mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        
        // Fetch data in parallel
        const [breedsResponse, colorsResponse, breedersResponse, dogsResponse] = await Promise.all([
          apiGet('/breeds/'),
          apiGet('/colors/'),
          apiGet('/breeders/'),
          apiGet('/dogs/')
        ]);
        
        setBreeds(breedsResponse || []);
        setColors(colorsResponse || []);
        setBreeders(breedersResponse || []);
        setDogs(dogsResponse || []);
        
        debugLog("Reference data loaded:", { 
          breeds: breedsResponse.length, 
          colors: colorsResponse.length,
          breeders: breedersResponse.length,
          dogs: dogsResponse.length
        });
      } catch (error) {
        debugError("Error loading reference data:", error);
        showError("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferenceData();
  }, []);
  
  // Load dog data if editing
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchDogData = async () => {
      try {
        debugLog("Fetching dog data for editing:", id);
        const response = await apiGet(`/dogs/${id}`);
        
        debugLog("Dog data received for editing:", response);
        // Ensure IDs are properly formatted
        const formattedData = {
          ...response,
          dam_id: response.dam_id || "",
          sire_id: response.sire_id || ""
        };
        setDog(formattedData);
      } catch (err) {
        debugError("Error fetching dog:", err);
        showError(`Error loading dog: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDogData();
  }, [id]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setDog(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear validation error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle date change specifically
  const handleDateChange = (date) => {
    setDog(prev => ({
      ...prev,
      birth_date: date
    }));
    
    // Clear validation error
    if (errors.birth_date) {
      setErrors(prev => ({
        ...prev,
        birth_date: null
      }));
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!dog.call_name) newErrors.call_name = "Call name is required";
    if (!dog.breed_id) newErrors.breed_id = "Breed is required";
    if (!dog.sex) newErrors.sex = "Sex is required";
    
    // Optional but with format validation
    if (dog.registration_number && !/^[A-Za-z0-9-]+$/.test(dog.registration_number)) {
      newErrors.registration_number = "Invalid registration number format";
    }
    
    if (dog.weight && isNaN(Number(dog.weight))) {
      newErrors.weight = "Weight must be a number";
    }
    
    if (dog.height && isNaN(Number(dog.height))) {
      newErrors.height = "Height must be a number";
    }
    
    if (dog.price && isNaN(Number(dog.price))) {
      newErrors.price = "Price must be a number";
    }
    
    // Set errors and return validation result
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      showError("Please correct the form errors");
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare data for API - remove any fields that aren't in the database schema
      const dataToSend = { ...dog };
      
      // Remove any fields that don't exist in the database schema
      delete dataToSend.dam_name;
      delete dataToSend.sire_name;
      delete dataToSend.breed_name;
      delete dataToSend.dam_info;
      delete dataToSend.sire_info;
      delete dataToSend.breed_info;
      
      // Format dates properly for the API
      if (dataToSend.birth_date) {
        dataToSend.birth_date = format(new Date(dataToSend.birth_date), 'yyyy-MM-dd');
      }
      
      let response;
      
      if (id) {
        // Update existing dog
        debugLog("Updating dog:", dataToSend);
        response = await apiPut(`/dogs/${id}`, dataToSend);
        showSuccess("Dog updated successfully");
      } else {
        // Create new dog
        debugLog("Creating new dog:", dataToSend);
        response = await apiPost('/dogs/', dataToSend);
        showSuccess("Dog created successfully");
      }
      
      debugLog("API response:", response);
      
      // Navigate back to dogs list
      navigate('/dogs/manage');
    } catch (error) {
      debugError("Error saving dog:", error);
      showError(`Failed to save dog: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Filter dogs for sire/dam selection
  const getMaleDogs = () => dogs.filter(d => d.sex === 'male' && d.id !== dog.id);
  const getFemaleDogs = () => dogs.filter(d => d.sex === 'female' && d.id !== dog.id);
  
  // Format a dog's name for display
  const formatDogName = (dog) => {
    if (!dog) return '';
    return dog.call_name ? `${dog.call_name} (${dog.registered_name || 'No reg. name'})` : dog.registered_name;
  };
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {id ? 'Edit Dog' : 'Add New Dog'}
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="call_name"
                label="Call Name"
                fullWidth
                required
                value={dog.call_name || ''}
                onChange={handleChange}
                error={!!errors.call_name}
                helperText={errors.call_name}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="registered_name"
                label="Registered Name"
                fullWidth
                value={dog.registered_name || ''}
                onChange={handleChange}
                error={!!errors.registered_name}
                helperText={errors.registered_name}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="registration_number"
                label="Registration Number"
                fullWidth
                value={dog.registration_number || ''}
                onChange={handleChange}
                error={!!errors.registration_number}
                helperText={errors.registration_number}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.sex}>
                <InputLabel>Sex</InputLabel>
                <Select
                  name="sex"
                  value={dog.sex || ''}
                  onChange={handleChange}
                  label="Sex"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
                {errors.sex && <FormHelperText>{errors.sex}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Birth Date"
                  value={dog.birth_date ? new Date(dog.birth_date) : null}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.birth_date}
                      helperText={errors.birth_date}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.breed_id} required>
                <InputLabel>Breed</InputLabel>
                <Select
                  name="breed_id"
                  value={dog.breed_id || ''}
                  onChange={handleChange}
                  label="Breed"
                >
                  {breeds.map(breed => (
                    <MenuItem key={breed.id} value={breed.id}>
                      {breed.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.breed_id && <FormHelperText>{errors.breed_id}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {/* Physical Characteristics */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Physical Characteristics
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  name="color"
                  value={dog.color || ''}
                  onChange={handleChange}
                  label="Color"
                >
                  {colors.map(color => (
                    <MenuItem key={color} value={color}>
                      {color}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                name="weight"
                label="Weight (lbs)"
                type="number"
                fullWidth
                value={dog.weight || ''}
                onChange={handleChange}
                error={!!errors.weight}
                helperText={errors.weight}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                name="height"
                label="Height (inches)"
                type="number"
                fullWidth
                value={dog.height || ''}
                onChange={handleChange}
                error={!!errors.height}
                helperText={errors.height}
              />
            </Grid>
            
            {/* Parentage */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Parentage
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sire (Father)</InputLabel>
                <Select
                  name="sire_id"
                  value={dog.sire_id || ''}
                  onChange={handleChange}
                  label="Sire (Father)"
                >
                  <MenuItem value="">None</MenuItem>
                  {getMaleDogs().map(sire => (
                    <MenuItem key={sire.id} value={sire.id}>
                      {formatDogName(sire)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Dam (Mother)</InputLabel>
                <Select
                  name="dam_id"
                  value={dog.dam_id || ''}
                  onChange={handleChange}
                  label="Dam (Mother)"
                >
                  <MenuItem value="">None</MenuItem>
                  {getFemaleDogs().map(dam => (
                    <MenuItem key={dam.id} value={dam.id}>
                      {formatDogName(dam)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Additional Information */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Breeder</InputLabel>
                <Select
                  name="breeder_id"
                  value={dog.breeder_id || ''}
                  onChange={handleChange}
                  label="Breeder"
                >
                  <MenuItem value="">Not specified</MenuItem>
                  {breeders.map(breeder => (
                    <MenuItem key={breeder.id} value={breeder.id}>
                      {breeder.business_name || breeder.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="microchip_number"
                label="Microchip Number"
                fullWidth
                value={dog.microchip_number || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={dog.status || 'owned'}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="owned">Owned</MenuItem>
                  <MenuItem value="co-owned">Co-Owned</MenuItem>
                  <MenuItem value="available">Available for Sale</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                  <MenuItem value="deceased">Deceased</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="price"
                label="Price"
                type="number"
                fullWidth
                value={dog.price || ''}
                onChange={handleChange}
                error={!!errors.price}
                helperText={errors.price}
                InputProps={{
                  startAdornment: <span>$</span>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                multiline
                rows={4}
                fullWidth
                value={dog.notes || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Breeding Stock</InputLabel>
                <Select
                  name="is_breeding_stock"
                  value={dog.is_breeding_stock || false}
                  onChange={handleChange}
                  label="Breeding Stock"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
                <FormHelperText>Is this dog used for breeding?</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Form Actions */}
            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                component={Link}
                to="/dogs/manage"
                variant="outlined"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : null}
              >
                {saving ? 'Saving...' : 'Save Dog'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default DogForm;
