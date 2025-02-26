// src/pages/litters/ManageLitters.js
import React, { useEffect, useState } from 'react';
import { useDog } from '../../context/DogContext';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Paper, 
  Divider,
  Container 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Pets as PetsIcon, 
  Visibility as LittersIcon 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

function ManageLitters() {
  const { litters, loading, error, refreshLitters } = useDog();
  const [hasInitialized, setHasInitialized] = useState(false);

  // This effect will only run once when the component mounts
  useEffect(() => {
    if (!hasInitialized) {
      refreshLitters();
      setHasInitialized(true);
    }
  }, [hasInitialized, refreshLitters]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Litters
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/dashboard/litters/add"
          >
            Add Litter
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography>Loading litters...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'error.main' }}>
            <Typography variant="h6">Error loading litters</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{error}</Typography>
            <Button onClick={refreshLitters} variant="outlined" sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : (!litters || litters.length === 0) ? (
          // Improved empty state
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            backgroundColor: '#f8f9fa',
            maxWidth: 800,
            mx: 'auto',
            mt: 4
          }}>
            <Box sx={{ mb: 3 }}>
              <LittersIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
              <Typography variant="h5" gutterBottom>No Litters Yet</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Track your breeding program by adding litters. Each litter entry allows you to record 
                important details such as whelp date, dam, sire, number of puppies, and more.
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Getting Started
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                To add your first litter, click the "Add Litter" button above. You'll need to have dam and 
                sire records created in your Dogs section first.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                component={Link}
                to="/dashboard/litters/add"
                sx={{ mt: 1 }}
              >
                Add Your First Litter
              </Button>
            </Box>
          </Paper>
        ) : (
          // Existing litters display
          <Grid container spacing={3}>
            {litters.map(litter => (
              <Grid item xs={12} key={litter.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{litter.name || `Litter #${litter.id}`}</Typography>
                    {/* Other litter details */}
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

export default ManageLitters;
