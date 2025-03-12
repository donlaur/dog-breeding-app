import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/apiUtils';
import { 
  Typography, 
  Box, 
  CircularProgress, 
  Button, 
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import EditIcon from '@mui/icons-material/Edit';

const DogDetailsSimple = () => {
  const navigate = useNavigate();
  const { id: dogId } = useParams();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('DogDetailsSimple component mounted, dogId:', dogId);
    fetchDogDetails();
    
    return () => {
      console.log('DogDetailsSimple component unmounting');
    };
  }, [dogId]);

  const fetchDogDetails = async () => {
    if (!dogId) return;
    
    setLoading(true);
    setError(null);
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        console.log(`Attempting to fetch dog details for ID: ${dogId} (Attempt ${retries + 1}/${maxRetries})`);
        
        const result = await apiGet(`dogs/${dogId}`);
        console.log('API response:', result);
        
        if (!result.ok) {
          throw new Error(result.error || 'Failed to fetch dog details');
        }
        
        setDog(result.data);
        console.log('Successfully fetched dog details:', result.data);
        
        // If successful, exit the retry loop
        break;
      } catch (error) {
        console.error(`Error fetching dog details (Attempt ${retries + 1}/${maxRetries}):`, error);
        retries++;
        
        if (retries >= maxRetries) {
          console.error('Max retries reached. Could not fetch dog details.');
          setError(`Could not load dog details: ${error.message}`);
        } else {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retries), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    setLoading(false);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    fetchDogDetails();
  };

  const handleEdit = () => {
    navigate(`/dashboard/dogs/edit/${dogId}`);
  };

  // If there's an error, show an error message with a retry button
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Dog Details
        </Typography>
        <Typography variant="body1" paragraph>
          {error}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRetry}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleGoBack}
            startIcon={<ArrowBackIcon />}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dog) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          Dog not found. The dog may have been deleted or you may not have permission to view it.
        </Alert>
        <Button 
          sx={{ mt: 2 }} 
          variant="outlined" 
          onClick={handleGoBack}
          startIcon={<ArrowBackIcon />}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {dog.call_name}
            {dog.gender === 'Male' ? (
              <MaleIcon sx={{ ml: 1, color: 'primary.main' }} />
            ) : (
              <FemaleIcon sx={{ ml: 1, color: 'error.main' }} />
            )}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Basic Information</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Registered Name
                </Typography>
                <Typography variant="body1">
                  {dog.registered_name || 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1">
                  {dog.gender || 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Color
                </Typography>
                <Typography variant="body1">
                  {dog.color || 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Weight
                </Typography>
                <Typography variant="body1">
                  {dog.weight ? `${dog.weight} lbs` : 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Birth Date
                </Typography>
                <Typography variant="body1">
                  {dog.birth_date ? new Date(dog.birth_date).toLocaleDateString() : 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  {dog.status || 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Additional Information</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {dog.description || 'No description available'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1">
                  {dog.notes || 'No notes available'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DogDetailsSimple;
