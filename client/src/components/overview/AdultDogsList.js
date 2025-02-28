import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Avatar, 
  Divider, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { 
  Pets as PetsIcon, 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  ChevronRight as ChevronRightIcon 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

/**
 * AdultDogsList - Component for displaying adult dogs in the dashboard
 * 
 * @param {Object} props
 * @param {Array} props.dogs - Adult dogs to display
 * @param {Function} props.navigateToDogDetails - Function to navigate to dog details
 * @param {Function} props.getImageUrl - Function to get the image URL
 * @param {Function} props.getGenderDisplay - Function to get gender icon and color
 * @param {Function} props.formatAdultAge - Function to format adult dog age
 */
const AdultDogsList = ({ 
  dogs = [], 
  navigateToDogDetails, 
  getImageUrl, 
  getGenderDisplay, 
  formatAdultAge 
}) => {
  // Create a safe sorting function for dogs
  const getSortedDogs = () => {
    try {
      if (!dogs || dogs.length === 0) return [];
      
      return [...dogs].sort((a, b) => {
        const nameA = ((a && a.call_name) || '').toLowerCase();
        const nameB = ((b && b.call_name) || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } catch (err) {
      console.error("Error sorting dogs:", err);
      return dogs;
    }
  };
  
  const sortedDogs = getSortedDogs();

  return (
    <Card elevation={1}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PetsIcon color="primary" />
            <Typography variant="h6">Adult Dogs</Typography>
          </Box>
          <Box>
            <Button 
              component={Link} 
              to="/dashboard/dogs/add" 
              variant="contained" 
              size="small"
              startIcon={<AddIcon />}
              sx={{ mr: 1 }}
            >
              Add Dog
            </Button>
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        {dogs && dogs.length > 0 ? (
          <Box>
            {sortedDogs.map((dog, index) => (
              <React.Fragment key={dog?.id || index}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    py: 1.5, 
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                    },
                    position: 'relative',
                    pr: 2 // Add padding for the chevron
                  }}
                  onClick={() => navigateToDogDetails && navigateToDogDetails(dog)}
                >
                  <Avatar 
                    src={getImageUrl && getImageUrl(dog?.cover_photo || dog?.profile_photo)}
                    alt={dog?.name || 'Dog'}
                    sx={{ width: 48, height: 48 }}
                  >
                    {!dog?.cover_photo && !dog?.profile_photo && <PetsIcon />}
                  </Avatar>
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'medium',
                          fontSize: '1.1rem',
                          mr: 1
                        }}
                      >
                        {dog?.call_name || dog?.name || 'Unnamed Dog'}
                      </Typography>
                      {getGenderDisplay && (
                        <Typography 
                          sx={{ 
                            fontWeight: 'bold',
                            color: getGenderDisplay(dog?.gender).color,
                            display: 'flex',
                            alignItems: 'center' 
                          }}
                        >
                          {getGenderDisplay(dog?.gender).icon}
                        </Typography>
                      )}
                      {dog?.birth_date && formatAdultAge && (
                        <Tooltip title={`Born: ${formatDate(dog.birth_date)}`}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              ml: 1, 
                              color: 'text.secondary',
                              backgroundColor: 'rgba(0,0,0,0.04)',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                            }}
                          >
                            {formatAdultAge(dog.birth_date)}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {dog?.registered_name || 'Pembroke Welsh Corgi'}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    bgcolor: dog?.status === 'Active' ? '#e8f5e9' : '#f5f5f5',
                    color: dog?.status === 'Active' ? '#2e7d32' : '#757575',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'medium',
                    mr: 2
                  }}>
                    {dog?.status || 'Active'}
                  </Box>
                  <ChevronRightIcon 
                    fontSize="small" 
                    sx={{ 
                      color: 'text.secondary',
                      position: 'absolute',
                      right: 8
                    }} 
                  />
                </Box>
                {index < sortedDogs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4, 
            color: 'text.secondary',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography sx={{ mb: 2 }}>No dogs added to your program yet</Typography>
            <Button 
              component={Link} 
              to="/dashboard/dogs/add" 
              variant="contained" 
              startIcon={<AddIcon />}
            >
              Add Your First Dog
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdultDogsList; 