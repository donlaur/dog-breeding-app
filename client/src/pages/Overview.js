import React, { useEffect, useRef, useState } from 'react';
import { useDog } from '../context/DogContext';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  LinearProgress,
  Button,
  Container,
  Paper
} from '@mui/material';

// Import the new modular components from overview folder
import StatCards from '../components/overview/StatCards';
import AdultDogsList from '../components/overview/AdultDogsList';
import PuppiesList from '../components/overview/PuppiesList';
import LittersList from '../components/overview/LittersList';
import UpcomingEvents from '../components/overview/UpcomingEvents';

// Import utility functions
import { getImageUrl, getGenderDisplay } from '../utils/imageUtils';
import { formatAdultAge } from '../utils/ageUtils';

function Overview() {
  const navigate = useNavigate();
  const { 
    dogs, 
    litters, 
    loading, 
    error,
    refreshData
  } = useDog();
  
  // Use a timer to prevent getting stuck in loading state
  const [localLoading, setLocalLoading] = useState(true);
  const isInitialMount = useRef(true);
  const refreshAttempted = useRef(false);
  const loadingTimeout = useRef(null);
  
  // Use effect for initial data load with a maximum loading time
  useEffect(() => {
    if (isInitialMount.current) {
      console.log("Overview - Initial mount");
      isInitialMount.current = false;
      
      // Set a maximum loading time of 3 seconds to prevent getting stuck
      loadingTimeout.current = setTimeout(() => {
        setLocalLoading(false);
        console.log("Forced loading to complete after timeout");
      }, 3000);
    }
    
    // If loading completes normally, clear the timeout and set localLoading to false
    if (!loading) {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
        loadingTimeout.current = null;
      }
      
      // Give a small delay to ensure UI is stable
      setTimeout(() => {
        setLocalLoading(false);
      }, 200);
    }
    
    // Clean up the timeout on unmount
    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [loading]);
  
  // Force data refresh only once if needed
  useEffect(() => {
    // Only try to refresh data once if dogs is still empty after loading completes
    if (!loading && !localLoading && !refreshAttempted.current && (!dogs || dogs.length === 0)) {
      refreshAttempted.current = true;
      console.log("No dogs found after loading completed, refreshing data once");
      refreshData(true);
    }
  }, [loading, localLoading, dogs, refreshData]);
  
  // Calculate counts
  const adultDogsCount = dogs.filter(dog => dog.is_adult === true).length;
  const puppiesCount = dogs.filter(dog => !dog.is_adult).length;
  const activeLittersCount = litters.filter(litter => 
    litter.status && ['born', 'active', 'expected'].includes(litter.status.toLowerCase())
  ).length;

  // Function to navigate to dog details with error handling
  const navigateToDogDetails = (dog) => {
    if (!dog) return;
    
    try {
      // Create a URL-friendly version of the dog's name
      const namePart = dog.call_name || dog.name || '';
      const slugName = namePart.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-'); // Replace spaces with hyphens
        
      // Add a 3-digit offset (100) to make IDs appear bigger but not too big
      const displayId = (dog.id || 0) + 100;
      
      // Combine for a SEO-friendly URL
      navigate(`/dashboard/dogs/${displayId}/${slugName}`);
    } catch (err) {
      console.error("Error navigating to dog details:", err);
    }
  };

  // Only show loading state for a short period
  if (loading && localLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'error.main' }}>
        <Typography>Error loading data: {error}</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={() => refreshData(true)}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Show the dashboard content even if data isn't available
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Program Overview
        </Typography>

        <StatCards 
          adultDogsCount={adultDogsCount}
          puppiesCount={puppiesCount}
          littersCount={activeLittersCount}
        />

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <AdultDogsList 
                dogs={dogs}
                navigateToDogDetails={navigateToDogDetails}
                getImageUrl={getImageUrl}
                getGenderDisplay={getGenderDisplay}
                formatAdultAge={formatAdultAge}
              />
              
              <PuppiesList 
                puppies={dogs}  // Pass all dogs, the component will filter
                navigateToDogDetails={navigateToDogDetails}
                getImageUrl={getImageUrl}
                getGenderDisplay={getGenderDisplay}
              />
              
              <LittersList 
                litters={litters}
                getImageUrl={getImageUrl}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <UpcomingEvents />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Overview; 