import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material';
import { API_URL, debugLog, debugError } from "../config";

const HeatForm = ({ onSave, initialData = null, isEdit = false }) => {
  const [dogs, setDogs] = useState({ females: [], males: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    dog_id: '',
    start_date: '',
    end_date: '',
    mating_date: '',
    sire_id: '',
    expected_whelp_date: '',
    notes: '',
    ...initialData
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const response = await fetch(`${API_URL}/dogs`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDogs({
          females: data.filter(dog => dog.gender === 'Female'),
          males: data.filter(dog => dog.gender === 'Male')
        });
      } catch (error) {
        debugError("Error fetching dogs:", error);
        setError("Failed to load dogs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDogs();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'mating_date' && !value ? { sire_id: '' } : {})
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      await onSave(formData);
    } catch (error) {
      setError(error.message || 'Failed to save heat');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel id="dog-select-label">Female Dog</InputLabel>
            <Select
              labelId="dog-select-label"
              id="dog_id"
              name="dog_id"
              value={formData.dog_id}
              onChange={handleChange}
              label="Female Dog"
            >
              {dogs.females.map(dog => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.call_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            type="date"
            label="Start Date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="End Date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Mating Details (Optional)
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Mating Date"
            name="mating_date"
            value={formData.mating_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={!formData.mating_date}>
            <InputLabel id="sire-select-label">Sire (Male)</InputLabel>
            <Select
              labelId="sire-select-label"
              id="sire_id"
              name="sire_id"
              value={formData.sire_id}
              onChange={handleChange}
              label="Sire (Male)"
            >
              {dogs.males.map(dog => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.call_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Expected Whelp Date"
            name="expected_whelp_date"
            value={formData.expected_whelp_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={submitting}
            >
              {isEdit ? 'Update Heat' : 'Add Heat'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HeatForm; 