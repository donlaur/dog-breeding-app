import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
import { API_URL, debugLog, debugError } from "../../config";
import { apiGet } from "../../utils/apiUtils";

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
        const response = await apiGet('dogs');
        if (response.success) {
          const data = response.data;
          setDogs({
            females: data.filter(dog => dog.gender === 'Female'),
            males: data.filter(dog => dog.gender === 'Male')
          });
        } else {
          throw new Error(response.error || 'Failed to load dogs');
        }
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
      // Remove any non-schema fields before sending to server
      const dataToSend = {...formData};
      
      // If any fields are empty strings, convert to null for the backend
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '') {
          dataToSend[key] = null;
        }
      });
      
      await onSave(dataToSend);
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
              id="dog-select"
              name="dog_id"
              value={formData.dog_id}
              onChange={handleChange}
              label="Female Dog"
            >
              {dogs.females.map((dog) => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.call_name} ({dog.registered_name || "No registered name"})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            id="start-date"
            name="start_date"
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="end-date"
            name="end_date"
            label="End Date"
            type="date"
            value={formData.end_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            helperText="Leave blank if heat is ongoing"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" mt={2} mb={1}>
            Mating Information (Optional)
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="mating-date"
            name="mating_date"
            label="Mating Date"
            type="date"
            value={formData.mating_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={!formData.mating_date}>
            <InputLabel id="sire-select-label">Sire</InputLabel>
            <Select
              labelId="sire-select-label"
              id="sire-select"
              name="sire_id"
              value={formData.sire_id || ''}
              onChange={handleChange}
              label="Sire"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {dogs.males.map((dog) => (
                <MenuItem key={dog.id} value={dog.id}>
                  {dog.call_name} ({dog.registered_name || "No registered name"})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="expected-whelp-date"
            name="expected_whelp_date"
            label="Expected Whelp Date"
            type="date"
            value={formData.expected_whelp_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            disabled={!formData.mating_date}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            id="notes"
            name="notes"
            label="Notes"
            multiline
            rows={4}
            value={formData.notes || ''}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            type="submit"
            disabled={submitting || !formData.dog_id || !formData.start_date}
          >
            {submitting ? <CircularProgress size={24} /> : isEdit ? 'Update Heat' : 'Create Heat'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

// Add PropTypes validation
HeatForm.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    dog_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    mating_date: PropTypes.string,
    sire_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    expected_whelp_date: PropTypes.string,
    notes: PropTypes.string
  }),
  isEdit: PropTypes.bool
};

export default HeatForm;