import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Typography, Paper, Box, CircularProgress, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PuppyForm from './PuppyForm';
import { apiGet, apiPost, addPuppyToLitter } from '../../utils/apiUtils';
import { API_URL, debugLog, debugError } from '../../config';

function AddPuppyPage() {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const [litter, setLitter] = useState(null);
  const [existingPuppies, setExistingPuppies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      if (!litterId) {
        setError('Missing litter ID');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch litter data
        console.log('Fetching litter data for puppy form, litter ID:', litterId);
        const litterResponse = await apiGet(`litters/${litterId}`);
        
        if (!litterResponse.ok) {
          throw new Error(litterResponse.error || 'Failed to fetch litter details');
        }
        
        setLitter(litterResponse.data);
        
        // Fetch existing puppies
        console.log('Fetching existing puppies for litter ID:', litterId);
        const puppiesResponse = await apiGet(`litters/${litterId}/puppies`);
        
        if (!puppiesResponse.ok) {
          console.warn('Could not fetch puppies:', puppiesResponse.error);
          setExistingPuppies([]);
        } else {
          console.log('Puppies data:', puppiesResponse.data);
          setExistingPuppies(puppiesResponse.data || []);
        }
      } catch (err) {
        console.error('Error fetching data for puppy form:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [litterId]);

  const handleSave = async (puppyData) => {
    try {
      console.log('Saving new puppy:', puppyData);
      
      if (!litterId) {
        throw new Error('Missing litter ID');
      }
      
      // Add the litter ID to the puppy data and ensure field names match DB schema
      const dataWithLitterId = {
        ...puppyData,
        litter_id: parseInt(litterId)
      };
      
      // Convert weight to weight_at_birth if needed
      if (dataWithLitterId.weight && !dataWithLitterId.weight_at_birth) {
        dataWithLitterId.weight_at_birth = dataWithLitterId.weight;
        delete dataWithLitterId.weight;
      }
      
      // Use the dedicated function to add puppy to litter
      const response = await addPuppyToLitter(litterId, dataWithLitterId);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to save puppy');
      }
      
      console.log('Puppy saved successfully:', response.data);
      
      // Navigate back to litter details
      navigate(`/dashboard/litters/${litterId}`);
    } catch (err) {
      console.error('Error saving puppy:', err);
      setError(`Failed to save puppy: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            component={Link}
            to={`/dashboard/litters/${litterId}`}
            variant="contained"
          >
            Back to Litter
          </Button>
        </Box>
      </Container>
    );
  }

  // Even if we couldn't load litter data, we should still show something
  if (!litter) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">Could not load litter information. You can still add a puppy, but some data may be missing.</Alert>
        <PuppyForm onSave={handleSave} litter={{}} existingPuppies={[]} />
      </Container>
    );
  }

  const existingCount = Array.isArray(existingPuppies) ? existingPuppies.length : 0;
  const totalCount = litter.num_puppies || 0;
  const remainingCount = Math.max(0, totalCount - existingCount);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button
        component={Link}
        to={`/dashboard/litters/${litterId}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        BACK TO LITTER
      </Button>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Add Puppy to Litter
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom>
          Litter: {litter.litter_name || `Litter #${litterId}`}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1">
            Adding puppy {existingCount + 1} of {totalCount} 
            ({remainingCount - 1} remaining after this one)
          </Typography>
        </Box>

        <PuppyForm 
          onSave={handleSave}
          initialData={{
            birth_date: litter.whelp_date ? new Date(litter.whelp_date).toISOString().split('T')[0] : null
          }}
          litter={litter} 
          existingPuppies={existingPuppies || []} 
        />
      </Paper>
    </Container>
  );
}

export default AddPuppyPage; 