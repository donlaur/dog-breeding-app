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
import { apiGet } from '../utils/apiUtils';

function Overview() {
  const navigate = useNavigate();
  const { 
    dogs, 
    puppies: contextPuppies, 
    litters, 
    loading, 
    error,
    refreshData
  } = useDog();
  
  // Add local state for puppies fetched directly
  const [directPuppies, setDirectPuppies] = useState([]);
  
  // Direct fetch of puppies
  useEffect(() => {
    const fetchPuppiesDirectly = async () => {
      try {
        console.log('Directly fetching puppies from API...');
        const response = await apiGet('puppies');
        if (response.ok) {
          const data = await response.json();
          console.log('Direct puppies fetch successful:', data);
          console.log('Direct puppies count:', data.length);
          setDirectPuppies(data);
        } else {
          console.error('Failed to directly fetch puppies:', response.status);
        }
      } catch (err) {
        console.error('Error directly fetching puppies:', err);
      }
    };
    
    fetchPuppiesDirectly();
  }, []);
  
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
  
  // Listen for custom puppies_loaded event
  useEffect(() => {
    const handlePuppiesLoaded = (event) => {
      console.log('Custom puppies_loaded event received in Overview:', event.detail);
      // Force a re-render
      setLocalLoading(false);
    };
    
    window.addEventListener('puppies_loaded', handlePuppiesLoaded);
    
    return () => {
      window.removeEventListener('puppies_loaded', handlePuppiesLoaded);
    };
  }, []);
  
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
  
  // Use the direct puppies data instead of the context data
  // Log puppies data for debugging
  console.log('Context puppies in Overview:', contextPuppies);
  console.log('Direct puppies in Overview:', directPuppies);
  
  // Use directPuppies count if available, otherwise fall back to context puppies
  const puppiesCount = directPuppies.length || contextPuppies.length;
  
  const activeLittersCount = litters.filter(litter => 
    litter.status && ['born', 'active', 'expected'].includes(litter.status.toLowerCase())
  ).length;
  
  // More logging
  console.log('Overview counts:', { adultDogsCount, puppiesCount, activeLittersCount, 
    directPuppiesCount: directPuppies.length, 
    contextPuppiesCount: contextPuppies.length 
  });

  // Function to navigate to dog/puppy details with error handling
  const navigateToDogDetails = (animal) => {
    if (!animal) return;
    
    try {
      // Get the ID of the animal
      const id = animal.id || 0;
      
      // Determine if this is a puppy or an adult dog
      // A puppy will have a litter_id property with a non-null value
      const isPuppy = animal.hasOwnProperty('litter_id') && animal.litter_id !== null;
      
      // Log for debugging
      console.log(`Navigating to details for ${isPuppy ? 'puppy' : 'dog'} with ID ${id}`);
      
      // Navigate to the appropriate URL based on whether it's a puppy or dog
      navigate(isPuppy ? `/dashboard/puppies/${id}` : `/dashboard/dogs/${id}`);
    } catch (err) {
      console.error("Error navigating to animal details:", err);
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
          loading={loading}
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
                puppies={directPuppies.length > 0 ? directPuppies : contextPuppies}  // Prefer direct puppies
                navigateToDogDetails={navigateToDogDetails}
                getImageUrl={getImageUrl}
                getGenderDisplay={getGenderDisplay}
              />
              {/* Debug display of raw puppies data */}
              {(directPuppies.length > 0 || contextPuppies.length > 0) ? (
                <div style={{ display: 'none' }}>
                  <p>Debug - Raw puppies data (direct):</p>
                  <pre>{JSON.stringify(directPuppies, null, 2)}</pre>
                  <p>Debug - Raw puppies data (context):</p>
                  <pre>{JSON.stringify(contextPuppies, null, 2)}</pre>
                </div>
              ) : null}
              
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