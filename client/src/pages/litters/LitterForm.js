// src/pages/litters/LitterForm.js
import React, { useState, useEffect } from "react";
import { 
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Grid,
  Typography,
  FormHelperText
} from "@mui/material";
import { API_URL, debugLog, debugError } from "../../config";

/**
 * LitterForm component
 * 
 * @param {Function} onSave - Callback when user submits the form
 * @param {Object} [initialData] - Optional data to prefill the form (for editing)
 * @param {Array} [breedOptions] - Optional array of breed objects for breed_id selection
 * @param {Array} [sireOptions] - Optional array of dog objects (male) for sire_id selection
 * @param {Array} [damOptions] - Optional array of dog objects (female) for dam_id selection
 */
const LitterForm = ({ onSave, initialData, breedOptions = [], sireOptions = [], damOptions = [] }) => {
  // Debug the props received
  debugLog("LitterForm props:", { 
    initialData: initialData ? "present" : "not present", 
    breedOptions, 
    breedOptionsLength: breedOptions.length,
    sireOptions: sireOptions.length, 
    damOptions: damOptions.length 
  });

  // Local state for all the fields
  const [litter, setLitter] = useState({
    litter_name: "",
    status: "Planned",
    whelp_date: "",
    expected_date: "",
    planned_date: "",
    breed_id: "",  // Initialize as empty string
    sire_id: "",
    dam_id: "",
    price: "",
    deposit: "",
    extras: "",
    socialization: "",
    cover_photo_file: null,
    cover_photo_preview: null
  });

  // Add state for validation errors
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Update initial data with default breed if not set
  useEffect(() => {
    debugLog("breedOptions:", breedOptions);
    
    if (initialData) {
      const data = { ...initialData };
      // If editing a litter without a breed_id and we have breed options
      if (!data.breed_id && breedOptions.length > 0) {
        data.breed_id = breedOptions[0].id;
        debugLog("Setting breed_id for existing litter to:", breedOptions[0].id);
      }
      setLitter(data);
    } 
    // For new litters, set default breed_id if we have breed options
    else if (breedOptions.length > 0) {
      debugLog("Setting default breed_id for new litter to:", breedOptions[0].id);
      setLitter(prev => ({ 
        ...prev, 
        breed_id: breedOptions[0].id 
      }));
    }
  }, [initialData, breedOptions]);

  // Validate form fields
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "litter_name":
        if (!value) error = "Litter name is required";
        else if (value.length < 2) error = "Litter name must be at least 2 characters";
        break;
      case "breed_id":
        if (!value) error = "Please select a breed";
        break;
      case "price":
        if (value && isNaN(Number(value))) error = "Price must be a number";
        break;
      case "deposit":
        if (value && isNaN(Number(value))) error = "Deposit must be a number";
        break;
      default:
        // No validation for other fields
        break;
    }
    
    return error;
  };

  // Validate a field and update errors state
  const validateAndUpdateErrors = (name, value) => {
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return error === "";
  };

  // Generic change handler for text/select inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update litter data
    setLitter(prev => ({
      ...prev,
      [name]: value
    }));

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate field
    validateAndUpdateErrors(name, value);
  };

  // Handle focus on a field (mark as touched)
  const handleBlur = (e) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate field
    validateAndUpdateErrors(name, litter[name]);
  };

  // Handle file input change (for photos)
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setLitter(prev => ({
          ...prev,
          cover_photo_file: file,
          cover_photo_preview: reader.result
        }));
      }
      
      if (file) {
        reader.readAsDataURL(file);
      }
    }
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    debugLog("Submitting litter form:", litter);
    
    // Validate all fields
    let isValid = true;
    const newTouched = {};
    const newErrors = {};
    
    // Check required fields
    const requiredFields = ["litter_name", "breed_id"];
    
    for (const field of requiredFields) {
      newTouched[field] = true;
      const error = validateField(field, litter[field]);
      if (error) {
        isValid = false;
        newErrors[field] = error;
      }
    }
    
    // Check optional fields that have values
    const optionalFields = ["price", "deposit"];
    for (const field of optionalFields) {
      if (litter[field]) {
        const error = validateField(field, litter[field]);
        if (error) {
          isValid = false;
          newErrors[field] = error;
          newTouched[field] = true;
        }
      }
    }
    
    // Update errors and touched state
    setErrors(newErrors);
    setTouched({ ...touched, ...newTouched });
    
    // If validation passes, submit the form
    if (isValid) {
      // Create FormData object for file uploads
      const formData = new FormData();
      
      // Add all litter data as individual form fields
      Object.keys(litter).forEach(key => {
        // Skip the preview URL as we don't need to send it to the server
        if (key === 'cover_photo_preview') return;
        
        // Add the actual file for cover_photo_file
        if (key === 'cover_photo_file' && litter[key]) {
          formData.append('cover_photo', litter[key]);
        } 
        // Handle bigint fields - don't send empty strings
        else if (['breed_id', 'sire_id', 'dam_id'].includes(key)) {
          // Only append if the value is not an empty string
          if (litter[key] !== '') {
            formData.append(key, litter[key]);
          }
        }
        // Handle other fields
        else if (litter[key] !== null) {
          // Add all other fields, converting null to empty string
          formData.append(key, litter[key]);
        }
      });
      
      // Pass the FormData to the onSave callback
      onSave(formData);
    } else {
      debugLog("Form validation failed:", newErrors);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Litter Name */}
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Litter Name"
            name="litter_name"
            value={litter.litter_name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.litter_name && Boolean(errors.litter_name)}
            helperText={touched.litter_name && errors.litter_name}
          />
        </Grid>
        
        {/* Status */}
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Status</FormLabel>
            <RadioGroup
              row
              name="status"
              value={litter.status}
              onChange={handleChange}
            >
              <FormControlLabel value="Planned" control={<Radio />} label="Planned" />
              <FormControlLabel value="Expected" control={<Radio />} label="Expected" />
              <FormControlLabel value="Born" control={<Radio />} label="Born" />
              <FormControlLabel value="Available" control={<Radio />} label="Available" />
              <FormControlLabel value="Completed" control={<Radio />} label="Completed" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        {/* Breed */}
        <Grid item xs={12} sm={6}>
          <FormControl 
            fullWidth
            error={touched.breed_id && Boolean(errors.breed_id)}
          >
            <InputLabel id="breed-select-label">Breed</InputLabel>
            <Select
              labelId="breed-select-label"
              name="breed_id"
              value={litter.breed_id}
              onChange={handleChange}
              onBlur={handleBlur}
              label="Breed"
            >
              {breedOptions.length > 0 ? (
                breedOptions.map(breed => (
                  <MenuItem key={breed.id} value={breed.id}>
                    {breed.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="">
                  <em>No breeds available</em>
                </MenuItem>
              )}
            </Select>
            <FormHelperText>
              {touched.breed_id && errors.breed_id ? 
                errors.breed_id : 
                breedOptions.length === 0 ? "Loading breeds..." : ""}
            </FormHelperText>
          </FormControl>
        </Grid>
          
        {/* Number of Puppies */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Number of Puppies"
            name="puppy_count"
            type="number"
            value={litter.puppy_count || ""}
            onChange={handleChange}
          />
        </Grid>
        
        {/* Sire (Father) */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="sire-select-label">Sire (Father)</InputLabel>
            <Select
              labelId="sire-select-label"
              name="sire_id"
              value={litter.sire_id}
              onChange={handleChange}
              label="Sire (Father)"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {sireOptions.map(sire => (
                <MenuItem key={sire.id} value={sire.id}>
                  {sire.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Dam (Mother) */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="dam-select-label">Dam (Mother)</InputLabel>
            <Select
              labelId="dam-select-label"
              name="dam_id"
              value={litter.dam_id}
              onChange={handleChange}
              label="Dam (Mother)"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {damOptions.map(dam => (
                <MenuItem key={dam.id} value={dam.id}>
                  {dam.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Price */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Price ($)"
            name="price"
            value={litter.price}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.price && Boolean(errors.price)}
            helperText={touched.price && errors.price}
          />
        </Grid>
        
        {/* Deposit */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Deposit ($)"
            name="deposit"
            value={litter.deposit}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.deposit && Boolean(errors.deposit)}
            helperText={touched.deposit && errors.deposit}
          />
        </Grid>
        
        {/* Birth Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Birth Date"
            name="whelp_date"
            type="date"
            value={litter.whelp_date || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        {/* Expected Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Expected Date"
            name="expected_date"
            type="date"
            value={litter.expected_date || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        {/* Planned Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Planned Date"
            name="planned_date"
            type="date"
            value={litter.planned_date || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        {/* Available From */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Available From"
            name="available_date"
            type="date"
            value={litter.available_date || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        {/* Extras Included */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Extras Included"
            name="extras"
            value={litter.extras || ""}
            onChange={handleChange}
            multiline
            rows={2}
            placeholder="e.g., AKC registration, microchip, starter kit"
          />
        </Grid>
        
        {/* Socialization */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Socialization"
            name="socialization"
            value={litter.socialization || ""}
            onChange={handleChange}
            multiline
            rows={2}
            placeholder="e.g., Early Neurological Stimulation, Puppy Culture, household sounds"
          />
        </Grid>
        
        {/* Cover Photo */}
        <Grid item xs={12}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="cover-photo-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="cover-photo-upload">
            <Button variant="outlined" component="span">
              Upload Cover Photo
            </Button>
          </label>
          {litter.cover_photo_preview && (
            <Box mt={2} textAlign="center">
              <img 
                src={litter.cover_photo_preview} 
                alt="Cover Preview" 
                style={{ maxWidth: '100%', maxHeight: '200px' }} 
              />
            </Box>
          )}
        </Grid>
        
        {/* Submit Button */}
        <Grid item xs={12}>
          <Button 
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Save Litter
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LitterForm;
