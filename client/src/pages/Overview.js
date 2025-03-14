import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Material UI imports
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';

// Custom components
import DashboardLayout from '../components/layout/DashboardLayout';
import UpcomingEvents from '../components/UpcomingEvents';

// Import utility functions
import { getImageUrl, getGenderDisplay } from '../utils/imageUtils';
import { formatAdultAge } from '../utils/ageUtils';
import { apiGet } from '../utils/apiUtils';
import { debugLog, debugError } from '../config';

function Overview() {
  const navigate = useNavigate();
  
  // State for direct puppies fetch (for demonstration)
  const [directPuppies, setDirectPuppies] = useState([]);
  const [puppiesLoading, setPuppiesLoading] = useState(false);
  const [puppiesError, setPuppiesError] = useState(null);
  
  // State for stats
  const [stats, setStats] = useState({
    totalDogs: 0,
    totalLitters: 0,
    totalPuppies: 0
  });
  
  // Fetch puppies directly from the API
  useEffect(() => {
    const fetchPuppiesDirectly = async () => {
      try {
        setPuppiesLoading(true);
        debugLog('Fetching puppies using API utility...');
        
        const data = await apiGet('/puppies');
        debugLog('Puppies fetch successful:', data);
        debugLog('Puppies count:', data.length);
        setDirectPuppies(data);
      } catch (err) {
        debugError('Error fetching puppies:', err);
        setPuppiesError(err.message || 'Failed to fetch puppies');
      } finally {
        setPuppiesLoading(false);
      }
    };
    
    fetchPuppiesDirectly();
  }, []);
  
  // Fetch overall stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiGet('/stats');
        setStats(data);
      } catch (err) {
        debugError('Error fetching stats:', err);
        // Silently fail for stats
      }
    };
    
    fetchStats();
  }, []);
  
  // Navigate to dog details
  const handleDogClick = (dogId) => {
    navigate(`/dashboard/dogs/${dogId}`);
  };
  
  // Navigate to puppy details
  const handlePuppyClick = (puppyId) => {
    navigate(`/dashboard/puppies/${puppyId}`);
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom component="div">
          Breeding Program Overview
        </Typography>
        
        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 140,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Total Dogs
              </Typography>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {stats.totalDogs}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 140,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Total Litters
              </Typography>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {stats.totalLitters}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 140,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Total Puppies
              </Typography>
              <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                {stats.totalPuppies}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Available Puppies Section */}
        <Typography variant="h5" gutterBottom component="div" sx={{ mt: 4 }}>
          Available Puppies
        </Typography>
        
        {puppiesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : puppiesError ? (
          <Alert severity="error">{puppiesError}</Alert>
        ) : directPuppies.length === 0 ? (
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="body1">
              No puppies currently available.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {directPuppies.map((puppy) => (
              <Grid item xs={12} sm={6} md={4} key={puppy.id}>
                <Card sx={{ maxWidth: 345 }}>
                  <CardActionArea onClick={() => handlePuppyClick(puppy.id)}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={getImageUrl(puppy.image_url, 'puppy')}
                      alt={puppy.name}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h5" component="div">
                        {puppy.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {puppy.breed_name}, {puppy.age_weeks} weeks old
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getGenderDisplay(puppy.gender)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard/puppies/manage')}
          >
            View All Puppies
          </Button>
        </Box>
        
        <Divider sx={{ my: 4 }} />
        
        {/* Upcoming Events Section */}
        <Typography variant="h5" gutterBottom component="div">
          Upcoming Events
        </Typography>
        <Paper sx={{ p: 2, mt: 2 }}>
          <UpcomingEvents />
        </Paper>
      </Box>
    </DashboardLayout>
  );
}

export default Overview;
