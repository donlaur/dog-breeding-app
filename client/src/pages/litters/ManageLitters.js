// src/pages/litters/ManageLitters.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Container,
  Paper,
  Divider,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Pets as PetsIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';
import { useDog } from '../../context/DogContext';

const ManageLitters = () => {
  const { litters, loading, error, refreshLitters } = useDog();

  useEffect(() => {
    // Only refresh if we don't have any litters and aren't currently loading
    if (!loading && (!litters || litters.length === 0)) {
      refreshLitters();
    }
  }, []); // Empty dependency array - only run on mount

  const handleRefresh = () => {
    refreshLitters(true);  // Force refresh when user clicks refresh button
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (!litters || litters.length === 0) {
    return (
      <Container maxWidth="sm">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mt: 4, 
            textAlign: 'center',
            backgroundColor: 'transparent'
          }}
        >
          <PetsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Litters Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Track your breeding program by adding litters. Each litter entry allows you to record 
            important details such as whelp date, dam, sire, number of puppies, and more.
          </Typography>
          <Button
            component={Link}
            to="/dashboard/litters/add"
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
          >
            Add First Litter
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Manage Litters
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleRefresh}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
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
        </Box>

        <Grid container spacing={3}>
          {litters.map(litter => (
            <Grid item xs={12} md={6} key={litter.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {litter.litter_name || `Litter #${litter.id}`}
                    </Typography>
                    <Chip 
                      label={litter.status || 'Born'} 
                      color={litter.status === 'Born' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FemaleIcon sx={{ mr: 1, color: 'error.light' }} />
                        <Typography variant="subtitle2">Dam</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {litter.dam_photo ? (
                          <Avatar 
                            src={litter.dam_photo} 
                            alt={litter.dam_name}
                            sx={{ width: 40, height: 40, mr: 1 }}
                          />
                        ) : (
                          <Avatar sx={{ width: 40, height: 40, mr: 1, bgcolor: 'error.light' }}>
                            <FemaleIcon />
                          </Avatar>
                        )}
                        <Typography variant="body2">
                          {litter.dam_name || 'Unknown Dam'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MaleIcon sx={{ mr: 1, color: 'primary.light' }} />
                        <Typography variant="subtitle2">Sire</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {litter.sire_photo ? (
                          <Avatar 
                            src={litter.sire_photo} 
                            alt={litter.sire_name}
                            sx={{ width: 40, height: 40, mr: 1 }}
                          />
                        ) : (
                          <Avatar sx={{ width: 40, height: 40, mr: 1, bgcolor: 'primary.light' }}>
                            <MaleIcon />
                          </Avatar>
                        )}
                        <Typography variant="body2">
                          {litter.sire_name || 'Unknown Sire'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Whelp Date:
                      </Typography>
                      <Typography variant="body1">
                        {litter.whelp_date ? formatDate(litter.whelp_date) : 'Not Set'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Number of Puppies:
                      </Typography>
                      <Typography variant="body1">
                        {litter.num_puppies || 'Not Set'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        bgcolor: 'background.default',
                        p: 1.5,
                        borderRadius: 1,
                        mt: 1
                      }}>
                        <Box>
                          <Typography variant="subtitle2">
                            Puppies Added:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {litter.puppy_count || 0} of {litter.num_puppies || '?'}
                          </Typography>
                        </Box>
                        {litter.status === 'Born' && litter.num_puppies && litter.puppy_count < litter.num_puppies && (
                          <Chip
                            icon={<WarningIcon />}
                            label={`${litter.num_puppies - (litter.puppy_count || 0)} Missing`}
                            color="warning"
                            size="small"
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      component={Link}
                      to={`/dashboard/litters/${litter.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      component={Link}
                      to={`/dashboard/litters/${litter.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default ManageLitters;
