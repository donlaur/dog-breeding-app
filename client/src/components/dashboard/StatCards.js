import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar } from '@mui/material';
import {
  Pets as PetsIcon,
  Visibility as LittersIcon, 
  Favorite as HeatsIcon, 
  Email as MessagesIcon,
} from '@mui/icons-material';

/**
 * StatCards - Dashboard statistics cards component
 * 
 * @param {Object} props
 * @param {number} props.adultDogsCount - Number of adult dogs
 * @param {number} props.puppiesCount - Number of puppies
 * @param {number} props.littersCount - Number of litters
 */
const StatCards = ({ adultDogsCount = 0, puppiesCount = 0, littersCount = 0 }) => {
  // Count for upcoming heats and messages (placeholder for now)
  const upcomingHeats = 0;
  const newMessages = 0;

  // Stats cards data based on the fetched data
  const statCards = [
    { 
      title: 'Adult Dogs', 
      value: adultDogsCount, 
      icon: <PetsIcon />, 
      color: '#1565c0',
      bgColor: '#e3f2fd',
      path: '/dashboard/dogs'
    },
    { 
      title: 'Puppies', 
      value: puppiesCount, 
      icon: <PetsIcon fontSize="small" />, 
      color: '#e65100',
      bgColor: '#fff3e0',
      path: '/dashboard/puppies'
    },
    { 
      title: 'Active Litters', 
      value: littersCount, 
      icon: <LittersIcon />, 
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      path: '/dashboard/litters'
    },
    { 
      title: 'Upcoming Heats', 
      value: upcomingHeats, 
      icon: <HeatsIcon />, 
      color: '#c62828',
      bgColor: '#ffebee',
      path: '/dashboard/heats'
    },
    { 
      title: 'New Messages', 
      value: newMessages, 
      icon: <MessagesIcon />, 
      color: '#6a1b9a',
      bgColor: '#f3e5f5',
      path: '/dashboard/messages'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <Card elevation={1}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {card.title}
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: card.bgColor,
                    color: card.color,
                    width: 32,
                    height: 32
                  }}
                >
                  {card.icon}
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ mb: 0 }}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCards; 