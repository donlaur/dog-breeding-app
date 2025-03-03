import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Female as FemaleIcon,
  Male as MaleIcon
} from '@mui/icons-material';
import { getLitterPuppies } from '../../utils/apiUtils';
import { formatDate } from '../../utils/dateUtils';
import { showSuccess, showError } from '../../utils/notifications';
import { API_URL, debugLog, debugError } from '../../config';

function ManagePuppies() {
  const { litterId } = useParams();
  const navigate = useNavigate();
  const [puppies, setPuppies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPuppies = async () => {
      setLoading(true);
      try {
        const response = await getLitterPuppies(litterId);
        if (response.ok) {
          setPuppies(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch puppies');
        }
      } catch (err) {
        console.error('Error fetching puppies:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPuppies();
  }, [litterId]);

  const handleDeletePuppy = async (puppyId, puppyName) => {
    try {
      const response = await fetch(`${API_URL}/litters/puppies/${puppyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      showSuccess(`Successfully deleted puppy "${puppyName}"`);
      refreshPuppies(); // Refresh the puppies list
      
    } catch (error) {
      console.error("Error deleting puppy:", error);
      showError(`Failed to delete puppy: ${error.message}`);
    }
  };

  const refreshPuppies = async () => {
    setLoading(true);
    try {
      const response = await getLitterPuppies(litterId);
      if (response.ok) {
        setPuppies(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch puppies');
      }
    } catch (err) {
      console.error('Error refreshing puppies:', err);
      setError('Failed to refresh puppies data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
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
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button
            component={Link}
            to={`/dashboard/litters/${litterId}`}
            startIcon={<ArrowBackIcon />}
          >
            Back to Litter
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/dashboard/litters/${litterId}/puppies/add`)}
          >
            Add Puppy
          </Button>
        </Box>

        {puppies.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>No Puppies Added Yet</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Start adding puppies to track their information and status.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/dashboard/litters/${litterId}/puppies/add`)}
            >
              Add First Puppy
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {puppies.map((puppy) => (
              <Grid item xs={12} sm={6} md={4} key={puppy.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {puppy.cover_photo ? (
                        <Avatar
                          src={puppy.cover_photo}
                          alt={puppy.name}
                          sx={{ width: 60, height: 60, mr: 2 }}
                        />
                      ) : (
                        <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
                          {puppy.gender === 'Female' ? <FemaleIcon /> : <MaleIcon />}
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="h6">{puppy.name}</Typography>
                        <Chip
                          size="small"
                          label={puppy.gender}
                          color={puppy.gender === 'Female' ? 'error' : 'primary'}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Born: {formatDate(puppy.birth_date)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Color: {puppy.color}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/dashboard/litters/${litterId}/puppies/${puppy.id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this puppy?')) {
                            handleDeletePuppy(puppy.id, puppy.name);
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default ManagePuppies; 