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

  // Generic change handler for text/select inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLitter(prev => ({ ...prev, [name]: value }));
  };

  // For file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create object URL for preview
      const previewUrl = URL.createObjectURL(file);
      
      setLitter(prev => ({
        ...prev,
        cover_photo_file: file,
        cover_photo_preview: previewUrl
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    debugLog("Submitting litter form:", litter);
    
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
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Litter Name */}
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="litter_name"
            label="Litter Name"
            value={litter.litter_name}
            onChange={handleChange}
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
          <FormControl fullWidth>
            <InputLabel id="breed-select-label">Breed</InputLabel>
            <Select
              labelId="breed-select-label"
              name="breed_id"
              value={litter.breed_id}
              onChange={handleChange}
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
              {breedOptions.length === 0 && "Loading breeds..."}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Puppies Count */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            name="num_puppies"
            label="Number of Puppies"
            value={litter.num_puppies || ''}
            onChange={handleChange}
          />
        </Grid>

        {/* Sire */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="sire-select-label">Sire (Father)</InputLabel>
            <Select
              labelId="sire-select-label"
              name="sire_id"
              value={litter.sire_id || ''}
              onChange={handleChange}
              label="Sire (Father)"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {sireOptions.map(dog => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.call_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Dam */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="dam-select-label">Dam (Mother)</InputLabel>
            <Select
              labelId="dam-select-label"
              name="dam_id"
              value={litter.dam_id || ''}
              onChange={handleChange}
              label="Dam (Mother)"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {damOptions.map(dog => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.call_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Price */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            name="price"
            label="Price ($)"
            value={litter.price || ''}
            onChange={handleChange}
          />
        </Grid>

        {/* Deposit */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            name="deposit"
            label="Deposit ($)"
            value={litter.deposit || ''}
            onChange={handleChange}
          />
        </Grid>

        {/* Birth Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            name="whelp_date"
            label="Birth Date"
            value={litter.whelp_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Expected Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            name="expected_date"
            label="Expected Date"
            value={litter.expected_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Planned Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            name="planned_date"
            label="Planned Date"
            value={litter.planned_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Availability Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            name="availability_date"
            label="Available From"
            value={litter.availability_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Extras */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            name="extras"
            label="Extras Included"
            value={litter.extras || ''}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            name="socialization"
            label="Socialization & Enrichment"
            value={litter.socialization || ''}
            onChange={handleChange}
          />
        </Grid>

        {/* Cover Photo */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Cover Photo</Typography>
          
          {litter.cover_photo_preview && (
            <Box sx={{ mb: 2 }}>
              <img
                src={litter.cover_photo_preview}
                alt="Litter Cover Preview"
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: "cover" }}
              />
            </Box>
          )}
          
          <Button
            variant="outlined"
            component="label"
            sx={{ mb: 2 }}
          >
            Upload Photo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 2 }}
          >
            {initialData ? "Save Changes" : "Add Litter"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LitterForm;
