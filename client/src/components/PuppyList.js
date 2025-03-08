import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Chip
} from '@mui/material';
import {
  Female as FemaleIcon,
  Male as MaleIcon
} from '@mui/icons-material';

const PuppyList = ({ puppies }) => {
  return (
    <Grid container spacing={2}>
      {puppies.map((puppy) => (
        <Grid item xs={12} sm={6} md={4} key={puppy.id}>
          <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: 3
            }
          }}>
            <CardContent>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <Typography variant="h6" component="h3">
                  {puppy.name || `Puppy ${puppy.identifier}`}
                </Typography>
                {puppy.gender === 'Female' ? (
                  <FemaleIcon sx={{ color: 'pink' }} />
                ) : (
                  <MaleIcon sx={{ color: 'blue' }} />
                )}
                <Chip 
                  label={puppy.status || 'Available'}
                  size="small"
                  color={puppy.status === 'Reserved' ? 'secondary' : 'primary'}
                  sx={{ ml: 'auto' }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                  <Typography color="text.secondary" variant="body2">
                    Color:
                  </Typography>
                  <Typography variant="body2">
                    {puppy.color}
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                  <Typography color="text.secondary" variant="body2">
                    Weight:
                  </Typography>
                  <Typography variant="body2">
                    {puppy.weight} lbs
                  </Typography>
                </Box>
                {puppy.collar_color && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography color="text.secondary" variant="body2">
                      Collar:
                    </Typography>
                    <Typography variant="body2">
                      {puppy.collar_color}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Additional puppy details can go here */}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default PuppyList; 