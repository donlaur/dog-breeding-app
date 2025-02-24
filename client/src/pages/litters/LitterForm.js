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
  // Local state for all the fields
  const [litter, setLitter] = useState({
    litter_name: "",
    status: "Planned",
    birth_date: "",
    expected_date: "",
    planned_date: "",
    breed_id: breedOptions.length > 0 ? breedOptions[0].id : "",
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
    if (initialData) {
      const data = { ...initialData };
      if (!data.breed_id && breedOptions.length > 0) {
        data.breed_id = breedOptions[0].id;
      }
      setLitter(data);
    } else if (breedOptions.length > 0 && !litter.breed_id) {
      setLitter(prev => ({ ...prev, breed_id: breedOptions[0].id }));
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
      setLitter(prev => ({
        ...prev,
        cover_photo_file: file,
        cover_photo_preview: URL.createObjectURL(file)
      }));
    }
  };

  // Submit the form
  const handleSubmit = (e) => {
    e.preventDefault();
    debugLog("Submitting litter form:", litter);
    onSave(litter);

    // If adding a new litter, you might reset the form. If editing, you might not.
    if (!initialData) {
      setLitter({
        litter_name: "",
        status: "Planned",
        birth_date: "",
        expected_date: "",
        planned_date: "",
        breed_id: breedOptions.length > 0 ? breedOptions[0].id : "",
        sire_id: "",
        dam_id: "",
        price: "",
        deposit: "",
        extras: "",
        socialization: "",
        cover_photo_file: null,
        cover_photo_preview: null
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
          <TextField
            fullWidth
            required
            name="litter_name"
            label="Litter Name"
            value={litter.litter_name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Status</FormLabel>
            <RadioGroup
              row
              name="status"
              value={litter.status}
              onChange={handleChange}
            >
              <FormControlLabel value="Born" control={<Radio />} label="Born" />
              <FormControlLabel value="Expected" control={<Radio />} label="Expected" />
              <FormControlLabel value="Planned" control={<Radio />} label="Planned" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* Dates */}
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            name="birth_date"
            label="Birth Date"
            value={litter.birth_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            name="expected_date"
            label="Expected Date"
            value={litter.expected_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            name="planned_date"
            label="Planned Date"
            value={litter.planned_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Parents and Breed */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Parents & Breed</Typography>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Breed</InputLabel>
            <Select
              name="breed_id"
              value={litter.breed_id}
              onChange={handleChange}
              label="Breed"
            >
              <MenuItem value="">-- Select Breed --</MenuItem>
              {breedOptions.map((breed) => (
                <MenuItem key={breed.id} value={breed.id}>
                  {breed.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Sire (Male)</InputLabel>
            <Select
              name="sire_id"
              value={litter.sire_id}
              onChange={handleChange}
              label="Sire (Male)"
            >
              <MenuItem value="">-- Select Sire --</MenuItem>
              {sireOptions.map((dog) => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.registered_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Dam (Female)</InputLabel>
            <Select
              name="dam_id"
              value={litter.dam_id}
              onChange={handleChange}
              label="Dam (Female)"
            >
              <MenuItem value="">-- Select Dam --</MenuItem>
              {damOptions.map((dog) => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.registered_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Financial Information */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Financial Information</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            name="price"
            label="Price"
            value={litter.price}
            onChange={handleChange}
            InputProps={{
              startAdornment: <Typography>$</Typography>
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            name="deposit"
            label="Deposit"
            value={litter.deposit}
            onChange={handleChange}
            InputProps={{
              startAdornment: <Typography>$</Typography>
            }}
          />
        </Grid>

        {/* Additional Information */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Additional Information</Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            name="extras"
            label="Extras Included"
            value={litter.extras}
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
            value={litter.socialization}
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
